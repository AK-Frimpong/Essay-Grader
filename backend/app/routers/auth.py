"""
Authentication Router
Endpoints for verifying and changing Teacher Security PIN.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field
from app.auth import verify_teacher_pin, hash_pin, get_stored_pin_hash
from app.database import get_db, log_audit

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/auth", tags=["Teacher Authentication & Security"])

class VerifyPinRequest(BaseModel):
    pin: str = Field(..., min_length=4, max_length=10, description="Teacher PIN")

class ChangePinRequest(BaseModel):
    current_pin: str = Field(..., description="Existing Teacher PIN")
    new_pin: str = Field(..., min_length=4, max_length=10, description="New 4-digit Teacher PIN")

@router.post("/verify-pin")
def verify_pin(payload: VerifyPinRequest):
    """Verify if provided PIN matches the active teacher PIN."""
    provided_hash = hash_pin(payload.pin)
    stored_hash = get_stored_pin_hash()
    
    if provided_hash == stored_hash:
        return {
            "valid": True,
            "role": "TEACHER",
            "message": "Teacher Security PIN verified successfully."
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid Teacher Security PIN.")

@router.post("/change-pin", dependencies=[Depends(verify_teacher_pin)])
def change_pin(payload: ChangePinRequest):
    """Change active Teacher Security PIN (requires current valid PIN)."""
    current_hash = hash_pin(payload.current_pin)
    stored_hash = get_stored_pin_hash()

    if current_hash != stored_hash:
        raise HTTPException(status_code=401, detail="Current Teacher PIN is incorrect.")

    new_hash = hash_pin(payload.new_pin)

    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO system_settings (key, value, updated_at)
            VALUES ('teacher_pin_hash', ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
            """,
            (new_hash,)
        )

    log_audit("PIN_CHANGE", details="Teacher security PIN updated.", actor="Teacher")

    return {
        "success": True,
        "message": "Teacher Security PIN updated successfully."
    }
