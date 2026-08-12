"""
Pydantic Schemas for Request & Response Serialization
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

# --- Rubric Schemas ---

class RubricLevel(BaseModel):
    score: float
    label: str
    descriptor: str

class RubricCriterion(BaseModel):
    id: str
    name: str
    description: str
    max_score: float
    weight: float = Field(default=1.0, ge=0.0, le=1.0)
    levels: List[RubricLevel] = []

class RubricCreate(BaseModel):
    title: str
    subject: str
    grade_level: str
    description: Optional[str] = None
    total_points: float = 100.0
    criteria: List[RubricCriterion]
    is_default: bool = False

class RubricResponse(BaseModel):
    id: str
    title: str
    subject: str
    grade_level: str
    description: Optional[str]
    total_points: float
    criteria: List[RubricCriterion]
    is_default: bool
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

# --- Ingestion & OCR Schemas ---

class IngestResponse(BaseModel):
    essay_id: str
    title: str
    student_name: str
    student_id: str
    school_name: str
    subject: str
    grade_level: str
    rubric_id: str
    file_type: str
    raw_extracted_text: str
    word_count: int
    image_url: Optional[str] = None
    preprocessed_image_url: Optional[str] = None
    status: str

class TextCorrectionRequest(BaseModel):
    essay_id: str
    corrected_text: str
    title: Optional[str] = None
    student_name: Optional[str] = None
    student_id: Optional[str] = None
    rubric_id: Optional[str] = None

class OCRFilterOptions(BaseModel):
    denoise: bool = True
    deskew: bool = True
    adaptive_threshold: bool = True
    contrast_enhancement: bool = True
    blur_kernel_size: int = 3

# --- Grading & Evaluation Schemas ---

class GrammarHighlight(BaseModel):
    line_number: Optional[int] = None
    issue_type: str  # 'Spelling', 'Subject-Verb Concord', 'Tense', 'Punctuation', 'Word Choice'
    original_snippet: str
    suggestion: str
    explanation: str

class CriterionScore(BaseModel):
    criterion_id: str
    name: str
    max_score: float
    ai_score: float
    teacher_score: Optional[float] = None
    comment: str
    level_matched: Optional[str] = None

class AIEvaluationResult(BaseModel):
    essay_id: str
    rubric_id: str
    overall_score: float
    max_overall_score: float
    percentage: float
    letter_grade: str
    grade_label: str
    criteria_scores: List[CriterionScore]
    strengths: List[str]
    weaknesses: List[str]
    grammar_highlights: List[GrammarHighlight]
    general_summary: str
    evaluator_engine: str  # 'Ollama (phi3:mini-4k-instruct)' or 'Offline Heuristic Engine'

class EvaluateRequest(BaseModel):
    essay_id: str
    rubric_id: Optional[str] = None

# --- Teacher Review & Grade Locking ---

class TeacherReviewSubmit(BaseModel):
    essay_id: str
    criteria_overrides: List[CriterionScore]
    teacher_feedback: str
    teacher_override_reason: Optional[str] = None
    approved_by: str = "Teacher / Examiner"
    lock_grade: bool = True

class GradeResponse(BaseModel):
    id: str
    essay_id: str
    rubric_id: str
    overall_score: float
    max_overall_score: float
    percentage: float
    letter_grade: str
    criteria_scores: List[CriterionScore]
    strengths: List[str]
    weaknesses: List[str]
    grammar_highlights: List[GrammarHighlight]
    teacher_feedback: Optional[str] = None
    teacher_override_reason: Optional[str] = None
    is_approved: bool
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    pdf_report_path: Optional[str] = None

# --- Licensing & Mobile Money Schemas ---

class HardwareSignatureResponse(BaseModel):
    machine_uuid: str
    mac_address: str
    host_name: str
    platform_info: str

class LicenseStatusResponse(BaseModel):
    status: str  # 'ACTIVE', 'EXPIRED', 'UNLICENSED'
    school_name: str
    machine_uuid: str
    valid_until: str
    allowed_credits: int
    used_credits: int
    remaining_credits: int
    license_key_masked: str

class LicenseActivationRequest(BaseModel):
    license_payload_b64: str

class MobileMoneyTopupRequest(BaseModel):
    phone_number: str  # e.g., '024XXXXXXX'
    network: str       # 'MTN_MOMO', 'TELECEL_CASH', 'AT_MONEY'
    amount_ghs: float  # Ghana Cedis
    credits_requested: int

# --- LAN & Analytics Schemas ---

class LANStatusResponse(BaseModel):
    host_ip: str
    port: int
    server_url: str
    frontend_url: str
    qr_code_base64: str
    is_online: bool
    client_count_estimate: int
    ollama_connected: bool
    active_model: str
    tesseract_installed: bool = True
    tesseract_message: str = "Tesseract OCR active"
    ollama_model_installed: bool = True
    ollama_installed_models: List[str] = []

class AnalyticsOverviewResponse(BaseModel):
    total_essays: int
    approved_essays: int
    pending_review: int
    average_percentage: float
    grade_distribution: Dict[str, int]  # e.g. {"A1": 5, "B2": 12, ...}
    criteria_averages: List[Dict[str, Any]]
    recent_submissions: List[Dict[str, Any]]
