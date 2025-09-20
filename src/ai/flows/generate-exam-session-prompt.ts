'use server';

/**
 * @fileOverview Generates a session start prompt for guiding students through the initial exam setup.
 *
 * - generateExamSessionPrompt - A function that generates the exam session start prompt.
 * - GenerateExamSessionPromptInput - The input type for the generateExamSessionPrompt function.
 * - GenerateExamSessionPromptOutput - The return type for the generateExamSessionPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExamSessionPromptInputSchema = z.object({
  studentName: z.string().describe('The name of the student taking the exam.'),
  examName: z.string().describe('The name of the exam.'),
});
export type GenerateExamSessionPromptInput = z.infer<
  typeof GenerateExamSessionPromptInputSchema
>;

const GenerateExamSessionPromptOutputSchema = z.object({
  sessionStartPrompt: z
    .string()
    .describe('The generated prompt to guide the student through the setup.'),
});
export type GenerateExamSessionPromptOutput = z.infer<
  typeof GenerateExamSessionPromptOutputSchema
>;

export async function generateExamSessionPrompt(
  input: GenerateExamSessionPromptInput
): Promise<GenerateExamSessionPromptOutput> {
  return generateExamSessionPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExamSessionPrompt',
  input: {schema: GenerateExamSessionPromptInputSchema},
  output: {schema: GenerateExamSessionPromptOutputSchema},
  prompt: `Welcome, {{studentName}}, to the {{examName}} exam!\n\nPlease follow these steps to begin:\n\n1.  Verify your identity by showing your photo ID to the camera.\n2.  Grant camera permissions to allow for proctoring.\n3.  Grant microphone permissions to allow for proctoring.\n4.  Ensure no other applications are running that could be used to cheat (close them).  We will be monitoring this.\n5.  Make sure there are no other people in the room, and that there will not be any other people entering the room during the exam.\n\nOnce these steps are complete, you may begin the exam. Good luck!`,
});

const generateExamSessionPromptFlow = ai.defineFlow(
  {
    name: 'generateExamSessionPromptFlow',
    inputSchema: GenerateExamSessionPromptInputSchema,
    outputSchema: GenerateExamSessionPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
