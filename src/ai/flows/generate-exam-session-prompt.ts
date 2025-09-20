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
  prompt: `You are a helpful assistant preparing a student for their exam. Generate a friendly and clear welcome message.

  Welcome, {{studentName}}, to the "{{examName}}" exam!

  Please follow these steps to begin:

  1.  Verify your identity by showing your photo ID to the camera when the exam starts.
  2.  You will now be asked for camera and microphone permissions for proctoring.
  3.  Ensure no other applications are running that could be used for cheating.
  4.  Make sure you are alone in the room and that no one will enter during the exam.

  Once these steps are complete, you may begin the exam. Good luck!`,
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
