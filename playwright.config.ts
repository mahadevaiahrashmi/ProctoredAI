import { defineConfig, devices } from '@playwright/test';

// E2E (Playwright) config. Specs live under `e2e/` (kept separate from the
// Vitest unit/integration suite under `src/**/*.test.{ts,tsx}`). The dev server
// is started automatically; no GEMINI_API_KEY is needed for the smoke path
// because the home page renders without an AI call (provider-capability lookup
// is wrapped in a catch). AI-dependent scenarios should stub the actions.
const PORT = 9002;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Grant a fake camera/mic so proctoring scenarios run headless without
        // real hardware or a permission prompt. Harmless for the smoke spec.
        launchOptions: {
          args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
          ],
        },
        permissions: ['camera', 'microphone'],
      },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
