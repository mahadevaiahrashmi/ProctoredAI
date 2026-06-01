# Architecture Decision Records (ADRs)

This folder records the significant architectural decisions for **ProctoredAI** — what was
decided, why, and the trade-offs accepted. ADRs are **immutable once accepted**: to change a
decision, add a new ADR that supersedes the old one (don't rewrite history).

## What is an ADR?

A short document capturing a single architecturally significant decision, its context, and
its consequences. Format here is a lightweight [MADR](https://adr.github.io/madr/)/Nygard
hybrid — see [`0000-template.md`](0000-template.md).

> **Note:** These ADRs were written **retroactively** from the existing codebase (this is a
> cloned/documented project). They describe decisions already embodied in the code rather
> than choices made fresh in a greenfield design session. Dates reflect when the ADR was
> *recorded*, not necessarily when the decision was originally made upstream.

## Status values
- **Proposed** — under discussion, not yet adopted.
- **Accepted** — adopted and in effect.
- **Accepted (revisit)** — in effect but knowingly carrying debt; expected to be reconsidered.
- **Superseded by ADR-XXXX** — replaced by a later decision.
- **Deprecated** — no longer relevant.

## Index

| ADR | Title | Status | Related debt |
| --- | --- | --- | --- |
| [0001](0001-nextjs-app-router-server-actions.md) | Single Next.js app with Server Actions (no separate backend) | Accepted | — |
| [0002](0002-genkit-google-gemini.md) | Use Genkit + Google Gemini for all AI | Accepted | — |
| [0003](0003-client-session-state-no-db.md) | Client-side session state, no database | Accepted | TD-004 |
| [0004](0004-webcam-frame-sampling-proctoring.md) | Periodic webcam frame sampling for proctoring | Accepted | TD-003, TD-005, TD-006 |
| [0005](0005-llm-grading.md) | LLM grades both multiple-choice and free-text | Accepted | TD-010 |
| [0006](0006-firebase-app-hosting.md) | Deploy on Firebase App Hosting | Accepted | TD-018 |
| [0007](0007-suppress-build-type-lint-errors.md) | Suppress TypeScript/ESLint errors during build | Superseded by [0008](0008-enforce-type-lint-ci.md) | TD-001 |
| [0008](0008-enforce-type-lint-ci.md) | Enforce TypeScript & ESLint in CI and the build | Accepted | TD-001, TD-002 |

## How to add a new ADR
1. Copy `0000-template.md` to `NNNN-short-title.md` (next number, kebab-case title).
2. Fill in Context, Decision, Consequences, Alternatives.
3. Set status to **Proposed**, open a PR, and move to **Accepted** on merge.
4. Add a row to the index above.
5. If it replaces an earlier decision, mark the old one **Superseded by ADR-NNNN** and link both ways.

Decisions referenced here are expanded in [../system_design.md](../system_design.md) §8 and the
debt items live in [../tech_debt.md](../tech_debt.md).
