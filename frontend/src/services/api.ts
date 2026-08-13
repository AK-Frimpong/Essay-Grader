import { 
  Rubric, 
  Essay, 
  Grade, 
  LicenseStatus, 
  HardwareSignature, 
  LANStatus, 
  AnalyticsOverview,
  CriterionScore,
  AuthenticityReport
} from '../types';

// Dynamically resolve backend host using browser origin hostname to support school LAN Wi-Fi access
export const getBaseApiUrl = (): string => {
  const customHost = typeof localStorage !== 'undefined' ? localStorage.getItem('custom_backend_host') : null;
  if (customHost) return customHost;
  
  const hostname = typeof window !== 'undefined' && window.location ? window.location.hostname || 'localhost' : 'localhost';
  return `http://${hostname}:8000/api/v1`;
};

// Helper to get request headers with optional Teacher Security PIN (X-Teacher-PIN)
const getHeaders = (includeJsonContentType = true): Record<string, string> => {
  const headers: Record<string, string> = {};
  if (includeJsonContentType) {
    headers['Content-Type'] = 'application/json';
  }
  const teacherPin = typeof localStorage !== 'undefined' ? localStorage.getItem('teacher_pin') : null;
  if (teacherPin) {
    headers['X-Teacher-PIN'] = teacherPin;
  }
  return headers;
};

// Helper to extract clean error message from API response or network exception
const parseApiError = (errData: any, defaultMsg: string): string => {
  if (!errData) return defaultMsg;
  if (typeof errData === 'string') return errData;
  if (typeof errData.detail === 'string') return errData.detail;
  if (Array.isArray(errData.detail)) {
    return errData.detail
      .map((item: any) => (item.msg ? `${item.loc ? item.loc.filter((l: any) => l !== 'body').join('.') + ': ' : ''}${item.msg}` : JSON.stringify(item)))
      .join('; ');
  }
  if (typeof errData.message === 'string') return errData.message;
  return defaultMsg;
};

const handleFetch = async (url: string, options?: RequestInit, defaultErrMsg = 'API request failed'): Promise<Response> => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({ detail: defaultErrMsg }));
      const msg = parseApiError(errData, defaultErrMsg);
      throw new Error(msg);
    }
    return res;
  } catch (err: any) {
    if (err.name === 'TypeError' && err.message?.includes('Failed to fetch')) {
      const baseUrl = getBaseApiUrl();
      throw new Error(`Unable to connect to server at ${baseUrl}. Please ensure the Python backend server is running on port 8000.`);
    }
    throw err;
  }
};

