"use server";

import { detectExamViolations } from "@/ai/flows/detect-exam-violations";
import { summarizeProctoringAlerts } from "@/ai/flows/summarize-proctoring-alerts";
import { generateExamQuestions, type GenerateExamQuestionsOutput, type Question } from "@/ai/flows/generate-exam-questions";
import { generateExamSessionPrompt } from "@/ai/flows/generate-exam-session-prompt";
import { gradeExam, type GradeExamOutput } from "@/ai/flows/grade-exam";
import { clarifyExamDoubts, type ClarifyExamDoubtsInput } from "@/ai/flows/clarify-exam-doubts";
import { textToSpeech } from "@/ai/flows/text-to-speech";
import { aiProvider, providerSupportsTTS, providerSupportsVision } from "@/ai/genkit";

/**
 * Capability flags for the active AI provider, exposed to client components so
 * the UI can degrade gracefully (e.g. offer only the unproctored path when the
 * provider has no vision model, or skip spoken-tutor controls without TTS).
 */
export async function getProviderCapabilitiesAction(): Promise<{
  provider: string;
  vision: boolean;
  tts: boolean;
}> {
  return {
    provider: aiProvider,
    vision: providerSupportsVision,
    tts: providerSupportsTTS,
  };
}


export async function detectViolationsAction(imageDataUri: string) {
  // Proctoring needs a vision-capable model. On providers without one (e.g.
  // Ollama with no OLLAMA_VISION_MODEL), skip the call instead of feeding frames
  // to a text-only model. The UI surfaces the unproctored state separately.
  if (!providerSupportsVision) {
    return [];
  }
  try {
    const result = await detectExamViolations({
      videoDataUri: imageDataUri,
    });
    return result.violations;
  } catch (error) {
    console.error("Error detecting violations:", error);
    // In a real app, you'd want more robust error handling.
    // For now, we'll return an empty array to prevent client crashes.
    return [];
  }
}

export async function summarizeAlertsAction(alerts: string[]) {
    if (alerts.length === 0) {
        return "No proctoring violations were detected during the exam session.";
    }
    try {
        const result = await summarizeProctoringAlerts({ alerts });
        return result.summary;
    } catch (error) {
        console.error("Error summarizing alerts:", error);
        return "Could not generate summary.";
    }
}


export async function generateExamAction(topic: string, studentName: string): Promise<{examData: GenerateExamQuestionsOutput; sessionPrompt: string}> {
    try {
        const [examData, sessionPromptResult] = await Promise.all([
             generateExamQuestions({ topic, numberOfQuestions: 5 }),
             generateExamSessionPrompt({ studentName, examName: topic })
        ]);

        return {
            examData,
            sessionPrompt: sessionPromptResult.sessionStartPrompt
        };

    } catch (error) {
        console.error("Error generating exam:", error);
        throw new Error("Failed to generate exam. Please try again.");
    }
}

export async function gradeExamAction(questions: Question[], userAnswers: Record<number, string | string[]>): Promise<GradeExamOutput> {
    try {
        const result = await gradeExam({ questions, userAnswers });
        return result;
    } catch (error) {
        console.error("Error grading exam:", error);
        throw new Error("Failed to grade exam.");
    }
}

export async function clarifyDoubtAction(input: ClarifyExamDoubtsInput): Promise<string> {
    try {
        const result = await clarifyExamDoubts(input);
        return result.response;
    } catch (error) {
        console.error("Error clarifying doubt:", error);
        if (error instanceof Error) {
            throw new Error(`AI Tutor Error: ${error.message}`);
        }
        throw new Error("An unknown error occurred in the AI Tutor.");
    }
}

export async function textToSpeechAction(text: string): Promise<string> {
    // Only Gemini implements the TTS flow. On other providers the tutor degrades
    // to text: returning "" makes the client skip audio playback (see chat-tutor).
    if (!providerSupportsTTS) {
        return "";
    }
    try {
        const result = await textToSpeech({ text });
        return result.audioDataUri;
    } catch (error) {
        console.error("Error converting text to speech:", error);
        // Return an empty string or handle the error as appropriate for the client
        return "";
    }
}
