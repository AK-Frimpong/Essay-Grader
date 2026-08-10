-- Offline Essay Grader Database Schema with SQLite WAL Mode
-- Engineered for Ghanaian Schools LAN Client-Server Infrastructure

-- Enable Write-Ahead Logging (WAL) for high concurrency over LAN
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA foreign_keys = ON;
PRAGMA busy_timeout = 5000;

-- 1. Rubrics Table
CREATE TABLE IF NOT EXISTS rubrics (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,             -- e.g. "English Language - WAEC BECE", "Social Studies - WASSCE"
    grade_level TEXT NOT NULL,         -- e.g. "JHS 1-3", "SHS 1-3"
    description TEXT,
    total_points INTEGER NOT NULL DEFAULT 100,
    criteria JSON NOT NULL,            -- Array of criteria: [{id, name, description, max_score, weight, levels: [...]}]
    is_default BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Essays Table
CREATE TABLE IF NOT EXISTS essays (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    student_name TEXT NOT NULL,
    student_id TEXT NOT NULL,          -- e.g. "STU-2026-089" or WAEC Index Number
    school_name TEXT NOT NULL DEFAULT 'Achimota Basic School / JHS',
    subject TEXT NOT NULL,
    grade_level TEXT NOT NULL,
    rubric_id TEXT NOT NULL,
    original_filename TEXT,
    file_type TEXT NOT NULL,           -- 'IMAGE', 'PDF', 'DOCX', 'TXT'
    file_path TEXT,
    preprocessed_image_path TEXT,
    raw_extracted_text TEXT,
    corrected_text TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'UPLOADED', -- 'UPLOADED', 'EXTRACTED', 'EVALUATED', 'REVIEWED', 'LOCKED'
    client_ip TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE RESTRICT
);

-- 3. Grades & Feedback Table
CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    essay_id TEXT UNIQUE NOT NULL,
    rubric_id TEXT NOT NULL,
    overall_score REAL NOT NULL,
    max_overall_score REAL NOT NULL DEFAULT 100.0,
    percentage REAL NOT NULL,
    letter_grade TEXT NOT NULL,        -- WAEC Scale: A1, B2, B3, C4, C5, C6, D7, E8, F9
    ai_evaluation_json JSON NOT NULL,  -- Structured Ollama feedback with criterion-level scores
    final_criteria_scores_json JSON NOT NULL, -- Final scores (with teacher overrides if any)
    strengths_json JSON,              -- Key student strengths
    weaknesses_json JSON,             -- Key areas for improvement
    grammar_highlights_json JSON,     -- Line-referenced grammar/spelling issues
    teacher_feedback TEXT,
    teacher_override_reason TEXT,
    is_approved BOOLEAN DEFAULT 0,
    approved_by TEXT,
    approved_at TIMESTAMP,
    pdf_report_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (essay_id) REFERENCES essays(id) ON DELETE CASCADE,
    FOREIGN KEY (rubric_id) REFERENCES rubrics(id) ON DELETE RESTRICT
);

-- 4. Licenses & Hardware Bindings Table
CREATE TABLE IF NOT EXISTS licenses (
    id TEXT PRIMARY KEY,
    school_name TEXT NOT NULL,
    machine_uuid TEXT NOT NULL,
    mac_address TEXT NOT NULL,
    license_key TEXT NOT NULL,
    public_key_pem TEXT NOT NULL,
    signature_b64 TEXT NOT NULL,
    valid_until DATE NOT NULL,
    allowed_credits INTEGER NOT NULL DEFAULT 100,
    used_credits INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'EXPIRED', 'UNLICENSED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Paystack Mobile Money & Offline Voucher Ledger Table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id TEXT PRIMARY KEY,
    transaction_ref TEXT UNIQUE NOT NULL,
    payment_method TEXT NOT NULL,       -- 'MTN_MOMO', 'TELECEL_CASH', 'AT_MONEY', 'OFFLINE_VOUCHER'
    phone_number TEXT,
    amount_ghs REAL NOT NULL,
    credits_added INTEGER NOT NULL,
    paystack_reference TEXT,
    status TEXT NOT NULL DEFAULT 'COMPLETED', -- 'PENDING', 'COMPLETED', 'FAILED'
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    essay_id TEXT,
    action TEXT NOT NULL,              -- 'INGEST', 'OCR_CLEAN', 'TEXT_EDIT', 'AI_EVALUATE', 'SCORE_OVERRIDE', 'GRADE_LOCK', 'PDF_EXPORT'
    details TEXT,
    actor TEXT NOT NULL DEFAULT 'Teacher / System',
    client_ip TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (essay_id) REFERENCES essays(id) ON DELETE SET NULL
);

-- Indexes for lightning fast queries over LAN
CREATE INDEX IF NOT EXISTS idx_essays_status ON essays(status);
CREATE INDEX IF NOT EXISTS idx_essays_student ON essays(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_essay ON grades(essay_id);
CREATE INDEX IF NOT EXISTS idx_audit_essay ON audit_logs(essay_id);
