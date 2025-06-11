'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { useToast } from '@/hooks/use-toast'
import { Clock, CheckCircle, XCircle, Trophy, RotateCcw, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: 'A' | 'B' | 'C' | 'D'
  question_order: number
}

interface QuizTakerProps {
  quizId: string
  onQuizComplete: () => void
}

export function QuizTaker({ quizId, onQuizComplete }: QuizTakerProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, 'A' | 'B' | 'C' | 'D'>>({})
  const [showResults, setShowResults] = useState(false)
  const [score, setScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [startTime] = useState(new Date())
  const [quizTitle, setQuizTitle] = useState('')
  const { user } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadQuiz()
  }, [quizId])

  const loadQuiz = async () => {
    try {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('title')
        .eq('id', quizId)
        .single()

      if (quizError) throw quizError
      setQuizTitle(quiz.title)

      const { data: questionsData, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('question_order')

      if (questionsError) throw questionsError
      setQuestions(questionsData || [])
    } catch (error) {
      console.error('Error loading quiz:', error)
      toast({
        title: 'Error',
        description: 'Failed to load quiz questions',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, answer: 'A' | 'B' | 'C' | 'D') => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmitQuiz = async () => {
    if (!user) return

    const unansweredQuestions = questions.filter(q => !answers[q.id])
    if (unansweredQuestions.length > 0) {
      toast({
        title: 'Incomplete Quiz',
        description: `Please answer all questions. ${unansweredQuestions.length} questions remaining.`,
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      let correctCount = 0
      const userAnswers = questions.map(question => {
        const userAnswer = answers[question.id]
        const isCorrect = userAnswer === question.correct_answer
        if (isCorrect) correctCount++

        return {
          question_id: question.id,
          selected_answer: userAnswer,
          is_correct: isCorrect,
        }
      })

      const endTime = new Date()
      const timeTaken = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quizId,
          score: correctCount,
          total_questions: questions.length,
          time_taken: `${timeTaken} seconds`,
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      const answersToInsert = userAnswers.map(answer => ({
        attempt_id: attempt.id,
        ...answer,
      }))

      const { error: answersError } = await supabase
        .from('user_answers')
        .insert(answersToInsert)

      if (answersError) throw answersError

      setScore(correctCount)
      setShowResults(true)

      toast({
        title: 'Quiz Completed!',
        description: `You scored ${correctCount}/${questions.length} (${Math.round((correctCount / questions.length) * 100)}%)`,
      })

    } catch (error) {
      console.error('Error submitting quiz:', error)
      toast({
        title: 'Submission Failed',
        description: 'Failed to submit quiz. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading quiz...</p>
        </CardContent>
      </Card>
    )
  }

  if (questions.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">No questions found for this quiz.</p>
        </CardContent>
      </Card>
    )
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100)
    const passed = percentage >= 60

    return (
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {passed ? (
              <Trophy className="h-16 w-16 text-yellow-500" />
            ) : (
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            )}
          </div>
          <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
          <CardDescription>Here are your results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-primary">
              {score}/{questions.length}
            </div>
            <div className="text-xl font-semibold">
              {percentage}% Score
            </div>
            <Badge variant={passed ? "default" : "secondary"} className="text-lg px-4 py-2">
              {passed ? "Passed!" : "Keep Learning!"}
            </Badge>
          </div>

          <Progress value={percentage} className="w-full h-3" />

          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-semibold">Correct</span>
              </div>
              <div className="text-2xl font-bold text-green-500">{score}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="font-semibold">Incorrect</span>
              </div>
              <div className="text-2xl font-bold text-red-500">{questions.length - score}</div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Question Review</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {questions.map((question, index) => {
                const userAnswer = answers[question.id]
                const isCorrect = userAnswer === question.correct_answer
                
                return (
                  <div key={question.id} className="flex items-center space-x-3 p-3 rounded-lg border">
                    <div className="flex-shrink-0">
                      {isCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        Q{index + 1}: {question.question_text}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your answer: {userAnswer} | Correct: {question.correct_answer}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={onQuizComplete} className="flex-1">
              <RotateCcw className="mr-2 h-4 w-4" />
              Take Another Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100
  const answeredCount = Object.keys(answers).length

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{quizTitle}</CardTitle>
            <CardDescription>
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <Clock className="h-3 w-3" />
            <span>{answeredCount}/{questions.length} answered</span>
          </Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold leading-relaxed">
            {currentQuestion.question_text}
          </h3>
          
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value as 'A' | 'B' | 'C' | 'D')}
            className="space-y-3"
          >
            {[
              { key: 'A', text: currentQuestion.option_a },
              { key: 'B', text: currentQuestion.option_b },
              { key: 'C', text: currentQuestion.option_c },
              { key: 'D', text: currentQuestion.option_d },
            ].map((option) => (
              <Label
                key={option.key}
                htmlFor={`option-${option.key}`}
                className={cn(
                  "flex items-start space-x-3 p-4 rounded-lg border cursor-pointer transition-all hover:border-primary",
                  answers[currentQuestion.id] === option.key && "border-primary bg-primary/5"
                )}
              >
                <RadioGroupItem
                  value={option.key}
                  id={`option-${option.key}`}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm mb-1">
                    {option.key}.
                  </div>
                  <div className="text-sm leading-relaxed">
                    {option.text}
                  </div>
                </div>
              </Label>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestionIndex(index)}
                className={cn(
                  "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                  index === currentQuestionIndex
                    ? "bg-primary text-primary-foreground"
                    : answers[questions[index].id]
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestionIndex === questions.length - 1 ? (
            <Button
              onClick={handleSubmitQuiz}
              disabled={submitting || answeredCount < questions.length}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Trophy className="mr-2 h-4 w-4" />
                  Submit Quiz
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1}
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}