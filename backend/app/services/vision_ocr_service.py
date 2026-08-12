"""
Google Cloud Vision OCR service for handwritten & scanned essay images.

This replaces local Tesseract as the primary OCR engine for handwritten
Ghanaian student scripts, which Tesseract handles poorly. It uses Vision's
document_text_detection, which is tuned for dense, handwritten text.

Authentication (pick one):
  * API key:            set GOOGLE_CLOUD_VISION_API_KEY
  * Service account:    set GOOGLE_APPLICATION_CREDENTIALS to a JSON path
"""
import logging
import os
from typing import Tuple

from app.config import GOOGLE_CLOUD_VISION_API_KEY, VISION_OCR_ENABLED

logger = logging.getLogger(__name__)

VISION_AVAILABLE = False
_vision_import_error = None
try:
    from google.cloud import vision
    VISION_AVAILABLE = True
except ImportError as e:  # pragma: no cover - depends on installed package
    _vision_import_error = e

_client = None


def _get_client():
    """Lazily build a singleton Vision client using API key or ADC."""
    global _client
    if _client is not None:
        return _client
    if not VISION_AVAILABLE:
        raise RuntimeError(
            "google-cloud-vision is not installed. Run: pip install google-cloud-vision"
        )
    if GOOGLE_CLOUD_VISION_API_KEY:
        _client = vision.ImageAnnotatorClient(
            client_options={"api_key": GOOGLE_CLOUD_VISION_API_KEY}
        )
    else:
        # Falls back to GOOGLE_APPLICATION_CREDENTIALS / Application Default Credentials
        _client = vision.ImageAnnotatorClient()
    return _client


def is_vision_ocr_available() -> Tuple[bool, str]:
    """
    Report whether Vision OCR can actually run.
    Returns (available: bool, message: str).
    """
    if not VISION_OCR_ENABLED:
        return False, "Vision OCR disabled via VISION_OCR_ENABLED=false."
    if not VISION_AVAILABLE:
        return False, (
            "google-cloud-vision package missing. "
            "Install it with: pip install google-cloud-vision"
        )
    if GOOGLE_CLOUD_VISION_API_KEY or os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
        return True, "Google Cloud Vision OCR ready (handwritten recognition active)."
    return False, (
        "Google Cloud credentials not found. Set GOOGLE_CLOUD_VISION_API_KEY "
        "or GOOGLE_APPLICATION_CREDENTIALS to enable handwritten OCR."
    )


def extract_text_with_vision(image_bytes: bytes) -> str:
    """
    Run Google Cloud Vision document text detection on raw image bytes.
    Returns the full extracted text, or "" if nothing was detected.
    """
    client = _get_client()
    image = vision.Image(content=image_bytes)
    response = client.document_text_detection(image=image)

    if response.error.message:
        raise RuntimeError(f"Vision API error: {response.error.message}")

    return (response.full_text_annotation.text or "").strip()
