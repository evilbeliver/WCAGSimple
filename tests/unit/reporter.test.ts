import { describe, it, expect } from 'vitest';
import { generateHtmlReport } from '@/reporter/HtmlReporter';
import type { Violation } from '@/utils/types';

describe('HtmlReporter', () => {
  it('should generate report for no violations', () => {
    const html = generateHtmlReport('https://example.com', [], {
      total: 0,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    });

    expect(html).toContain('No accessibility violations found');
    expect(html).toContain('https://example.com');
  });

  it('should generate report with violations', () => {
    const violations: Violation[] = [
      {
        ruleId: 'color-contrast',
        description: 'Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds',
        impact: 'serious',
        help: 'Elements must have sufficient color contrast',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
        nodes: [
          {
            html: '<div>Test</div>',
            target: ['div'],
            failureSummary: 'Element has insufficient color contrast',
          },
        ],
      },
    ];

    const html = generateHtmlReport('https://example.com', violations, {
      total: 1,
      critical: 0,
      serious: 1,
      moderate: 0,
      minor: 0,
    });

    expect(html).toContain('color-contrast');
    expect(html).toContain('Serious Issues');
    expect(html).toContain('Elements must have sufficient color contrast');
  });
});
