// API functions for SafeCloud Security Scanner
const API_BASE = 'http://localhost:8000';

export interface ScanSummary {
  totalIssues: number;
  high: number;
  medium: number;
  low: number;
  complianceScore: number;
  scanDuration: number;
  estSavings: number;
  projectStatus: {
    lastScan: string;
    nextScan: string;
    totalScans: number;
  };
}

export interface ScanFinding {
  resource: string;
  type: string;
  severity: 'High' | 'Medium' | 'Low';
  recommendation: string;
  description?: string;
  id?: string;
  pattern?: string;
  location?: string;
  timestamp?: string;
}

export interface ScanResult {
  message: string;
  summary: ScanSummary;
  findingsCount: number;
  timestamp: string;
}

export interface ScanStatus {
  isScanning: boolean;
  progress?: number;
  currentFile?: string;
  timestamp: string;
}

export interface AuthStatus {
  success: boolean;
  authenticated?: boolean;
  hasAwsCredentials?: boolean;
  user?: any;
  timestamp: string;
}

// Scan API functions
export const scanAPI = {
  // Run a new security scan
  async runScan(): Promise<ScanResult> {
    const response = await fetch(`${API_BASE}/scan/run`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Scan failed: ${response.status}`);
    }

    return response.json();
  },

  // Get scan summary
  async getSummary(): Promise<{ summary: ScanSummary; timestamp: string; isScanning: boolean }> {
    const response = await fetch(`${API_BASE}/scan/summary`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get summary: ${response.status}`);
    }

    return response.json();
  },

  // Get scan findings
  async getFindings(): Promise<ScanFinding[]> {
    const response = await fetch(`${API_BASE}/scan/findings`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get findings: ${response.status}`);
    }

    const data = await response.json();

    // Backend returns { findings: [...], ... }
    const rawFindings: any[] = Array.isArray(data) ? data : (data.findings || []);

    // Map backend shape to frontend shape expected by dashboard
    const mapped: ScanFinding[] = rawFindings.map((f, idx) => {
      const descriptionFromDetails = f.details && (f.details.rule || f.details.description);
      return {
        resource: f.resource,
        type: f.type,
        severity: f.severity,
        recommendation: f.recommendation,
        description: f.description || descriptionFromDetails || '',
        id: f.id || `${f.resource || 'res'}:${f.type || 'type'}:${f.severity || 'sev'}:${idx}`,
      } as ScanFinding;
    });

    return mapped;
  },

  // Get scan status
  async getStatus(): Promise<ScanStatus> {
    const response = await fetch(`${API_BASE}/scan/status`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to get status: ${response.status}`);
    }

    return response.json();
  },

  // Check authentication status
  async getAuthStatus(): Promise<AuthStatus> {
    const response = await fetch(`${API_BASE}/auth/status`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Auth check failed: ${response.status}`);
    }

    return response.json();
  },

  // Debug session data
  async debugSession(): Promise<any> {
    const response = await fetch(`${API_BASE}/scan/debug`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Debug failed: ${response.status}`);
    }

    return response.json();
  },

  // Download latest report as PDF
  async downloadPDF(): Promise<Blob> {
    const response = await fetch(`${API_BASE}/scan/report.pdf`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      throw new Error(`Failed to download report: ${response.status}`);
    }
    return await response.blob();
  }
};

// Legacy functions for compatibility
export async function connectAWS(): Promise<{ success: boolean }> {
  return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1200));
}

export async function downloadPDF(): Promise<Blob> {
  return scanAPI.downloadPDF();
}
