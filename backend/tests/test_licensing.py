try:
    import pytest
except ImportError:
    pass
import sys
import os

backend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.database import init_db
from app.seed_data import seed_database
from app.services.license_service import (
    get_machine_hardware_signature,
    generate_sample_school_license,
    verify_and_apply_license_file,
    get_current_license_status
)

def setup_test_db():
    init_db()
    seed_database()

def test_hardware_signature():
    """Verify hardware signature extraction returns non-empty strings."""
    sig = get_machine_hardware_signature()
    assert "machine_uuid" in sig and len(sig["machine_uuid"]) > 0
    assert "mac_address" in sig and len(sig["mac_address"]) > 0
    assert "platform_info" in sig and len(sig["platform_info"]) > 0

def test_valid_license_verification():
    """Verify RSA-2048 signed license generation and activation."""
    signed_b64 = generate_sample_school_license("Accra Academy Senior High", credits=600)
    assert len(signed_b64) > 50

    success, msg = verify_and_apply_license_file(signed_b64)
    assert success is True
    assert "Successfully activated" in msg
    assert "Accra Academy Senior High" in msg

    status = get_current_license_status()
    assert status["school_name"] == "Accra Academy Senior High"
    assert status["allowed_credits"] == 600

def test_invalid_license_payload():
    """Verify corrupted base64 or invalid JSON license payload is rejected."""
    success, msg = verify_and_apply_license_file("INVALID_BASE64_PAYLOAD_123")
    assert success is False
    assert "Invalid license signature or corrupted file" in msg
