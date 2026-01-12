export interface ScanRequest {
  url: string;
  credentials?: {
    username: string;
    password: string;
  };
  timestamp: Date;
  maxPages?: number; // Maximum number of pages to scan
}

export interface Violation {
  ruleId: string;
  description: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  help: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

export interface PageScanResult {
  url: string;
  violations: Violation[];
  summary: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

export interface ScanResult {
  url: string; // Starting URL
  pages: PageScanResult[]; // Results for each scanned page
  violations: Violation[]; // All violations across all pages
  summary: {
    total: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  reportHtml: string;
  completedAt: Date;
  success: boolean;
  error?: string;
}
