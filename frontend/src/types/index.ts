export interface RubricLevel {
  score: number;
  label: string;
  descriptor: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  description: string;
  max_score: number;
  weight: number;
  levels?: RubricLevel[];
}

export interface Rubric {
  id: string;
  title: string;
  subject: string;
  grade_level: string;
  description?: string;
  total_points: number;
  criteria: RubricCriterion[];
  is_default: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface Essay {
  id: string;
  title: string;
  student_name: string;
  student_id: string;
  school_name: string;
  subject: string;
  grade_level: string;
  rubric_id: string;
  rubric_title?: string;
  rubric_total_points?: number;
  original_filename?: string;
  file_type: 'IMAGE' | 'PDF' | 'DOCX' | 'TXT';
  file_path?: string;
  preprocessed_image_path?: string;
  raw_extracted_text?: string;
  corrected_text: string;
  word_count: number;
  status: 'UPLOADED' | 'EXTRACTED' | 'EVALUATED' | 'REVIEWED' | 'LOCKED' | 'APPROVED';
  submitted_at: string;
  overall_score?: number;
  percentage?: number;
  letter_grade?: string;
  is_approved?: boolean | number;
}

export interface GrammarHighlight {
  line_number?: number;
  issue_type: string;
  original_snippet: string;
  suggestion: string;
  explanation: string;
}

export interface CriterionScore {
  criterion_id: string;
  name: string;
  max_score: number;
  ai_score: number;
  teacher_score?: number;
  comment: string;
  level_matched?: string;
}

export interface Grade {
  id: string;
  essay_id: string;
  rubric_id: string;
  overall_score: number;
  max_overall_score: number;
  percentage: number;
  letter_grade: string;
  ai_evaluation_json?: {
    criteria_scores: CriterionScore[];
    overall_score: number;
    strengths: string[];
    weaknesses: string[];
    grammar_highlights: GrammarHighlight[];
    general_summary: string;
    evaluator_engine?: string;
  };
  final_criteria_scores_json: CriterionScore[];
  strengths_json?: string[];
  weaknesses_json?: string[];
  grammar_highlights_json?: GrammarHighlight[];
  teacher_feedback?: string;
  teacher_override_reason?: string;
  is_approved: boolean | number;
  approved_by?: string;
  approved_at?: string;
  pdf_report_path?: string;
}

export interface LicenseStatus {
  status: 'ACTIVE' | 'EXPIRED' | 'UNLICENSED';
  school_name: string;
  machine_uuid: string;
  valid_until: string;
  allowed_credits: number;
  used_credits: number;
  remaining_credits: number;
  license_key_masked: string;
}

export interface HardwareSignature {
  machine_uuid: string;
  mac_address: string;
  host_name: string;
  platform_info: string;
}

export interface LANStatus {
  host_ip: string;
  port: number;
  server_url: string;
  frontend_url: string;
  qr_code_base64: string;
  is_online: boolean;
  client_count_estimate: number;
  ollama_connected: boolean;
  active_model: string;
  tesseract_installed?: boolean;
  tesseract_message?: string;
  ollama_model_installed?: boolean;
  ollama_installed_models?: string[];
}

export interface AnalyticsOverview {
  total_essays: number;
  approved_essays: number;
  pending_review: number;
  average_percentage: number;
  grade_distribution: Record<string, number>;
  criteria_averages: Array<{
    criterion: string;
    average_score: number;
    max_score: number;
    mastery_pct: number;
  }>;
  recent_submissions: Array<{
    id: string;
    title: string;
    student_name: string;
    student_id: string;
    subject: string;
    status: string;
    submitted_at: string;
    percentage?: number;
    letter_grade?: string;
  }>;
}
