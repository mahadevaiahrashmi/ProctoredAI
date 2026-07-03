import { describe, it, expect } from 'vitest';
import {
  rankOpenRouterModels,
  DEFAULT_MAX_INPUT_USD_PER_MTOK,
  type CatalogEntry,
} from './openrouter-models';

// Helper: build a catalogue entry. `prompt` is USD/token as a string, matching
// the OpenRouter API (e.g. "0.0000001" === $0.10 per 1M tokens).
function model(
  id: string,
  prompt: string | null,
  opts: { inputs?: string[]; outputs?: string[]; ctx?: number } = {},
): CatalogEntry {
  return {
    id,
    pricing: prompt === null ? {} : { prompt },
    architecture: {
      input_modalities: opts.inputs ?? ['text'],
      output_modalities: opts.outputs ?? ['text'],
    },
    context_length: opts.ctx ?? 8000,
  };
}

const PER_MTOK = 1 / 1_000_000; // USD/token that equals $1.00 per 1M tokens

describe('rankOpenRouterModels', () => {
  it('orders free first, then cheapest → most expensive', () => {
    const ranked = rankOpenRouterModels([
      model('paid-mid', String(0.05 * PER_MTOK)),
      model('free-a', '0'),
      model('paid-cheap', String(0.01 * PER_MTOK)),
    ]);
    expect(ranked.map((m) => m.id)).toEqual(['free-a', 'paid-cheap', 'paid-mid']);
    expect(ranked[0].inputUsdPerMTok).toBe(0);
    expect(ranked[1].inputUsdPerMTok).toBeCloseTo(0.01, 6);
  });

  it('excludes models whose input price exceeds the cap (default $0.10/Mtok)', () => {
    const ranked = rankOpenRouterModels([
      model('too-pricey', String(0.15 * PER_MTOK)), // $0.15/Mtok > 0.10 cap
      model('at-cap', String(0.1 * PER_MTOK)), // exactly at the cap → kept
      model('cheap', String(0.02 * PER_MTOK)),
    ]);
    expect(ranked.map((m) => m.id)).toEqual(['cheap', 'at-cap']);
    expect(DEFAULT_MAX_INPUT_USD_PER_MTOK).toBe(0.1);
  });

  it('honors a custom cap', () => {
    const catalog = [
      model('a', String(0.5 * PER_MTOK)),
      model('b', String(2 * PER_MTOK)),
    ];
    expect(rankOpenRouterModels(catalog, 1).map((m) => m.id)).toEqual(['a']);
    expect(rankOpenRouterModels(catalog, 3).map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('drops models that cannot output text and those with no usable price', () => {
    const ranked = rankOpenRouterModels([
      model('audio-only', '0', { outputs: ['audio'] }),
      model('no-price', null),
      model('empty-price', ''),
      model('good', '0'),
    ]);
    expect(ranked.map((m) => m.id)).toEqual(['good']);
  });

  it('excludes negative sentinel prices (e.g. openrouter/auto reports "-1")', () => {
    const ranked = rankOpenRouterModels([
      model('openrouter/auto', '-1'),
      model('free-real', '0'),
    ]);
    expect(ranked.map((m) => m.id)).toEqual(['free-real']);
  });

  it('flags vision (image input) and keeps context length', () => {
    const ranked = rankOpenRouterModels([
      model('vlm', '0', { inputs: ['text', 'image'], ctx: 128000 }),
      model('text-only', '0', { inputs: ['text'], ctx: 8000 }),
    ]);
    const vlm = ranked.find((m) => m.id === 'vlm')!;
    const txt = ranked.find((m) => m.id === 'text-only')!;
    expect(vlm.vision).toBe(true);
    expect(txt.vision).toBe(false);
    // Tie on price (both free) → larger context ranks first.
    expect(ranked.map((m) => m.id)).toEqual(['vlm', 'text-only']);
  });
});
