# Product Design — ProctoredAI

Covers user flows, information architecture, and the visual & interaction design as
implemented. Style direction is inherited from [blueprint.md](blueprint.md).

---

## 1. Design principles

1. **Focus over chrome.** The exam content is the hero; proctoring is present but peripheral.
2. **Progressive disclosure.** Setup is a 3-step wizard so the user is never overwhelmed.
3. **Trust through transparency.** Live proctoring status and a visible violation log make monitoring legible rather than hidden.
4. **Encouraging tone.** Grading and the tutor are explicitly constructive and supportive, not punitive.
5. **Feedback on every action.** Loading skeletons, spinners, status icons, and toasts confirm what's happening.

---

## 2. Information architecture

```
/ (Exam setup wizard)
├── Step 0: Identity + topic  ──► generates exam (sessionStorage: examData)
├── Step 1: AI instructions
└── Step 2: System check (camera/mic)
        │
        ▼
/exam (Exam runner)
├── Header: title + countdown timer
├── Main: question (MC or text) + progress + nav (Prev / Next / Submit)
└── Proctoring panel: live camera, status, violation log
        │  (submit → sessionStorage: examResults)
        ▼
/results (Report + tutor)
├── Score card + performance summary
├── Question-by-question accordion (your answer / correct / feedback)
├── Proctoring violation report (only if violations)
└── AI Tutor chat (voice-enabled)

/submitted  — deprecated placeholder, not in the active flow
```

There is no global navigation; the app is a **linear funnel**. Movement between pages is
via primary action buttons. State is handed off through `sessionStorage`, so the flow is
single-session and single-tab.

---

## 3. Primary user flow (happy path)

1. **Land on `/`.** User sees the "Proctored Exam Setup" card with a book icon.
2. **Enter details.** Name + topic (topic defaults to "Quantum Physics"). Submit is disabled until both fields are filled.
3. **Generate.** Button shows a spinner; the app generates the exam and the welcome prompt in parallel, stores the exam, advances to Step 1.
4. **Read instructions.** AI-written welcome message with the proctoring steps. (Shows skeleton lines while loading.)
5. **System check.** The browser prompts for camera + mic. Each shows a spinner → green check (granted) or red X (denied). "Start Exam" stays disabled until both are granted.
6. **Take the exam.** Answer questions, navigate, watch the timer and proctoring panel.
7. **Submit.** On the last question, "Submit Exam" opens a confirm dialog. Confirm → results.
8. **Review results.** A loading state ("Grading your exam…") resolves into the score, summary, and breakdown.
9. **Ask the tutor.** Type a question; the tutor replies in text and speaks the answer (avatar pulses while speaking).
10. **Return home.** "Return to Home" restarts the funnel.

### Key alternate / edge flows
- **Permission denied:** A destructive alert explains both permissions are required; the user must enable them in browser settings and refresh.
- **Time expires:** The timer hits 00:00 → `onTimeUp` auto-submits the current answers.
- **No exam in session (direct visit to `/exam`):** Falls back to the static sample exam in `src/lib/data.ts`.
- **Generation failure:** A destructive alert: "Failed to generate exam. Please try a different topic or try again later."
- **Grading failure:** Full-screen error card with a "Return to Home" action.
- **Tutor/TTS failure:** Tutor shows an inline error bubble; TTS simply produces no audio (silent degrade).

---

## 4. Screen-by-screen detail

### 4.1 Setup wizard (`/`)
- **Layout:** Centered card (`max-w-2xl`), drop shadow, circular primary-colored icon badge.
- **Step 0 — Identity & topic:** Two labeled inputs with leading icons (User, FileText). Inline validation message if either is empty. Primary CTA: "Generate Exam & Proceed →".
- **Step 1 — Instructions:** Bordered, tinted panel titled "Instructions" containing the AI welcome text (preserves line breaks). CTA: "Start System Check →".
- **Step 2 — System check:** Two permission rows (Camera, Microphone) each with a state icon: spinner (prompt) / green check (granted) / red X (denied). CTA label is "Start Exam" when ready, otherwise "Waiting for Permissions…".

