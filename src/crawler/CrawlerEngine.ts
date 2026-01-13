import { chromium, Browser, Page, BrowserContext } from 'playwright';
import type { ScanRequest, ScanResult, Violation, PageScanResult } from '../utils/types';
import { ScanError, isValidUrl, sanitizeCredentials } from '../utils/errors';
import { logger } from '../utils/logger';
import { runAxeChecks } from '../checks/AxeRunner';
import { generateHtmlReport } from '../reporter/HtmlReporter';

export class CrawlerEngine {
  private browser: Browser | null = null;
  private browserContext: BrowserContext | null = null; // Shared context for cookie persistence
  private visitedUrls: Set<string> = new Set();
  private maxPages: number = 100; // Default max pages to scan
  private authenticated: boolean = false; // Track if already authenticated
  private authPage: Page | null = null; // Keep the authenticated page open to maintain session

  async initialize(): Promise<void> {
    if (!this.browser) {
      this.browser = await chromium.launch({ 
        headless: true,
      });
      // Create a persistent browser context for all pages to share cookies
      this.browserContext = await this.browser.newContext();
      logger.info('Browser initialized with persistent context');
    }
  }

  async close(): Promise<void> {
    if (this.authPage) {
      await this.authPage.close().catch(() => {});
      this.authPage = null;
    }
    if (this.browserContext) {
      await this.browserContext.close().catch(() => {});
      this.browserContext = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }

  async scan(request: ScanRequest): Promise<ScanResult> {
    const startTime = Date.now();
    this.visitedUrls.clear();
    this.maxPages = request.maxPages || 100;
    const scanType = request.scanType || 'both';
    
    logger.info('Starting multi-page scan', { url: request.url, maxPages: this.maxPages, scanType });

    // Validate URL
    if (!isValidUrl(request.url)) {
      throw new ScanError('Invalid URL format', 'INVALID_URL', request.url);
    }

    // Check if already aborted
    if (request.abortSignal?.aborted) {
      throw new ScanError('Scan cancelled', 'SCAN_CANCELLED', 'Scan was cancelled before starting');
    }

    // Validate authenticated scan requires credentials
    if (scanType === 'authenticated' && !request.credentials) {
      throw new ScanError('Credentials required', 'CREDENTIALS_REQUIRED', 'Authenticated scan requires login credentials');
    }

    // Sanitize credentials
    sanitizeCredentials(request.credentials);

    await this.initialize();

    const startUrl = new URL(request.url);
    const baseUrl = `${startUrl.protocol}//${startUrl.host}`;
    const pages: PageScanResult[] = [];
    const urlsToScan: string[] = [request.url];

    try {
      // Perform authentication once before scanning (if credentials provided and not public-only scan)
      if (request.credentials && scanType !== 'public') {
        await this.handleAuthentication(request);
      }

      // Try to discover URLs from sitemap first (skip for authenticated-only scans)
      if (scanType !== 'authenticated') {
        const sitemapUrls = await this.discoverSitemapUrls(baseUrl);
        if (sitemapUrls.length > 0) {
          logger.info('Discovered URLs from sitemap', { count: sitemapUrls.length, baseUrl });
          // Add sitemap URLs to the queue (but don't exceed maxPages)
          urlsToScan.push(...sitemapUrls.slice(0, this.maxPages - 1));
        }
      } else {
        logger.info('Skipping sitemap discovery for authenticated-only scan');
      }

      // Crawl pages up to maxPages limit
      while (urlsToScan.length > 0 && pages.length < this.maxPages) {
        // Check if scan was cancelled
        if (request.abortSignal?.aborted) {
          logger.info('Scan cancelled by user', { pagesScanned: pages.length });
          throw new ScanError('Scan cancelled', 'SCAN_CANCELLED', 'Scan was cancelled by user');
        }
        
        const currentUrl = urlsToScan.shift()!;
        
        // Skip if already visited
        if (this.visitedUrls.has(currentUrl)) {
          continue;
        }
        
        this.visitedUrls.add(currentUrl);
        logger.info('Scanning page', { url: currentUrl, progress: `${pages.length + 1}/${this.maxPages}` });

        const page = await this.browserContext!.newPage();
        
        // Debug: Check if cookies are available in this new page's context
        if (this.authenticated) {
          const pageCookies = await page.context().cookies();
          logger.info('Cookies available in new page', { 
            url: currentUrl,
            cookieCount: pageCookies.length,
            hasCookies: pageCookies.length > 0
          });
        }
        
        try {
          // Navigate to URL with timeout
          const response = await page.goto(currentUrl, {
            waitUntil: 'load',
            timeout: 60000,
          });

          if (!response || !response.ok()) {
            logger.warn('Page failed to load', { url: currentUrl, status: response?.status() });
            continue;
          }

          // Check if page is behind authentication
          const finalUrl = page.url();
          const isLoginPage = finalUrl.includes('/login') || finalUrl.includes('/signin') || finalUrl.includes('/auth');
          const isAuthenticatedPath = (
            finalUrl.includes('/dashboard') || 
            finalUrl.includes('/account') || 
            finalUrl.includes('/profile') || 
            finalUrl.includes('/settings') ||
            finalUrl.includes('/my') ||
            finalUrl.includes('/user') ||
            finalUrl.includes('/member')
          );
          const isPublicPath = (
            finalUrl === baseUrl + '/' ||
            finalUrl === baseUrl ||
            finalUrl.includes('/about') ||
            finalUrl.includes('/contact') ||
            finalUrl.includes('/faq') ||
            finalUrl.includes('/help') ||
            finalUrl.includes('/terms') ||
            finalUrl.includes('/privacy') ||
            finalUrl.includes('/how-it-works') ||
            finalUrl.includes('/health-plans')
          );
          
          // Filter based on scanType
          if (scanType === 'authenticated') {
            // In authenticated mode, skip login pages and public pages
            if (isLoginPage) {
              logger.warn('Redirected to login page, skipping', { url: currentUrl, redirectedTo: finalUrl });
              continue;
            }
            if (isPublicPath && !isAuthenticatedPath) {
              logger.info('Skipping public page in authenticated-only scan', { url: currentUrl });
              continue;
            }
          }
          
          if (scanType === 'public' && isLoginPage) {
            logger.info('Skipping login page in public scan', { url: currentUrl });
            continue;
          }

          logger.info('Page loaded', { url: currentUrl, status: response.status(), finalUrl });

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
    } finally {
      this.authenticated = false; // Reset for next scan
      if (this.authPage) {
        await this.authPage.close().catch(() => {});
        this.authPage = null;
      }
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

  private async handleAuthentication(request: ScanRequest): Promise<void> {
    if (!request.credentials || this.authenticated) return;

    const { username, password, loginUrl } = request.credentials;
    logger.info('Attempting authentication', { url: request.url, method: loginUrl ? 'form-based' : 'basic' });

    try {
      if (loginUrl) {
        // Form-based authentication - do it once and cookies will persist
        const page = await this.browserContext!.newPage();
        
        try {
          logger.info('Navigating to login page', { loginUrl });
          await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 60000 });
          
          // Wait for page to be fully loaded
          await page.waitForTimeout(1000);
        
          // Try to find and fill common username/email field selectors
        const usernameSelectors = [
          'input[name="username"]',
          'input[name="email"]',
          'input[type="email"]',
          'input[name="user"]',
          'input[id="username"]',
          'input[id="email"]',
          'input[placeholder*="username" i]',
          'input[placeholder*="email" i]',
          'input[autocomplete="username"]',
          'input[autocomplete="email"]',
        ];
        
        let usernameField = null;
        for (const selector of usernameSelectors) {
          usernameField = await page.$(selector);
          if (usernameField) {
            logger.info('Found username field', { selector });
            break;
          }
        }
        
        if (!usernameField) {
          throw new Error('Could not find username/email input field');
        }
        
        // Try to find and fill common password field selectors
        const passwordSelectors = [
          'input[name="password"]',
          'input[type="password"]',
          'input[id="password"]',
          'input[autocomplete="current-password"]',
        ];
        
        let passwordField = null;
        for (const selector of passwordSelectors) {
          passwordField = await page.$(selector);
          if (passwordField) {
            logger.info('Found password field', { selector });
            break;
          }
        }
        
        if (!passwordField) {
          throw new Error('Could not find password input field');
        }
        
        // Fill in the credentials
        await usernameField.fill(username);
        await passwordField.fill(password);
        
        logger.info('Credentials filled, submitting form');
        
        // Try to find and click the submit button
        const submitSelectors = [
          'button[type="submit"]',
          'input[type="submit"]',
          'button[name="submit"]',
          'button:has-text("Sign in")',
          'button:has-text("Log in")',
          'button:has-text("Login")',
          'button:has-text("Submit")',
        ];
        
        let submitButton = null;
        for (const selector of submitSelectors) {
          try {
            submitButton = await page.$(selector);
            if (submitButton) {
              logger.info('Found submit button', { selector });
              break;
            }
          } catch {
            // Continue to next selector
          }
        }
        
        if (submitButton) {
          // Click submit and wait for navigation (or timeout)
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'load', timeout: 30000 }).catch((err) => {
              // Navigation might not happen if it's a SPA, log but continue
              logger.warn('Navigation timeout after login', { error: String(err) });
            }),
            submitButton.click(),
          ]);
          
          // Wait additional time for session to be established
          await page.waitForTimeout(3000);
        } else {
          // Try pressing Enter as fallback
          logger.warn('Could not find submit button, pressing Enter');
          await passwordField.press('Enter');
          await page.waitForTimeout(5000); // Wait longer for login to process
        }
        
        // Verify login succeeded by checking URL and page content
        const postLoginUrl = page.url();
        logger.info('Post-login check', { postLoginUrl });
        
        // Check if we navigated away from login page (even if just to a redirect page)
        const stillOnLoginPage = postLoginUrl.includes('/login') || postLoginUrl.includes('/signin');
        
        // Also check if there are any error messages on the page
        const hasLoginError = await page.evaluate(() => {
          const errorSelectors = [
            '.error', '.alert-error', '.alert-danger', 
            '[class*="error"]', '[class*="invalid"]',
            '[role="alert"]'
          ];
          return errorSelectors.some(sel => {
            const el = document.querySelector(sel);
            return el && el.textContent && el.textContent.length > 0;
          });
        });
        
        if (stillOnLoginPage || hasLoginError) {
          logger.error('Login failed', { stillOnLoginPage, hasLoginError, postLoginUrl });
          throw new Error('Authentication failed - check credentials or login page changed');
        }
        
        // Get cookies to verify session was created
        const context = page.context();
        const cookies = await context.cookies();
        const sessionCookies = cookies.filter(c => 
          c.name.toLowerCase().includes('session') || 
          c.name.toLowerCase().includes('auth') ||
          c.name.toLowerCase().includes('token')
        );
        logger.info('Authentication cookies set', { 
          totalCookies: cookies.length,
          sessionCookies: sessionCookies.map(c => c.name)
        });
        
        if (cookies.length === 0) {
          logger.warn('No cookies set after login - authentication may not persist');
        }
        
        logger.info('Form-based authentication completed successfully');
        
        // Store the authenticated page to keep session alive
        this.authPage = page;
        
        } finally {
          // Don't close the page in finally - we stored it in this.authPage
        }
        
        this.authenticated = true; // Mark as authenticated
      } else {
        // HTTP Basic authentication - set on browser context
        const context = this.browser!.contexts()[0];
        await context.setExtraHTTPHeaders({
          Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
        });
        logger.info('HTTP Basic authentication configured');
        this.authenticated = true;
      }
    } catch (error) {
      logger.error('Authentication failed', { error: String(error) });
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
