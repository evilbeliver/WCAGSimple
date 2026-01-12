import type { Violation, ScanResult, PageScanResult } from '../utils/types';

export function generateHtmlReport(
  startUrl: string,
  pages: PageScanResult[],
  summary: ScanResult['summary']
): string {
  const timestamp = new Date().toLocaleString();

  const impactColors = {
    critical: '#dc2626',
    serious: '#ea580c',
    moderate: '#ca8a04',
    minor: '#0891b2',
  };

  // Generate scanned URLs list
  const scannedUrlsHtml = pages.map((page, index) => `
    <div class="scanned-page">
      <div class="page-header">
        <span class="page-number">${index + 1}</span>
        <code class="page-url">${escapeHtml(page.url)}</code>
      </div>
      <div class="page-summary">
        <span class="badge ${page.summary.total === 0 ? 'badge-success' : 'badge-warning'}">
          ${page.summary.total} ${page.summary.total === 1 ? 'violation' : 'violations'}
        </span>
        ${page.summary.critical > 0 ? `<span class="badge badge-critical">${page.summary.critical} critical</span>` : ''}
        ${page.summary.serious > 0 ? `<span class="badge badge-serious">${page.summary.serious} serious</span>` : ''}
      </div>
    </div>
  `).join('');

  // Aggregate all violations for impact-based grouping
  const allViolations = pages.flatMap(p => p.violations);
  const violationsByImpact = {
    critical: allViolations.filter(v => v.impact === 'critical'),
    serious: allViolations.filter(v => v.impact === 'serious'),
    moderate: allViolations.filter(v => v.impact === 'moderate'),
    minor: allViolations.filter(v => v.impact === 'minor'),
  };

  const violationsHtml = Object.entries(violationsByImpact)
    .filter(([_, items]) => items.length > 0)
    .map(([impact, items]) => {
      const color = impactColors[impact as keyof typeof impactColors];
      return `
        <section class="impact-section">
          <h2 style="color: ${color}; text-transform: capitalize;">
            ${impact} Issues (${items.length})
          </h2>
          ${items
            .map(
              v => `
            <article class="violation">
              <h3>${v.help}</h3>
              <p><strong>Rule:</strong> <code>${v.ruleId}</code></p>
              <p>${v.description}</p>
              <p><a href="${v.helpUrl}" target="_blank" rel="noopener noreferrer">Learn more</a></p>
              <details>
                <summary>Affected Elements (${v.nodes.length})</summary>
                <ul>
                  ${v.nodes
                    .map(
                      n => `
                    <li>
                      <p><strong>Target:</strong> <code>${n.target.join(', ')}</code></p>
                      <p>${n.failureSummary}</p>
                      <pre><code>${escapeHtml(n.html)}</code></pre>
                    </li>
                  `
                    )
                    .join('')}
                </ul>
              </details>
            </article>
          `
            )
            .join('')}
        </section>
      `;
    })
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accessibility Report - ${escapeHtml(startUrl)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      line-height: 1.6;
      color: #1f2937;
      background: #f9fafb;
      padding: 2rem 1rem;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    header {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }
    h1 { font-size: 1.875rem; margin-bottom: 1rem; }
    .scanned-url {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 0.25rem;
      word-break: break-all;
    }
    .scanned-url strong { color: #1e40af; }
    .scanned-url code {
      background: white;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      color: #1f2937;
      font-size: 0.875rem;
    }
    .meta { color: #6b7280; font-size: 0.875rem; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin: 2rem 0;
    }
    .summary-card {
      background: white;
      padding: 1.5rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-left: 4px solid;
    }
    .summary-card.total { border-color: #3b82f6; }
    .summary-card.critical { border-color: #dc2626; }
    .summary-card.serious { border-color: #ea580c; }
    .summary-card.moderate { border-color: #ca8a04; }
    .summary-card.minor { border-color: #0891b2; }
    .summary-card h3 { font-size: 0.875rem; text-transform: uppercase; color: #6b7280; }
    .summary-card p { font-size: 2rem; font-weight: bold; margin-top: 0.5rem; }
    .scanned-pages {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }
    .scanned-pages h2 { margin-bottom: 1rem; color: #1f2937; }
    .scanned-page {
      padding: 1rem;
      margin-bottom: 0.75rem;
      background: #f9fafb;
      border-radius: 0.375rem;
      border-left: 3px solid #3b82f6;
    }
    .page-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.5rem;
    }
    .page-number {
      background: #3b82f6;
      color: white;
      width: 2rem;
      height: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      font-weight: bold;
      font-size: 0.875rem;
      flex-shrink: 0;
    }
    .page-url {
      background: white;
      padding: 0.375rem 0.75rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      word-break: break-all;
      flex: 1;
    }
    .page-summary {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-left: 2.75rem;
    }
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-critical { background: #fee2e2; color: #991b1b; }
    .badge-serious { background: #fed7aa; color: #9a3412; }
    .impact-section {
      background: white;
      padding: 2rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }
    .impact-section h2 { margin-bottom: 1.5rem; }
    .violation {
      border-left: 3px solid #e5e7eb;
      padding: 1rem;
      margin-bottom: 1.5rem;
      background: #f9fafb;
    }
    .violation h3 { margin-bottom: 0.5rem; }
    .violation code { background: #e5e7eb; padding: 0.125rem 0.25rem; border-radius: 0.25rem; }
    .violation pre {
      background: #1f2937;
      color: #f9fafb;
      padding: 1rem;
      border-radius: 0.25rem;
      overflow-x: auto;
      margin-top: 0.5rem;
    }
    details { margin-top: 1rem; }
    summary {
      cursor: pointer;
      font-weight: 600;
      padding: 0.5rem;
      background: #e5e7eb;
      border-radius: 0.25rem;
    }
    summary:hover { background: #d1d5db; }
    details ul { list-style: none; padding: 1rem 0; }
    details li { margin-bottom: 1rem; padding: 1rem; background: white; border-radius: 0.25rem; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .no-violations {
      background: #d1fae5;
      border: 2px solid #10b981;
      color: #065f46;
      padding: 2rem;
      border-radius: 0.5rem;
      text-align: center;
      font-size: 1.125rem;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Accessibility Report</h1>
      <div class="scanned-url">
        <p><strong>Starting URL:</strong></p>
        <code>${escapeHtml(startUrl)}</code>
      </div>
      <div class="meta">
        <p><strong>Scanned:</strong> ${timestamp}</p>
        <p><strong>Pages Scanned:</strong> ${pages.length}</p>
        <p><strong>Standard:</strong> WCAG 2.1 Level AA</p>
      </div>
    </header>

    <div class="scanned-pages">
      <h2>Scanned Pages (${pages.length})</h2>
      ${scannedUrlsHtml}
    </div>

    <div class="summary">
      <div class="summary-card total">
        <h3>Total Issues</h3>
        <p>${summary.total}</p>
      </div>
      <div class="summary-card critical">
        <h3>Critical</h3>
        <p>${summary.critical}</p>
      </div>
      <div class="summary-card serious">
        <h3>Serious</h3>
        <p>${summary.serious}</p>
      </div>
      <div class="summary-card moderate">
        <h3>Moderate</h3>
        <p>${summary.moderate}</p>
      </div>
      <div class="summary-card minor">
        <h3>Minor</h3>
        <p>${summary.minor}</p>
      </div>
    </div>

    ${
      allViolations.length === 0
        ? '<div class="no-violations">✓ No accessibility violations found!</div>'
        : violationsHtml
    }
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