### 4.2 Exam runner (`/exam`)
- **Header (`h-16`, sticky top):** Exam title (truncates) on the left; a pill timer on the right showing `MM:SS`. Timer pill turns **destructive red when < 5:00 remain**, primary otherwise. On mobile, a panel-toggle button reveals proctoring in a slide-over sheet.
- **Main column:** A card containing "Question X of N", a progress bar, the question body, and a footer with **Previous** (disabled on Q1) and **Next** / **Submit Exam** (last question).
- **Question types:**
  - *Multiple-choice:* radio options as full-width clickable label rows; the selected row gets an accent background/border.
  - *Text:* an 8-row textarea.
- **Proctoring panel (right sidebar ≥ lg; slide-over sheet < lg):**
  - Live webcam preview (`aspect-video`, "Your Camera" badge).
  - "Proctoring Status" with a spinner while a frame is being analyzed, and a status line: *System Secure* (green shield) or *Potential Violation Detected* (red triangle) or *Initializing…*.
  - "Violation Log": scrollable list of timestamped entries, or an empty-state message.
- **Floating camera:** On small screens a small fixed webcam thumbnail appears top-right.
- **Submit confirmation:** AlertDialog — "Are you sure? … You cannot undo this action." with Cancel / Submit.

### 4.3 Results (`/results`)
- **Loading state:** Centered card, spinning icon, "Grading Your Exam…", skeleton blocks.
- **Report card:** Award icon, "Exam Report for "{title}"", then a 3-up grid: a big **Overall Score %** tile and a wide **Performance Summary** tile.
- **Question analysis:** An accordion; each row leads with a green check or red X and the question text; expanding shows *Your Answer*, *Correct Answer*, and *Feedback*.
- **Proctoring violation report (conditional):** A destructive-tinted card with the AI summary and a scrollable detailed log. Hidden entirely when there are no violations.
- **AI Tutor:** A tall (`h-[600px]`) gradient chat surface with a Bot header. Empty state invites a question. User messages are right-aligned (primary bubble); tutor messages are left-aligned with a bot avatar that **gets a glowing ring while audio is playing**. A loading bubble (spinner) shows while the tutor thinks. Input + send button at the bottom.
- **Footer:** "Return to Home" button.

---

## 5. Visual design system

From [blueprint.md](blueprint.md), implemented via Tailwind + CSS variables (`src/app/globals.css`) and shadcn-ui:

| Token | Intent | Blueprint value |
| --- | --- | --- |
| **Primary** | Professional, secure feel; primary actions, timer, accents | Deep blue `#30475E` |
| **Background** | Clean, modern backdrop | Light gray `#E8E8E8` |
| **Accent** | Interactive highlights | Electric blue `#749BC2` |
| **Destructive** | Errors, violations, low-time timer | Red (theme default) |
| **Success** | Granted permissions, correct answers | Green-500 |

- **Typography:** `Inter` (400/500/600/700) for both headline and body, loaded from Google Fonts; monospace reserved for code. Tabular numerals on the timer.
- **Iconography:** `lucide-react`, minimalist and consistent (BookOpen, Camera, Mic, ShieldCheck, AlertTriangle, Timer, Bot, Award, etc.).
- **Surfaces:** Rounded cards with soft shadows; bordered list rows; subtle secondary tints for panels.
- **Theming:** CSS-variable based (`hsl(var(--token))`), dark-mode-capable via the `class` strategy (no in-app toggle is wired up).

---

## 6. Interaction & motion
- **Loading:** Skeletons for content that's being fetched (instructions, grading); spinners (`Loader2`) for in-flight buttons and per-frame proctoring.
- **State icons:** Animated spinner → check/X transitions for permissions.
- **Accordion:** `accordion-down/up` 0.2s ease animations for the results breakdown.
- **Speaking indicator:** The tutor avatar gains a `ring` while the TTS audio element is playing, and loses it on pause/end.
- **Timer urgency:** Color shift to destructive under 5 minutes provides ambient pressure without a modal.
- **Toasts:** A global `Toaster` is mounted for transient notifications.

---

## 7. Accessibility notes (current state & gaps)
- Inputs use `<Label>`; the text answer has an `sr-only` label; the mobile panel trigger has an `sr-only` description.
- Radix primitives provide focus management and ARIA for dialogs, accordions, radio groups.
- **Gaps:** Proctoring status leans on color (red/green) to convey meaning — needs a non-color cue for color-blind users. No captions/transcript toggle for spoken tutor answers beyond the on-screen text. Live proctoring updates are not announced via an ARIA live region. These are tracked in [tech_debt.md](tech_debt.md).
