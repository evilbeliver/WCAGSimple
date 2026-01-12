import { chromium, Browser, Page } from 'playwright';
import type { ScanRequest, ScanResult, Violation, PageScanResult } from '../utils/types';
import { ScanError, isValidUrl, sanitizeCredentials } from '../utils/errors';
import { logger } from '../utils/logger';
import { runAxeChecks } from '../checks/AxeRunner';
import { generateHtmlReport } from '../reporter/HtmlReporter';

export class CrawlerEngine {
  private browser: Browser | null = null;
  private visitedUrls: Set<string> = new Set();
  private maxPages: number = 50; // Default max pages to scan

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({ headless: true });
      logger.info('Browser initialized');
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }

  async scan(request: ScanRequest): Promise<ScanResult> {
    const startTime = Date.now();
    this.visitedUrls.clear();
    this.maxPages = request.maxPages || 50;
    
    logger.info('Starting multi-page scan', { url: request.url, maxPages: this.maxPages });

    // Validate URL
    if (!isValidUrl(request.url)) {
      throw new ScanError('Invalid URL format', 'INVALID_URL', request.url);
    }

    // Sanitize credentials
    sanitizeCredentials(request.credentials);

    await this.initialize();

    const startUrl = new URL(request.url);
    const baseUrl = `${startUrl.protocol}//${startUrl.host}`;
    const pages: PageScanResult[] = [];
    const urlsToScan: string[] = [request.url];

    try {
      // Try to discover URLs from sitemap first
      const sitemapUrls = await this.discoverSitemapUrls(baseUrl);
      if (sitemapUrls.length > 0) {
        logger.info('Discovered URLs from sitemap', { count: sitemapUrls.length, baseUrl });
        // Add sitemap URLs to the queue (but don't exceed maxPages)
        urlsToScan.push(...sitemapUrls.slice(0, this.maxPages - 1));
      }

      // Crawl pages up to maxPages limit
      while (urlsToScan.length > 0 && pages.length < this.maxPages) {
        const currentUrl = urlsToScan.shift()!;
        
        // Skip if already visited
        if (this.visitedUrls.has(currentUrl)) {
          continue;
        }
        
        this.visitedUrls.add(currentUrl);
        logger.info('Scanning page', { url: currentUrl, progress: `${pages.length + 1}/${this.maxPages}` });

        const page = await this.browser!.newPage();
        
        try {
          // Handle authentication if credentials provided
          if (request.credentials) {
            await this.handleAuthentication(page, request);
          }

          // Navigate to URL with timeout
          const response = await page.goto(currentUrl, {
            waitUntil: 'load',
            timeout: 60000,
          });

          if (!response || !response.ok()) {
            logger.warn('Page failed to load', { url: currentUrl, status: response?.status() });
            continue;
          }

          logger.info('Page loaded', { url: currentUrl, status: response.status() });

          // Wait for JavaScript-rendered content (wait a bit for dynamic content to load)
          await page.waitForTimeout(2000);

          // Run accessibility checks
          const violations = await runAxeChecks(page);

          // Generate summary for this page
          const pageSummary = this.generateSummary(violations);

          pages.push({
            url: currentUrl,
            violations,
            summary: pageSummary,
          });

          // Discover new links on this page (only if we haven't reached max pages)
          if (pages.length < this.maxPages) {
            const newLinks = await this.discoverLinks(page, baseUrl);
            for (const link of newLinks) {
              if (!this.visitedUrls.has(link) && !urlsToScan.includes(link)) {
                urlsToScan.push(link);
              }
            }
          }

        } catch (error) {
          logger.error('Page scan failed', { url: currentUrl, error: String(error) });
        } finally {
          await page.close();
        }
      }

      // Aggregate all violations
      const allViolations: Violation[] = pages.flatMap(p => p.violations);
      const totalSummary = this.generateSummary(allViolations);

      // Generate HTML report with all pages
      const reportHtml = generateHtmlReport(request.url, pages, totalSummary);

      const result: ScanResult = {
        url: request.url,
        pages,
        violations: allViolations,
        summary: totalSummary,
        reportHtml,
        completedAt: new Date(),
        success: true,
      };

      const duration = Date.now() - startTime;
      logger.info('Multi-page scan completed', { 
        startUrl: request.url,
        pagesScanned: pages.length,
        totalViolations: totalSummary.total,
        duration: `${duration}ms` 
      });

      return result;
    } catch (error) {
      logger.error('Multi-page scan failed', { url: request.url, error: String(error) });
      
      if (error instanceof ScanError) {
        throw error;
      }

      throw new ScanError(
        'Scan failed',
        'SCAN_FAILED',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private async discoverSitemapUrls(baseUrl: string): Promise<string[]> {
    try {
      // Try XML sitemaps first
      const xmlSitemapUrls = [
        `${baseUrl}/sitemap.xml`,
        `${baseUrl}/sitemap_index.xml`,
      ];

      for (const sitemapUrl of xmlSitemapUrls) {
        try {
          logger.info('Checking for XML sitemap', { url: sitemapUrl });
          
          const response = await fetch(sitemapUrl);
          if (!response.ok) {
            continue;
          }

          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('xml') && !contentType.includes('text')) {
            continue;
          }

          const xml = await response.text();
          
          // Parse XML to extract URLs
          const urlMatches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
          const urls: string[] = [];
          
          for (const match of urlMatches) {
            const url = match[1].trim();
            // Skip if it's another sitemap (sitemap index)
            if (url.includes('sitemap') && (url.endsWith('.xml') || url.endsWith('.xml.gz'))) {
              // This is a sitemap index, fetch nested sitemaps
              try {
                const nestedResponse = await fetch(url);
                if (nestedResponse.ok) {
                  const nestedXml = await nestedResponse.text();
                  const nestedMatches = nestedXml.matchAll(/<loc>(.*?)<\/loc>/g);
                  for (const nestedMatch of nestedMatches) {
                    const nestedUrl = nestedMatch[1].trim();
                    if (!nestedUrl.includes('sitemap')) {
                      urls.push(nestedUrl);
                    }
                  }
                }
              } catch {
                // Ignore nested sitemap errors
              }
            } else {
              urls.push(url);
            }
          }

          if (urls.length > 0) {
            logger.info('Sitemap found', { url: sitemapUrl, urlCount: urls.length });
            return [...new Set(urls)]; // Remove duplicates
          }
        } catch (error) {
          // Try next sitemap location
          logger.debug('Sitemap not found', { url: sitemapUrl });
        }
      }

      // Try HTML sitemap page
      const htmlSitemapUrl = `${baseUrl}/sitemap`;
      try {
        logger.info('Checking for HTML sitemap', { url: htmlSitemapUrl });
        
        const response = await fetch(htmlSitemapUrl);
        if (response.ok) {
          const html = await response.text();
          
          // Extract all href attributes from anchor tags
          const hrefMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi);
          const urls: string[] = [];
          
          for (const match of hrefMatches) {
            let url = match[1].trim();
            
            // Convert relative URLs to absolute
            if (url.startsWith('/')) {
              url = `${baseUrl}${url}`;
            } else if (!url.startsWith('http')) {
              continue; // Skip invalid URLs
            }
            
            // Only include URLs from the same domain
            try {
              const urlObj = new URL(url);
              const baseUrlObj = new URL(baseUrl);
              const normalizeDomain = (host: string) => host.replace(/^www\./, '');
              
              if (normalizeDomain(urlObj.host) === normalizeDomain(baseUrlObj.host)) {
                urls.push(url);
              }
            } catch {
              // Skip invalid URLs
            }
          }
          
          if (urls.length > 0) {
            logger.info('HTML sitemap found', { url: htmlSitemapUrl, urlCount: urls.length });
            return [...new Set(urls)]; // Remove duplicates
          }
        }
      } catch (error) {
        logger.debug('HTML sitemap not found', { url: htmlSitemapUrl });
      }

      logger.info('No sitemap found', { baseUrl });
      return [];
    } catch (error) {
      logger.error('Failed to discover sitemap URLs', { error: String(error), baseUrl });
      return [];
    }
  }

  private async discoverLinks(page: Page, baseUrl: string): Promise<string[]> {
    try {
      const currentUrl = page.url(); // Get actual URL after redirects
      const links = await page.evaluate(({ base, current }) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        
        // Debug info
        const totalAnchors = anchors.length;
        
        // Helper to normalize domains (remove www or add it)
        const normalizeDomain = (host: string) => {
          return host.replace(/^www\./, '');
        };
        
        const baseURL = new URL(base);
        const currentURL = new URL(current);
        const baseDomain = normalizeDomain(baseURL.host);
        const currentDomain = normalizeDomain(currentURL.host);
        
        const allLinks = anchors.map(a => (a as HTMLAnchorElement).href);
        
        const filtered = allLinks.filter(href => {
            try {
              const url = new URL(href);
              const linkDomain = normalizeDomain(url.host);
              
              // Include links from same domain (with or without www)
              // and same protocol, excluding anchors and special protocols
              return (linkDomain === baseDomain || linkDomain === currentDomain) &&
                     url.protocol === baseURL.protocol &&
                     !href.includes('#') &&
                     !href.startsWith('mailto:') &&
                     !href.startsWith('tel:') &&
                     !href.startsWith('javascript:') &&
                     !href.match(/\.(pdf|jpg|jpeg|png|gif|svg|zip|doc|docx)$/i); // Skip files
            } catch {
              return false;
            }
          });
        
        // Return debug info along with links
        return {
          links: filtered,
          debug: {
            totalAnchors,
            totalLinks: allLinks.length,
            sampleLinks: allLinks.slice(0, 5),
            baseDomain,
            currentDomain
          }
        };
      }, { base: baseUrl, current: currentUrl });

      const uniqueLinks = [...new Set(links.links)];
      logger.info('Discovered links', { 
        count: uniqueLinks.length, 
        baseUrl, 
        currentUrl,
        debug: links.debug
      });
      return uniqueLinks;
    } catch (error) {
      logger.error('Failed to discover links', { error: String(error) });
      return [];
    }
  }

  private async handleAuthentication(page: Page, request: ScanRequest): Promise<void> {
    if (!request.credentials) return;

    logger.info('Attempting authentication', { url: request.url });

    try {
      // Basic HTTP authentication
      await page.setExtraHTTPHeaders({
        Authorization: `Basic ${Buffer.from(
          `${request.credentials.username}:${request.credentials.password}`
        ).toString('base64')}`,
      });

      logger.info('Authentication configured');
    } catch (error) {
      throw new ScanError(
        'Authentication failed',
        'AUTH_FAILED',
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  private generateSummary(violations: Violation[]): ScanResult['summary'] {
    const summary = {
      total: violations.length,
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    };

    violations.forEach(v => {
      summary[v.impact]++;
    });

    return summary;
  }
}

export const crawlerEngine = new CrawlerEngine();
