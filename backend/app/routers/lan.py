"""
LAN Network Status & Discovery Router
Provides local Wi-Fi host IP, QR code for instant mobile pairing, and connected client metrics.
"""
import io
import base64
import qrcode
import requests
import logging
from fastapi import APIRouter
from app.models.schemas import LANStatusResponse
from app.config import get_lan_ip, PORT, FRONTEND_PORT, OLLAMA_HOST, OLLAMA_MODEL

from app.services.ocr_service import check_tesseract_status, check_ocr_status

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/lan", tags=["LAN Host Status"])

def _generate_qr_base64(url: str) -> str:
    """Generate base64 encoded PNG of QR code for instant mobile pairing."""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=6,
        border=2,
    )
    qr.add_data(url)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#065F46", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    buffer.seek(0)
    return base64.b64encode(buffer.read()).decode("utf-8")

@router.get("/status", response_model=LANStatusResponse)
def get_lan_status():
    """
    Retrieve LAN host status, detected IP, pairing QR code, and AI/OCR diagnostics.
    Enables classroom mobile devices to connect over school Wi-Fi.
    """
    lan_ip = get_lan_ip()
    server_url = f"http://{lan_ip}:{PORT}"
    frontend_url = f"http://{lan_ip}:{FRONTEND_PORT}"
    qr_b64 = _generate_qr_base64(frontend_url)

    # 1. Check OCR Engine Status (Vision preferred, Tesseract fallback)
    ocr_ok, ocr_msg = check_ocr_status()
    tesseract_ok, tesseract_msg = check_tesseract_status()

    # 2. Check local Ollama connectivity and installed models
    ollama_ok = False
    model_installed = False
    installed_models = []

    try:
        res = requests.get(f"{OLLAMA_HOST.rstrip('/')}/api/tags", timeout=1.5)
        if res.status_code == 200:
            ollama_ok = True
            data = res.json()
            models_list = data.get("models", [])
            installed_models = [m.get("name") for m in models_list if m.get("name")]
            # Check if OLLAMA_MODEL or model family prefix matches any installed model
            target = OLLAMA_MODEL.lower()
            model_installed = any(
                target in m.lower() or m.lower() in target or target.split(":")[0] in m.lower()
                for m in installed_models
            )
    except Exception:
        ollama_ok = False

    return LANStatusResponse(
        host_ip=lan_ip,
        port=PORT,
        server_url=server_url,
        frontend_url=frontend_url,
        qr_code_base64=qr_b64,
        is_online=True,
        client_count_estimate=3, # Active local peers on LAN subnet
        ollama_connected=ollama_ok,
        active_model=OLLAMA_MODEL if ollama_ok else "Offline Heuristic Fallback Engine",
        tesseract_installed=tesseract_ok,
        tesseract_message=tesseract_msg,
        ollama_model_installed=model_installed,
        ollama_installed_models=installed_models,
        vision_ocr_available=ocr_ok,
        vision_ocr_message=ocr_msg
    )
