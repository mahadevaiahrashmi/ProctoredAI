import { describe, it, expect, afterEach, vi } from 'vitest';

// Mock the heavy provider plugins with light fakes so the real env-driven
// selection logic in genkit.ts runs without constructing real clients or
// touching the network. Each fake `model()` echoes the provider-qualified name
// the way the real plugins do, which is what genkit.ts exposes as visionModel.
vi.mock('genkit', () => ({
  genkit: () => ({}),
  z: {},
}));
vi.mock('@genkit-ai/google-genai', () => ({
  googleAI: Object.assign(() => ({}), {
    model: (name: string) => ({ name: `googleai/${name}` }),
  }),
}));
vi.mock('genkitx-ollama', () => ({
  ollama: Object.assign(() => ({}), {
    model: (name: string) => ({ name: `ollama/${name}` }),
  }),
}));
vi.mock('@genkit-ai/compat-oai', () => ({
  openAICompatible: () => ({}),
  compatOaiModelRef: ({ name, namespace }: { name: string; namespace: string }) => ({
    name: `${namespace}/${name}`,
  }),
}));

// Re-import genkit.ts fresh under a given environment.
async function loadWithEnv(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.unstubAllEnvs();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) continue;
    vi.stubEnv(k, v);
  }
  return import('@/ai/genkit');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('genkit provider resolution', () => {
  it('defaults to googleai with TTS + vision when AI_PROVIDER is unset', async () => {
    const m = await loadWithEnv({ AI_PROVIDER: undefined });
    expect(m.aiProvider).toBe('googleai');
    expect(m.visionModel.name).toBe('googleai/gemini-2.5-flash');
    expect(m.providerSupportsTTS).toBe(true);
    expect(m.providerSupportsVision).toBe(true);
  });

  it('falls back to googleai for an unrecognized AI_PROVIDER', async () => {
    const m = await loadWithEnv({ AI_PROVIDER: 'banana' });
    expect(m.aiProvider).toBe('googleai');
  });

  it('selects ollama with no TTS and vision off until a vision model is set', async () => {
    const m = await loadWithEnv({ AI_PROVIDER: 'ollama', OLLAMA_MODEL: 'llama3.2' });
    expect(m.aiProvider).toBe('ollama');
    expect(m.visionModel.name).toBe('ollama/llama3.2');
    expect(m.providerSupportsTTS).toBe(false);
    expect(m.providerSupportsVision).toBe(false);
  });

  it('turns ollama vision on when OLLAMA_VISION_MODEL is set', async () => {
    const m = await loadWithEnv({ AI_PROVIDER: 'ollama', OLLAMA_VISION_MODEL: 'llava' });
    expect(m.visionModel.name).toBe('ollama/llava');
    expect(m.providerSupportsVision).toBe(true);
  });

  it('selects openrouter with a namespaced model and vision on, TTS off', async () => {
    const m = await loadWithEnv({
      AI_PROVIDER: 'openrouter',
      OPENROUTER_MODEL: 'mistralai/mistral-7b-instruct:free',
    });
    expect(m.aiProvider).toBe('openrouter');
    expect(m.visionModel.name).toBe('openrouter/mistralai/mistral-7b-instruct:free');
    expect(m.providerSupportsTTS).toBe(false);
    expect(m.providerSupportsVision).toBe(true);
  });
});
