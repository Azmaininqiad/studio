'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Sparkles, FileText } from 'lucide-react'

interface QuizGeneratorProps {
  fileData: {
    fileId: string
    content: string
    filename: string
  }
  onQuizGenerated: (quizId: string) => void
}

interface GeneratedQuestion {
  question: string
  options: {
    A: string
    B: string
    C: string
    D: string
  }
  correct_answer: 'A' | 'B' | 'C' | 'D'
}

export function QuizGenerator({ fileData, onQuizGenerated }: QuizGeneratorProps) {
  const [questionCount, setQuestionCount] = useState(5)
  const [quizTitle, setQuizTitle] = useState('')
  const [quizDescription, setQuizDescription] = useState('')
  const [generating, setGenerating] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()

  const handleGenerateQuiz = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to generate quizzes',
        variant: 'destructive',
      })
      return
    }

    if (!fileData.content.trim()) {
      toast({
        title: 'No Content',
        description: 'The uploaded file appears to be empty or could not be processed',
        variant: 'destructive',
      })
      return
    }

    setGenerating(true)

    try {
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: fileData.content,
          questionCount,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const quizData = await response.json()
      
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error('Invalid quiz data received')
      }

      const title = quizTitle.trim() || `Quiz from ${fileData.filename}`
      
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .insert({
          user_id: user.id,
          file_id: fileData.fileId,
          title,
          description: quizDescription.trim() || null,
          question_count: quizData.questions.length,
        })
        .select()
        .single()

      if (quizError) throw quizError

      const questionsToInsert = quizData.questions.map((q: GeneratedQuestion, index: number) => ({
        quiz_id: quiz.id,
        question_text: q.question,
        option_a: q.options.A,
        option_b: q.options.B,
        option_c: q.options.C,
        option_d: q.options.D,
        correct_answer: q.correct_answer,
        question_order: index + 1,
      }))

      const { error: questionsError } = await supabase
        .from('quiz_questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      toast({
        title: 'Quiz Generated Successfully!',
        description: `Created "${title}" with ${quizData.questions.length} questions`,
      })

      onQuizGenerated(quiz.id)

    } catch (error) {
      console.error('Quiz generation error:', error)
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate quiz',
        variant: 'destructive',
      })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>Generate Quiz</span>
        </CardTitle>
        <CardDescription>
          Configure your quiz settings and generate MCQ questions from your uploaded content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-sm">{fileData.filename}</p>
            <p className="text-xs text-muted-foreground">
              {fileData.content.length} characters extracted
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="quiz-title">Quiz Title (Optional)</Label>
          <Input
            id="quiz-title"
            placeholder={`Quiz from ${fileData.filename}`}
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            disabled={generating}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quiz-description">Description (Optional)</Label>
          <Textarea
            id="quiz-description"
            placeholder="Add a description for your quiz..."
            value={quizDescription}
            onChange={(e) => setQuizDescription(e.target.value)}
            disabled={generating}
            rows={3}
          />
        </div>

        <div className="space-y-3">
          <Label htmlFor="question-count">
            Number of Questions: <span className="font-bold text-primary">{questionCount}</span>
          </Label>
          <Slider
            id="question-count"
            min={3}
            max={20}
            step={1}
            value={[questionCount]}
            onValueChange={(value) => setQuestionCount(value[0])}
            disabled={generating}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>3 questions</span>
            <span>20 questions</span>
          </div>
        </div>

        <Button
          onClick={handleGenerateQuiz}
          disabled={generating}
          className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold py-6 text-lg"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate {questionCount} Questions
            </>
          )}
        </Button>

        {generating && (
          <div className="text-center space-y-2">
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
            <p className="text-sm text-muted-foreground">
              AI is analyzing your content and creating questions...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}