# ADR-0003: Client-side session state, no database

- **Status:** Accepted
- **Date:** 2026-06-01
- **Deciders:** Original author (recorded retroactively)
- **Related:** [ADR-0001](0001-nextjs-app-router-server-actions.md), [tech_debt TD-004](../tech_debt.md), [resumability](../resumability.md)

## Context

The app passes data across three pages: the generated exam (setup → exam) and the results
bundle (exam → results). It is a single-user, single-session experience with no login and no
requirement (in the current scope) to keep history.

## Decision

We will hold cross-page state in the browser's **`sessionStorage`** (`examData`,
`examResults`) as JSON and use **no database**. `/exam` falls back to a static sample exam
(`src/lib/data.ts`) if no session data is present.

## Consequences

**Positive**
- Zero backend persistence to provision, secure, or pay for — trivial to run and deploy.
- Data is scoped to the tab and naturally discarded when the session ends (a privacy plus).

**Negative / costs**
- **No resumability:** refreshing or opening a new tab loses the exam/results (tracked as **TD-004**; see [resumability.md](../resumability.md)).
- No history, audit trail, analytics, or multi-device continuity.
- Correct answers travel to and live in client-readable storage — fine for a learning tool, not exam-secure.

**Neutral / follow-ups**
- Introducing persistence later (e.g. Firestore) would be a new ADR superseding this one.

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Firestore / server DB | More setup than the demo scope needs; not required without accounts/history. |
| URL/query-param handoff | Exam + results payloads are too large and would expose answers in the URL. |
| Single-page app with in-memory state | Avoids storage but loses the multi-route structure already in place. |
