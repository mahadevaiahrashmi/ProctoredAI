/**
 * Multi-provider Genkit configuration.
 *
 * The active provider is selected at startup via the `AI_PROVIDER` env var
 * (default: "googleai"). Each branch resolves the Genkit `ai` instance, a
 * vision-capable model used by the proctoring flow, and capability flags the
 * flows read so they can degrade gracefully.
 *
 *   AI_PROVIDER=googleai    Google Gemini (default). Multimodal + TTS.
 *                           Needs GEMINI_API_KEY (or GOOGLE_API_KEY).
 *   AI_PROVIDER=ollama      Local models via Ollama — no API key. Set
 *                           OLLAMA_MODEL (default "llama3.2") and, for webcam
 *                           proctoring, OLLAMA_VISION_MODEL (e.g.
 *                           "llama3.2-vision"). Server address:
 *                           OLLAMA_SERVER_ADDRESS (default http://localhost:11434).
 *   AI_PROVIDER=openrouter  OpenAI-compatible gateway. Free models exist but a
 *                           (free) OPENROUTER_API_KEY is still required. Set
 *                           OPENROUTER_MODEL.
 *
 * Only Gemini implements the TTS flow (the spoken tutor); elsewhere the tutor
 * degrades to text. Proctoring needs a vision-capable model — see the flags.
 */
import {genkit, z, type ModelReference} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {ollama} from 'genkitx-ollama';
import {compatOaiModelRef, openAICompatible} from '@genkit-ai/compat-oai';

export type AiProvider = 'googleai' | 'ollama' | 'openrouter';

/** Read an env var, treating empty/whitespace as unset. */
function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

const requested = (readEnv('AI_PROVIDER') ?? 'googleai').toLowerCase();
export const aiProvider: AiProvider =
  requested === 'ollama' || requested === 'openrouter' ? requested : 'googleai';

let aiInstance: ReturnType<typeof genkit>;
let resolvedVisionModel: ModelReference<z.ZodTypeAny>;
let ttsSupported: boolean;
let visionSupported: boolean;

switch (aiProvider) {
  case 'ollama': {
    const textModel = readEnv('OLLAMA_MODEL') ?? 'llama3.2';
    const visionModelName = readEnv('OLLAMA_VISION_MODEL') ?? textModel;
    const serverAddress =
      readEnv('OLLAMA_SERVER_ADDRESS') ?? 'http://localhost:11434';
    const declared = Array.from(new Set([textModel, visionModelName])).map(
      name => ({name})
    );
    aiInstance = genkit({
      plugins: [ollama({serverAddress, models: declared})],
      model: ollama.model(textModel),
    });
    resolvedVisionModel = ollama.model(visionModelName);
    ttsSupported = false;
    // Proctoring is only meaningful if a (vision-capable) model is configured.
    visionSupported = readEnv('OLLAMA_VISION_MODEL') !== undefined;
    break;
  }
  case 'openrouter': {
    const textModel =
      readEnv('OPENROUTER_MODEL') ??
      'meta-llama/llama-3.2-11b-vision-instruct:free';
    aiInstance = genkit({
      plugins: [
        openAICompatible({
          name: 'openrouter',
          baseURL: 'https://openrouter.ai/api/v1',
          apiKey: readEnv('OPENROUTER_API_KEY') ?? false,
        }),
      ],
      model: compatOaiModelRef({name: textModel, namespace: 'openrouter'}),
    });
    resolvedVisionModel = compatOaiModelRef({
      name: textModel,
      namespace: 'openrouter',
    });
    ttsSupported = false;
    visionSupported = true; // depends on the chosen model
    break;
  }
  case 'googleai':
  default: {
    aiInstance = genkit({
      plugins: [googleAI()],
      model: googleAI.model('gemini-2.5-flash'),
    });
    resolvedVisionModel = googleAI.model('gemini-2.5-flash');
    ttsSupported = true;
    visionSupported = true;
    break;
  }
}

/** The configured Genkit instance (provider chosen via AI_PROVIDER). */
export const ai = aiInstance;
/** Vision-capable model reference used by the proctoring flow. */
export const visionModel = resolvedVisionModel;
/** Whether the active provider implements the TTS (spoken-tutor) flow. */
export const providerSupportsTTS = ttsSupported;
/** Whether the active provider can analyze webcam frames (proctoring). */
export const providerSupportsVision = visionSupported;
