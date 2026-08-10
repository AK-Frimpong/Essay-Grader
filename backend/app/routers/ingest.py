"""
Document Ingestion & OCR Workspace Router
Uploads PDF/DOCX/TXT/Images, triggers OpenCV noise filters, and handles split-screen text correction.
"""
import uuid
import shutil
import logging
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query
from app.models.schemas import IngestResponse, TextCorrectionRequest
from app.config import UPLOADS_DIR
from app.database import get_db, log_audit
from app.services.ocr_service import extract_text_from_document, preprocess_image_opencv

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ingest", tags=["Ingestion & OCR"])

@router.post("/upload", response_model=IngestResponse)
async def upload_document(
    file: UploadFile = File(...),
    student_name: str = Form("Ghanaian Student"),
    student_id: str = Form("WAEC-STU-001"),
    school_name: str = Form("Achimota Basic School / JHS"),
    subject: str = Form("English Language"),
    grade_level: str = Form("JHS 3"),
    title: str = Form("Essay Composition"),
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
    essay_id = f"essay-{uuid.uuid4().hex[:8]}"
    file_ext = Path(file.filename).suffix.lower()
    
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
    saved_filename = f"{essay_id}_{file.filename}"
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
        if file_type == "IMAGE":
            extracted_text, preprocessed_path = extract_text_from_document(str(saved_file_path), file_type)
        else:
            extracted_text, preprocessed_path = extract_text_from_document(str(saved_file_path), file_type)
    except Exception as e:
        logger.error(f"Text extraction failed: {e}")
        extracted_text = "Text extraction failed. Please edit manually in the workspace."
        preprocessed_path = None

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
                file.filename,
                file_type,
                str(saved_file_path),
                preprocessed_path,
                extracted_text,
                extracted_text,
                word_count
            )
        )

    log_audit("INGEST_UPLOAD", essay_id=essay_id, details=f"Uploaded {file.filename} ({file_type}) for {student_name}")

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

@router.delete("/essays/{essay_id}")
def delete_essay(essay_id: str):
    """Delete an essay and its associated grade record."""
    with get_db() as conn:
        conn.execute("DELETE FROM grades WHERE essay_id = ?", (essay_id,))
        conn.execute("DELETE FROM essays WHERE id = ?", (essay_id,))
    
    log_audit("ESSAY_DELETED", essay_id=essay_id, details="Deleted essay and associated grades")
    return {"message": "Essay deleted successfully."}
