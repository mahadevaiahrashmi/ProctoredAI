# User Manual — ProctoredAI

A guide for taking an AI-proctored exam, written for the person sitting the test.
No technical knowledge required.

---

## What is ProctoredAI?

ProctoredAI creates a short exam on any topic you choose, watches your webcam for
suspicious activity while you take it, grades your answers, and then gives you an AI
tutor you can talk to about your results. The tutor also reads its answers out loud.

**You will need:** a computer with a **webcam and microphone**, a modern web browser
(Chrome, Edge, Safari, or Firefox), and an internet connection.

---

## Before you start

1. Find a **quiet, well-lit room** where you are **alone**.
2. Make sure your **face is clearly visible** to the webcam.
3. **Close other apps** you don't need (especially anything that could look like cheating).
4. Put your **phone away** — phones are flagged by the proctor.
5. Be ready to **show a photo ID** to the camera if asked.

---

## Step-by-step

### Step 1 — Enter your details
On the first screen ("Proctored Exam Setup"):
1. Type **your name**.
2. Type an **exam topic** (for example, "World History" or "Photosynthesis").
3. Click **Generate Exam & Proceed**.

The app builds your exam — this takes a few seconds.

### Step 2 — Read the instructions
You'll see a personalized welcome message with the rules for the session. Read it, then
click **Start System Check**.

### Step 3 — Allow camera & microphone
Your browser will ask for permission to use your **camera** and **microphone**.
- Click **Allow** for both.
- Each item turns into a **green check** when granted.
- When both are green, click **Start Exam**.

> If you accidentally block them, see [Troubleshooting](#troubleshooting) below.

### Step 4 — Take the exam
- The exam has **5 questions**, a mix of **multiple-choice** and **written** answers.
- A **timer** at the top right counts down (about 1½ minutes per question). It turns **red** when less than 5 minutes remain. **If the timer reaches zero, your exam is submitted automatically.**
- Use **Previous** and **Next** to move between questions. Your answers are kept as you navigate.
- For multiple-choice, click the option you want. For written questions, type into the box.
- On the right (or behind the panel button on a phone) you'll see the **Proctoring** area:
  - your live camera,
  - a **status** (green "System Secure" or red "Potential Violation Detected"),
  - a **violation log** listing anything flagged, with timestamps.

### Step 5 — Submit
- On the last question, click **Submit Exam**.
- A confirmation box appears — click **Submit** to finish (or **Cancel** to keep working).

### Step 6 — Review your results
After a short "Grading your exam…" wait, you'll see:
- your **Overall Score (%)**,
- a **Performance Summary**,
- a **question-by-question breakdown** — click any row to expand it and see your answer, the correct answer, and feedback,
- a **Proctoring Violation Report** (only if anything was flagged).

### Step 7 — Ask the AI Tutor
At the bottom of the results page is the **AI Tutor**:
1. Type a question about your exam — e.g. *"Why was my answer to question 2 wrong?"*
2. Press **Send** (or Enter).
3. The tutor replies in writing **and speaks the answer aloud**. Its icon glows while it's talking.

The tutor only discusses **your exam**. If you ask about something unrelated, it will
politely steer you back.

When you're done, click **Return to Home** to start over.

---

## Tips for a clean proctoring report
- Keep your **face centered** and avoid looking away for long stretches.
- Don't let **other people** appear in the camera view.
- Keep your **phone out of sight**.
- Don't open other applications mid-exam.

A flagged item is a *potential* concern, not an automatic penalty — the report simply
records what the system noticed.

---

## Frequently asked questions

**How many questions are there?** Five, generated fresh from your topic each time.

**How long do I have?** About 1.5 minutes per question (so ~7.5 minutes for five). Watch the timer.

**Can I go back and change an answer?** Yes, until you submit. Use Previous/Next.

**What happens if time runs out?** The exam submits automatically with whatever you've entered.

**Are my answers saved if I refresh the page?** Not reliably. The exam lives in your browser
session for the current tab only. **Refreshing or opening a new tab can lose your progress**, so
avoid it during the exam.

**Is my camera recorded?** The app captures still frames from your webcam while you test and
sends them to an AI service to check for violations. It does not save a video in the app. If
data handling matters to you, ask whoever provided the app about their privacy policy.

**Why didn't the tutor speak?** Audio can fail quietly if the speech service is unavailable, or
your tab may be muted. The written answer still appears.

---

## Troubleshooting

| Problem | What to do |
| --- | --- |
| Camera/microphone shows a **red X** | Click **Allow** when prompted. If you blocked it, open your browser's site settings (the padlock/permissions icon in the address bar), set Camera and Microphone to **Allow**, then **refresh** the page. |
| **"Failed to generate exam"** | Try a different topic and click again. If it keeps failing, the AI service may be temporarily unavailable — wait a moment and retry. |
| The exam page looks **empty or shows a sample about Quantum Physics** | You may have opened the exam directly or lost your session. Go back to the home page and start from Step 1. |
| **AI Tutor shows an error** | Send your message again. If it persists, the AI service may be busy. |
| **No sound** from the tutor | Check your tab isn't muted and your system volume is up; the written answer is always shown regardless. |
| The page is **slow** during the exam | The proctor checks your camera every couple of seconds; on slow connections this can lag, but you can keep answering normally. |

If you're a developer or administrator, see **[../SETUP.md](../SETUP.md)** for installation
and configuration help.
