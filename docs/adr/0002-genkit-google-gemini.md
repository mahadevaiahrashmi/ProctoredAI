# ADR-0002: Use Genkit + Google Gemini for all AI

- **Status:** Accepted
- **Date:** 2026-06-01
- **Deciders:** Original author (recorded retroactively)
- **Related:** [ADR-0001](0001-nextjs-app-router-server-actions.md), [ADR-0005](0005-llm-grading.md)

## Context

Five distinct AI capabilities are required: exam generation, a personalized session prompt,
vision-based proctoring (analyze a webcam frame), grading with structured output, a grounded
chat tutor, and text-to-speech. We want typed inputs/outputs, structured JSON results, and a
local way to test prompts. The project was created in Firebase Studio, which favors the Google
AI ecosystem.

## Decision

We will use **Genkit** (`genkit`, `@genkit-ai/googleai`, `@genkit-ai/next`) as the AI
orchestration layer and **Google Gemini** as the model provider — `gemini-2.5-flash` for text
and vision, and `gemini-2.5-flash-preview-tts` for speech. Each capability is a Genkit
**flow** with **Zod** input/output schemas (`src/ai/flows/*`), configured via a shared client
in `src/ai/genkit.ts`.

## Consequences

**Positive**
- Structured, schema-validated outputs make AI calls behave like typed functions.
- One provider/SDK for text, vision, and audio reduces integration surface.
- Genkit dev UI (`npm run genkit:dev`) allows running flows in isolation.
- `gemini-2.5-flash` is fast and cheap, suitable for the per-frame proctoring loop.

**Negative / costs**
- Hard dependency on Google Gemini availability, quota, and pricing; every feature fails closed without a valid key.
- Coupling to Genkit's abstractions and the preview TTS model (preview models can change).
- Vendor lock-in at the prompt/flow layer.

**Neutral / follow-ups**
- Flows are isolated and could be re-pointed to another Genkit model plugin with limited changes.

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Direct Gemini REST/SDK calls | Loses Genkit's schema validation, flow structure, and dev tooling. |
| OpenAI / Anthropic models | Off the Firebase Studio / Google-native path the project started from; TTS + vision + text would span multiple SDKs. |
| LangChain / other orchestrators | Heavier than needed; Genkit fits the Next.js + Google stack cleanly. |
