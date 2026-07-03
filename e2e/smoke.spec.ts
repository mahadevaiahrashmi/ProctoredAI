import { test, expect } from '@playwright/test';

// Smoke-level E2E: exercises the real app shell end-to-end up to the first
// screen, which renders without any AI call (the provider-capability lookup is
// wrapped in a catch, so no GEMINI_API_KEY is required to run this).
//
// The richer scenarios sketched in docs/testing.md §2.3 (E2E-1 happy path,
// E2E-2 time-up auto-submit, E2E-3 permission denied, E2E-4 generation failure)
// build on this scaffold but need the Server Actions stubbed to stay offline
// and deterministic; they are intentionally not implemented here yet.
test.describe('exam setup wizard', () => {
  test('renders the setup wizard with name and topic fields', async ({ page }) => {
    await page.goto('/');

    // CardTitle renders a <div>, not a semantic heading, so match on text.
    await expect(page.getByText(/proctored exam setup/i)).toBeVisible();
    await expect(page.getByLabel(/your name/i)).toBeVisible();
    // Topic is pre-filled so the form is one field away from submittable.
    await expect(page.getByLabel(/exam topic/i)).toHaveValue('Quantum Physics');
  });

  test('enables "Generate Exam" only after a name is entered', async ({ page }) => {
    await page.goto('/');

    const generate = page.getByRole('button', { name: /generate exam/i });
    await expect(generate).toBeDisabled();

    await page.getByLabel(/your name/i).fill('Alex');
    await expect(generate).toBeEnabled();
  });
});
