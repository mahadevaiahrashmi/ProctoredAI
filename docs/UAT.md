# User Acceptance Testing (UAT) — ProctoredAI

Manual acceptance plan to confirm the app behaves correctly from a real user's
perspective before a release. Complements the automated strategy in [testing.md](testing.md).

---

## 1. Scope
- **In scope:** the end-to-end learner journey — setup, permissions, exam taking, proctoring, submission, grading, results, and the AI tutor (incl. spoken responses).
- **Out of scope:** load/performance testing, security penetration, the deprecated `/submitted` route, and any instructor/admin features (none exist).

## 2. Environment & prerequisites
- Build under test: latest `main` deployed to a staging URL **or** local `npm run dev` (http://localhost:9002).
- A valid `GEMINI_API_KEY` configured with available quota.
- A device with a **working webcam + microphone**, speakers/headphones, and a modern browser.
- A photo ID handy (to exercise the identity instruction).
- Stable internet connection.

## 3. Entry criteria (UAT may begin when…)
- [ ] All planned features for the release are code-complete and deployed to the test environment.
- [ ] `npm run lint`, `npm run typecheck`, and the automated test suite pass (see [testing.md](testing.md)).
- [ ] Smoke test passes: home page loads and an exam can be generated.
- [ ] Known open defects are documented and none are severity **Critical/Blocker**.
- [ ] Test data and accounts (n/a — no auth) and API quota are available.

## 4. Exit criteria (UAT is complete when…)
- [ ] 100% of **Must-pass** test cases (P1) executed and passed.
- [ ] ≥ 95% of all test cases passed; no open **Critical/High** defects.
- [ ] Any remaining Medium/Low defects are triaged with an agreed disposition (fix-now / defer).
- [ ] Privacy/consent expectations for webcam capture reviewed and accepted by the product owner.
- [ ] Sign-off recorded in §8.

## 5. Roles
| Role | Responsibility |
| --- | --- |
| UAT lead | Owns the plan, schedules runs, reports results. |
| Tester(s) | Execute cases, log defects with repro steps + screenshots. |
| Product owner | Confirms acceptance, approves exit, owns privacy sign-off. |
| Engineering | Triages and fixes defects, provides builds. |

---

## 6. Test cases

Priority: **P1 = must pass**, P2 = should pass, P3 = nice to have.
Record **Pass/Fail**, date, tester, and notes per run.

| ID | Priority | Story | Title | Steps | Expected result | Result |
| --- | --- | --- | --- | --- | --- | --- |
| UAT-01 | P1 | US-1 | Generate exam | On `/`, enter name + topic, click Generate. | Spinner shows; within a few seconds the Instructions step appears; exam stored. | ☐ |
| UAT-02 | P2 | US-1 | Required fields | Leave name or topic empty; attempt to proceed. | Generate button stays disabled / inline error "Please enter both…". | ☐ |
| UAT-03 | P2 | US-2 | Instructions shown | After generation, view Step 1. | A personalized welcome message with proctoring steps is displayed. | ☐ |
| UAT-04 | P1 | US-3 | Permission grant | Start System Check; allow camera + mic. | Both rows show green checks; "Start Exam" becomes enabled. | ☐ |
| UAT-05 | P1 | US-3 | Permission denied | Start System Check; block permissions. | Red X on the blocked item; destructive alert explains both are required; "Start Exam" stays disabled. | ☐ |
| UAT-06 | P1 | US-4 | Render question types | Enter the exam; navigate questions. | Multiple-choice shows selectable options; text shows a textarea; both accept input. | ☐ |
| UAT-07 | P1 | US-4 | Navigation persists answers | Answer Q1, go Next, return Previous. | Previous answer is still selected/typed; Previous disabled on Q1. | ☐ |
| UAT-08 | P1 | US-5 | Timer counts down | Observe the header timer. | Timer decreases each second in MM:SS; turns red under 5:00. | ☐ |
| UAT-09 | P1 | US-5 | Auto-submit on time-up | Let the timer reach 00:00 (use a short exam or wait). | Exam auto-submits and routes to results. | ☐ |
| UAT-10 | P1 | US-6 | Live proctoring status | Sit normally in front of the camera. | Camera preview is live; status reads "System Secure" with no violations. | ☐ |
| UAT-11 | P1 | US-6 | Violation detection | Hold a phone up / have a second person appear. | Within a few seconds a timestamped entry appears in the log; status flips to "Potential Violation Detected". | ☐ |
| UAT-12 | P2 | US-6 | Camera failure handled | Cover/disable the camera mid-exam. | App logs "Camera access denied or failed." and does not crash; questions remain answerable. | ☐ |
| UAT-13 | P1 | US-7 | Submit confirmation | On the last question, click Submit Exam. | Confirmation dialog appears; Cancel returns to exam, Submit proceeds. | ☐ |
| UAT-14 | P1 | US-8 | Grading report | Submit a completed exam. | "Grading…" then a report with Overall Score %, Performance Summary, and per-question accordion. | ☐ |
| UAT-15 | P1 | US-8 | Per-question feedback | Expand an accordion row. | Shows Your Answer, Correct Answer, Feedback; correct/incorrect icon matches. | ☐ |
| UAT-16 | P1 | US-9 | Violation report shows | Submit after triggering violations. | A Proctoring Violation Report card shows a summary + detailed timestamped log. | ☐ |
| UAT-17 | P2 | US-9 | Clean session | Submit with no violations. | No violation card is shown on results. | ☐ |
| UAT-18 | P1 | US-10 | Tutor answers in-context | Ask "Why did I get question 2 wrong?". | Tutor replies relevantly using your exam data; reply bubble appears. | ☐ |
| UAT-19 | P2 | US-10 | Tutor declines off-topic | Ask something unrelated (e.g. "What's the weather?"). | Tutor politely declines and redirects to the exam. | ☐ |
| UAT-20 | P1 | US-11 | Spoken response | After a tutor reply. | Audio plays the answer; the bot avatar shows the speaking (glow) state while playing. | ☐ |
| UAT-21 | P2 | — | Generation error path | Use a topic that fails / simulate API outage. | Destructive alert "Failed to generate exam…"; app remains usable. | ☐ |
| UAT-22 | P2 | — | Direct exam visit fallback | Open `/exam` directly without setup. | The static sample exam loads (no crash). | ☐ |
| UAT-23 | P3 | — | Responsive / mobile | Run on a narrow viewport. | Proctoring opens via the panel button (sheet); floating camera thumbnail appears; layout is usable. | ☐ |
| UAT-24 | P3 | — | Return home resets | Click Return to Home from results. | Lands on setup; a new exam can be started. | ☐ |

> **Note on UAT-09:** because the time limit is 90s × #questions (7:30 for five questions),
> testers may use a build/branch with a shorter limit or simply wait. Document which.

---

## 7. Defect logging
For each failure capture: **ID, title, severity (Blocker/Critical/High/Medium/Low), steps to
reproduce, expected vs actual, screenshot/recording, environment/browser, build/commit.**
Link defects back to the UAT case ID. Severity definitions align with the rubric in
[tech_debt.md](tech_debt.md).

---

## 8. Sign-off

| Run | Build / commit | Date | Cases passed | P1 pass? | Notes |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  / 24 |  ☐ |  |

**Acceptance decision:** ☐ Accepted ☐ Accepted with conditions ☐ Rejected

| Approver | Role | Signature | Date |
| --- | --- | --- | --- |
|  | Product Owner |  |  |
|  | UAT Lead |  |  |
|  | Engineering Lead |  |  |

_Conditions / follow-ups:_ ____________________________________________
