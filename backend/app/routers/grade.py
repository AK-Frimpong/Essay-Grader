"""
AI Grading & Evaluation Router
Connects to local Ollama (phi3:mini-4k-instruct) or offline heuristic engine to score rubrics.
"""
import uuid
import json
import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import EvaluateRequest, AIEvaluationResult, AuthenticityReport
from app.database import get_db, log_audit
from app.config import get_waec_grade
from app.services.ollama_service import evaluate_essay_with_ollama
from app.services.license_service import deduct_grading_credit
from app.services.plagiarism_service import run_full_authenticity_check

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/grade", tags=["AI Grading Engine"])

@router.post("/evaluate", response_model=AIEvaluationResult)
def evaluate_essay(payload: EvaluateRequest):
    """
    Trigger AI grading for an essay against its assigned rubric.
    Enforces WAEC scoring format and deductions from offline credit ledger.
    """
    # 1. Deduct offline credit (if available)
    has_credits = deduct_grading_credit()
    if not has_credits:
        raise HTTPException(
            status_code=402, 
            detail="Offline grading credits exhausted. Please top-up via Paystack MoMo or upload an offline license voucher."
        )

    # 2. Retrieve essay and rubric data
    with get_db() as conn:
        essay = conn.execute("SELECT * FROM essays WHERE id = ?", (payload.essay_id,)).fetchone()
        if not essay:
            raise HTTPException(status_code=404, detail="Essay not found.")

        target_rubric_id = payload.rubric_id or essay.get("rubric_id")
        rubric = conn.execute("SELECT * FROM rubrics WHERE id = ?", (target_rubric_id,)).fetchone()
        if not rubric:
            raise HTTPException(status_code=404, detail="Assigned rubric not found.")

    essay_text = essay.get("corrected_text") or essay.get("raw_extracted_text", "")
    if len(essay_text.strip()) < 10:
        raise HTTPException(status_code=400, detail="Essay text is too brief to evaluate. Please provide more content.")

    # 3. Execute Ollama / Heuristic Evaluation
    eval_result = evaluate_essay_with_ollama(
        essay_text=essay_text,
        rubric=rubric,
        subject=essay.get("subject", "English Language"),
        grade_level=essay.get("grade_level", "JHS / SHS")
    )

    # 4. Calculate Percentage and WAEC Letter Grade
    overall_score = float(eval_result.get("overall_score", 0.0))
    max_score = float(rubric.get("total_points", 100.0))
    percentage = round((overall_score / max_score) * 100.0, 1) if max_score > 0 else 0.0
    waec_info = get_waec_grade(percentage)
    letter_grade = waec_info["grade"]

    # 5. Persist to grades table
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
                payload.essay_id,
                target_rubric_id,
                overall_score,
                max_score,
                percentage,
                letter_grade,
                json.dumps(eval_result),
                json.dumps(eval_result.get("criteria_scores", [])),
                json.dumps(eval_result.get("strengths", [])),
                json.dumps(eval_result.get("weaknesses", [])),
                json.dumps(eval_result.get("grammar_highlights", []))
            )
        )
        # Update essay status
        conn.execute("UPDATE essays SET status = 'EVALUATED', rubric_id = ? WHERE id = ?", (target_rubric_id, payload.essay_id))

    log_audit("AI_EVALUATE", essay_id=payload.essay_id, details=f"Evaluated with score {overall_score}/{max_score} ({letter_grade}) via {eval_result.get('evaluator_engine')}")

    return AIEvaluationResult(
        essay_id=payload.essay_id,
        rubric_id=target_rubric_id,
        overall_score=overall_score,
        max_overall_score=max_score,
        percentage=percentage,
        letter_grade=letter_grade,
        grade_label=waec_info.get("label", "Credit"),
        criteria_scores=eval_result.get("criteria_scores", []),
        strengths=eval_result.get("strengths", []),
        weaknesses=eval_result.get("weaknesses", []),
        grammar_highlights=eval_result.get("grammar_highlights", []),
        general_summary=eval_result.get("general_summary", ""),
        evaluator_engine=eval_result.get("evaluator_engine", "Offline Heuristic Engine")
    )

@router.get("/{essay_id}")
def get_grade(essay_id: str):
    """Fetch current grade details for an essay."""
    with get_db() as conn:
        grade = conn.execute("SELECT * FROM grades WHERE essay_id = ?", (essay_id,)).fetchone()
        if not grade:
            raise HTTPException(status_code=404, detail="No grade found for this essay.")
        return grade

@router.get("/authenticity/{essay_id}", response_model=AuthenticityReport)
def get_authenticity_analysis(essay_id: str):
    """
    Run peer-to-peer plagiarism, AI detection, and web plagiarism analysis for an essay.
    Peer & AI detection work 100% offline. Web search runs online when WAN is available.
    """
    with get_db() as conn:
        essay = conn.execute("SELECT * FROM essays WHERE id = ?", (essay_id,)).fetchone()
        if not essay:
            raise HTTPException(status_code=404, detail="Essay not found.")
            
    text = essay.get("corrected_text") or essay.get("raw_extracted_text", "")
    return run_full_authenticity_check(essay_id, text)
