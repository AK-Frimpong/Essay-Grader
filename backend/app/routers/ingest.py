"""
Document Ingestion & OCR Workspace Router
Uploads PDF/DOCX/TXT/Images, triggers OpenCV noise filters, and handles split-screen text correction.
"""
import uuid
import shutil
import logging
import io
import re
import json
from pathlib import Path
from zipfile import ZipFile
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Depends
from app.models.schemas import IngestResponse, TextCorrectionRequest
from app.config import UPLOADS_DIR, get_waec_grade
from app.database import get_db, log_audit
from app.services.ocr_service import extract_text_from_document, preprocess_image_opencv
from app.services.ollama_service import evaluate_essay_with_ollama
from app.services.license_service import deduct_grading_credit
from app.auth import verify_teacher_pin

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ingest", tags=["Ingestion & OCR"])

def parse_filename_student_info(filename: str):
    """
    Intelligently parse student name and WAEC index / ID from filename conventions.
    Examples:
      'Kofi_Mensah_BECE_001.pdf' -> Name: 'Kofi Mensah', ID: 'BECE-001'
      'Ama_Serwaa_WAEC-STU-089.docx' -> Name: 'Ama Serwaa', ID: 'WAEC-STU-089'
      'Kwame_Osei.jpg' -> Name: 'Kwame Osei', ID: None
    """
    stem = Path(filename).stem
    parts = re.split(r'[_\-]+', stem)
    parts = [p.strip() for p in parts if p.strip()]

    student_id_parts = []
    name_parts = []

    for part in parts:
        if re.match(r'^(BECE|WASSCE|WAEC|STU|\d{3,})$', part, re.IGNORECASE):
            student_id_parts.append(part)
        elif not re.match(r'^(written|scanned|scan|essay|composition|doc|docx|pdf|png|jpg|jpeg|draft|final)$', part, re.IGNORECASE):
            name_parts.append(part)

    student_name = " ".join(name_parts).title() if name_parts else None
    student_id = "-".join(student_id_parts).upper() if student_id_parts else None

    return student_name, student_id

