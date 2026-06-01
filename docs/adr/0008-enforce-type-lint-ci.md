# ADR-0008: Enforce TypeScript & ESLint in CI and the build

- **Status:** Accepted
- **Date:** 2026-06-01
- **Deciders:** Maintainer (type/lint/CI hardening pass)
- **Supersedes:** [ADR-0007](0007-suppress-build-type-lint-errors.md)
- **Related:** [tech_debt TD-001](../tech_debt.md) (resolved), [TD-002](../tech_debt.md) (partial), [testing](../testing.md)

## Context

[ADR-0007](0007-suppress-build-type-lint-errors.md) suppressed type/lint errors during `next build`
to keep early iteration fast, explicitly deferring enforcement to "separate, blocking checks in
CI" — which **did not exist yet**. Two things have since changed:

1. The codebase was brought to **zero `tsc --noEmit` errors** and **zero ESLint errors** (a handful of small, mechanical fixes — a wrong type import, an unguarded `sessionStorage` value, a missing `!`, and a few unescaped JSX entities).
2. **ESLint was actually configured** (`eslint` + `eslint-config-next`, `.eslintrc.json` extending `next/core-web-vitals`), and a **CI workflow** was added.

With the code clean and CI in place, ADR-0007's own follow-up ("once clean and CI is green, flip
both flags to `false` and supersede this ADR") is now actionable.

## Decision

We will **enforce type and lint safety**:

- Set `typescript.ignoreBuildErrors: false` and `eslint.ignoreDuringBuilds: false` in `next.config.ts`, so `next build` fails on type or lint errors.
- Add `.github/workflows/ci.yml` running `npm ci` → `npm run typecheck` → `npm run lint` on every push and pull request to `main` (Node 20).

This **supersedes [ADR-0007](0007-suppress-build-type-lint-errors.md)**.

## Consequences

**Positive**
- A green build is now genuine proof that types and lint are sound (**TD-001 resolved**).
- Regressions are caught on every push/PR, not by hand.
- Flipping the flags immediately surfaced and removed real debt: the dead `submitted/page.tsx` (TD-014) was an empty non-module that the strict build rejected.

**Negative / costs**
- `next build` is slightly slower (it now runs `tsc` + ESLint).
- A type/lint error now **blocks** the build and CI — intended, but it means contributors must keep the tree clean.

**Neutral / follow-ups**
- **Automated tests still do not exist** — CI covers typecheck + lint only, so **TD-002 remains partially open** (see [testing.md](../testing.md)).
- Could later add `next build` (and tests) as CI steps, and tighten lint with `--max-warnings=0`.

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Keep the flags `true`, rely on CI alone | The local/preview build would still report a misleading "green" while CI is the only real gate; enforcing in both is stronger and costs little. |
| Wait for a full test suite before flipping | Unnecessary coupling — type/lint enforcement is independently valuable and was cheap once the code was clean. Tests are tracked separately (TD-002). |
