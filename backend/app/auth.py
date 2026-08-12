"""
Authentication and LAN Security Dependency Module
Handles Teacher PIN verification and endpoint authorization.
"""
import hashlib
import logging
from typing import Optional
from fastapi import Header, HTTPException, status
from app.database import get_db

logger = logging.getLogger(__name__)

def hash_pin(pin: str) -> str:
    """Hash a 4-digit PIN using SHA-256."""
    return hashlib.sha256(pin.strip().encode("utf-8")).hexdigest()

def get_stored_pin_hash() -> str:
    """Fetch stored teacher PIN hash from system_settings table, fallback to default '1234' hash."""
    default_hash = hash_pin("1234")
    try:
        with get_db() as conn:
            row = conn.execute("SELECT value FROM system_settings WHERE key = 'teacher_pin_hash'").fetchone()
            if row and row["value"]:
                return row["value"]
    except Exception as e:
        logger.warning(f"Failed to fetch teacher PIN hash from database: {e}")
    return default_hash

def verify_teacher_pin(x_teacher_pin: Optional[str] = Header(None, alias="X-Teacher-PIN")):
    """
    FastAPI dependency that enforces valid X-Teacher-PIN header for administrative endpoints.
    """
    if not x_teacher_pin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Teacher Security PIN required. Please provide a valid X-Teacher-PIN header."
        )

    provided_hash = hash_pin(x_teacher_pin)
    stored_hash = get_stored_pin_hash()

    if provided_hash != stored_hash:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Teacher Security PIN. Access denied."
        )

    return True
