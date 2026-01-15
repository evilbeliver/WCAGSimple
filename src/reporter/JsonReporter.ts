import type { ScanResult, PageScanResult } from '../utils/types';

export interface AxeCoreJsonReport {
  timestamp: string;
  url: string;
  testEngine: {
    name: string;
    version: string;
  };
  testRunner: {
    name: string;
  };
  testEnvironment: {
    userAgent: string;
    windowWidth: number;
    windowHeight: number;
    orientationAngle: number;
    orientationType: string;
  };
  pages: Array<{
    url: string;
    timestamp: string;
    violations: Array<{
      id: string;
      impact: string;
      tags: string[];
      description: string;
      help: string;
      helpUrl: string;
      nodes: Array<{
        html: string;
        target: string[];
        failureSummary: string;
        impact: string;
      }>;
    }>;
  }>;
  summary: {
    totalPages: number;
    totalViolations: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
}

export function generateAxeCoreJsonReport(
  startUrl: string,
  pages: PageScanResult[],
  summary: ScanResult['summary']
): string {
  const timestamp = new Date().toISOString();
  
  const report: AxeCoreJsonReport = {
    timestamp,
    url: startUrl,
    testEngine: {
      name: 'axe-core',
      version: '4.10.2', // Update this to match your axe-core version
    },
    testRunner: {
      name: 'WCAGSimple',
    },
    testEnvironment: {
      userAgent: 'Playwright/Chromium',
      windowWidth: 1280,
      windowHeight: 720,
      orientationAngle: 0,
      orientationType: 'landscape-primary',
    },
    pages: pages.map(page => ({
      url: page.url,
      timestamp,
      violations: page.violations.map(violation => ({
        id: violation.ruleId,
        impact: violation.impact,
        tags: extractTags(violation.ruleId),
        description: violation.description,
        help: violation.help,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes.map(node => ({
          html: node.html,
          target: node.target,
          failureSummary: node.failureSummary,
          impact: violation.impact,
        })),
      })),
    })),
    summary: {
      totalPages: pages.length,
      totalViolations: summary.total,
      critical: summary.critical,
      serious: summary.serious,
      moderate: summary.moderate,
      minor: summary.minor,
    },
  };

  return JSON.stringify(report, null, 2);
}

// Helper function to extract WCAG tags from rule IDs
function extractTags(ruleId: string): string[] {
  const tags = ['wcag2a', 'wcag2aa'];
  
  // Add specific tags based on rule ID patterns
  if (ruleId.includes('color-contrast')) {
    tags.push('wcag143', 'cat.color');
  }
  if (ruleId.includes('image-alt') || ruleId.includes('alt')) {
    tags.push('wcag111', 'cat.text-alternatives');
  }
  if (ruleId.includes('label') || ruleId.includes('form')) {
    tags.push('wcag332', 'wcag131', 'cat.forms');
  }
  if (ruleId.includes('link')) {
    tags.push('wcag244', 'cat.name-role-value');
  }
  if (ruleId.includes('heading')) {
    tags.push('cat.semantics', 'best-practice');
  }
  if (ruleId.includes('landmark')) {
    tags.push('cat.semantics', 'best-practice');
  }
  if (ruleId.includes('aria')) {
    tags.push('cat.aria', 'wcag412');
  }
  
  return tags;
}
