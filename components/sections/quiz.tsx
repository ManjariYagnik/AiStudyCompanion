'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, RotateCcw, Zap, Brain, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  type Difficulty,
  type QuizQuestion,
  type StudyDocument,
  listDocuments,
  generateQuiz,
} from '@/lib/api'

export function QuizSection() {
  // --- setup state ---
  const [documents, setDocuments] = useState<StudyDocument[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // --- active quiz state ---
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const indexed = documents.filter((d) => d.status === 'indexed')

  useEffect(() => {
    listDocuments()
      .then((docs) => {
        setDocuments(docs)
        const firstIndexed = docs.find((d) => d.status === 'indexed')
        if (firstIndexed) setSelectedId(firstIndexed.id)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingDocs(false))
  }, [])

  const handleGenerate = async () => {
    if (!selectedId) return
    setError(null)
    setGenerating(true)
    try {
      const quiz = await generateQuiz(selectedId, difficulty)
      if (!quiz.questions.length) throw new Error('No questions were generated.')
      setQuestions(quiz.questions)
      setCurrentQuestion(0)
      setSelectedAnswers({})
      setIsSubmitted(false)
      setShowResults(false)
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate quiz')
    } finally {
      setGenerating(false)
    }
  }

  const handleSelectAnswer = (index: number) => {
    if (!isSubmitted) {
      setSelectedAnswers({ ...selectedAnswers, [currentQuestion]: index })
    }
  }

  const handleSubmit = () => setIsSubmitted(true)

  const handleNext = () => {
    if (!questions) return
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setIsSubmitted(false)
    } else {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setIsSubmitted(true) // previously answered questions stay revealed
    }
  }

  const backToSetup = () => {
    setQuestions(null)
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setIsSubmitted(false)
    setShowResults(false)
  }

  // ---------- Setup screen ----------
  if (!questions) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-5xl text-white mb-1">Quiz</h1>
          <p className="text-base text-white/55">
            Test your knowledge with AI-generated quizzes
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loadingDocs ? (
          <div className="flex items-center text-white/55">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading documents…
          </div>
        ) : indexed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center animate-rise">
            <div className="w-20 h-20 rounded-2xl liquid-glass flex items-center justify-center mb-6">
              <Brain className="w-9 h-9 text-white/70" />
            </div>
            <h3 className="font-display text-2xl text-white mb-2">No documents ready</h3>
            <p className="text-white/55 max-w-sm">
              Upload and index a document first to generate a quiz.
            </p>
          </div>
        ) : (
          <Card className="p-8 rounded-2xl glass animate-rise">
            <h2 className="font-display text-3xl text-white mb-6">Set up your quiz</h2>

            <label className="block text-sm font-medium text-white/55 mb-2">Document</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mb-6 h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/25 transition-colors cursor-pointer"
            >
              {indexed.map((doc) => (
                <option key={doc.id} value={doc.id} className="bg-[#0d1320]">
                  {doc.name}
                </option>
              ))}
            </select>

            <label className="block text-sm font-medium text-white/55 mb-2">Difficulty</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`p-5 rounded-xl border text-left transition-colors duration-200 cursor-pointer ${
                    difficulty === level
                      ? 'border-primary/60 bg-primary/15'
                      : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20'
                  }`}
                >
                  <h3 className="text-base font-semibold text-white mb-1 capitalize">{level}</h3>
                  <p className="text-xs text-white/55 leading-relaxed">
                    {level === 'easy' && 'Recall of definitions and facts'}
                    {level === 'medium' && 'Connecting concepts'}
                    {level === 'hard' && 'Application and reasoning'}
                  </p>
                </button>
              ))}
            </div>

            <Button
              onClick={handleGenerate}
              disabled={generating || !selectedId}
              className="mt-6 bg-primary hover:bg-primary/90 text-[#010828] rounded-xl h-11 px-8 w-full font-medium cursor-pointer"
            >
              {generating ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Generating quiz…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Zap className="size-4" />
                  Generate Quiz
                </span>
              )}
            </Button>
          </Card>
        )}
      </div>
    )
  }

  // ---------- Results screen ----------
  if (showResults) {
    const score = questions.reduce(
      (acc, q, i) => acc + (selectedAnswers[i] === q.correct ? 1 : 0),
      0,
    )
    const percentage = Math.round((score / questions.length) * 100)

    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-5xl text-white mb-1">Quiz Results</h1>
          <p className="text-base text-white/55">Here&apos;s how you performed</p>
        </div>

        <Card className="p-12 rounded-2xl glass animate-rise text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 mb-6">
              <span className="text-4xl font-bold text-primary">{percentage}%</span>
            </div>
            <h2 className="font-display text-4xl text-white mb-2">
              {percentage >= 80 ? 'Excellent!' : percentage >= 60 ? 'Good Job!' : 'Keep Practicing'}
            </h2>
            <p className="text-base text-white/55">
              You got {score} out of {questions.length} questions correct
            </p>
          </div>

          <Button
            onClick={backToSetup}
            className="bg-primary hover:bg-primary/90 text-[#010828] rounded-xl h-11 px-8 cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <RotateCcw className="size-4" />
              Try Another Quiz
            </span>
          </Button>
        </Card>

        <div className="space-y-4">
          <h3 className="font-display text-2xl text-white">Review Answers</h3>
          {questions.map((q, index) => {
            const selected = selectedAnswers[index]
            const correct = q.correct === selected
            return (
              <Card
                key={index}
                className={`p-6 rounded-xl glass animate-rise ${correct ? 'ring-1 ring-green-500/30' : 'ring-1 ring-red-500/30'}`}
              >
                <div className="flex items-start gap-4">
                  {correct ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-white mb-2">
                      {index + 1}. {q.question}
                    </p>
                    <p className="text-sm text-white/55 mb-1">
                      Your answer:{' '}
                      <span className={correct ? 'text-green-400' : 'text-red-400'}>
                        {selected !== undefined ? q.options[selected] : 'Not answered'}
                      </span>
                    </p>
                    {!correct && (
                      <p className="text-sm text-white/55 mb-3">
                        Correct answer: <span className="text-green-400">{q.options[q.correct]}</span>
                      </p>
                    )}
                    <p className="text-sm text-white/85 bg-black/30 border border-white/5 p-3 rounded-lg leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // ---------- Question screen ----------
  const currentQ = questions[currentQuestion]
  const isAnswered = selectedAnswers[currentQuestion] !== undefined

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-5xl text-white mb-1">Quiz</h1>
        <p className="text-base text-white/55">Test your knowledge with AI-generated quizzes</p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-white/55">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium text-white/55">
            {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-white/8 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-8 rounded-2xl glass animate-rise">
        <h2 className="text-2xl font-semibold text-white mb-8 leading-snug">{currentQ.question}</h2>

        <div className="space-y-3 mb-8">
          {currentQ.options.map((option, index) => {
            const isSelected = selectedAnswers[currentQuestion] === index
            const isCorrectOption = currentQ.correct === index
            const showCorrect = isSubmitted && isCorrectOption
            const showIncorrect = isSubmitted && isSelected && !isCorrectOption

            return (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                disabled={isSubmitted}
                className={`w-full p-4 rounded-xl border text-left font-medium transition-colors duration-200 ${
                  showCorrect
                    ? 'border-green-500/60 bg-green-500/12 text-green-300'
                    : showIncorrect
                      ? 'border-red-500/60 bg-red-500/12 text-red-300'
                      : isSelected
                        ? 'border-primary/60 bg-primary/15 text-white'
                        : 'border-white/10 bg-white/5 hover:bg-white/8 hover:border-white/20 text-white/80'
                } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors flex-shrink-0 ${
                      showCorrect
                        ? 'border-green-400 bg-green-400'
                        : showIncorrect
                          ? 'border-red-400 bg-red-400'
                          : isSelected
                            ? 'border-primary bg-primary'
                            : 'border-white/25'
                    }`}
                  >
                    {showCorrect && <CheckCircle2 className="w-3 h-3 text-black" />}
                    {showIncorrect && <XCircle className="w-3 h-3 text-black" />}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            )
          })}
        </div>

        {isSubmitted && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/25 mb-6 animate-rise">
            <p className="text-sm text-white/85 leading-relaxed">
              <span className="font-semibold text-primary">Explanation:</span> {currentQ.explanation}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            variant="outline"
            className="flex-1 rounded-xl h-11 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white disabled:opacity-40 cursor-pointer"
          >
            Previous
          </Button>

          {!isSubmitted ? (
            <Button
              onClick={handleSubmit}
              disabled={!isAnswered}
              className="flex-1 bg-primary hover:bg-primary/90 text-[#010828] rounded-xl h-11 disabled:opacity-40 cursor-pointer"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 bg-primary hover:bg-primary/90 text-[#010828] rounded-xl h-11 cursor-pointer"
            >
              {currentQuestion === questions.length - 1 ? 'View Results' : 'Next Question'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
