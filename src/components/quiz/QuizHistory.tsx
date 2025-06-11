'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/auth/AuthProvider'
import { formatDistanceToNow } from 'date-fns'
import { Trophy, Clock, FileText, Play, TrendingUp } from 'lucide-react'

interface QuizAttempt {
  id: string
  score: number
  total_questions: number
  percentage: number
  completed_at: string
  quiz: {
    id: string
    title: string
    file: {
      filename: string
    }
  }
}

interface QuizHistoryProps {
  onRetakeQuiz: (quizId: string) => void
}

export function QuizHistory({ onRetakeQuiz }: QuizHistoryProps) {
  const [attempts, setAttempts] = useState<QuizAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      loadQuizHistory()
    }
  }, [user])

  const loadQuizHistory = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          id,
          score,
          total_questions,
          percentage,
          completed_at,
          quiz:quizzes (
            id,
            title,
            file:files (
              filename
            )
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setAttempts(data || [])
    } catch (error) {
      console.error('Error loading quiz history:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading quiz history...</p>
        </CardContent>
      </Card>
    )
  }

  if (attempts.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Quiz History</span>
          </CardTitle>
          <CardDescription>Your recent quiz attempts will appear here</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-muted-foreground">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No quiz attempts yet</p>
            <p className="text-sm">Take your first quiz to see your progress!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const averageScore = attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length
  const bestScore = Math.max(...attempts.map(attempt => attempt.percentage))
  const totalQuizzes = attempts.length

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Quiz Statistics</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-primary">{totalQuizzes}</div>
              <div className="text-sm text-muted-foreground">Total Quizzes</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">{Math.round(averageScore)}%</div>
              <div className="text-sm text-muted-foreground">Average Score</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-yellow-600">{Math.round(bestScore)}%</div>
              <div className="text-sm text-muted-foreground">Best Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Attempts</CardTitle>
          <CardDescription>Your latest quiz results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {attempts.map((attempt) => (
            <div
              key={attempt.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium">{attempt.quiz.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  From: {attempt.quiz.file.filename}
                </p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(attempt.completed_at), { addSuffix: true })}</span>
                  </div>
                  <span>{attempt.score}/{attempt.total_questions} correct</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Badge
                  variant={attempt.percentage >= 80 ? "default" : attempt.percentage >= 60 ? "secondary" : "destructive"}
                  className="text-sm"
                >
                  {Math.round(attempt.percentage)}%
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRetakeQuiz(attempt.quiz.id)}
                  className="flex items-center space-x-1"
                >
                  <Play className="h-3 w-3" />
                  <span>Retake</span>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}