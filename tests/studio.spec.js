import { test, expect } from '@playwright/test';

test('studio loads and adapts to the viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Make your product/i })).toBeVisible();
  await expect(page.getByText('Product details')).toBeVisible();
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
  await page.locator('input[type=file]').setInputFiles({
    name: 'test-product.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64')
  });
  await expect(page.getByText('Product image added')).toBeVisible();
  await page.getByRole('button', { name: /Bold Launch/i }).click();
  await expect(page.getByRole('button', { name: /Bold Launch/i })).toHaveClass(/selected/);
});

test('MP4 export completes in desktop Chromium', async ({ page, browserName }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium', 'MP4 export is run once on desktop Chromium');
  await page.goto('/');
  const png = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 320; c.height = 240;
    const x = c.getContext('2d');
    x.fillStyle = '#4d65b5'; x.fillRect(0, 0, 320, 240);
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').setInputFiles({
    name: 'export-test.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64')
  });
  await page.waitForTimeout(500);
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  const downloadPromise = page.waitForEvent('download', { timeout: 240000 });
  await page.getByRole('button', { name: /Export MP4/i }).click();
  const download = await downloadPromise;
  expect(pageErrors, pageErrors.join('\n')).toEqual([]);
  expect(download.suggestedFilename()).toMatch(/\.mp4$/i);
  const path = await download.path();
  expect(path).toBeTruthy();
  const fs = await import('node:fs/promises');
  const stat = await fs.stat(path);
  expect(stat.size).toBeGreaterThan(1000);
});
