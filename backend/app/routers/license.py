"""
Offline License & Paystack Mobile Money Router
Validates machine UUID signatures offline and processes online credit top-ups for low-connectivity environments.
"""
import logging
from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    HardwareSignatureResponse,
    LicenseStatusResponse,
    LicenseActivationRequest,
    MobileMoneyTopupRequest
)
from app.database import get_db, log_audit
from app.services.license_service import (
    get_machine_hardware_signature,
    get_current_license_status,
    verify_and_apply_license_file,
    process_paystack_momo_topup,
    generate_sample_school_license
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/license", tags=["Offline Licensing & Payments"])

@router.get("/hardware-signature", response_model=HardwareSignatureResponse)
def get_hardware_signature():
    """Retrieve the unique machine signature for offline license binding."""
    sig = get_machine_hardware_signature()
    return HardwareSignatureResponse(**sig)

@router.get("/status", response_model=LicenseStatusResponse)
def get_license_status():
    """Check current offline license validation state and remaining grading credits."""
    status_info = get_current_license_status()
    return LicenseStatusResponse(**status_info)

@router.post("/activate")
def activate_offline_license(payload: LicenseActivationRequest):
    """Verify and install an RSA-2048 cryptographically signed license payload."""
    success, message = verify_and_apply_license_file(payload.license_payload_b64)
    if not success:
        raise HTTPException(status_code=400, detail=message)
    
    log_audit("LICENSE_ACTIVATED", details=message)
    return {"success": True, "message": message, "status": get_current_license_status()}

@router.post("/generate-test-license")
def create_test_license(school_name: str = "Ghana Education Service Pilot Host", credits: int = 500):
    """Generate an authentic signed RSA test license string for demonstration and offline testing."""
    signed_b64 = generate_sample_school_license(school_name, credits)
    return {
        "school_name": school_name,
        "credits": credits,
        "license_payload_b64": signed_b64,
        "instructions": "Copy this signed payload or upload it into the Offline License Manager modal."
    }

@router.post("/momo-topup")
def topup_via_paystack_momo(payload: MobileMoneyTopupRequest):
    """
    Process Ghana Mobile Money top-up (MTN MoMo / Telecel / AT Money) via Paystack.
    Instantly updates local offline credit ledger balance in SQLite.
    """
    if payload.amount_ghs <= 0 or payload.credits_requested <= 0:
        raise HTTPException(status_code=400, detail="Invalid topup amount or credit count.")
        
    result = process_paystack_momo_topup(
        phone_number=payload.phone_number,
        network=payload.network,
        amount_ghs=payload.amount_ghs,
        credits_to_add=payload.credits_requested
    )
    
    log_audit("MOMO_TOPUP", details=f"Added {payload.credits_requested} credits via {payload.network} ({payload.phone_number})")
    return result

@router.get("/transactions")
def get_transaction_history():
    """Retrieve history of all MoMo and offline voucher transactions."""
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM credit_transactions ORDER BY created_at DESC").fetchall()
        return rows
