"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { generateQuiz, type GenerateQuizOutput } from "@/ai/flows/generate-quiz-from-file";
import type { QuizQuestion, AppStep } from "@/types/quiz";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Logo } from "@/components/icons/Logo";
import { Loader2, UploadCloud, FileText, FileImage, AlertCircle, RotateCcw, CheckCircle, XCircle, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function QuizCraftPage() {
  const [appStep, setAppStep] = useState<AppStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState<Record<number, boolean | null>>({}); // true for correct, false for incorrect, null for no answer
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
        setError(`File is too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`);
        setFile(null);
        setFileName("");
        setFileContent(null);
        return;
      }

      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        if (selectedFile.type === "text/plain") {
          setFileContent(content);
        } else {
          // For non-txt files, we set content to a placeholder or empty,
          // as direct client-side parsing for PDF/DOCX/Image OCR is complex.
          // The AI flow expects a string.
          setFileContent(""); // Or some placeholder indication
          toast({
            title: "File Type Note",
            description: `For non-plain text files like ${selectedFile.type}, content extraction is limited. For best results, use .txt files or paste content directly if this feature were available. The AI will attempt to process based on filename or available text.`,
            variant: "default",
          });
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setFileContent(null);
      };
      reader.readAsText(selectedFile); // Attempt to read all as text
    }
  };

  const handleGenerateQuiz = useCallback(async () => {
    if (!fileContent && !file) { // Allow generation if file is present, even if content extraction is imperfect
      setError("Please upload a file first.");
      return;
    }
    if (fileContent === "" && file) {
       toast({
          title: "Attempting Quiz Generation",
          description: `Content from '${fileName}' might not be fully processed. AI will use available information.`,
          variant: "default",
        });
    }


    setIsLoading(true);
    setError(null);
    try {
      // Use file?.name as part of content if fileContent is empty, giving AI some context
      const contentForAI = fileContent || `Content from file: ${file?.name || "untitled document"}`;
      const result: GenerateQuizOutput = await generateQuiz({
        fileContent: contentForAI,
        questionCount: numQuestions,
      });
      if (result.quiz && result.quiz.length > 0) {
        setQuiz(result.quiz);
        setAppStep("quiz");
        setCurrentQuestionIndex(0);
        setUserAnswers({});
        setFeedback({});
      } else {
        setError("Failed to generate quiz. The AI might not have found enough content or an issue occurred.");
        setQuiz(null);
      }
    } catch (err) {
      console.error("Quiz generation error:", err);
      setError("An error occurred while generating the quiz. Please try again.");
      setQuiz(null);
    } finally {
      setIsLoading(false);
    }
  }, [fileContent, numQuestions, file, fileName, toast]);

  const handleAnswerSelection = (questionIndex: number, answer: string) => {
    setUserAnswers((prev) => ({ ...prev, [questionIndex]: answer }));
    // Provide immediate feedback
    if (quiz) {
      const correctAnswer = quiz[questionIndex].answer;
      setFeedback(prev => ({ ...prev, [questionIndex]: answer === correctAnswer }));
    }
  };
  
  const currentQuestion = useMemo(() => quiz?.[currentQuestionIndex], [quiz, currentQuestionIndex]);

  const score = useMemo(() => {
    if (!quiz) return 0;
    return quiz.reduce((acc, question, index) => {
      return userAnswers[index] === question.answer ? acc + 1 : acc;
    }, 0);
  }, [quiz, userAnswers]);

  const handleNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setAppStep("results");
    }
  };

  const handleRestart = () => {
    setAppStep("upload");
    setFile(null);
    setFileContent(null);
    setFileName("");
    setQuiz(null);
    setUserAnswers({});
    setFeedback({});
    setCurrentQuestionIndex(0);
    setError(null);
    setNumQuestions(5);
  };
  
  // Effect to clear file if numQuestions changes, to ensure re-upload for new context
  useEffect(() => {
    if(appStep === 'upload') {
      setFile(null);
      setFileContent(null);
      setFileName("");
    }
  }, [numQuestions, appStep]);


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 sm:p-8 font-body">
      <header className="mb-8 text-center">
        <div className="inline-block mb-4">
          <Logo />
        </div>
        <p className="text-muted-foreground text-lg">
          Upload your documents, and let AI craft your multiple-choice quizzes!
        </p>
      </header>

      <main className="w-full max-w-2xl">
        {error && (
          <Alert variant="destructive" className="mb-6 animate-in fade-in-0">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {appStep === "upload" && (
          <Card className="w-full shadow-2xl animate-in fade-in-0 zoom-in-95">
            <CardHeader>
              <CardTitle className="font-headline text-3xl text-center">Create Your Quiz</CardTitle>
              <CardDescription className="text-center">
                Upload a file and set the number of questions.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-lg">Upload File</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".txt,.pdf,.docx,.png,.jpg,.jpeg"
                    onChange={handleFileChange}
                    className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  {file ? <FileText className="h-6 w-6 text-primary" /> : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
                </div>
                {fileName && <p className="text-sm text-muted-foreground">Selected: {fileName}</p>}
                 <p className="text-xs text-muted-foreground">Max file size: {MAX_FILE_SIZE_MB}MB. Supported: .txt, .pdf, .docx, images. Note: .txt provides best results.</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="num-questions" className="text-lg">Number of Questions: <span className="font-bold text-primary">{numQuestions}</span></Label>
                <Slider
                  id="num-questions"
                  min={1}
                  max={20}
                  step={1}
                  value={[numQuestions]}
                  onValueChange={(value) => setNumQuestions(value[0])}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleGenerateQuiz}
                disabled={(!file && !fileContent) || isLoading}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Lightbulb className="mr-2 h-5 w-5" />
                )}
                Generate Quiz
              </Button>
            </CardFooter>
          </Card>
        )}

        {appStep === "quiz" && currentQuestion && (
          <Card className="w-full shadow-2xl animate-in fade-in-0 zoom-in-95">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Question {currentQuestionIndex + 1} of {quiz?.length}</CardTitle>
              <Progress value={((currentQuestionIndex +1) / (quiz?.length || 1)) * 100} className="w-full mt-2 h-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xl font-semibold">{currentQuestion.question}</p>
              <RadioGroup
                value={userAnswers[currentQuestionIndex]}
                onValueChange={(value) => handleAnswerSelection(currentQuestionIndex, value)}
                className="space-y-2"
              >
                {currentQuestion.options.map((option, idx) => (
                  <Label
                    key={idx}
                    htmlFor={`option-${idx}`}
                    className={`flex items-center space-x-3 p-3 rounded-md border transition-all cursor-pointer hover:border-primary
                      ${userAnswers[currentQuestionIndex] === option ? (feedback[currentQuestionIndex] === true ? 'border-green-500 bg-green-500/10' : feedback[currentQuestionIndex] === false ? 'border-red-500 bg-red-500/10' : 'border-primary') : 'border-input'}
                    `}
                  >
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <span>{option}</span>
                    {userAnswers[currentQuestionIndex] === option && feedback[currentQuestionIndex] === true && <CheckCircle className="h-5 w-5 text-green-500 ml-auto" />}
                    {userAnswers[currentQuestionIndex] === option && feedback[currentQuestionIndex] === false && <XCircle className="h-5 w-5 text-red-500 ml-auto" />}
                  </Label>
                ))}
              </RadioGroup>
               {userAnswers[currentQuestionIndex] !== undefined && feedback[currentQuestionIndex] === false && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription>
                      Correct answer: {currentQuestion.answer}
                    </AlertDescription>
                  </Alert>
                )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleNextQuestion} className="w-full bg-primary hover:bg-primary/90 text-lg py-6" disabled={userAnswers[currentQuestionIndex] === undefined}>
                {currentQuestionIndex === (quiz?.length || 0) - 1 ? "Finish Quiz" : "Next Question"}
              </Button>
            </CardFooter>
          </Card>
        )}

        {appStep === "results" && (
          <Card className="w-full text-center shadow-2xl animate-in fade-in-0 zoom-in-95">
            <CardHeader>
              <CardTitle className="font-headline text-3xl">Quiz Completed!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-2xl">
                Your Score: <span className="font-bold text-primary">{score}</span> / {quiz?.length}
              </p>
              <Progress value={(score / (quiz?.length || 1)) * 100} className="w-full h-4" />
              <p className="text-lg">
                {score > (quiz?.length || 0) / 2 ? "Great job! \uD83C\uDF89" : "Keep practicing! \uD83D\uDCDA"}
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={handleRestart} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6">
                <RotateCcw className="mr-2 h-5 w-5" />
                Create Another Quiz
              </Button>
            </CardFooter>
          </Card>
        )}
      </main>
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} QuizCraft AI. Powered by Genkit and Next.js.</p>
      </footer>
    </div>
  );
}
