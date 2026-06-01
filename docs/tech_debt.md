# Technical Debt Register — ProctoredAI

A living record of known shortcuts, gaps, and risks, with a shared rubric for prioritizing
them. Update this file as part of any PR that adds or pays down debt.

---

## 1. Severity rubric

| Severity | Definition | Response target |
| --- | --- | --- |
| **Critical** | Causes data loss, security/privacy breach, or makes a core flow unusable in production. | Fix before next release. |
| **High** | Significant risk to correctness, cost, or maintainability; likely to bite soon or block scaling. | Plan into the current/next cycle. |
| **Medium** | Real issue with a workaround; degrades UX, DX, or efficiency but not blocking. | Schedule opportunistically. |
| **Low** | Cleanup, polish, or minor inconsistency; low impact. | Fix when touching the area. |

**Effort** is a rough T-shirt size: **S** (< 0.5 day), **M** (0.5–2 days), **L** (> 2 days).
**Status:** `Open` · `In progress` · `Resolved` · `Won't fix`.

---

## 2. Active debt

| ID | Title | Severity | Effort | Area | Description & impact | Suggested remediation |
| --- | --- | --- | --- | --- | --- | --- |
| TD-002 | No automated tests | **High** | L | Quality | CI now runs `typecheck` + `lint` (`.github/workflows/ci.yml`), but there are still **zero automated tests** — behavior is validated by hand. | Stand up Vitest + RTL + Playwright on the existing CI pipeline per [testing.md](testing.md). |
| TD-003 | Webcam frames sent to third party with no consent/retention policy | **High** | M | Privacy/Legal | A JPEG of the user is POSTed to Gemini every ~1.5s with no consent record, retention statement, or opt-out. | Add an explicit consent step + privacy notice; document retention; consider configurable cadence and on-device pre-filtering. |
| TD-004 | No persistence — session-only state | **Medium** | L | Architecture | Exam + results live only in `sessionStorage`; refresh/new tab loses everything and there's no history or audit trail. | Introduce a backend store (e.g. Firestore) if history/audit is needed; otherwise document the limitation prominently. |
| TD-005 | Camera streams never stopped on unmount | **Medium** | S | Resource leak | `proctoring-panel.tsx` and `floating-camera.tsx` acquire `getUserMedia` streams but their effects have no cleanup, so tracks keep running; multiple components can open the camera simultaneously. | Return a cleanup that calls `stream.getTracks().forEach(t => t.stop())`; share one stream via context. |
| TD-006 | Violation log not de-duplicated → floods | **Medium** | S | UX/Logic | The proctor appends every detected violation each 1.5s tick, so a persistent condition (e.g. "Phone detected.") spams the log with near-duplicate timestamped entries. | Debounce/coalesce repeated violations (e.g. collapse consecutive duplicates with a count or cooldown). |
| TD-007 | No auth or rate limiting on AI actions | **Medium** | M | Security/Cost | Server Actions calling Gemini are open to anyone with the URL; no throttling means cost/abuse exposure. | Add auth and/or per-IP rate limiting and request quotas. |
| TD-008 | Identity verification claimed but not enforced | **Medium** | M | Integrity | The blueprint/instructions mention verifying ID, but the app only *tells* the user to show ID — nothing checks it. | Either implement an ID-capture/verification step or remove the claim to avoid over-promising. |
| TD-009 | Dead/duplicated prompt in tutor flow | **Low** | S | Maintainability | `clarify-exam-doubts.ts` declares an `ai.definePrompt` Handlebars template that is never used; the flow builds an equivalent string prompt inline, duplicating the logic. | Delete the unused `definePrompt` or switch the flow to use it; keep one source of truth. |
| TD-010 | LLM grades deterministic MC questions | **Medium** | M | Correctness/Cost | Multiple-choice answers are graded by the model rather than by exact comparison, risking mis-scoring and extra cost/latency. | Score MC deterministically in code; reserve the LLM for free-text grading. |
| TD-011 | Hard-coded question count | **Low** | S | Flexibility | `generateExamAction` always requests 5 questions though the flow supports 1–10; not user-configurable. | Expose count (and ideally time limit) as a setup option. |
| TD-012 | Errors swallowed in proctoring action | **Low** | S | Observability | `detectViolationsAction` returns `[]` on any error, hiding API failures from users and telemetry. | Surface a non-blocking status and log failures to real observability (TD-015). |
| TD-013 | Unused `firebase` dependency | **Low** | S | Bloat | `firebase` is installed and emulators are configured, but no app code uses it. | Remove the dependency (and emulator config) unless persistence is planned (TD-004). |
| TD-015 | No observability | **Medium** | M | Ops | Only `console.error`; no structured logs, metrics, or tracing in production. | Wire Genkit telemetry + structured logging/metrics; track the success metrics in [PRD.md](PRD.md). |
| TD-016 | `patch-package` with no patches | **Low** | S | Cleanup | Dependency present but there is no `patches/` directory or `postinstall` hook using it. | Remove `patch-package` or add the intended postinstall + patches. |
| TD-017 | Accessibility gaps | **Medium** | M | A11y | Proctoring status relies on color; live updates aren't announced (no ARIA live region); spoken answers have no captions/transcript toggle beyond on-screen text. | Add non-color status cues, an ARIA live region for the log, and a mute/caption affordance. |
| TD-018 | `maxInstances: 1` caps scaling | **Low** | S | Ops | `apphosting.yaml` limits the backend to a single instance. | Raise based on expected concurrency and Gemini quota. |

---

## 3. Resolved debt

| ID | Title | Severity | Resolved on | Resolved by | Notes / PR |
| --- | --- | --- | --- | --- | --- |
| TD-001 | Build ignores type & lint errors | High | 2026-06-01 | type/lint/CI hardening pass | Flipped `ignoreBuildErrors`/`ignoreDuringBuilds` to `false`; configured ESLint and added CI (`typecheck` + `lint`). See [ADR-0008](adr/0008-enforce-type-lint-ci.md). |
| TD-014 | Dead route `submitted/page.tsx` | Low | 2026-06-01 | type/lint/CI hardening pass | Deleted the empty, comment-only non-module route (surfaced by the now-enforced build). |

---

## 4. Entry template

Copy this block when adding a new item to **Active debt** (assign the next `TD-###`).

```markdown
| TD-### | <short title> | <Critical|High|Medium|Low> | <S|M|L> | <area> | <what the debt is and why it matters / its impact> | <suggested fix> |
```

When an item is paid down, move its row to **Resolved debt** and fill in the date,
who resolved it, and the PR link:

```markdown
| TD-### | <short title> | <severity> | <YYYY-MM-DD> | <name> | <PR link / summary> |
```

> Keep IDs stable — never renumber. Reference debt items by ID from PRs and other docs
> (e.g. "addresses TD-001").
