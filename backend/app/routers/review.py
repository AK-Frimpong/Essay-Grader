"""
Teacher Review & Grade Approval Router
Provides split-screen evaluation pane, score override sliders, comment editors, and grade locking.
"""
import uuid
import json
import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import TeacherReviewSubmit, GradeResponse
from app.database import get_db, log_audit
from app.config import get_waec_grade
from app.services.pdf_service import generate_student_pdf_report

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/review", tags=["Teacher Review & Approval"])

@router.get("/{essay_id}")
def get_review_workspace_data(essay_id: str):
    """
    Fetch comprehensive workspace data for the teacher review split-pane:
    Essay text + Rubric Criteria + AI Scores + Override History + Audit Logs.
    """
    with get_db() as conn:
        essay = conn.execute(
            """
            SELECT e.*, r.title as rubric_title, r.total_points as rubric_total_points, r.criteria as rubric_criteria
            FROM essays e
            LEFT JOIN rubrics r ON e.rubric_id = r.id
            WHERE e.id = ?
            """,
            (essay_id,)
        ).fetchone()

        if not essay:
            raise HTTPException(status_code=404, detail="Essay not found.")

        grade = conn.execute("SELECT * FROM grades WHERE essay_id = ?", (essay_id,)).fetchone()
        
        audit_history = conn.execute(
            "SELECT * FROM audit_logs WHERE essay_id = ? ORDER BY timestamp DESC",
            (essay_id,)
        ).fetchall()

    return {
        "essay": essay,
        "grade": grade,
        "audit_history": audit_history
    }

@router.post("/submit", response_model=GradeResponse)
def submit_teacher_review(payload: TeacherReviewSubmit):
    """
    Save teacher score overrides, qualitative feedback, and optionally lock grade with PDF generation.
    """
    with get_db() as conn:
        essay = conn.execute(
            """
            SELECT e.*, r.title as rubric_title, r.total_points as rubric_total_points, r.criteria as rubric_criteria
            FROM essays e
            LEFT JOIN rubrics r ON e.rubric_id = r.id
            WHERE e.id = ?
            """,
            (payload.essay_id,)
        ).fetchone()
        
        if not essay:
            raise HTTPException(status_code=404, detail="Essay not found.")

        grade_row = conn.execute("SELECT * FROM grades WHERE essay_id = ?", (payload.essay_id,)).fetchone()
        if not grade_row:
            raise HTTPException(status_code=400, detail="Essay has not yet been evaluated by AI. Please run evaluation first.")

    # Calculate new overall score from teacher overrides
    total_teacher_score = 0.0
    final_criteria_list = []
    
    for c in payload.criteria_overrides:
        score_val = c.teacher_score if c.teacher_score is not None else c.ai_score
        total_teacher_score += score_val
        final_criteria_list.append({
            "criterion_id": c.criterion_id,
            "name": c.name,
            "max_score": c.max_score,
            "ai_score": c.ai_score,
            "teacher_score": score_val,
            "comment": c.comment,
            "level_matched": c.level_matched
        })

    max_score = float(essay.get("rubric_total_points", 100.0))
    percentage = round((total_teacher_score / max_score) * 100.0, 1) if max_score > 0 else 0.0
    waec_info = get_waec_grade(percentage)
    letter_grade = waec_info["grade"]

    grade_dict_for_pdf = {
        "overall_score": total_teacher_score,
        "max_overall_score": max_score,
        "percentage": percentage,
        "letter_grade": letter_grade,
        "final_criteria_scores_json": final_criteria_list,
        "strengths_json": grade_row.get("strengths_json", []),
        "weaknesses_json": grade_row.get("weaknesses_json", []),
        "teacher_feedback": payload.teacher_feedback,
        "approved_by": payload.approved_by
    }

    # Generate Official ReportLab PDF Report Card
    try:
        rubric_dict = {
            "title": essay.get("rubric_title", "WAEC Rubric"),
            "criteria": essay.get("rubric_criteria", [])
        }
        pdf_path = generate_student_pdf_report(essay, grade_dict_for_pdf, rubric_dict)
    except Exception as e:
        logger.error(f"PDF generation note: {e}")
        pdf_path = None

    # Update database record
    with get_db() as conn:
        conn.execute(
            """
            UPDATE grades
            SET overall_score = ?,
                percentage = ?,
                letter_grade = ?,
                final_criteria_scores_json = ?,
                teacher_feedback = ?,
                teacher_override_reason = ?,
                is_approved = ?,
                approved_by = ?,
                approved_at = CURRENT_TIMESTAMP,
                pdf_report_path = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE essay_id = ?
            """,
            (
                total_teacher_score,
                percentage,
                letter_grade,
                json.dumps(final_criteria_list),
                payload.teacher_feedback,
                payload.teacher_override_reason,
                1 if payload.lock_grade else 0,
                payload.approved_by,
                pdf_path,
                payload.essay_id
            )
        )
        
        # Update essay status
        new_status = "LOCKED" if payload.lock_grade else "REVIEWED"
        conn.execute("UPDATE essays SET status = ? WHERE id = ?", (new_status, payload.essay_id))

    log_audit(
        "GRADE_LOCK" if payload.lock_grade else "SCORE_OVERRIDE",
        essay_id=payload.essay_id,
        details=f"Grade locked at {total_teacher_score}/{max_score} ({letter_grade}) by {payload.approved_by}",
        actor=payload.approved_by
    )

    return GradeResponse(
        id=grade_row["id"],
        essay_id=payload.essay_id,
        rubric_id=grade_row["rubric_id"],
        overall_score=total_teacher_score,
        max_overall_score=max_score,
        percentage=percentage,
        letter_grade=letter_grade,
        criteria_scores=payload.criteria_overrides,
        strengths=grade_row.get("strengths_json", []),
        weaknesses=grade_row.get("weaknesses_json", []),
        grammar_highlights=grade_row.get("grammar_highlights_json", []),
        teacher_feedback=payload.teacher_feedback,
        teacher_override_reason=payload.teacher_override_reason,
        is_approved=payload.lock_grade,
        approved_by=payload.approved_by,
        approved_at=str(grade_row.get("approved_at", "Just now")),
        pdf_report_path=pdf_path
    )
