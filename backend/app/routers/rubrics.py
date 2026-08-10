"""
Rubric Management Router
CRUD endpoints for Ghanaian curriculum rubrics (WAEC BECE / WASSCE & custom rubrics).
"""
import uuid
import json
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends
from app.models.schemas import RubricCreate, RubricResponse
from app.database import get_db, log_audit

router = APIRouter(prefix="/api/v1/rubrics", tags=["Rubrics"])

@router.get("", response_model=List[RubricResponse])
def list_rubrics(subject: Optional[str] = None):
    """Retrieve all available grading rubrics."""
    query = "SELECT * FROM rubrics"
    params = []
    if subject:
        query += " WHERE subject LIKE ?"
        params.append(f"%{subject}%")
    query += " ORDER BY is_default DESC, created_at DESC"

    with get_db() as conn:
        rows = conn.execute(query, params).fetchall()
        return rows

@router.get("/{rubric_id}", response_model=RubricResponse)
def get_rubric(rubric_id: str):
    """Fetch details of a specific rubric."""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM rubrics WHERE id = ?", (rubric_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Rubric not found.")
        return row

@router.post("", response_model=RubricResponse)
def create_rubric(payload: RubricCreate):
    """Create a new custom evaluation rubric."""
    rubric_id = f"rubric-{uuid.uuid4().hex[:8]}"
    criteria_json = json.dumps([c.model_dump() for c in payload.criteria])

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO rubrics (id, title, subject, grade_level, description, total_points, criteria, is_default)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                rubric_id,
                payload.title,
                payload.subject,
                payload.grade_level,
                payload.description,
                payload.total_points,
                criteria_json,
                1 if payload.is_default else 0
            )
        )
        row = conn.execute("SELECT * FROM rubrics WHERE id = ?", (rubric_id,)).fetchone()
    
    log_audit("RUBRIC_CREATED", details=f"Created rubric: {payload.title}")
    return row

@router.put("/{rubric_id}", response_model=RubricResponse)
def update_rubric(rubric_id: str, payload: RubricCreate):
    """Update an existing rubric."""
    criteria_json = json.dumps([c.model_dump() for c in payload.criteria])

    with get_db() as conn:
        conn.execute(
            """
            UPDATE rubrics 
            SET title = ?, subject = ?, grade_level = ?, description = ?, total_points = ?, criteria = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (
                payload.title,
                payload.subject,
                payload.grade_level,
                payload.description,
                payload.total_points,
                criteria_json,
                1 if payload.is_default else 0,
                rubric_id
            )
        )
        row = conn.execute("SELECT * FROM rubrics WHERE id = ?", (rubric_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Rubric not found.")
        return row

@router.delete("/{rubric_id}")
def delete_rubric(rubric_id: str):
    """Delete a rubric if not referenced by existing essays."""
    with get_db() as conn:
        # Check references
        count = conn.execute("SELECT COUNT(*) as c FROM essays WHERE rubric_id = ?", (rubric_id,)).fetchone()["c"]
        if count > 0:
            raise HTTPException(status_code=400, detail="Cannot delete rubric currently associated with essays.")
        
        conn.execute("DELETE FROM rubrics WHERE id = ?", (rubric_id,))
    
    log_audit("RUBRIC_DELETED", details=f"Deleted rubric ID: {rubric_id}")
    return {"message": "Rubric deleted successfully."}
