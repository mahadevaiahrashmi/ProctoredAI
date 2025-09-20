"use server";

import { detectExamViolations } from "@/ai/flows/detect-exam-violations";
import { summarizeProctoringAlerts } from "@/ai/flows/summarize-proctoring-alerts";

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
