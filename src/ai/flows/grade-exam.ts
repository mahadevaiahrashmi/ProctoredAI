'use server';

/**
 * @fileOverview Grades an exam and generates a performance report.
 *
 * - gradeExam - A function that grades an exam and provides a report.
 * - GradeExamInput - The input type for the gradeExam function.
 * - GradeExamOutput - The return type for the gradeExam function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { Question } from './generate-exam-questions';


const GradeExamInputSchema = z.object({
  questions: z.array(
    z.object({
      id: z.number(),
      type: z.enum(['multiple-choice', 'text']),
      text: z.string(),
      options: z.array(z.string()).optional(),
      answer: z.string(),
    })
  ).describe("The list of questions from the exam."),
  userAnswers: z.record(z.union([z.string(), z.array(z.string())])).describe("The user's answers, indexed by question ID."),
});

export type GradeExamInput = z.infer<typeof GradeExamInputSchema>;


const GradedQuestionSchema = z.object({
    questionId: z.number(),
    isCorrect: z.boolean(),
    feedback: z.string().describe("Specific feedback for the user's answer to this question."),
});

const GradeExamOutputSchema = z.object({
  overallScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'The overall percentage score for the exam, from 0 to 100.'
    ),
  summaryReport: z
    .string()
    .describe(
      'A comprehensive summary of the student\'s performance, including strengths, weaknesses, and areas for improvement.'
    ),
  gradedQuestions: z.array(GradedQuestionSchema).describe("A question-by-question breakdown of the user's performance.")
});

export type GradeExamOutput = z.infer<typeof GradeExamOutputSchema>;

export async function gradeExam(
  input: GradeExamInput
): Promise<GradeExamOutput> {
  return gradeExamFlow(input);
}

const prompt = ai.definePrompt({
  name: 'gradeExamPrompt',
  input: {schema: GradeExamInputSchema},
  output: {schema: GradeExamOutputSchema},
  prompt: `You are an AI-powered teaching assistant responsible for grading an exam.

Analyze the user's answers against the provided questions and correct answers.

For multiple-choice questions, the answer is either right or wrong.
For text-based (open-ended) questions, evaluate the user's answer based on the provided model answer. The user's answer doesn't need to be a verbatim match, but it should capture the key concepts accurately.

Based on this evaluation, perform the following tasks:
1.  Calculate an overall percentage score for the exam.
2.  Provide a detailed, summary report of the student's performance. This report should be encouraging and constructive, highlighting their strengths and identifying areas where they can improve.
3.  Provide a question-by-question breakdown, indicating if the answer was correct and providing brief, specific feedback for each answer.

Here is the exam data:

**Questions & Correct Answers:**
{{#each questions}}
- **ID: {{id}}**
  - **Question:** {{text}}
  - **Type:** {{type}}
  {{#if options}}
  - **Options:** {{#each options}}- {{this}} {{/each}}
  {{/if}}
  - **Correct Answer:** {{answer}}
{{/each}}

**Student's Answers:**
{{#each userAnswers}}
- **Question ID: {{@key}}**
  - **Answer:** {{this}}
{{/each}}
`,
});

const gradeExamFlow = ai.defineFlow(
  {
    name: 'gradeExamFlow',
    inputSchema: GradeExamInputSchema,
    outputSchema: GradeExamOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