def extract_metadata_from_text(text: str):
    """
    Search document text content for student name, index number, and essay title.
    Used during bulk/single ingestion when metadata is not provided in filename.
    """
    extracted_id = None
    extracted_name = None
    extracted_title = None

    if not text or not text.strip():
        return extracted_name, extracted_id, extracted_title

    # 1. Search for Index Number / Student ID patterns in text content
    id_patterns = [
        r'(?:Index\s*Number|Index\s*No\.?|Student\s*ID|WAEC\s*Index|ID\s*No\.?|Registration\s*No\.?):\s*([A-Za-z0-9\-_/]+)',
        r'Index\s*:\s*([A-Za-z0-9\-_/]+)',
        r'\b(20\d{5,8}|[A-Z]{2,4}-\d{3,6}-[A-Z0-9]+)\b'
    ]
    for pat in id_patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            if candidate and len(candidate) >= 3 and candidate.lower() not in ['number', 'index', 'student', 'essay']:
                extracted_id = candidate.upper()
                break

    # 2. Search for Student Name patterns in text content (e.g. "By: Zaly Stool", "Name: Kofi Mensah")
    name_patterns = [
        r'(?:By|Author|Student\s*Name|Name):\s*([^\n\(\)\d:]+)',
        r'Presented\s*by:\s*([^\n\(\)\d:]+)'
    ]
    for pat in name_patterns:
        match = re.search(pat, text, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            if candidate and len(candidate.split()) <= 4:
                extracted_name = candidate.title()
                break

    # 3. First non-header line as Title if short
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    if lines:
        first_line = lines[0]
        if len(first_line) < 80 and not re.match(r'^(by|author|name|index|student|school):', first_line, re.IGNORECASE):
            extracted_title = first_line

    return extracted_name, extracted_id, extracted_title

@router.post("/upload", response_model=IngestResponse)
async def upload_document(
    file: Optional[UploadFile] = File(None),
    raw_text: Optional[str] = Form(None),
    student_name: str = Form(""),
    student_id: str = Form(""),
    school_name: str = Form("Achimota Basic School / JHS"),
    subject: str = Form("English Language"),
    grade_level: str = Form("JHS 3"),
    title: str = Form(""),
    rubric_id: str = Form("rubric-waec-bece-english"),
    denoise: bool = Form(True),
    deskew: bool = Form(True),
    adaptive_threshold: bool = Form(True),
    contrast_enhancement: bool = Form(True),
):
    """
    Ingest a student essay document (PDF, DOCX, TXT, or scanned image).
    Applies OpenCV preprocessing and OCR text extraction.
    """
    if not file and not (raw_text and raw_text.strip()):
        raise HTTPException(status_code=400, detail="Please select an essay scan or document file, or enter essay text to ingest.")

    essay_id = f"essay-{uuid.uuid4().hex[:8]}"
    preprocessed_path = None

    if file and file.filename:
        file_ext = Path(file.filename).suffix.lower()
        original_fname = file.filename
        
        # Classify file type
        if file_ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"]:
            file_type = "IMAGE"
        elif file_ext == ".pdf":
            file_type = "PDF"
        elif file_ext in [".docx", ".doc"]:
            file_type = "DOCX"
        else:
            file_type = "TXT"

        # Save original upload
        saved_filename = f"{essay_id}_{original_fname}"
        saved_file_path = UPLOADS_DIR / saved_filename
        
        with open(saved_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Perform OCR / Document text extraction
        options = {
            "denoise": denoise,
            "deskew": deskew,
            "adaptive_threshold": adaptive_threshold,
            "contrast_enhancement": contrast_enhancement
        }

        try:
            extracted_text, preprocessed_path = extract_text_from_document(str(saved_file_path), file_type)
        except Exception as e:
            logger.error(f"Text extraction failed: {e}")
            extracted_text = raw_text.strip() if raw_text and raw_text.strip() else "Text extraction failed. Please edit manually in the workspace."
            preprocessed_path = None
    else:
        # Direct raw text submission
        original_fname = "manual_entry.txt"
        file_type = "TXT"
        saved_filename = f"{essay_id}_{original_fname}"
        saved_file_path = UPLOADS_DIR / saved_filename
        extracted_text = raw_text.strip() if raw_text else ""
        
        with open(saved_file_path, "w", encoding="utf-8") as f:
            f.write(extracted_text)

    # Intelligently infer missing student metadata from filename or extracted text headers if left empty
    parsed_fname_name, parsed_fname_id = parse_filename_student_info(original_fname)
    
    if not student_name or student_name.strip() in ["", "Ghanaian Student"]:
        # Try text header first (e.g. By: Zaly Stool)
        header_name_match = re.search(r'By:\s*([^\n\(\)]+)', extracted_text, re.IGNORECASE)
        if header_name_match and header_name_match.group(1).strip():
            student_name = header_name_match.group(1).strip()
        elif parsed_fname_name and parsed_fname_name != Path(original_fname).stem.replace("_", " ").title():
            student_name = parsed_fname_name
        else:
            student_name = "Unassigned Student"

    if not student_id or student_id.strip() in ["", "WAEC-STU-001"]:
        header_id_match = re.search(r'(?:Index Number|Student ID):\s*([^\n\(\)]+)', extracted_text, re.IGNORECASE)
        if header_id_match and header_id_match.group(1).strip():
            student_id = header_id_match.group(1).strip()
        elif parsed_fname_id and not parsed_fname_id.startswith("WAEC-"):
            student_id = parsed_fname_id
        else:
            student_id = f"WAEC-{uuid.uuid4().hex[:6].upper()}"

    if not title or title.strip() in ["", "Essay Composition"]:
        first_line = extracted_text.split('\n')[0].strip() if extracted_text else ""
        if first_line and len(first_line) < 80 and not first_line.lower().startswith('by:'):
            title = first_line
        else:
            title = f"{subject} Essay Composition"

    word_count = len(extracted_text.split())

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO essays 
            (id, title, student_name, student_id, school_name, subject, grade_level, rubric_id, original_filename, file_type, file_path, preprocessed_image_path, raw_extracted_text, corrected_text, word_count, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EXTRACTED')
            """,
            (
                essay_id,
                title,
                student_name,
                student_id,
                school_name,
                subject,
                grade_level,
                rubric_id,
                original_fname,
                file_type,
                str(saved_file_path),
                preprocessed_path,
                extracted_text,
                extracted_text,
                word_count
            )
        )

    log_audit("INGEST_UPLOAD", essay_id=essay_id, details=f"Uploaded {original_fname} ({file_type}) for {student_name}")

    image_url = f"/api/v1/ingest/files/{saved_filename}" if file_type == "IMAGE" else None
    preprocessed_url = f"/api/v1/ingest/files/{Path(preprocessed_path).name}" if preprocessed_path else None

    return IngestResponse(
        essay_id=essay_id,
        title=title,
        student_name=student_name,
        student_id=student_id,
        school_name=school_name,
        subject=subject,
        grade_level=grade_level,
        rubric_id=rubric_id,
        file_type=file_type,
        raw_extracted_text=extracted_text,
        word_count=word_count,
        image_url=image_url,
        preprocessed_image_url=preprocessed_url,
        status="EXTRACTED"
    )

@router.post("/batch")
async def batch_ingest_documents(
    files: List[UploadFile] = File(...),
    rubric_id: str = Form("rubric-waec-bece-english"),
    school_name: str = Form("Achimota Basic School / JHS"),
    subject: str = Form("English Language"),
    grade_level: str = Form("JHS 3"),
    auto_grade: bool = Form(True)
):
    """
    Batch ingest multiple student essay files or ZIP archives.
    Extracts student names/IDs from filenames, performs OCR,
    and optionally runs AI rubric evaluation across the batch.
    """
    # 1. Retrieve Rubric
    with get_db() as conn:
        rubric = conn.execute("SELECT * FROM rubrics WHERE id = ?", (rubric_id,)).fetchone()
        if not rubric:
            raise HTTPException(status_code=404, detail="Assigned rubric not found.")

    # 2. Extract files from upload list or ZIP archives
    extracted_file_items = []

    for file_obj in files:
        fname = file_obj.filename
        ext = Path(fname).suffix.lower()
        content = await file_obj.read()

        if ext == ".zip":
            try:
                with ZipFile(io.BytesIO(content)) as zf:
                    for member_name in zf.namelist():
                        if member_name.endswith("/") or member_name.startswith("__MACOSX"):
                            continue
                        m_ext = Path(member_name).suffix.lower()
                        if m_ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp", ".pdf", ".docx", ".doc", ".txt"]:
                            m_bytes = zf.read(member_name)
                            extracted_file_items.append((Path(member_name).name, m_bytes))
            except Exception as e:
                logger.error(f"Failed to extract zip file {fname}: {e}")
        elif ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp", ".pdf", ".docx", ".doc", ".txt"]:
            extracted_file_items.append((fname, content))

    if not extracted_file_items:
        raise HTTPException(status_code=400, detail="No valid essay documents (.pdf, .docx, .png, .jpg, .txt) found in batch.")

    processed_results = []
    total_graded = 0

    for original_fname, file_bytes in extracted_file_items:
        essay_id = f"essay-{uuid.uuid4().hex[:8]}"
        file_ext = Path(original_fname).suffix.lower()

        if file_ext in [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"]:
            file_type = "IMAGE"
        elif file_ext == ".pdf":
            file_type = "PDF"
        elif file_ext in [".docx", ".doc"]:
            file_type = "DOCX"
        else:
            file_type = "TXT"

        saved_filename = f"{essay_id}_{original_fname}"
        saved_file_path = UPLOADS_DIR / saved_filename

        with open(saved_file_path, "wb") as buffer:
            buffer.write(file_bytes)

        # Extract text via OCR service
        try:
            extracted_text, preprocessed_path = extract_text_from_document(str(saved_file_path), file_type)
        except Exception as e:
            logger.error(f"Batch OCR extraction failed for {original_fname}: {e}")
            extracted_text = "Extraction failed. Please review text manually."
            preprocessed_path = None

        word_count = len(extracted_text.split())
        fname_name, fname_id = parse_filename_student_info(original_fname)
        content_name, content_id, content_title = extract_metadata_from_text(extracted_text)

        # 1. Index Number: Use filename ID if present, otherwise extract from content if present, else fallback
        if fname_id:
            final_id = fname_id
        elif content_id:
            final_id = content_id
        else:
            final_id = f"WAEC-{uuid.uuid4().hex[:6].upper()}"

        # 2. Student Name: Use content name if found, else filename name, else fallback
        if content_name:
            final_name = content_name
        elif fname_name:
            final_name = fname_name
        else:
            final_name = "Unassigned Student"

        # 3. Essay Title
        essay_title = content_title if content_title else f"{subject} Essay Composition"

        # Insert initial essay record into essays table first (required for FOREIGN KEY constraints in grades table)
        with get_db() as conn:
            conn.execute(
                """
                INSERT INTO essays 
                (id, title, student_name, student_id, school_name, subject, grade_level, rubric_id, original_filename, file_type, file_path, preprocessed_image_path, raw_extracted_text, corrected_text, word_count, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'EXTRACTED')
                """,
                (
                    essay_id,
                    essay_title,
                    final_name,
                    final_id,
                    school_name,
                    subject,
                    grade_level,
                    rubric_id,
                    original_fname,
                    file_type,
                    str(saved_file_path),
                    preprocessed_path,
                    extracted_text,
                    extracted_text,
                    word_count
                )
            )

        initial_status = "EXTRACTED"
        eval_data = None

        # 2. Auto-grade if enabled
        if auto_grade and len(extracted_text.strip()) >= 10:
            has_credit = deduct_grading_credit()
            if has_credit:
                try:
                    eval_result = evaluate_essay_with_ollama(
                        essay_text=extracted_text,
                        rubric=rubric,
                        subject=subject,
                        grade_level=grade_level
                    )
                    overall_score = float(eval_result.get("overall_score", 0.0))
                    max_score = float(rubric.get("total_points", 100.0))
                    percentage = round((overall_score / max_score) * 100.0, 1) if max_score > 0 else 0.0
                    waec_info = get_waec_grade(percentage)

                    grade_id = f"grade-{uuid.uuid4().hex[:8]}"
                    with get_db() as conn:
                        conn.execute(
                            """
                            INSERT OR REPLACE INTO grades 
                            (id, essay_id, rubric_id, overall_score, max_overall_score, percentage, letter_grade, ai_evaluation_json, final_criteria_scores_json, strengths_json, weaknesses_json, grammar_highlights_json, is_approved, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
                            """,
                            (
                                grade_id,
                                essay_id,
                                rubric_id,
                                overall_score,
                                max_score,
                                percentage,
                                waec_info["grade"],
                                json.dumps(eval_result),
                                json.dumps(eval_result.get("criteria_scores", [])),
                                json.dumps(eval_result.get("strengths", [])),
                                json.dumps(eval_result.get("weaknesses", [])),
                                json.dumps(eval_result.get("grammar_highlights", []))
                            )
                        )
                        conn.execute("UPDATE essays SET status = 'EVALUATED' WHERE id = ?", (essay_id,))

                    initial_status = "EVALUATED"
                    total_graded += 1
                    eval_data = {
                        "overall_score": overall_score,
                        "max_score": max_score,
                        "percentage": percentage,
                        "letter_grade": waec_info["grade"]
                    }
                except Exception as e:
                    logger.error(f"Batch auto-grading failed for {essay_id}: {e}")

        processed_results.append({
            "essay_id": essay_id,
            "original_filename": original_fname,
            "student_name": final_name,
            "student_id": final_id,
            "file_type": file_type,
            "word_count": word_count,
            "status": initial_status,
            "evaluation": eval_data
        })

    log_audit("BATCH_INGEST", details=f"Batch ingested {len(processed_results)} essays ({total_graded} auto-graded)")

    return {
        "total_processed": len(processed_results),
        "total_graded": total_graded,
        "results": processed_results
    }

@router.post("/correct-text")
def save_corrected_text(payload: TextCorrectionRequest):
    """Save teacher-corrected OCR text prior to sending to LLM evaluation."""
    word_count = len(payload.corrected_text.split())
    
    with get_db() as conn:
        essay = conn.execute("SELECT id FROM essays WHERE id = ?", (payload.essay_id,)).fetchone()
        if not essay:
            raise HTTPException(status_code=404, detail="Essay not found.")

        conn.execute(
            """
            UPDATE essays 
            SET corrected_text = ?, word_count = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (payload.corrected_text, word_count, payload.essay_id)
        )
        
        # Optional metadata updates
        if payload.title or payload.student_name or payload.student_id or payload.rubric_id:
            conn.execute(
                """
                UPDATE essays 
                SET title = COALESCE(?, title),
                    student_name = COALESCE(?, student_name),
                    student_id = COALESCE(?, student_id),
                    rubric_id = COALESCE(?, rubric_id)
                WHERE id = ?
                """,
                (payload.title, payload.student_name, payload.student_id, payload.rubric_id, payload.essay_id)
            )

    log_audit("OCR_CORRECTION", essay_id=payload.essay_id, details=f"Updated text ({word_count} words)")
    return {"message": "Corrected text saved successfully.", "word_count": word_count}

@router.get("/essays")
def list_essays(status: Optional[str] = None, search: Optional[str] = None):
    """Retrieve all essays with optional status and search filters."""
    query = """
        SELECT e.*, r.title as rubric_title, g.overall_score, g.percentage, g.letter_grade, g.is_approved
        FROM essays e
        LEFT JOIN rubrics r ON e.rubric_id = r.id
        LEFT JOIN grades g ON e.id = g.essay_id
    """
    params = []
    conditions = []
    
    if status:
        conditions.append("e.status = ?")
        params.append(status)
    if search:
        conditions.append("(e.student_name LIKE ? OR e.student_id LIKE ? OR e.title LIKE ?)")
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    query += " ORDER BY e.submitted_at DESC"

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
        return rows

@router.get("/essays/{essay_id}")
def get_essay_details(essay_id: str):
    """Retrieve single essay with its rubric and grade information."""
    with get_db() as conn:
        essay = conn.execute(
            """
            SELECT e.*, r.title as rubric_title, r.criteria as rubric_criteria, r.total_points as rubric_total_points
            FROM essays e
            LEFT JOIN rubrics r ON e.rubric_id = r.id
            WHERE e.id = ?
            """,
            (essay_id,)
        ).fetchone()
        
        if not essay:
            raise HTTPException(status_code=404, detail="Essay not found.")
            
        grade = conn.execute("SELECT * FROM grades WHERE essay_id = ?", (essay_id,)).fetchone()
        return {"essay": essay, "grade": grade}

@router.delete("/essays/{essay_id}", dependencies=[Depends(verify_teacher_pin)])
def delete_essay(essay_id: str):
    """Delete an essay and its associated grade record."""
    with get_db() as conn:
        conn.execute("DELETE FROM grades WHERE essay_id = ?", (essay_id,))
        conn.execute("DELETE FROM essays WHERE id = ?", (essay_id,))
    
    log_audit("ESSAY_DELETED", essay_id=essay_id, details="Deleted essay and associated grades")
    return {"message": "Essay deleted successfully."}
