"""
Class Export Service
Exports class-wide CSV grade sheets and creates batch ZIP packages of student PDF report cards.
"""
import io
import csv
import zipfile
import logging
from pathlib import Path
from typing import List, Dict, Any
from app.database import get_db
from app.config import GENERATED_REPORTS_DIR

logger = logging.getLogger(__name__)

def export_class_grade_sheet_csv(rubric_id: str = None) -> str:
    """Generate a comprehensive CSV grade sheet for all graded essays."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Write CSV Header
    writer.writerow([
        "WAEC Index / Student ID",
        "Student Name",
        "School Name",
        "Subject",
        "Grade Level",
        "Essay Title",
        "Word Count",
        "Raw Score",
        "Max Score",
        "Percentage (%)",
        "WAEC Letter Grade",
        "Teacher Feedback",
        "Approved Status",
        "Approved By",
        "Evaluation Date"
    ])

    query = """
        SELECT 
            e.student_id, e.student_name, e.school_name, e.subject, e.grade_level,
            e.title, e.word_count, g.overall_score, g.max_overall_score,
            g.percentage, g.letter_grade, g.teacher_feedback, g.is_approved,
            g.approved_by, g.approved_at
        FROM essays e
        LEFT JOIN grades g ON e.id = g.essay_id
    """
    params = []
    if rubric_id:
        query += " WHERE e.rubric_id = ?"
        params.append(rubric_id)
    
    query += " ORDER BY e.student_name ASC"

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()

    for r in rows:
        writer.writerow([
            r.get("student_id", "N/A"),
            r.get("student_name", "N/A"),
            r.get("school_name", "N/A"),
            r.get("subject", "N/A"),
            r.get("grade_level", "N/A"),
            r.get("title", "N/A"),
            r.get("word_count", 0),
            f"{r.get('overall_score', 0):.1f}" if r.get("overall_score") is not None else "Pending",
            f"{r.get('max_overall_score', 100):.1f}" if r.get("max_overall_score") is not None else "100.0",
            f"{r.get('percentage', 0):.1f}%" if r.get("percentage") is not None else "Pending",
            r.get("letter_grade", "Pending"),
            r.get("teacher_feedback", ""),
            "APPROVED" if r.get("is_approved") else "DRAFT",
            r.get("approved_by", ""),
            r.get("approved_at", "")
        ])

    return output.getvalue()

def create_bulk_pdf_zip(essay_ids: List[str] = None) -> io.BytesIO:
    """Create in-memory ZIP archive containing all generated PDF report cards."""
    zip_buffer = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        # Collect all generated PDFs
        for pdf_file in GENERATED_REPORTS_DIR.glob("*.pdf"):
            zf.write(str(pdf_file), arcname=pdf_file.name)

    zip_buffer.seek(0)
    return zip_buffer
