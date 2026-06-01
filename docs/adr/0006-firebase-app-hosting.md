# ADR-0006: Deploy on Firebase App Hosting

- **Status:** Accepted
- **Date:** 2026-06-01
- **Deciders:** Original author (recorded retroactively)
- **Related:** [ADR-0001](0001-nextjs-app-router-server-actions.md), [tech_debt TD-018](../tech_debt.md)

## Context

The project was created in **Firebase Studio**, which provides an integrated path to deploy
Next.js apps on **Firebase App Hosting**. The app is a single Next.js server (Server Actions +
client) with a secret `GEMINI_API_KEY` and no database.

## Decision

We will target **Firebase App Hosting**, configured via `apphosting.yaml`. The Gemini API key
is supplied as a backend environment variable/secret in the hosting environment. Scaling is
bounded by `runConfig.maxInstances` (currently `1`).

## Consequences

**Positive**
- Zero-friction path from the Firebase Studio origin to a live deploy.
- Managed Next.js hosting; no server to operate.
- Native place to store the API key as a backend secret.

**Negative / costs**
- `maxInstances: 1` caps concurrency until raised (**TD-018**).
- Some coupling to Firebase's hosting model and config.

**Neutral / follow-ups**
- The app has **no Firebase runtime dependency in code** (the `firebase` package is unused — TD-013), so it remains portable to Vercel, Cloud Run, or any Node host with minimal change.

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Vercel | Excellent Next.js fit, but off the Firebase Studio default path the project started on. |
| Self-hosted Node / Cloud Run | More ops; unnecessary for this scale. |
