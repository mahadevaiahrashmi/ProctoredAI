# Testing Strategy — ProctoredAI

> **Current state:** the repository has **no automated tests** and no test runner
> configured. CI **does** exist (`.github/workflows/ci.yml`) but only runs `typecheck` +
> `lint`, and the build enforces both ([ADR-0008](adr/0008-enforce-type-lint-ci.md)). This
> document defines the target strategy: the test pyramid, conventions, what to mock, and the
> test/E2E steps to add to CI. Items marked _(to add)_ do not exist yet.

---

## 1. Guiding principles
- **Determinism first.** AI calls are non-deterministic; tests must **mock the Genkit flows / Gemini** at the boundary so suites are fast and repeatable. Never hit the live model in unit/integration tests.
- **Test behavior, not implementation.** Assert on rendered output and user-visible state, not internal hooks.
- **Cover the risky bits.** Permission gating, timer auto-submit, the proctoring loop, session handoff, and error/degrade paths are where bugs hurt most.
- **Guard the build.** `next.config.ts` now **fails** `build` on type and lint errors, and CI runs `typecheck` and `lint` as **independent, blocking** steps ([ADR-0008](adr/0008-enforce-type-lint-ci.md)) — keep both green.

---

## 2. The test pyramid

```
                 ╱╲   E2E (Playwright)            — few, critical happy paths
                ╱  ╲                                + key error paths
               ╱────╲ Integration (RTL + mocked    — moderate
              ╱      ╲  actions/flows)
             ╱────────╲ Unit (Vitest)              — many, fast
            ╱__________╲  pure logic + flow schemas
```

### 2.1 Unit tests _(to add)_ — most numerous
Target the pure, synchronous logic and the flow contracts:
- **Flow schemas / shaping:** `summarize-proctoring-alerts` empty-list short-circuit; `clarify-exam-doubts` prompt assembly (`userAnswers`/feedback lookup, "Not Answered" fallback); `text-to-speech` `toWav` PCM→WAV conversion (feed a known PCM buffer, assert WAV header).
- **Timer math:** `exam-header` duration = `90 × #questions`, `MM:SS` formatting, red threshold at `< 300s`.
- **Question rendering logic:** `question-display` selects radio vs textarea by `type`; selected-option highlighting.
- **Zod schemas:** valid/invalid `Question`, `GradeExamInput`, etc. reject bad shapes.

### 2.2 Integration tests _(to add)_ — moderate
Render components/pages with **React Testing Library** and **mocked Server Actions**:
- **Setup wizard (`page.tsx`):** submit disabled until name+topic; mocked `generateExamAction` advances steps and writes `sessionStorage.examData`; denied permissions block "Start Exam" and show the destructive alert.
- **Exam runner (`exam/page.tsx`):** loads exam from session; Prev disabled on Q1; Submit appears on last question; confirm dialog → writes `examResults` and routes to `/results`; timer expiry auto-submits.
- **Proctoring panel:** with a mocked `detectViolationsAction` returning violations, the log appends a timestamped entry and status flips to "Potential Violation Detected"; a thrown action does **not** crash the loop.
- **Results (`results/page.tsx`):** mocked `gradeExamAction`/`summarizeAlertsAction` render score, summary, accordion; violation card only renders when violations exist; grading error shows the error card.
- **Chat tutor:** sending a message calls `clarifyDoubtAction`, appends the reply, and calls `textToSpeechAction`; a thrown action renders the inline "Sorry, I ran into a problem" bubble.

### 2.3 End-to-end tests _(to add)_ — fewest, highest value
Run the real app with **Playwright**, stubbing network calls to Gemini (or pointing actions at a fake) and **granting fake media** via `context.grantPermissions(['camera','microphone'])` + a fake video device:
- **E2E-1 (happy path):** setup → instructions → permissions → answer all 5 → submit → results render → ask the tutor → reply appears.
- **E2E-2 (time-up):** let the timer expire → auto-submit → results.
- **E2E-3 (permission denied):** deny camera → "Start Exam" stays disabled, alert shown.
- **E2E-4 (generation failure):** stub a failing action → destructive alert appears.

---

## 3. Recommended tooling _(to add)_
| Concern | Tool | Why |
| --- | --- | --- |
| Unit/integration runner | **Vitest** | Fast, native ESM/TS, Jest-compatible API; pairs well with Next 15. |
| Component testing | **@testing-library/react** + **@testing-library/user-event** | Behavior-focused DOM assertions. |
| E2E | **Playwright** | Built-in permission/media mocking, multi-browser, trace viewer. |
| Action/flow mocking | `vi.mock('@/app/actions')` | Keep tests deterministic and offline. |
| Coverage | Vitest `--coverage` (v8) | Track and gate coverage. |

> Add the runner config and a `test` script to `package.json` (e.g. `"test": "vitest"`,
> `"test:e2e": "playwright test"`). These are not present today.

---

## 4. Conventions
- **Location:** co-locate unit/integration tests next to source as `*.test.ts` / `*.test.tsx`; put E2E specs under `e2e/`.
- **Naming:** describe the behavior — `it('disables Start Exam until both permissions are granted')`.
- **Arrange-Act-Assert**; one behavior per test.
- **Mock at the action boundary** (`src/app/actions.ts`), not inside flows, so component tests don't depend on Genkit internals. For flow unit tests, mock `ai.generate` / the prompt call.
- **No real network, no real camera, no real audio** in CI. Provide fixtures (sample `Exam`, `GradeExamOutput`, image data URI).
- **Deterministic time:** use fake timers for the countdown/auto-submit tests.
- **Accessibility checks:** prefer role/label queries; optionally add `axe` assertions on key screens.

---

## 5. Test data / fixtures
- A canonical sample exam already exists at `src/lib/data.ts` — reuse it as the base fixture.
- Create fixtures for: a graded report (`GradeExamOutput`), a violations list, a tiny JPEG data URI for proctoring, and a short PCM buffer for `toWav`.

---

## 6. Continuous integration

CI **exists today** at `.github/workflows/ci.yml`: on every push/PR to `main` it runs
`npm ci` → `npm run typecheck` → `npm run lint` (Node 20) — see
[ADR-0008](adr/0008-enforce-type-lint-ci.md). It does **not** yet run tests, `build`, or E2E.
The recommended **target** pipeline that adds those steps:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint        # also enforced by the build
      - run: npm run typecheck    # also enforced by the build
      - run: npm test -- --run    # unit + integration (Vitest), once configured
      - run: npm run build
  e2e:
    runs-on: ubuntu-latest
    needs: verify
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

**CI gates (must pass to merge):** `lint`, `typecheck` (both live today), then — once added —
unit+integration, `build`, and E2E. Type/lint safety is now enforced in **two** places: the
build fails on errors (`ignoreBuildErrors`/`ignoreDuringBuilds` are `false`) **and** CI
re-checks them, so a regression can't slip through either gate.

> **Secrets:** keep `GEMINI_API_KEY` out of CI for unit/integration/E2E by mocking the
> model. If you ever add a small live-smoke job, store the key as an encrypted Actions secret
> and run it sparingly (cost + flakiness).

---

## 7. Definition of done (per change)
- New/changed behavior has unit or integration coverage.
- `lint`, `typecheck`, and `test` pass locally.
- A user-facing flow change is reflected in (or adds) an E2E spec.
- Error/degrade paths are exercised, not just the happy path.

See [UAT.md](UAT.md) for the manual acceptance pass that complements this automated strategy.
