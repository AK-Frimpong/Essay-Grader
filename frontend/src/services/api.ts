import { 
  Rubric, 
  Essay, 
  Grade, 
  LicenseStatus, 
  HardwareSignature, 
  LANStatus, 
  AnalyticsOverview,
  CriterionScore
} from '../types';

// Dynamically resolve backend host using browser origin hostname to support school LAN Wi-Fi access
export const getBaseApiUrl = (): string => {
  const customHost = localStorage.getItem('custom_backend_host');
  if (customHost) return customHost;
  
  const hostname = window.location.hostname || 'localhost';
  return `http://${hostname}:8000/api/v1`;
};

export const api = {
  // LAN & Host Info
  getLanStatus: async (): Promise<LANStatus> => {
    const res = await fetch(`${getBaseApiUrl()}/lan/status`);
    if (!res.ok) throw new Error('Failed to reach LAN server status');
    return res.json();
  },

  // Rubrics
  getRubrics: async (subject?: string): Promise<Rubric[]> => {
    const url = subject ? `${getBaseApiUrl()}/rubrics?subject=${encodeURIComponent(subject)}` : `${getBaseApiUrl()}/rubrics`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch rubrics');
    return res.json();
  },

  getRubric: async (id: string): Promise<Rubric> => {
    const res = await fetch(`${getBaseApiUrl()}/rubrics/${id}`);
    if (!res.ok) throw new Error('Failed to fetch rubric details');
    return res.json();
  },

  createRubric: async (rubric: Partial<Rubric>): Promise<Rubric> => {
    const res = await fetch(`${getBaseApiUrl()}/rubrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rubric)
    });
    if (!res.ok) throw new Error('Failed to create rubric');
    return res.json();
  },

  updateRubric: async (id: string, rubric: Partial<Rubric>): Promise<Rubric> => {
    const res = await fetch(`${getBaseApiUrl()}/rubrics/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rubric)
    });
    if (!res.ok) throw new Error('Failed to update rubric');
    return res.json();
  },

  deleteRubric: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${getBaseApiUrl()}/rubrics/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Delete failed' }));
      throw new Error(err.detail || 'Failed to delete rubric');
    }
    return res.json();
  },

  // Ingestion & OCR
  uploadDocument: async (formData: FormData): Promise<any> => {
    const res = await fetch(`${getBaseApiUrl()}/ingest/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Failed to upload document');
    }
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
    const res = await fetch(`${getBaseApiUrl()}/ingest/correct-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to save corrected text');
    return res.json();
  },

  getEssays: async (status?: string, search?: string): Promise<Essay[]> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (search) params.append('search', search);
    
    const res = await fetch(`${getBaseApiUrl()}/ingest/essays?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to list essays');
    return res.json();
  },

  getEssayDetails: async (id: string): Promise<{ essay: Essay; grade?: Grade }> => {
    const res = await fetch(`${getBaseApiUrl()}/ingest/essays/${id}`);
    if (!res.ok) throw new Error('Failed to fetch essay details');
    return res.json();
  },

  deleteEssay: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(`${getBaseApiUrl()}/ingest/essays/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete essay');
    return res.json();
  },

  // AI Evaluation
  evaluateEssay: async (essay_id: string, rubric_id?: string): Promise<any> => {
    const res = await fetch(`${getBaseApiUrl()}/grade/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ essay_id, rubric_id })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Grading failed' }));
      throw new Error(err.detail || 'Failed to grade essay');
    }
    return res.json();
  },

  // Teacher Review & Grade Locking
  getReviewWorkspace: async (essay_id: string): Promise<{
    essay: Essay;
    grade?: Grade;
    audit_history: any[];
  }> => {
    const res = await fetch(`${getBaseApiUrl()}/review/${essay_id}`);
    if (!res.ok) throw new Error('Failed to load review workspace');
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
    const res = await fetch(`${getBaseApiUrl()}/review/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Failed to submit teacher review');
    return res.json();
  },

  // Analytics & Exports
  getAnalytics: async (): Promise<AnalyticsOverview> => {
    const res = await fetch(`${getBaseApiUrl()}/export/analytics`);
    if (!res.ok) throw new Error('Failed to fetch analytics');
    return res.json();
  },

  getStudentPdfUrl: (essay_id: string): string => {
    return `${getBaseApiUrl()}/export/pdf/${essay_id}`;
  },

  getBulkPdfUrl: (): string => {
    return `${getBaseApiUrl()}/export/bulk-pdf`;
  },

  getCsvExportUrl: (rubric_id?: string): string => {
    return rubric_id 
      ? `${getBaseApiUrl()}/export/csv?rubric_id=${rubric_id}` 
      : `${getBaseApiUrl()}/export/csv`;
  },

  // Licensing & MoMo Top-Up
  getHardwareSignature: async (): Promise<HardwareSignature> => {
    const res = await fetch(`${getBaseApiUrl()}/license/hardware-signature`);
    if (!res.ok) throw new Error('Failed to retrieve machine signature');
    return res.json();
  },

  getLicenseStatus: async (): Promise<LicenseStatus> => {
    const res = await fetch(`${getBaseApiUrl()}/license/status`);
    if (!res.ok) throw new Error('Failed to fetch license status');
    return res.json();
  },

  activateLicense: async (license_payload_b64: string): Promise<any> => {
    const res = await fetch(`${getBaseApiUrl()}/license/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ license_payload_b64 })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Activation failed' }));
      throw new Error(err.detail || 'License activation failed');
    }
    return res.json();
  },

  generateTestLicense: async (school_name?: string, credits?: number): Promise<any> => {
    const res = await fetch(`${getBaseApiUrl()}/license/generate-test-license`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ school_name: school_name || "Achimota School JHS", credits: credits || 500 })
    });
    if (!res.ok) throw new Error('Failed to generate test license');
    return res.json();
  },

  topupMoMo: async (payload: {
    phone_number: string;
    network: string;
    amount_ghs: number;
    credits_requested: number;
  }): Promise<any> => {
    const res = await fetch(`${getBaseApiUrl()}/license/momo-topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('MoMo transaction failed');
    return res.json();
  }
};
