"use server";

import { detectExamViolations } from "@/ai/flows/detect-exam-violations";
import { summarizeProctoringAlerts } from "@/ai/flows/summarize-proctoring-alerts";
import { generateExamQuestions, type GenerateExamQuestionsOutput, type Question } from "@/ai/flows/generate-exam-questions";
import { generateExamSessionPrompt } from "@/ai/flows/generate-exam-session-prompt";
import { gradeExam, GradeExamOutput } from "@/ai/flows/grade-exam";

export async function detectViolationsAction(imageDataUri: string) {
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
        return "No alerts to summarize.";
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
