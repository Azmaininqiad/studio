'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import { AuthModal } from '@/components/auth/AuthModal'
import { FileUpload } from '@/components/quiz/FileUpload'
import { QuizGenerator } from '@/components/quiz/QuizGenerator'
import { QuizTaker } from '@/components/quiz/QuizTaker'
import { QuizHistory } from '@/components/quiz/QuizHistory'
import { Logo } from '@/components/icons/Logo'
import { Sparkles, Upload, Brain, Trophy, LogOut, User, History, Plus } from 'lucide-react'

type AppStep = 'upload' | 'generate' | 'take' | 'history'

interface FileData {
  fileId: string
  content: string
  filename: string
}

function QuizCraftApp() {
  const [step, setStep] = useState<AppStep>('upload')
  const [fileData, setFileData] = useState<FileData | null>(null)
  const [currentQuizId, setCurrentQuizId] = useState<string | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, loading, signOut } = useAuth()

  useEffect(() => {
    if (!loading && !user) {
      setShowAuthModal(true)
    }
  }, [user, loading])

  const handleFileProcessed = (data: FileData) => {
    setFileData(data)
    setStep('generate')
  }

  const handleQuizGenerated = (quizId: string) => {
    setCurrentQuizId(quizId)
    setStep('take')
  }

  const handleQuizComplete = () => {
    setStep('history')
  }

  const handleRetakeQuiz = (quizId: string) => {
    setCurrentQuizId(quizId)
    setStep('take')
  }

  const handleNewQuiz = () => {
    setFileData(null)
    setCurrentQuizId(null)
    setStep('upload')
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setStep('upload')
      setFileData(null)
      setCurrentQuizId(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading QuizCraft AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Logo />
              {user && (
                <nav className="hidden md:flex space-x-1">
                  <Button
                    variant={step === 'upload' || step === 'generate' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={handleNewQuiz}
                    className="flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>New Quiz</span>
                  </Button>
                  <Button
                    variant={step === 'history' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setStep('history')}
                    className="flex items-center space-x-2"
                  >
                    <History className="h-4 w-4" />
                    <span>History</span>
                  </Button>
                </nav>
              )}
            </div>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="text-muted-foreground">{user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowAuthModal(true)}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!user ? (
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                QuizCraft AI
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Transform any document into engaging multiple-choice quizzes with the power of AI. 
                Upload your files and let our advanced AI create personalized learning experiences.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card className="text-center p-6">
                <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Upload Files</h3>
                <p className="text-sm text-muted-foreground">
                  Support for PDF, DOCX, TXT, and image files
                </p>
              </Card>
              <Card className="text-center p-6">
                <Brain className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">AI Generation</h3>
                <p className="text-sm text-muted-foreground">
                  Powered by Gemini 2.0 Flash for intelligent question creation
                </p>
              </Card>
              <Card className="text-center p-6">
                <Trophy className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Monitor your learning with detailed analytics
                </p>
              </Card>
            </div>

            <Button 
              size="lg" 
              onClick={() => setShowAuthModal(true)}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold px-8 py-6 text-lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Get Started Free
            </Button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {step === 'history' ? (
              <QuizHistory onRetakeQuiz={handleRetakeQuiz} />
            ) : step === 'take' && currentQuizId ? (
              <QuizTaker quizId={currentQuizId} onQuizComplete={handleQuizComplete} />
            ) : (
              <div className="space-y-8">
                <div className="text-center space-y-4">
                  <h1 className="text-3xl md:text-4xl font-bold font-headline">
                    Create Your Quiz
                  </h1>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Upload your study material and let AI generate personalized quiz questions
                  </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <Card className="border-2 border-dashed border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Upload className="h-5 w-5" />
                          <span>Step 1: Upload File</span>
                        </CardTitle>
                        <CardDescription>
                          Upload your document to extract content for quiz generation
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FileUpload onFileProcessed={handleFileProcessed} />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className={`border-2 border-dashed ${fileData ? 'border-primary/20' : 'border-muted/20'}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Sparkles className="h-5 w-5" />
                          <span>Step 2: Generate Quiz</span>
                        </CardTitle>
                        <CardDescription>
                          Configure your quiz settings and generate questions
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {fileData ? (
                          <QuizGenerator 
                            fileData={fileData} 
                            onQuizGenerated={handleQuizGenerated} 
                          />
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Upload a file first to generate quiz questions</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  )
}

export default function Page() {
  return (
    <AuthProvider>
      <QuizCraftApp />
    </AuthProvider>
  )
}