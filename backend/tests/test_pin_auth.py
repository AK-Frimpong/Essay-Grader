try:
    import pytest
except ImportError:
    pass
import sys
import os
from fastapi import HTTPException

backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.database import init_db
from app.seed_data import seed_database
from app.auth import hash_pin, get_stored_pin_hash, verify_teacher_pin
from app.routers.auth import verify_pin, change_pin, VerifyPinRequest, ChangePinRequest

def setup_test_db():
    init_db()
    seed_database()

def test_pin_hashing():
    """Verify SHA-256 PIN hashing helper."""
    h1 = hash_pin("1234")
    h2 = hash_pin("1234")
    h3 = hash_pin("5678")

    assert h1 == h2
    assert h1 != h3
    assert len(h1) == 64  # SHA-256 hex string length

def test_verify_pin_endpoint():
    """Verify default PIN verification and wrong PIN rejection."""
    res = verify_pin(VerifyPinRequest(pin="1234"))
    assert res["valid"] is True
    assert res["role"] == "TEACHER"

    try:
        verify_pin(VerifyPinRequest(pin="0000"))
        assert False, "Should raise 401"
    except HTTPException as e:
        assert e.status_code == 401

def test_verify_teacher_pin_dependency():
    """Verify X-Teacher-PIN header dependency."""
    assert verify_teacher_pin(x_teacher_pin="1234") is True

    try:
        verify_teacher_pin(x_teacher_pin=None)
        assert False, "Should raise 401"
    except HTTPException as e:
        assert e.status_code == 401

    try:
        verify_teacher_pin(x_teacher_pin="wrong_pin")
        assert False, "Should raise 401"
    except HTTPException as e:
        assert e.status_code == 401

def test_change_pin_flow():
    """Verify changing teacher PIN and verifying with new PIN."""
    change_res = change_pin(ChangePinRequest(current_pin="1234", new_pin="9876"))
    assert change_res["success"] is True

    assert verify_teacher_pin(x_teacher_pin="9876") is True

    # Reset back to default 1234
    change_pin(ChangePinRequest(current_pin="9876", new_pin="1234"))
    assert verify_teacher_pin(x_teacher_pin="1234") is True
