import type { GenerateQuizOutput } from "@/ai/flows/generate-quiz-from-file";

export type QuizQuestion = GenerateQuizOutput["quiz"][0];

export type AppStep = "upload" | "quiz" | "results";
