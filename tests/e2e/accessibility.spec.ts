import { test, expect } from '@playwright/test';

test.describe('WCAG Simple Accessibility', () => {
  test('homepage should be accessible', async ({ page }) => {
    await page.goto('/');

    // Check for proper heading hierarchy
    const h1 = await page.locator('h1').textContent();
    expect(h1).toContain('WCAG Simple');

    // Check for form labels
    const urlLabel = await page.locator('label[for="url"]');
    expect(await urlLabel.textContent()).toBeTruthy();

    // Check keyboard navigation
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('form should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    // Check URL input has aria-label
    const urlInput = page.locator('input[name="url"]');
    const ariaLabel = await urlInput.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();

    // Check submit button has aria-label
    const submitButton = page.locator('button[type="submit"]');
    const buttonAriaLabel = await submitButton.getAttribute('aria-label');
    expect(buttonAriaLabel).toBeTruthy();
  });
});
