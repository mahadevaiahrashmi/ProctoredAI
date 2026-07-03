# Resumability & Handoff Guide

The single doc to read when **picking this project back up** — whether you're a returning
developer, a new contributor, or an AI agent resuming work. It captures the current state, how
to rebuild the working environment, where runtime state lives, and the open threads to
continue. Pair it with the [regeneration kit](regeneration-kit.md) (rebuild the *code*) and the
[ADRs](adr/README.md) (why things are the way they are).

> **Keep this current.** Update the "Current state" and "Open threads" sections whenever you
> finish a meaningful chunk of work, so the next person resumes from truth, not from memory.

---

## 1. One-paragraph orientation

**ProctoredAI** is a Next.js 15 + Genkit app (Google **Gemini** by default; pluggable to local
**Ollama** or **OpenRouter** via the `AI_PROVIDER` env var) that generates an exam from a topic,
**optionally** proctors the test-taker via periodic webcam-frame analysis (the camera can be
declined — exams then run *unproctored*), grades answers (MC + free-text), and offers an AI tutor
on the results page whose spoken replies can be muted. There is **no backend database** —
state lives in the browser session. The app was cloned from
[abhinavrbharadwaj7/AI_test_propter](https://github.com/abhinavrbharadwaj7/AI_test_propter)
and documented under `docs/`. Start with [../README.md](../README.md) →
[system_design.md](system_design.md) for the mental model.

## 2. Current state (as of 2026-06-02)

- **Code:** Functional app. A type/lint/CI hardening pass fixed a handful of type/lint errors, configured ESLint, added CI, and made the build enforce both ([ADR-0008](adr/0008-enforce-type-lint-ci.md)). **Automated testing is set up at two levels** — Vitest + RTL (12 files / 40 tests, incl. page-level integration) and a **Playwright E2E** smoke spec (`e2e/`) — both run in CI alongside `typecheck`, `lint`, and `build` (TD-002). The remaining gap is the full E2E scenarios and a couple of page flows.
- **Pluggable AI + opt-outs:** The AI provider is now selectable via `AI_PROVIDER` (Gemini default; Ollama keyless/local; OpenRouter free models), proctoring is **optional** (camera opt-out → unproctored, clearly labelled), and the tutor's spoken replies can be **muted** (text-only fallback where TTS is unavailable). Genkit was upgraded 1.14→1.36. See [ADR-0009](adr/0009-pluggable-ai-providers-and-camera-opt-out.md); caveats in TD-020 (Ollama structured output) and TD-019 (npm audit backlog).
- **Docs:** Full suite added — README (with source credit), SETUP, requirements, `.env.example`, and `docs/` (PRD, product & system design, user manual, testing, UAT, tech debt, ADRs, this file, regeneration kit).
- **Published:** `main` is on GitHub at **https://github.com/mahadevaiahrashmi/ProctoredAI** (public).
- **Remotes:** `origin` → `mahadevaiahrashmi/ProctoredAI` (SSH); `upstream` → the original `abhinavrbharadwaj7/AI_test_propter`.
- **Not done yet:** with the proctoring hygiene (TD-005/006), cleanup (TD-009/013/016), and proctored-path consent (TD-003) now landed, the highest-value open items are **persistence/resumability** (TD-004) and finishing the **E2E scenarios + remaining page-integration flows** (TD-002). See §6.

## 3. Rebuild the environment from scratch

```bash
git clone git@github.com:mahadevaiahrashmi/ProctoredAI.git
cd ProctoredAI
npm install
cp .env.example .env        # default provider (Gemini): add GEMINI_API_KEY (https://aistudio.google.com/app/apikey)
                            # …or set AI_PROVIDER=ollama for a keyless local run
npm run dev                 # http://localhost:9002
# optional: npm run genkit:dev   # Genkit flow inspector
```

- **Node 20**, npm 9+. Secrets depend on the provider: **Gemini** (default) needs `GEMINI_API_KEY` (or `GOOGLE_API_KEY`); **Ollama** needs **no key** (just a local Ollama server); **OpenRouter** needs `OPENROUTER_API_KEY`.
- Full prerequisites/troubleshooting: [../SETUP.md](../SETUP.md).
- To recreate the *code* (not just the environment), see [regeneration-kit.md](regeneration-kit.md).

## 4. Where runtime state lives (and why nothing "resumes" today)

This is the crux of the app's (lack of) resumability. State is held in **`sessionStorage`**,
scoped to the tab and lost on refresh/new tab (see [ADR-0003](adr/0003-client-session-state-no-db.md)):

| Key | Written by | Read by | Shape |
| --- | --- | --- | --- |
| `examData` | `app/page.tsx` after generation | `app/exam/page.tsx` | `{ title, questions[] }` |
| `examConfig` | `app/page.tsx` on start | `app/exam/page.tsx` | `{ proctored, consent? }` |
| `examResults` | `app/exam/page.tsx` on submit | `app/results/page.tsx` | `{ questions, answers, violations[], title, proctored, consent }` |

Implications when resuming a *session*:
- Refreshing `/exam` reloads `examData` from session **but resets answers, the timer, and the violation log** (those live only in React state). Opening `/exam` with no session falls back to the static sample exam in `src/lib/data.ts`.
- `/results` cannot be reconstructed without `examResults` in the same tab.

**To make exams truly resumable** (the feature option, tracked as **TD-004**): persist answers +
remaining time + violations (e.g. to `localStorage` keyed by an exam/session id, or to a
backend), and rehydrate React state on mount. That change would supersede
[ADR-0003](adr/0003-client-session-state-no-db.md) with a new ADR.

## 5. Mental model / entry points

```
src/app/page.tsx        → setup wizard (generate exam; camera/mic gate OR opt out → unproctored)
src/app/exam/page.tsx   → exam runner + proctoring loop (loop skipped when unproctored)
src/app/results/page.tsx→ grading report + AI tutor (spoken replies mutable)
src/app/actions.ts      → Server Actions (the seam between UI and AI; per-provider capability gating)
src/ai/flows/*          → the Genkit flows (the AI behavior)
src/ai/genkit.ts        → provider selection (AI_PROVIDER) + capability flags; default gemini-2.5-flash
src/lib/data.ts         → fallback sample exam
```

Read order for a newcomer: [README](../README.md) → [system_design.md](system_design.md) →
`src/app/actions.ts` → the relevant flow in `src/ai/flows/`.

## 6. Open threads / what to do next

Prioritized from [tech_debt.md](tech_debt.md) (IDs are stable references):

1. **Decide on persistence/resumability** — TD-004 (see §4). Now the top open thread: exam + results live only in `sessionStorage`, so refresh/new-tab loses everything and there's no history or audit trail. Product call: is history/resume in scope?
2. **Finish the test pyramid** — TD-002. Page-level integration (setup wizard, results) and a Playwright E2E scaffold + smoke spec now run in CI; what's left is the full E2E scenarios (E2E-1…E2E-4) and the exam-runner + chat-tutor integration tests. See [testing.md](testing.md) §2.2–2.3.
3. **Harden security/cost** — no auth or rate limiting on the AI Server Actions (TD-007); MC questions are graded by the LLM rather than exact-compared (TD-010); npm audit backlog incl. 1 critical (TD-019).
4. **Optional proctoring-privacy hardening** — TD-003 is largely resolved (explicit consent + versioned notice + a recorded audit line); the residual is making the ~1.5s cadence configurable and adding on-device pre-filtering.

> **Recently landed (2026-06-02):** proctoring hygiene — camera streams stopped on unmount (TD-005) and the violation log de-duplicated (TD-006); cleanup — removed `firebase` (TD-013), `patch-package` (TD-016), and the dead tutor `definePrompt` (TD-009); and the proctored-path **consent step + privacy notice + recorded consent** (TD-003).

## 7. Resuming as an AI agent — checklist

1. `git -C <repo> status` and `git log --oneline -5` to see uncommitted work and recent history.
2. Read this file, then [tech_debt.md](tech_debt.md) and [adr/README.md](adr/README.md) for state + rationale.
3. Confirm the working directory: this project lives in its **own** git repo (`AI_test_propter/`). The parent folder is a *separate* repo — always scope git commands to the project with `git -C <path>` to avoid committing in the wrong place.
4. For AI-behavior changes, edit the relevant `src/ai/flows/*` (each is the source of truth for its prompt) — note the tutor flow builds its prompt inline (an `ai.generate` call with a `customPrompt` string).
5. Before claiming a change works: `npm run typecheck`, `npm run lint`, `npm test`, and (the build/E2E gates) `npm run build` / `npm run test:e2e` — the first `test:e2e` run needs `npx playwright install chromium`. For UI, run `npm run dev` and exercise the flow.
6. Persist progress here (update §2 and §6) and via commits — don't rely on conversational memory.

## 8. Quick facts

| Thing | Value |
| --- | --- |
| Dev URL | http://localhost:9002 |
| Tests | `npm test` — Vitest + RTL (unit/integration); `npm run test:e2e` — Playwright E2E (smoke) |
| AI provider | `AI_PROVIDER`: `googleai` (default) · `ollama` (keyless/local) · `openrouter` (free models) |
| Default model | `googleai/gemini-2.5-flash` (TTS `gemini-2.5-flash-preview-tts` — Gemini only; tutor is text-only elsewhere) |
| Required env | Gemini: `GEMINI_API_KEY`/`GOOGLE_API_KEY` · Ollama: none · OpenRouter: `OPENROUTER_API_KEY` |
| Questions per exam | 5 (hard-coded in `generateExamAction`; flow supports 1–10 — TD-011) |
| Time limit | 90s × #questions |
| Proctor cadence | every 1500 ms |
| Deploy target | Firebase App Hosting (`apphosting.yaml`, maxInstances 1) |
