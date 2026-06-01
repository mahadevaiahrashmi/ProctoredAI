# ADR-0009: Pluggable AI providers + optional (camera opt-out) proctoring

- **Status:** Accepted
- **Date:** 2026-06-02
- **Deciders:** Maintainer (multi-provider + camera opt-out pass)
- **Related:** extends [ADR-0002](0002-genkit-google-gemini.md) (Genkit + Gemini) and [ADR-0004](0004-webcam-frame-sampling-proctoring.md) (webcam sampling); [tech_debt TD-003](../tech_debt.md) (privacy), [TD-019](../tech_debt.md), [TD-020](../tech_debt.md)

## Context

[ADR-0002](0002-genkit-google-gemini.md) committed every AI feature to Google Gemini, and its
own follow-up noted the flows "could be re-pointed to another Genkit model plugin with limited
changes." Two forces made that worth acting on:

1. **Access/cost.** Gemini needs a Google API key, and every feature "fails closed without a
   valid key" (ADR-0002). Some users want to run **without any key** (locally) or with a **free**
   hosted model.
2. **Consent.** [ADR-0004](0004-webcam-frame-sampling-proctoring.md) sends a webcam JPEG to a
   third-party model every ~1.5s with **no opt-out** (TD-003). A user who declines the camera
   currently cannot take the exam at all.

Constraints: keep the default behavior identical (don't break existing Gemini users), stay within
the Genkit orchestration layer (ADR-0002) rather than hand-rolling SDK calls, and don't over-promise
capabilities a provider can't deliver (TTS, vision).

## Decision

**1. Provider is selected at startup via `AI_PROVIDER`** (default `googleai`). `src/ai/genkit.ts`
became a switch over three Genkit plugins:

| `AI_PROVIDER` | Plugin | Key? | Vision (proctoring) | TTS (spoken tutor) |
| --- | --- | --- | --- | --- |
| `googleai` *(default)* | `@genkit-ai/google-genai` | yes (`GEMINI_API_KEY`/`GOOGLE_API_KEY`) | yes | **yes** |
| `ollama` | `genkitx-ollama` | **no** (local) | only if `OLLAMA_VISION_MODEL` set | no |
| `openrouter` | `@genkit-ai/compat-oai` | yes (free `OPENROUTER_API_KEY`) | yes (model-dependent) | no |

`genkit.ts` exports two **capability flags** — `providerSupportsVision` and `providerSupportsTTS`
— plus a `visionModel` reference. Flows/actions read these and **degrade gracefully**:
`textToSpeechAction` returns `""` when TTS is unsupported (tutor stays text-only), and
`detectViolationsAction` returns `[]` when vision is unsupported (no proctoring). Unrecognized
`AI_PROVIDER` values fall back to `googleai`.

**2. The camera is optional.** The setup wizard offers **"Take Without Camera (Unproctored)"**
alongside the proctored start, and auto-routes to unproctored when the provider has no vision model
or the user denies permission. The choice is stored in `sessionStorage` (`examConfig.proctored`),
honored by `/exam` (no camera acquired, no frames sent), and **labeled on the results page**
("Unproctored session — no integrity monitoring was performed").

This **extends, but does not supersede, ADR-0002**: Genkit is still the orchestration layer and
Gemini is still the default and the only fully-featured provider.

## Consequences

**Positive**
- Runs **key-free and fully local** via Ollama, or **free** via OpenRouter — lowers the barrier to trying the app and removes the single-vendor hard dependency from ADR-0002 for non-TTS use.
- Users can **decline the webcam and still take the exam** — a partial, user-facing mitigation for the consent gap in TD-003/ADR-0004.
- Capability flags keep features honest: no silent failures when a provider lacks TTS or vision.
- Default path is unchanged — existing Gemini users see no difference.

**Negative / costs**
- More configuration surface (`AI_PROVIDER` + per-provider env vars) and more branches to keep working; documented in `.env.example`.
- **Feature parity is uneven:** TTS is Gemini-only; small local models can't reliably produce the structured exam/grading JSON (**TD-020**).
- Provider plugins enlarge the dependency tree and its vulnerability surface (**TD-019**).
- Unproctored results are lower-assurance; the opt-out is a UX mitigation, not a full consent/retention policy (TD-003 remains open).

**Neutral / follow-ups**
- **Local Claude CLI as a provider was considered and deferred** (see Alternatives) — no Genkit plugin, can't be CI-tested, and the subscription CLI isn't a programmatic model endpoint.
- A future provider could add TTS; the flag plumbing is already in place.
- Per-provider model defaults (e.g. the OpenRouter free vision model) may drift as hosted catalogs change.

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Stay Gemini-only (status quo, ADR-0002) | Doesn't address key-free/free-model access or the no-opt-out webcam concern. |
| Hand-rolled multi-SDK calls (Ollama/OpenAI SDKs directly) | Throws away Genkit's schema validation, flow structure, and dev UI (the reasons in ADR-0002). Staying on Genkit plugins keeps the flows untouched. |
| **Local Claude CLI provider** (`claude` subscription) | The CLI is an interactive coding agent, not a Genkit model plugin or structured model endpoint; shelling out per call can't be schema-validated or CI-tested, and ties behavior to an external binary. Deferred as a documented follow-up. |
| Use Ollama for everything (incl. exam generation) | Small local models echo the JSON schema instead of filling it — `genkitx-ollama` doesn't forward Ollama's native `format` (**TD-020**). Fine for the text tutor; unreliable for structured flows. |
| Block the exam unless the camera is granted | Excludes users without a webcam and offers no path when the provider has no vision model; conflicts with the goal of broader access. |
