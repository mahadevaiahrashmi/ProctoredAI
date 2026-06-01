# ADR-0005: LLM grades both multiple-choice and free-text

- **Status:** Accepted
- **Date:** 2026-06-01
- **Deciders:** Original author (recorded retroactively)
- **Related:** [ADR-0002](0002-genkit-google-gemini.md), [tech_debt TD-010](../tech_debt.md)

## Context

Exams contain both multiple-choice questions (one correct option) and open-ended text
questions (a model answer to compare against). Grading must produce an overall score, a
narrative summary, and per-question feedback. Free-text grading genuinely requires semantic
judgement.

## Decision

We will have the **`grade-exam` flow grade every question with the LLM**, including
multiple-choice, passing the questions, correct answers, and the student's answers and asking
for a structured `{overallScore, summaryReport, gradedQuestions[]}` result.

## Consequences

**Positive**
- One uniform grading path and prompt for all question types.
- Produces rich, constructive narrative feedback that pure comparison cannot.
- Handles paraphrased/partial free-text answers sensibly.

**Negative / costs**
- The model can occasionally **mis-score deterministic MC questions** that a simple equality check would always get right (**TD-010**).
- Higher token cost and latency than scoring MC in code.
- Score is non-deterministic across runs.

**Neutral / follow-ups**
- A hybrid (deterministic MC scoring + LLM for free-text and the summary) would be cheaper and more reliable; deferred as TD-010.

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Deterministic scoring for everything | Cannot grade open-ended text answers. |
| Hybrid: code for MC, LLM for text | Better, but adds branching; the uniform path was simpler to ship (now tracked as debt). |