export const api = {
  // Authentication & Security PIN
  verifyPin: async (pin: string): Promise<{ valid: boolean; role: string; message: string }> => {
    const res = await handleFetch(`${getBaseApiUrl()}/auth/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    }, 'PIN verification failed');
    return res.json();
  },

  changePin: async (currentPin: string, newPin: string): Promise<{ success: boolean; message: string }> => {
    const res = await handleFetch(`${getBaseApiUrl()}/auth/change-pin`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ current_pin: currentPin, new_pin: newPin })
    }, 'Failed to update PIN');
    return res.json();
  },

  // LAN & Host Info
  getLanStatus: async (): Promise<LANStatus> => {
    const res = await handleFetch(`${getBaseApiUrl()}/lan/status`, undefined, 'Failed to reach LAN server status');
    return res.json();
  },

  // Rubrics
  getRubrics: async (subject?: string): Promise<Rubric[]> => {
    const url = subject ? `${getBaseApiUrl()}/rubrics?subject=${encodeURIComponent(subject)}` : `${getBaseApiUrl()}/rubrics`;
    const res = await handleFetch(url, undefined, 'Failed to fetch rubrics');
    return res.json();
  },

  getRubric: async (id: string): Promise<Rubric> => {
    const res = await handleFetch(`${getBaseApiUrl()}/rubrics/${id}`, undefined, 'Failed to fetch rubric details');
    return res.json();
  },

  createRubric: async (rubric: Partial<Rubric>): Promise<Rubric> => {
    const res = await handleFetch(`${getBaseApiUrl()}/rubrics`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(rubric)
    }, 'Failed to create rubric');
    return res.json();
  },

  updateRubric: async (id: string, rubric: Partial<Rubric>): Promise<Rubric> => {
    const res = await handleFetch(`${getBaseApiUrl()}/rubrics/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(rubric)
    }, 'Failed to update rubric');
    return res.json();
  },

  deleteRubric: async (id: string): Promise<{ message: string }> => {
    const res = await handleFetch(`${getBaseApiUrl()}/rubrics/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    }, 'Failed to delete rubric');
    return res.json();
  },

  // Ingestion & OCR
  uploadDocument: async (formData: FormData): Promise<any> => {
    const res = await handleFetch(`${getBaseApiUrl()}/ingest/upload`, {
      method: 'POST',
      headers: getHeaders(false),
      body: formData
    }, 'Failed to upload document for OCR extraction');
    return res.json();
  },

  batchUploadDocuments: async (formData: FormData): Promise<{
    total_processed: number;
    total_graded: number;
    results: Array<{
      essay_id: string;
      original_filename: string;
      student_name: string;
      student_id: string;
      file_type: string;
      word_count: number;
      status: string;
      evaluation?: {
        overall_score: number;
        max_score: number;
        percentage: number;
        letter_grade: string;
      };
    }>;
  }> => {
    const res = await handleFetch(`${getBaseApiUrl()}/ingest/batch`, {
      method: 'POST',
      headers: getHeaders(false),
      body: formData
    }, 'Failed batch document ingestion');
    return res.json();
  },

  saveCorrectedText: async (payload: {
    essay_id: string;
    corrected_text: string;
    title?: string;
    student_name?: string;
    student_id?: string;
    rubric_id?: string;
  }): Promise<any> => {
    const res = await handleFetch(`${getBaseApiUrl()}/ingest/correct-text`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    }, 'Failed to save corrected text');
    return res.json();
  },

  getEssays: async (status?: string, search?: string): Promise<Essay[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const res = await handleFetch(`${getBaseApiUrl()}/ingest/essays?${params.toString()}`, undefined, 'Failed to list essays');
    return res.json();
  },

  getEssayDetails: async (id: string): Promise<{ essay: Essay; grade?: Grade }> => {
    const res = await handleFetch(`${getBaseApiUrl()}/ingest/essays/${id}`, undefined, 'Failed to fetch essay details');
    return res.json();
  },

  deleteEssay: async (id: string): Promise<{ message: string }> => {
    const res = await handleFetch(`${getBaseApiUrl()}/ingest/essays/${id}`, {
      method: 'DELETE',
      headers: getHeaders(false)
    }, 'Failed to delete essay');
    return res.json();
  },

  clearEssays: async (): Promise<{ message: string }> => {
    const res = await handleFetch(`${getBaseApiUrl()}/ingest/essays`, {
      method: 'DELETE',
      headers: getHeaders(false)
    }, 'Failed to clear essays');
    return res.json();
  },

  // AI Evaluation & Authenticity
  evaluateEssay: async (essay_id: string, rubric_id?: string): Promise<any> => {
    const res = await handleFetch(`${getBaseApiUrl()}/grade/evaluate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ essay_id, rubric_id })
    }, 'Failed to evaluate essay with AI engine');
    return res.json();
  },

  getAuthenticityReport: async (essay_id: string): Promise<AuthenticityReport> => {
    const res = await handleFetch(`${getBaseApiUrl()}/grade/authenticity/${essay_id}`, undefined, 'Failed to fetch authenticity report');
    return res.json();
  },

  // Teacher Review & Grade Locking
  getReviewWorkspace: async (essay_id: string): Promise<{
    essay: Essay;
    grade?: Grade;
    audit_history: any[];
  }> => {
    const res = await handleFetch(`${getBaseApiUrl()}/review/${essay_id}`, undefined, 'Failed to load review workspace');
    return res.json();
  },

  submitTeacherReview: async (payload: {
    essay_id: string;
    criteria_overrides: CriterionScore[];
    teacher_feedback: string;
    teacher_override_reason?: string;
    approved_by?: string;
    lock_grade: boolean;
  }): Promise<Grade> => {
    const res = await handleFetch(`${getBaseApiUrl()}/review/submit`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    }, 'Failed to submit teacher review');
    return res.json();
  },

  // Analytics & Exports
  getAnalytics: async (): Promise<AnalyticsOverview> => {
    const res = await handleFetch(`${getBaseApiUrl()}/export/analytics`, undefined, 'Failed to fetch analytics');
    return res.json();
  },

  getStudentPdfUrl: (essay_id: string): string => {
    return `${getBaseApiUrl()}/export/pdf/${essay_id}`;
  },

  getBulkPdfUrl: (): string => {
    return `${getBaseApiUrl()}/export/bulk-pdf`;
  },

  getCsvExportUrl: (rubric_id?: string, essay_ids?: string[]): string => {
    const params = new URLSearchParams();
    if (rubric_id) params.append('rubric_id', rubric_id);
    if (essay_ids && essay_ids.length > 0) params.append('essay_ids', essay_ids.join(','));
    const queryString = params.toString();
    return queryString ? `${getBaseApiUrl()}/export/csv?${queryString}` : `${getBaseApiUrl()}/export/csv`;
  },

  // Licensing & MoMo Top-Up
  getHardwareSignature: async (): Promise<HardwareSignature> => {
    const res = await handleFetch(`${getBaseApiUrl()}/license/hardware-signature`, undefined, 'Failed to retrieve machine signature');
    return res.json();
  },

  getLicenseStatus: async (): Promise<LicenseStatus> => {
    const res = await handleFetch(`${getBaseApiUrl()}/license/status`, undefined, 'Failed to fetch license status');
    return res.json();
  },

  activateLicense: async (license_payload_b64: string): Promise<any> => {
    const res = await handleFetch(`${getBaseApiUrl()}/license/activate`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ license_payload_b64 })
    }, 'License activation failed');
    return res.json();
  },

  generateTestLicense: async (school_name?: string, credits?: number): Promise<any> => {
    const res = await handleFetch(`${getBaseApiUrl()}/license/generate-test-license`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ school_name: school_name || "Achimota School JHS", credits: credits || 500 })
    }, 'Failed to generate test license');
    return res.json();
  },

  topupMoMo: async (payload: {
    phone_number: string;
    network: string;
    amount_ghs: number;
    credits_requested: number;
  }): Promise<any> => {
    const res = await handleFetch(`${getBaseApiUrl()}/license/momo-topup`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(payload)
    }, 'MoMo transaction failed');
    return res.json();
  }
};

