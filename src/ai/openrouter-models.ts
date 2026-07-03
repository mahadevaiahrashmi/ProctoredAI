/**
 * OpenRouter model auto-selection.
 *
 * When `OPENROUTER_MODEL` is not pinned, the provider config (see genkit.ts)
 * asks OpenRouter for its live catalogue and ranks candidates by **input
 * (prompt) price**: free models first, then cheapest → most expensive, excluding
 * any model whose input price exceeds a cap (default $0.10 per 1M prompt tokens).
 * It then probes that ranked list and uses the cheapest model that is actually
 * available, so a rate-limited or retired free model is skipped for the next
 * cheapest option instead of failing the app.
 *
 * OpenRouter's `/models` pricing is expressed in **USD per token** (e.g. a
 * "$0.10 / 1M tokens" model reports `pricing.prompt === "0.0000001"`), so the
 * cap is converted from per-1M-tokens to per-token before comparing.
 */

/** Default cap on a model's input price for auto-selection (USD per 1M tokens). */
export const DEFAULT_MAX_INPUT_USD_PER_MTOK = 0.1;

/** A catalogue model that passed the price filter, with normalized fields. */
export interface RankedModel {
  id: string;
  /** Input (prompt) price in USD per 1M tokens; 0 for free models. */
  inputUsdPerMTok: number;
  /** Whether the model accepts image input (needed for webcam proctoring). */
  vision: boolean;
  contextLength: number | null;
}

/** The subset of an OpenRouter `/models` entry this module relies on. */
export interface CatalogEntry {
  id: string;
  pricing?: { prompt?: string | null };
  architecture?: {
    input_modalities?: string[] | null;
    output_modalities?: string[] | null;
  };
  context_length?: number | null;
}

/**
 * Rank OpenRouter catalogue entries for auto-selection. Keeps text-generating
 * (chat) models whose input price is a finite value at or below
 * `maxInputUsdPerMTok`, ordered **free first, then cheapest → most expensive**
 * (tie-break: larger context window, then id for stable ordering).
 */
export function rankOpenRouterModels(
  catalog: CatalogEntry[],
  maxInputUsdPerMTok: number = DEFAULT_MAX_INPUT_USD_PER_MTOK,
): RankedModel[] {
  const capPerToken = maxInputUsdPerMTok / 1_000_000;
  const ranked: RankedModel[] = [];

  for (const m of catalog) {
    const raw = m.pricing?.prompt;
    const perToken = raw == null || raw === '' ? NaN : Number(raw);
    // Skip models with no usable price, a negative sentinel price (OpenRouter
    // uses "-1" for variable-priced routers like `openrouter/auto`), or a price
    // above the cap.
    if (!Number.isFinite(perToken) || perToken < 0 || perToken > capPerToken) {
      continue;
    }
    // Must be able to generate text (excludes image/audio-only models).
    const outputs = m.architecture?.output_modalities ?? [];
    if (!outputs.includes('text')) continue;

    const inputs = m.architecture?.input_modalities ?? [];
    ranked.push({
      id: m.id,
      inputUsdPerMTok: perToken * 1_000_000,
      vision: inputs.includes('image'),
      contextLength: m.context_length ?? null,
    });
  }

  ranked.sort(
    (a, b) =>
      a.inputUsdPerMTok - b.inputUsdPerMTok ||
      (b.contextLength ?? 0) - (a.contextLength ?? 0) ||
      a.id.localeCompare(b.id),
  );
  return ranked;
}

/** Fetch the OpenRouter model catalogue (`data` array). */
export async function fetchOpenRouterCatalog(
  apiKey?: string,
): Promise<CatalogEntry[]> {
  const res = await fetch('https://openrouter.ai/api/v1/models', {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  });
  if (!res.ok) {
    throw new Error(`OpenRouter /models returned HTTP ${res.status}`);
  }
  const json = (await res.json()) as { data?: CatalogEntry[] };
  return json.data ?? [];
}

/**
 * Probe ranked models in order and return the first that answers a minimal
 * completion, skipping ones that are unavailable / rate-limited (non-2xx).
 * Only the first `maxProbes` are tried to bound startup cost. Returns null if
 * none respond.
 */
export async function firstAvailableModel(
  ranked: RankedModel[],
  apiKey: string,
  maxProbes = 8,
): Promise<RankedModel | null> {
  for (const model of ranked.slice(0, maxProbes)) {
    try {
      const res = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: model.id,
            messages: [{ role: 'user', content: 'ping' }],
            max_tokens: 1,
          }),
        },
      );
      if (res.ok) return model;
    } catch {
      // network hiccup — try the next candidate
    }
  }
  return null;
}
