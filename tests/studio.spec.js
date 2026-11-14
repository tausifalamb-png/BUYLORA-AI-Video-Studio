import { test, expect } from '@playwright/test';

test('studio loads and adapts to the viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Build product videos/i })).toBeVisible();
  await expect(page.getByText('Multi-scene timeline')).toBeVisible();
  await expect(page.getByRole('button', { name: /Export MP4/i })).toBeVisible();
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
  const box = await page.locator('.studio-grid').boundingBox();
  expect(box?.width).toBeGreaterThan(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
});

test('product image upload and template selection work', async ({ page }) => {
  await page.goto('/');
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 240;
    const x = c.getContext('2d');
    x.fillStyle = '#4d65b5'; x.fillRect(0, 0, 320, 240);
    x.fillStyle = '#fff'; x.font = 'bold 24px Arial'; x.fillText('TEST PRODUCT', 30, 120);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type="file"][accept="image/png,image/jpeg,image/webp"]').setInputFiles({
    name: 'test-product.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64')
  });
  await expect(page.getByText('Image uploaded')).toBeVisible();
  await page.getByRole('button', { name: /Editorial Fashion/i }).click({ force: true });
  await expect(page.getByRole('button', { name: /Editorial Fashion/i })).toHaveClass(/selected/);
});

test('MP4 export completes and downloads a valid MP4 in desktop Chromium', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'MP4 export is run once on desktop Chromium');
  await page.goto('/');
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 240;
    const x = c.getContext('2d');
    x.fillStyle = '#4d65b5'; x.fillRect(0, 0, 320, 240);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type="file"][accept="image/png,image/jpeg,image/webp"]').setInputFiles({
    name: 'export-test.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64')
  });
  await expect(page.getByText('Image uploaded')).toBeVisible();
  const downloadPromise = page.waitForEvent('download', { timeout: 150000 }).then(download => ({ download })).catch(() => null);
  const errorPromise = page.locator('.error-message').waitFor({ state: 'visible', timeout: 150000 }).then(async () => ({ error: await page.locator('.error-message').innerText() })).catch(() => null);
  await page.getByRole('button', { name: /Export MP4/i }).click();
  const result = await Promise.race([downloadPromise, errorPromise]);
  expect(result, 'Export neither downloaded a file nor displayed an error').not.toBeNull();
  if (result?.error) throw new Error('Export UI error: ' + result.error);
  const download = result.download;
  expect(download.suggestedFilename()).toMatch(/\.mp4$/i);
  const path = await download.path();
  expect(path).toBeTruthy();
  const fs = await import('node:fs/promises');
  const file = await fs.readFile(path);
  expect(file.byteLength).toBeGreaterThan(1000);
  expect(file.subarray(4, 8).toString()).toBe('ftyp');
  await expect(page.getByText('MP4 exported successfully.')).toBeVisible({ timeout: 15000 });
});


test('multi-scene editor, social formats and project controls are available', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'Full editor interaction is checked on desktop; mobile layout is checked separately.');
  await page.goto('/');
  await expect(page.getByText('Template library · 24 layouts')).toBeVisible();
  await expect(page.locator('.template-card')).toHaveCount(24);
  await expect(page.locator('.scene-row')).toHaveCount(5);
  await page.getByRole('button', { name: /9:16/ }).click();
  await expect(page.getByRole('button', { name: /Reels \/ Shorts/i })).toHaveClass(/active/);
  await page.getByRole('button', { name: /1080p Full HD/i }).click();
  await expect(page.getByText('Advanced design controls')).toBeVisible();
  await expect(page.getByText('Audio & project system')).toBeVisible();
  await expect(page.getByRole('button', { name: /Record voice-over/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Save project/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Reopen project/i })).toBeVisible();
  await page.locator('.add-scene-row button').nth(2).click();
  await expect(page.locator('.scene-row')).toHaveCount(6);
});

test('scene project auto-saves and restores in the same browser', async ({ page }) => {
  await page.goto('/');
  const headline = page.locator('label').filter({ hasText: 'Scene headline' }).locator('input');
  await headline.fill('BUYLORA Test Headphones');
  await page.waitForTimeout(1300);
  await page.reload();
  await expect(page.locator('label').filter({ hasText: 'Scene headline' }).locator('input')).toHaveValue('BUYLORA Test Headphones');
});
