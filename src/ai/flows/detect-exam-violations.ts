'use server';

/**
 * @fileOverview Detects exam violations using GenAI by analyzing the video feed.
 *
 * - detectExamViolations - A function that detects potential exam violations.
 * - DetectExamViolationsInput - The input type for the detectExamViolations function.
 * - DetectExamViolationsOutput - The return type for the detectExamViolations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectExamViolationsInputSchema = z.object({
  videoDataUri: z
    .string()
    .describe(
      "A video feed of the examinee's environment, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type DetectExamViolationsInput = z.infer<typeof DetectExamViolationsInputSchema>;

const DetectExamViolationsOutputSchema = z.object({
  violations: z
    .array(z.string())
    .describe('A list of potential exam violations detected.'),
});

export type DetectExamViolationsOutput = z.infer<typeof DetectExamViolationsOutputSchema>;

export async function detectExamViolations(
  input: DetectExamViolationsInput
): Promise<DetectExamViolationsOutput> {
  return detectExamViolationsFlow(input);
}

const detectExamViolationsPrompt = ai.definePrompt({
  name: 'detectExamViolationsPrompt',
  input: {schema: DetectExamViolationsInputSchema},
  output: {schema: DetectExamViolationsOutputSchema},
  prompt: `You are an AI proctoring system analyzing a video feed for exam violations.

  Analyze the provided video feed and identify any potential violations of exam rules, such as:

  - Unauthorized applications running on the computer
  - The examinee looking away from the screen for extended periods
  - The presence of other people in the room
  - Suspicious eye movements

  Provide a list of any violations detected. If no violations are detected, return an empty list.

  Video Feed: {{media url=videoDataUri}}
  `,
});

const detectExamViolationsFlow = ai.defineFlow(
  {
    name: 'detectExamViolationsFlow',
    inputSchema: DetectExamViolationsInputSchema,
    outputSchema: DetectExamViolationsOutputSchema,
  },
  async input => {
    const {output} = await detectExamViolationsPrompt(input);
    return output!;
  }
);
