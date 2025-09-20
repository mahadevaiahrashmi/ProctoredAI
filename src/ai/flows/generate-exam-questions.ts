'use server';

/**
 * @fileOverview Generates a full exam with a specified number of questions on a given topic.
 *
 * - generateExamQuestions - A function that generates an exam.
 * - GenerateExamQuestionsInput - The input type for the generateExamQuestions function.
 * - Question - The type for a single question.
 * - GenerateExamQuestionsOutput - The return type for the generateExamQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateExamQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic of the exam (e.g., "Quantum Physics").'),
  numberOfQuestions: z
    .number()
    .min(1)
    .max(10)
    .describe('The number of questions to generate for the exam.'),
});
export type GenerateExamQuestionsInput = z.infer<
  typeof GenerateExamQuestionsInputSchema
>;

const QuestionSchema = z.object({
  id: z.number().describe('A unique ID for the question.'),
  type: z
    .enum(['multiple-choice', 'text'])
    .describe('The type of the question.'),
  text: z.string().describe('The question text.'),
  options: z
    .array(z.string())
    .optional()
    .describe(
      'An array of possible answers for multiple-choice questions.'
    ),
});
export type Question = z.infer<typeof QuestionSchema>;

const GenerateExamQuestionsOutputSchema = z.object({
  title: z.string().describe('A creative title for the exam.'),
  questions: z
    .array(QuestionSchema)
    .describe('The array of generated questions.'),
});
export type GenerateExamQuestionsOutput = z.infer<
  typeof GenerateExamQuestionsOutputSchema
>;

export async function generateExamQuestions(
  input: GenerateExamQuestionsInput
): Promise<GenerateExamQuestionsOutput> {
  return generateExamQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateExamQuestionsPrompt',
  input: {schema: GenerateExamQuestionsInputSchema},
  output: {schema: GenerateExamQuestionsOutputSchema},
  prompt: `You are an expert educator and exam creator. Generate a complete exam about the provided topic.

The exam should have a creative title and exactly {{numberOfQuestions}} questions.

Ensure the questions include a mix of "multiple-choice" and "text" (open-ended) types. For multiple-choice questions, provide exactly 4 options, one of which must be the correct answer. The IDs for the questions should be unique sequential numbers starting from 1.

Topic: {{topic}}
Number of Questions: {{numberOfQuestions}}`,
});

const generateExamQuestionsFlow = ai.defineFlow(
  {
    name: 'generateExamQuestionsFlow',
    inputSchema: GenerateExamQuestionsInputSchema,
    outputSchema: GenerateExamQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
