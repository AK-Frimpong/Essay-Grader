"""
FastAPI Server Entrypoint
Configured for Local Area Network (LAN) host binding (0.0.0.0:8000) and CORS access.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import UPLOADS_DIR, GENERATED_REPORTS_DIR, HOST, PORT, get_lan_ip
from app.database import init_db
from app.seed_data import seed_database
from app.routers import rubrics, ingest, grade, review, export, license, lan, auth

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("offline_essay_grader")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize database, WAL mode, and seed records on startup."""
    logger.info("Initializing SQLite database with WAL mode...")
    init_db()
    seed_database()
    lan_ip = get_lan_ip()
    logger.info("=" * 60)
    logger.info(f"🚀 Ghanaian Offline Essay Grader Server Running!")
    logger.info(f"   Local Host Access:   http://localhost:{PORT}")
    logger.info(f"   LAN Classroom Access: http://{lan_ip}:{PORT}")
    logger.info(f"   API Documentation:   http://{lan_ip}:{PORT}/docs")
    logger.info("=" * 60)
    yield
    logger.info("Server shutting down cleanly.")

app = FastAPI(
    title="Offline Essay Grader with Rubric-Aligned AI Feedback",
    description="LAN-based essay evaluation platform tailored for Ghanaian schools with low internet access.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration for local Wi-Fi / Ethernet access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all LAN device IPs (192.168.x.x, 10.x.x.x, localhost)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static File Mounts for Uploads & PDF Report Previews
app.mount("/api/v1/ingest/files", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
app.mount("/api/v1/export/reports", StaticFiles(directory=str(GENERATED_REPORTS_DIR)), name="reports")

# Register API Routers
app.include_router(auth.router)
app.include_router(lan.router)
app.include_router(rubrics.router)
app.include_router(ingest.router)
app.include_router(grade.router)
app.include_router(review.router)
app.include_router(export.router)
app.include_router(license.router)

@app.get("/")
def root():
    lan_ip = get_lan_ip()
    return {
        "system": "Offline Essay Grader (Ghana LAN Edition)",
        "version": "1.0.0",
        "status": "OPERATIONAL",
        "host_ip": lan_ip,
        "api_docs": f"http://{lan_ip}:{PORT}/docs",
        "supported_standards": ["WAEC BECE", "WASSCE", "GES Curricula"]
    }
