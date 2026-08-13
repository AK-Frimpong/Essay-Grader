"""
Configuration and Environment Settings for Offline Essay Grader
Engineered for Ghanaian Schools LAN Client-Server Infrastructure
"""
import os
import socket
from pathlib import Path

# Base Directories (Vercel Serverless /tmp compatibility)
IS_VERCEL = os.getenv("VERCEL") == "1"
BASE_DIR = Path("/tmp") if IS_VERCEL else Path(__file__).resolve().parent.parent
APP_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
GENERATED_REPORTS_DIR = BASE_DIR / "generated_reports"
LICENSES_DIR = BASE_DIR / "licenses"
DATABASE_PATH = BASE_DIR / "grader.db"

# Auto-load .env environment file if present
for potential_env in [BASE_DIR / ".env", BASE_DIR.parent / ".env", APP_DIR / ".env"]:
    if potential_env.exists():
        try:
            with open(potential_env, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ[k.strip()] = v.strip().strip("'\"")
        except Exception:
            pass

# Create directories if they do not exist
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
GENERATED_REPORTS_DIR.mkdir(parents=True, exist_ok=True)
LICENSES_DIR.mkdir(parents=True, exist_ok=True)

# LAN & Server Config
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))
FRONTEND_PORT = int(os.getenv("FRONTEND_PORT", 5173))

# Ollama LLM Configuration
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3:mini-4k-instruct")
OLLAMA_TIMEOUT_SECONDS = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", 90))

# Paystack Config (Test keys for Ghana Mobile Money)
PAYSTACK_PUBLIC_KEY = os.getenv("PAYSTACK_PUBLIC_KEY", "pk_test_offline_grader_ghana_momo")
PAYSTACK_SECRET_KEY = os.getenv("PAYSTACK_SECRET_KEY", "sk_test_offline_grader_ghana_momo")

# Google Cloud Vision API Config (Online Handwriting OCR)
GOOGLE_CLOUD_VISION_API_KEY = os.getenv("GOOGLE_CLOUD_VISION_API_KEY", "")
GOOGLE_APPLICATION_CREDENTIALS = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
VISION_OCR_ENABLED = os.getenv("VISION_OCR_ENABLED", "true").lower() in ["true", "1", "yes"]

def is_gcv_configured() -> bool:
    """Check if Google Cloud Vision API Key or Service Account credentials are provided."""
    key = os.getenv("GOOGLE_CLOUD_VISION_API_KEY", GOOGLE_CLOUD_VISION_API_KEY)
    creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", GOOGLE_APPLICATION_CREDENTIALS)
    enabled = os.getenv("VISION_OCR_ENABLED", "true").lower() in ["true", "1", "yes"]
    is_valid_key = bool(key and key.strip() and not key.startswith("your_api_key") and not key.startswith("AIzaSy..."))
    is_valid_creds = bool(creds and Path(creds).exists())
    return enabled and (is_valid_key or is_valid_creds)

def is_online_mode() -> bool:
    """Check if active internet connectivity is available."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(1.0)
        s.connect(("8.8.8.8", 53))
        s.close()
        return True
    except Exception:
        return False

# WAEC Grade Scales (A1 - F9)
WAEC_GRADE_SCALE = [
    {"grade": "A1", "label": "Excellent", "min_score": 80.0, "max_score": 100.0, "color": "#059669"},
    {"grade": "B2", "label": "Very Good", "min_score": 70.0, "max_score": 79.99, "color": "#10B981"},
    {"grade": "B3", "label": "Good", "min_score": 65.0, "max_score": 69.99, "color": "#3B82F6"},
    {"grade": "C4", "label": "Credit", "min_score": 60.0, "max_score": 64.99, "color": "#06B6D4"},
    {"grade": "C5", "label": "Credit", "min_score": 55.0, "max_score": 59.99, "color": "#8B5CF6"},
    {"grade": "C6", "label": "Credit", "min_score": 50.0, "max_score": 54.99, "color": "#F59E0B"},
    {"grade": "D7", "label": "Pass", "min_score": 45.0, "max_score": 49.99, "color": "#F97316"},
    {"grade": "E8", "label": "Weak Pass", "min_score": 40.0, "max_score": 44.99, "color": "#EF4444"},
    {"grade": "F9", "label": "Fail", "min_score": 0.0, "max_score": 39.99, "color": "#991B1B"},
]

def get_waec_grade(percentage: float) -> dict:
    """Resolve percentage score to Ghanaian WAEC letter grade."""
    clamped_pct = max(0.0, min(100.0, float(percentage)))
    for grade_info in WAEC_GRADE_SCALE:
        if grade_info["min_score"] <= clamped_pct <= grade_info["max_score"]:
            return grade_info
    return WAEC_GRADE_SCALE[-1]  # Default to F9

def get_lan_ip() -> str:
    """Detect the local machine's LAN IP address for local network access without network blocking."""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.1)
        # 10.255.255.255 doesn't require active internet routing to determine local interface IP
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        try:
            return socket.gethostbyname(socket.gethostname())
        except Exception:
            return "127.0.0.1"
