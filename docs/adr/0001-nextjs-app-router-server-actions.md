# ADR-0001: Single Next.js app with Server Actions (no separate backend)

- **Status:** Accepted
- **Date:** 2026-06-01
- **Deciders:** Original author (recorded retroactively)
- **Related:** [ADR-0002](0002-genkit-google-gemini.md), [ADR-0003](0003-client-session-state-no-db.md)

## Context

The app needs server-side execution to call the Gemini API with a secret key (the key must
never reach the browser) and to run the Genkit flows. It also needs a reactive client UI for
the exam, proctoring, and chat. The project is a single-developer / demo-scale app scaffolded
in Firebase Studio.

## Decision

We will build a **single Next.js 15 application using the App Router**, exposing server logic
through **Server Actions** (`src/app/actions.ts`, `"use server"`) rather than a separate API
service or backend process. Client components ("use client") call those actions directly.

## Consequences

**Positive**
- The Gemini API key stays server-side; the browser only invokes typed actions.
- One codebase, one deploy artifact, one mental model — minimal ops.
- Server Actions remove the need to hand-write/maintain REST endpoints and client fetch glue.

**Negative / costs**
- Tight coupling to Next.js/React server conventions; harder to reuse the AI layer from a non-Next client.
- Server Actions are RPC-like and less self-documenting than an explicit, versioned API.
- No independent scaling of the AI workload separate from the web tier.

**Neutral / follow-ups**
- The AI logic is isolated in `src/ai/flows/*` so it could be lifted into a standalone service later if needed.

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Separate backend (Express/Nest/FastAPI) + SPA | More moving parts and deployment surface than this scale warrants. |
| Next.js Route Handlers (REST) instead of Server Actions | Workable, but Server Actions give end-to-end types with less boilerplate for this app. |
| Client-only with key in browser | Unacceptable — would expose the Gemini API key. |
