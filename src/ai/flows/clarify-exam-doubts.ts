'use server';

/**
 * @fileOverview An AI tutor that helps students clarify doubts after an exam.
 *
 * - clarifyExamDoubts - A function that allows a student to chat with an AI tutor about their exam.
 * - ClarifyExamDoubtsInput - The input type for the clarifyExamDoubts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {type GradeExamOutput} from './grade-exam';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

// We must re-define the Zod schema for GradeExamOutput here, because
// "use server" files cannot export Zod schemas, only types.
const GradeExamOutputSchemaForInput = z.object({
  overallScore: z.number().min(0).max(100),
  summaryReport: z.string(),
  gradedQuestions: z.array(
    z.object({
      questionId: z.number(),
      isCorrect: z.boolean(),
      feedback: z.string(),
    })
  ),
});


const ClarifyExamDoubtsInputSchema = z.object({
  examTitle: z.string().describe('The title of the exam.'),
  questions: z.array(
    z.object({
      id: z.number(),
      type: z.enum(['multiple-choice', 'text']),
      text: z.string(),
      options: z.array(z.string()).optional(),
      answer: z.string(),
    })
  ).describe('The list of questions from the exam.'),
  userAnswers: z
    .record(z.union([z.string(), z.array(z.string())]))
    .describe("The user's answers, indexed by question ID."),
  gradingReport: GradeExamOutputSchemaForInput.describe(
    'The generated grading report.'
  ),
  chatHistory: z
    .array(ChatMessageSchema)
    .describe('The history of the conversation so far.'),
  userQuery: z.string().describe('The latest query from the user.'),
});

export type ClarifyExamDoubtsInput = z.infer<
  typeof ClarifyExamDoubtsInputSchema
> & {
  // We manually intersect the imported TypeScript type here.
  gradingReport: GradeExamOutput;
};

const ClarifyExamDoubtsOutputSchema = z.object({
  response: z
    .string()
    .describe('The AI tutor\'s response to the user\'s query.'),
});

type ClarifyExamDoubtsOutput = z.infer<
  typeof ClarifyExamDoubtsOutputSchema
>;

export async function clarifyExamDoubts(
  input: ClarifyExamDoubtsInput
): Promise<ClarifyExamDoubtsOutput> {
  return clarifyExamDoubtsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'clarifyExamDoubtsPrompt',
  input: {schema: ClarifyExamDoubtsInputSchema},
  output: {schema: ClarifyExamDoubtsOutputSchema},
  prompt: `You are a friendly and encouraging AI teaching assistant. Your goal is to help a student understand their exam results and clarify any doubts they have.

You have been provided with the full context of the exam: the questions, the student's answers, the correct answers, and a detailed performance report.

**Your instructions are:**
1.  **Be Conversational and Supportive:** Use a positive and encouraging tone.
2.  **Use the Provided Context:** Base your answers ONLY on the exam data provided below. Do not invent information or answer questions about topics outside of this exam.
3.  **Explain Concepts Clearly:** When a student asks about a specific question, explain why their answer was right or wrong, and clarify the underlying concept using the provided correct answer and feedback.
4.  **Maintain Conversation History:** Use the provided chat history to understand the flow of the conversation and provide relevant follow-up responses.
5.  **Decline Irrelevant Questions:** If the student asks something unrelated to their exam performance or the subject matter, politely decline and steer the conversation back to the exam. For example: "My purpose is to help you with your exam results. I can't answer questions about other topics, but I'd be happy to go over another question with you."

**Exam Context:**

*   **Exam Title:** {{examTitle}}
*   **Performance Report:** {{gradingReport.summaryReport}}
*   **Overall Score:** {{gradingReport.overallScore}}%

*   **Questions, Answers, and Feedback:**
    {{#each questions}}
    - **Question {{id}}:** {{text}}
      - **Correct Answer:** {{answer}}
      - **Student's Answer:** {{lookup ../userAnswers id}}
      - **AI Feedback:** {{lookup ../gradingReport.gradedQuestions "questionId" id "feedback"}}
    {{/each}}

**Conversation History:**
{{#each chatHistory}}
- **{{role}}:** {{content}}
{{/each}}

**New User Question:**
- **user:** {{userQuery}}

Based on all of this context, provide a helpful and relevant response to the user's question.
`,
});

const clarifyExamDoubtsFlow = ai.defineFlow(
  {
    name: 'clarifyExamDoubtsFlow',
    inputSchema: ClarifyExamDoubtsInputSchema,
    outputSchema: ClarifyExamDoubtsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
