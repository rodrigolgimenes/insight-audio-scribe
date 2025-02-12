
import { test, expect } from '@playwright/test';

test.describe('Recording Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Mock media permissions
    await page.context().grantPermissions(['microphone']);
    await page.goto('/simple-record');
  });

  test('complete recording flow', async ({ page }) => {
    // Wait for the page to be ready
    await page.waitForSelector('select'); // Device select
    await page.waitForSelector('button[aria-label="Start Recording"]');

    // Select a device
    await page.selectOption('select', { index: 0 });

    // Start recording
    await page.click('button[aria-label="Start Recording"]');
    await expect(page.locator('text=Recording...')).toBeVisible();

    // Wait for some time
    await page.waitForTimeout(2000);

    // Stop recording
    await page.click('button[aria-label="Stop Recording"]');

    // Verify audio player appears
    await expect(page.locator('audio')).toBeVisible();

    // Try to save
    await page.click('button:has-text("Create Note")');

    // Verify success message
    await expect(page.locator('text=Recording saved')).toBeVisible();
  });

  test('handles errors gracefully', async ({ page }) => {
    // Simulate no microphone access
    await page.context().clearPermissions();
    await page.goto('/simple-record');

    await page.click('button[aria-label="Start Recording"]');
    await expect(page.locator('text=Please grant microphone access')).toBeVisible();
  });

  test('system audio recording', async ({ page }) => {
    await page.waitForSelector('[role="switch"]');
    await page.click('[role="switch"]');
    
    // Verify system audio warning
    await expect(page.locator('text=You\'ll need to grant additional permission')).toBeVisible();
  });

  test('recording duration limit', async ({ page }) => {
    await page.click('button[aria-label="Start Recording"]');
    
    // Fast-forward time to simulate long recording
    await page.evaluate(() => {
      const now = Date.now();
      Date.now = () => now + 25 * 60 * 1000; // 25 minutes
    });

    // Verify time limit warning
    await expect(page.locator('text=Recording time limit reached')).toBeVisible();
  });
});
