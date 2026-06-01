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
| TD-002 | Automated test coverage incomplete | **Medium** | M | Quality | **Vitest + RTL are set up** with an initial unit/component suite (4 files, 13 tests) run in CI via `npm test`; the remaining gap is **page-level integration coverage and an E2E (Playwright) layer** — most full-flow behavior is still validated by hand. | Grow the RTL suite to the page flows in [testing.md](testing.md) §2.2 and add Playwright E2E (§2.3). |
| TD-003 | Webcam frames sent to third party with no consent record/retention policy | **High** | M | Privacy/Legal | **Partially mitigated:** users can now decline the camera and take the exam unproctored ([ADR-0009](adr/0009-pluggable-ai-providers-and-camera-opt-out.md)). But if they *do* proctor, a JPEG is still POSTed to the AI provider every ~1.5s with no consent **record** or retention statement. | Add an explicit consent step + privacy notice for the proctored path; document retention; consider configurable cadence and on-device pre-filtering. |
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
| TD-017 | Accessibility gaps | **Medium** | M | A11y | Proctoring status relies on color; live updates aren't announced (no ARIA live region). A **mute toggle** for the spoken tutor now exists (an accessible button — partial mitigation), but there's still no caption/transcript affordance beyond the on-screen text. | Add non-color status cues and an ARIA live region for the log; consider a caption/transcript affordance. |
| TD-018 | `maxInstances: 1` caps scaling | **Low** | S | Ops | `apphosting.yaml` limits the backend to a single instance. | Raise based on expected concurrency and Gemini quota. |
| TD-019 | npm dependency vulnerabilities | **Medium** | M | Security | `npm audit` reports a backlog of advisories — last observed **48, including 1 critical** — coming largely from the Genkit/Firebase dependency tree. Re-run `npm audit` for the current count. | Triage with `npm audit`; apply non-breaking fixes (`npm audit fix`), bump or replace the offending transitive deps, and drive the critical one to closure first. |
| TD-020 | Ollama structured-output unreliable for exam/grading flows | **Medium** | M | AI/Compatibility | On `AI_PROVIDER=ollama`, small local models (e.g. llama3.2 3B) tend to echo the JSON **schema** back instead of filling it, so exam generation and grading fail. `genkitx-ollama` 1.36 does **not** forward Ollama's native `format`/structured-output API — it relies on prompt-injection. Plain text and the chat tutor work fine. | Use a larger/instruct local model, or `googleai`/`openrouter` for the structured flows; or patch the plugin to send Ollama's `format`. Context in [ADR-0009](adr/0009-pluggable-ai-providers-and-camera-opt-out.md). |

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
