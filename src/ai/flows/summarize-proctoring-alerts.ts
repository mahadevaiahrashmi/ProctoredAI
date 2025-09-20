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

  Summarize the following alerts into a short, concise report for the administrator:

  {%#each alerts %}
  - {{this}}
  {%/each %}
  `,
});

const summarizeProctoringAlertsFlow = ai.defineFlow(
  {
    name: 'summarizeProctoringAlertsFlow',
    inputSchema: SummarizeProctoringAlertsInputSchema,
    outputSchema: SummarizeProctoringAlertsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
