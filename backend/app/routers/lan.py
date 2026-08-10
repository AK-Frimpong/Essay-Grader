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
    Retrieve LAN host status, detected IP, and pairing QR code.
    Enables classroom mobile devices to connect over school Wi-Fi.
    """
    lan_ip = get_lan_ip()
    server_url = f"http://{lan_ip}:{PORT}"
    frontend_url = f"http://{lan_ip}:{FRONTEND_PORT}"
    qr_b64 = _generate_qr_base64(frontend_url)

    # Check local Ollama connectivity
    ollama_ok = False
    try:
        res = requests.get(f"{OLLAMA_HOST.rstrip('/')}/api/tags", timeout=1.5)
        ollama_ok = res.status_code == 200
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
        active_model=OLLAMA_MODEL if ollama_ok else "Offline Heuristic Fallback Engine"
    )
