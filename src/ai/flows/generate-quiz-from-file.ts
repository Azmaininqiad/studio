// src/ai/flows/generate-quiz-from-file.ts
'use server';
/**
 * @fileOverview Generates a multiple-choice quiz from file content.
 *
 * - generateQuiz - A function that generates a quiz from the provided file content and number of questions.
 * - GenerateQuizInput - The input type for the generateQuiz function.
 * - GenerateQuizOutput - The return type for the generateQuiz function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateQuizInputSchema = z.object({
  fileContent: z
    .string()
    .describe('The content of the file to generate the quiz from.'),
  questionCount: z
    .number()
    .min(1)
    .max(20)
    .describe('The number of questions to generate for the quiz.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const GenerateQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      options: z.array(z.string()).describe('The possible answers to the question.'),
      answer: z.string().describe('The correct answer to the question.'),
    })
  ).describe('The generated quiz questions and answers.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generateQuizPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `You are a quiz generator. Generate a multiple-choice quiz with the following specifications:

File Content: {{{fileContent}}}
Number of Questions: {{{questionCount}}}

The quiz should have the specified number of questions. Each question should have 4 possible answers, with one correct answer.  The answer field should contain the correct answer.

Ensure that the questions are relevant to the content provided and that the answers are clear and concise.

Output the quiz as a JSON object.`,
});

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const {output} = await generateQuizPrompt(input);
    return output!;
  }
);
