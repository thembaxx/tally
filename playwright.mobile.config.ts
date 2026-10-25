import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: 'mobile.spec.ts',
  workers: 1,
  timeout: 60000,
  use: {
    browserName: 'webkit',
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    headless: true,
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: 'reduce',
    timezoneId: 'Africa/Johannesburg',
  },
  reporter: 'list',
});
