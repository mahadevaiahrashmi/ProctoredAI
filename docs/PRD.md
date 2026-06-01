# Product Requirements Document — ProctoredAI

**Status:** Reverse-engineered from the existing codebase (not a forward-looking spec).
**Last updated:** 2026-06-01
**Owner:** _unassigned_

> This PRD documents what the application *currently does* and frames it in product terms.
> Where a capability is implied by the UI/blueprint but **not enforced in code**, it is
> called out as a gap so the requirement and reality don't get conflated.

---

## 1. Overview

ProctoredAI is a single-user web app that delivers an end-to-end, AI-driven exam
experience: it **generates** an exam on any topic, **proctors** the test-taker through
their webcam, **grades** the submission, and offers a **conversational AI tutor** that
explains results aloud. It is built to demonstrate how generative AI (Google Gemini via
Genkit) can replace several traditionally manual steps in online assessment.

## 2. Problem statement

Creating, invigilating, and grading exams is labor-intensive. Educators spend time
authoring questions, remote proctoring requires human monitors, and feedback to students
is slow and generic. ProctoredAI compresses author → proctor → grade → tutor into one
automated flow that a learner can run on demand.

## 3. Goals & non-goals

### Goals
- **G1.** Generate a coherent, mixed-format exam from a free-text topic in one step.
- **G2.** Provide real-time, low-friction proctoring signals using only a standard webcam.
- **G3.** Grade both multiple-choice and open-ended answers and return actionable feedback.
- **G4.** Help the learner understand their results through an interactive, voice-enabled tutor grounded strictly in their own exam.
- **G5.** Run entirely client-initiated with no account or backend database required.

### Non-goals (current version)
- **NG1.** Not a system of record — results are **not persisted** beyond the browser session.
- **NG2.** No multi-user roles (no separate "instructor" vs "student" dashboards).
- **NG3.** Not a high-stakes / tamper-proof proctoring solution (see §8 risks).
- **NG4.** No identity verification enforcement, scheduling, or cohort management.
- **NG5.** No offline mode — every core action requires a live Gemini API call.

## 4. Target users & personas

| Persona | Description | Primary needs |
| --- | --- | --- |
| **Self-learner ("Sam")** | An individual studying a topic who wants quick self-assessment. | On-demand quiz, instant grading, an explainer for wrong answers. |
| **Educator/demo ("Dr. Lee")** | A teacher or evaluator exploring AI-assisted assessment. | See generation + proctoring + grading working end-to-end; assess feasibility. |
| **Reviewer/proctor ("Morgan")** | Someone who later inspects the violation report. | A clear, summarized log of suspected violations during the session. |

The current build is optimized for **Sam** (single, self-served session).

## 5. User stories

### Exam setup
- **US-1.** As a learner, I can enter my name and an exam topic so the system can generate a relevant exam.
- **US-2.** As a learner, I receive clear pre-exam instructions so I know how proctoring works.
- **US-3.** As a learner, I am asked for camera and microphone permission before the exam starts, and I cannot start until both are granted.

### Taking the exam
- **US-4.** As a learner, I can navigate forward/back through questions and answer multiple-choice (single select) and free-text questions.
- **US-5.** As a learner, I can see a countdown timer and progress indicator, and the exam auto-submits when time runs out.
- **US-6.** As a learner, I can see live proctoring status and a running violation log while I test.
- **US-7.** As a learner, I confirm before final submission so I don't submit accidentally.

### Results & tutoring
- **US-8.** As a learner, I receive an overall score, a written performance summary, and per-question feedback.
- **US-9.** As a learner, I see a proctoring violation report if any violations were detected.
- **US-10.** As a learner, I can chat with an AI tutor about my results, and it answers only about my exam.
- **US-11.** As a learner, the tutor speaks its answers aloud so I can listen rather than read.

## 6. Functional requirements

| ID | Requirement | Source flow / component |
| --- | --- | --- |
| FR-1 | Generate a titled exam of mixed MC/text questions from a topic. | `generate-exam-questions` (currently fixed at 5 questions) |
| FR-2 | Generate a personalized welcome/instruction prompt. | `generate-exam-session-prompt` |
| FR-3 | Request and gate on camera + microphone permissions. | `app/page.tsx` |
| FR-4 | Render MC (radio) and text (textarea) question types. | `question-display.tsx` |
| FR-5 | Enforce a time limit (90s/question) with auto-submit. | `exam-header.tsx` |
| FR-6 | Capture a webcam frame every ~1.5s and detect violations. | `proctoring-panel.tsx` + `detect-exam-violations` |
| FR-7 | Maintain a timestamped violation log. | `proctoring-panel.tsx` |
| FR-8 | Grade submission → score + summary + per-question feedback. | `grade-exam` |
| FR-9 | Summarize the violation log into a short report. | `summarize-proctoring-alerts` |
| FR-10 | Provide a results-grounded chat tutor that declines off-topic questions. | `clarify-exam-doubts` + `chat-tutor.tsx` |
| FR-11 | Convert tutor responses to speech and play them. | `text-to-speech` |

## 7. Success metrics

> No analytics are instrumented in the current build; these are the metrics that *should*
> be tracked to evaluate the product. They are targets/KPIs, not measured values.

| Metric | Definition | Target |
| --- | --- | --- |
| **Exam generation success rate** | % of generation attempts that return a valid exam. | ≥ 98% |
| **Time-to-first-question** | Setup submit → exam rendered. | ≤ 8s (p50) |
| **Grading completion rate** | % of submissions that produce a report without error. | ≥ 98% |
| **Proctoring frame success** | % of webcam frames analyzed without API failure. | ≥ 95% |
| **Tutor groundedness** | % of tutor answers that stay on-topic (manual eval). | ≥ 95% |
| **Tutor relevance/helpfulness** | Avg. thumbs-up rate (needs a feedback widget — not built). | ≥ 80% |
| **Completion rate** | % of started exams that reach the results page. | ≥ 70% |

## 8. Risks, assumptions, dependencies

- **Dependency:** Google Gemini API availability, quota, and pricing. Every feature fails closed if the key is missing or rate-limited.
- **Assumption:** The user has a working webcam/mic and grants permission; proctoring is best-effort, not authoritative.
- **Risk (accuracy):** Vision-based violation detection may produce false positives/negatives; it is not court-of-law evidence.
- **Risk (privacy):** Webcam frames are sent to a third-party model every ~1.5s. There is **no consent record, retention policy, or data-handling notice** in the app.
- **Risk (integrity):** Correct answers are generated by AI and live in client-accessible session state; this is a learning tool, not a secure testing platform.
- **Gap vs. blueprint:** The blueprint lists "verify user identity"; the code only *instructs* the user to show ID — it does not verify it.

## 9. Open questions
- Should results persist (accounts + history), and if so, where?
- Should the number of questions and time limits be configurable by the user?
- What is the data-retention / consent policy for webcam frames?
- Is an instructor/admin view in scope for a future version?

See [product_design.md](product_design.md) for UX detail and [system_design.md](system_design.md) for architecture.
