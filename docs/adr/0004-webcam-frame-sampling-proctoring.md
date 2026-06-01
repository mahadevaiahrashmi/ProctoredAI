# ADR-0004: Periodic webcam frame sampling for proctoring

- **Status:** Accepted
- **Date:** 2026-06-01
- **Deciders:** Original author (recorded retroactively)
- **Related:** [ADR-0002](0002-genkit-google-gemini.md), [tech_debt TD-003, TD-005, TD-006](../tech_debt.md)

## Context

Proctoring must detect suspicious activity (multiple faces, a phone, looking away, other
people) using only a standard webcam, with no specialized hardware and no human invigilator.
The model available is Gemini's multimodal vision.

## Decision

We will **sample a single webcam frame on an interval** (every ~1.5s in `proctoring-panel.tsx`),
draw it to a hidden `<canvas>`, encode it as a **JPEG data URI** (quality 0.7), and send it to
the `detect-exam-violations` flow for analysis. Detected violations are appended to a
timestamped client-side log.

## Consequences

**Positive**
- Simple, model-agnostic, and works with any webcam in the browser.
- No video upload/streaming infrastructure; each check is an independent, stateless call.
- Cadence is easy to tune via one constant.

**Negative / costs**
- **Privacy:** a user image is sent to a third-party model every ~1.5s with no consent record or retention policy (**TD-003**).
- **Cost/latency:** frequent vision calls add API cost and can lag on slow networks.
- **Accuracy:** single-frame vision yields false positives/negatives; not authoritative evidence.
- Implementation gaps: camera streams aren't stopped on unmount (**TD-005**) and repeated violations flood the log without de-duplication (**TD-006**).

**Neutral / follow-ups**
- On-device pre-filtering (e.g. face detection) could cut cost/privacy exposure before any upload.

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Continuous video stream to a service | Needs streaming infra; far heavier for marginal accuracy gain at this scale. |
| On-device ML (MediaPipe/face-api.js) | More privacy-friendly and cheaper, but more complex and lower-capability than Gemini vision for arbitrary rules. |
| Human proctor via WebRTC | Out of scope; defeats the "automated" goal. |
