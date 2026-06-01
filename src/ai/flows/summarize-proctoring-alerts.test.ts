import { describe, it, expect, vi } from 'vitest';

// Mock the Genkit boundary so the flow never reaches a real model. `defineFlow`
// returns the handler so we can call it directly; `definePrompt` returns a spy
// we can assert was NOT called on the short-circuit path.
const { promptSpy } = vi.hoisted(() => ({ promptSpy: vi.fn() }));

vi.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: () => promptSpy,
    defineFlow: (_config: unknown, handler: (input: unknown) => unknown) =>
      handler,
  },
}));

import { summarizeProctoringAlerts } from '@/ai/flows/summarize-proctoring-alerts';

describe('summarizeProctoringAlerts', () => {
  it('short-circuits an empty alert list without calling the model', async () => {
    const result = await summarizeProctoringAlerts({ alerts: [] });
    expect(result.summary).toBe(
      'No proctoring violations were detected during the exam session.'
    );
    expect(promptSpy).not.toHaveBeenCalled();
  });
});
