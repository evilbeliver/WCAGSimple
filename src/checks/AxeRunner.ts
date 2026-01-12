import type { Page } from 'playwright';
import * as axe from 'axe-core';
import type { Violation } from '../utils/types';
import { logger } from '../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

export async function runAxeChecks(page: Page): Promise<Violation[]> {
  logger.info('Running Axe-Core accessibility checks');

  try {
    // Get the axe-core source code from node_modules
    // Use process.cwd() to get absolute path since require.resolve doesn't work well with Turbopack
    const axeSourcePath = path.join(process.cwd(), 'node_modules', 'axe-core', 'axe.min.js');
    const axeSource = fs.readFileSync(axeSourcePath, 'utf8');

    // Inject axe-core into the page
    await page.addScriptTag({ content: axeSource });

    // Run axe with WCAG 2.1 AA rules
    const results = await page.evaluate(async () => {
      // @ts-expect-error axe is injected globally
      return await window.axe.run({
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      });
    });

    const violations: Violation[] = results.violations.map((v: Record<string, unknown>) => ({
      ruleId: v.id as string,
      description: v.description as string,
      impact: v.impact as Violation['impact'],
      help: v.help as string,
      helpUrl: v.helpUrl as string,
      nodes: (v.nodes as Array<Record<string, unknown>>).map(n => ({
        html: n.html as string,
        target: n.target as string[],
        failureSummary: n.failureSummary as string,
      })),
    }));

    logger.info('Axe checks completed', { violationCount: violations.length });

    return violations;
  } catch (error) {
    logger.error('Axe checks failed', { error: String(error) });
    throw error;
  }
}
