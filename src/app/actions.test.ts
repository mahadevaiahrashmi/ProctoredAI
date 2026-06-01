import { describe, it, expect, vi } from 'vitest';

// Pin the active provider to one with neither TTS nor vision (e.g. a text-only
// Ollama setup). `ai.definePrompt`/`defineFlow` are stubbed so the real flow
// modules still load at import time without reaching a model.
vi.mock('@/ai/genkit', () => ({
  ai: {
    definePrompt: () => vi.fn(),
    defineFlow: (_config: unknown, handler: (input: unknown) => unknown) => handler,
  },
  visionModel: { name: 'ollama/llama3.2' },
  aiProvider: 'ollama',
  providerSupportsTTS: false,
  providerSupportsVision: false,
}));

// Spy on the two flows the degradation guards protect, so we can assert they
// are never invoked when the provider lacks the capability.
const { ttsSpy, detectSpy } = vi.hoisted(() => ({
  ttsSpy: vi.fn(),
  detectSpy: vi.fn(),
}));
vi.mock('@/ai/flows/text-to-speech', () => ({ textToSpeech: ttsSpy }));
vi.mock('@/ai/flows/detect-exam-violations', () => ({ detectExamViolations: detectSpy }));

import {
  textToSpeechAction,
  detectViolationsAction,
  getProviderCapabilitiesAction,
} from '@/app/actions';

describe('provider-aware action degradation', () => {
  it('textToSpeechAction returns "" and never calls the TTS flow without TTS support', async () => {
    const result = await textToSpeechAction('hello tutor');
    expect(result).toBe('');
    expect(ttsSpy).not.toHaveBeenCalled();
  });

  it('detectViolationsAction returns [] and never calls the proctoring flow without vision support', async () => {
    const result = await detectViolationsAction('data:image/jpeg;base64,AAAA');
    expect(result).toEqual([]);
    expect(detectSpy).not.toHaveBeenCalled();
  });

  it('getProviderCapabilitiesAction reports the active provider flags', async () => {
    await expect(getProviderCapabilitiesAction()).resolves.toEqual({
      provider: 'ollama',
      vision: false,
      tts: false,
    });
  });
});
