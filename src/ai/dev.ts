import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-proctoring-alerts.ts';
import '@/ai/flows/detect-exam-violations.ts';
import '@/ai/flows/generate-exam-session-prompt.ts';
import '@/ai/flows/generate-exam-questions.ts';
import '@/ai/flows/grade-exam.ts';
import '@/ai/flows/clarify-exam-doubts.ts';
import '@/ai/flows/text-to-speech.ts';
