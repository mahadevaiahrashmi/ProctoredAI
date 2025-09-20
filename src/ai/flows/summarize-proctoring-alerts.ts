'use server';

/**
 * @fileOverview Summarizes proctoring alerts into a concise report for administrators.
 *
 * - summarizeProctoringAlerts - A function that takes a list of proctoring alerts and summarizes them.
 * - SummarizeProctoringAlertsInput - The input type for the summarizeProctoringAlerts function.
 * - SummarizeProctoringAlertsOutput - The return type for the summarizeProctoringAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeProctoringAlertsInputSchema = z.object({
  alerts: z
    .array(z.string())
    .describe('A list of proctoring alerts to summarize.'),
});
export type SummarizeProctoringAlertsInput = z.infer<
  typeof SummarizeProctoringAlertsInputSchema
>;

const SummarizeProctoringAlertsOutputSchema = z.object({
  summary: z.string().describe('A short summary of the proctoring alerts.'),
});
export type SummarizeProctoringAlertsOutput = z.infer<
  typeof SummarizeProctoringAlertsOutputSchema
>;

export async function summarizeProctoringAlerts(
  input: SummarizeProctoringAlertsInput
): Promise<SummarizeProctoringAlertsOutput> {
  return summarizeProctoringAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeProctoringAlertsPrompt',
  input: {schema: SummarizeProctoringAlertsInputSchema},
  output: {schema: SummarizeProctoringAlertsOutputSchema},
  prompt: `You are an AI assistant that summarizes proctoring alerts during an exam.

  Based on the list of alerts provided, generate a 1-2 sentence summary that gives an overview of the student's conduct. Mention the types of violations and their frequency. For example: "Multiple potential violations were detected, including the presence of a phone and the student frequently looking away from the screen." If no alerts are present, state that the session was clean.

  Alerts:
  {{#each alerts}}
  - {{this}}
  {{/each}}
  `,
});

const summarizeProctoringAlertsFlow = ai.defineFlow(
  {
    name: 'summarizeProctoringAlertsFlow',
    inputSchema: SummarizeProctoringAlertsInputSchema,
    outputSchema: SummarizeProctoringAlertsOutputSchema,
  },
  async input => {
    // If there are no alerts, return a clean summary without calling the AI
    if (input.alerts.length === 0) {
      return { summary: "No proctoring violations were detected during the exam session." };
    }
    const {output} = await prompt(input);
    return output!;
  }
);

    