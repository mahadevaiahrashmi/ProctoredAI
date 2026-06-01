# ADR-0007: Suppress TypeScript/ESLint errors during build

- **Status:** Accepted (revisit)
- **Date:** 2026-06-01
- **Deciders:** Original author (recorded retroactively)
- **Related:** [tech_debt TD-001](../tech_debt.md), [testing](../testing.md)

## Context

`next.config.ts` sets `typescript.ignoreBuildErrors: true` and
`eslint.ignoreDuringBuilds: true`. This is a common scaffolding default (and is convenient in
an AI-assisted rapid-iteration workflow like Firebase Studio) because it lets `next build`
succeed even while code is mid-change or has unresolved type/lint issues.

## Decision

We will **keep the build error suppression for now** to preserve fast iteration, but treat it
as **debt to revisit** rather than a permanent stance. Type and lint safety must instead be
enforced by **separate, blocking checks** (`npm run typecheck`, `npm run lint`) in CI.

## Consequences

**Positive**
- `next build` never fails mid-iteration on transient type/lint noise; faster local/preview loops.

**Negative / costs**
- A production build is **not** proof the types are sound — real regressions can ship undetected (**TD-001**).
- Easy to forget the separate checks if CI doesn't enforce them (CI does not exist yet — TD-002).

**Neutral / follow-ups**
- Add CI gates for `typecheck` + `lint` (see [testing.md](../testing.md)).
- Once the codebase is clean and CI is green, **flip both flags to `false`** and supersede this ADR.

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Fail the build on type/lint errors (flags off) | The correct long-term stance, but premature before CI exists and the codebase is verified clean. |
| Remove linting/types entirely | Unacceptable — loses the safety net that CI will enforce. |
