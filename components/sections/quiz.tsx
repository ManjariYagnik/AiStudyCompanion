'use client'

import { useState } from 'react'
import { Brain, CheckCircle2, XCircle, RotateCcw, Zap } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function QuizSection() {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const quizzes = {
    easy: [
      {
        id: 1,
        question: 'What is the basic unit of life?',
        options: ['Atom', 'Molecule', 'Cell', 'Organism'],
        correct: 2,
        explanation: 'Cells are the smallest units of life capable of independent life. This is stated in cell theory.',
      },
      {
        id: 2,
        question: 'Which organelle is responsible for energy production?',
        options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
        correct: 1,
        explanation: 'Mitochondria are known as the powerhouse of the cell, producing ATP through cellular respiration.',
      },
      {
        id: 3,
        question: 'What surrounds and protects the nucleus?',
        options: ['Cell wall', 'Ribosome', 'Nuclear envelope', 'Cell membrane'],
        correct: 2,
        explanation: 'The nuclear envelope is a double membrane that surrounds the nucleus and controls what enters and exits.',
      },
      {
        id: 4,
        question: 'Which type of cell lacks a nucleus?',
        options: ['Eukaryotic', 'Prokaryotic', 'Animal', 'Plant'],
        correct: 1,
        explanation: 'Prokaryotic cells (bacteria) do not have a membrane-bound nucleus, unlike eukaryotic cells.',
      },
      {
        id: 5,
        question: 'What is the primary function of the cell membrane?',
        options: [
          'Produce energy',
          'Control what enters and exits the cell',
          'Store genetic material',
          'Synthesize proteins',
        ],
        correct: 1,
        explanation: 'The cell membrane is a selective barrier that controls the movement of substances in and out of the cell.',
      },
    ],
    medium: [
      {
        id: 1,
        question: 'What is the main difference between prokaryotic and eukaryotic cells?',
        options: [
          'Size - prokaryotes are larger',
          'Prokaryotes lack a nucleus and organelles',
          'Eukaryotes cannot reproduce',
          'Prokaryotes have chloroplasts',
        ],
        correct: 1,
        explanation:
          'The key difference is that eukaryotic cells have a nucleus and membrane-bound organelles, while prokaryotic cells do not.',
      },
      {
        id: 2,
        question: 'Which process do mitochondria use to produce ATP?',
        options: ['Photosynthesis', 'Fermentation', 'Cellular respiration', 'Glycolysis only'],
        correct: 2,
        explanation:
          'Mitochondria perform cellular respiration (glycolysis, citric acid cycle, and electron transport chain) to produce ATP.',
      },
      {
        id: 3,
        question: 'What is the relationship between the ER and Golgi apparatus?',
        options: [
          'They are the same structure',
          'ER synthesizes proteins; Golgi modifies and packages them',
          'Golgi synthesizes; ER packages',
          'They have no relationship',
        ],
        correct: 1,
        explanation:
          'The rough ER synthesizes proteins, which are then transported to the Golgi apparatus for modification, packaging, and distribution.',
      },
      {
        id: 4,
        question: 'How does transport across the cell membrane occur without energy?',
        options: ['Active transport', 'Passive transport', 'Endocytosis', 'Photosynthesis'],
        correct: 1,
        explanation:
          'Passive transport (diffusion and osmosis) allows substances to move across the membrane without energy input, moving from high to low concentration.',
      },
      {
        id: 5,
        question: 'What is the role of ribosomes in protein synthesis?',
        options: [
          'Design proteins',
          'Break down proteins',
          'Read mRNA and assemble amino acids into proteins',
          'Store proteins',
        ],
        correct: 2,
        explanation: 'Ribosomes read the mRNA code and translate it into sequences of amino acids, forming proteins.',
      },
    ],
    hard: [
      {
        id: 1,
        question: 'Explain the chemiosmotic theory in ATP production.',
        options: [
          'Protons move through ATP synthase, driving ATP synthesis',
          'Glucose directly converts to ATP',
          'Mitochondria produce ATP through photosynthesis',
          'Ribosomes synthesize ATP',
        ],
        correct: 0,
        explanation:
          'The chemiosmotic theory explains how a proton gradient across the inner mitochondrial membrane drives ATP synthase to produce ATP.',
      },
      {
        id: 2,
        question: 'How does the signal sequence direct proteins to the ER?',
        options: [
          'Random distribution in cytoplasm',
          'Signal recognition particles recognize the signal sequence',
          'Proteins have natural affinity for ER',
          'Golgi apparatus guides them',
        ],
        correct: 1,
        explanation:
          'Signal recognition particles (SRP) recognize the signal sequence on newly synthesized proteins and direct them to the ER for processing.',
      },
      {
        id: 3,
        question: 'What is the role of the cytoskeleton in cell structure?',
        options: [
          'Only for storage',
          'Provides structural support, enables movement, and facilitates intracellular transport',
          'Produces energy only',
          'Synthesizes lipids',
        ],
        correct: 1,
        explanation:
          'The cytoskeleton provides structural support, enables cell movement, facilitates intracellular transport, and maintains cell shape.',
      },
      {
        id: 4,
        question: 'How does endocytosis differ from exocytosis?',
        options: [
          'No difference',
          'Endocytosis brings materials in; exocytosis expels materials out',
          'Exocytosis uses energy; endocytosis does not',
          'Both move materials in the same direction',
        ],
        correct: 1,
        explanation:
          'Endocytosis is the process of bringing materials into the cell via vesicles, while exocytosis expels materials out of the cell.',
      },
      {
        id: 5,
        question: 'Describe the structure and function of the nuclear pore complex.',
        options: [
          'Simple channels with no selectivity',
          'Selective transporters controlling passage of molecules between nucleus and cytoplasm',
          'Only allows proteins to pass',
          'Randomly opens and closes',
        ],
        correct: 1,
        explanation:
          'Nuclear pore complexes are selective transporters that regulate the passage of molecules between the nucleus and cytoplasm, allowing some proteins and RNA to pass while blocking others.',
      },
    ],
  }

  const currentQuiz = quizzes[difficulty]
  const currentQ = currentQuiz[currentQuestion]
  const isAnswered = selectedAnswers[currentQuestion] !== undefined
  const isCorrect = selectedAnswers[currentQuestion] === currentQ.correct

  const handleSelectAnswer = (index: number) => {
    if (!showResults) {
      setSelectedAnswers({
        ...selectedAnswers,
        [currentQuestion]: index,
      })
    }
  }

  const handleSubmit = () => {
    setIsSubmitted(true)
  }

  const handleNext = () => {
    if (currentQuestion < currentQuiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
    }
  }

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleRestart = () => {
    setCurrentQuestion(0)
    setSelectedAnswers({})
    setIsSubmitted(false)
    setShowResults(false)
  }

  const calculateScore = () => {
    let correct = 0
    currentQuiz.forEach((q, index) => {
      if (selectedAnswers[index] === q.correct) {
        correct++
      }
    })
    return correct
  }

  const score = calculateScore()
  const percentage = Math.round((score / currentQuiz.length) * 100)

  if (showResults) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Quiz Results</h1>
          <p className="text-lg text-muted-foreground">Here&apos;s how you performed</p>
        </div>

        <Card className="p-12 rounded-2xl border-0 bg-gradient-to-br from-card to-card/50 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 mb-6">
              <span className="text-4xl font-bold text-primary">{percentage}%</span>
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              {percentage >= 80
                ? 'Excellent!'
                : percentage >= 60
                  ? 'Good Job!'
                  : 'Keep Practicing'}
            </h2>
            <p className="text-lg text-muted-foreground">
              You got {score} out of {currentQuiz.length} questions correct
            </p>
          </div>

          <Button
            onClick={handleRestart}
            className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-8 gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Try Another Quiz
          </Button>
        </Card>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-foreground">Review Answers</h3>
          {currentQuiz.map((q, index) => {
            const selected = selectedAnswers[index]
            const correct = q.correct === selected
            return (
              <Card
                key={index}
                className={`p-6 rounded-xl border-0 ${
                  correct ? 'bg-green-500/10' : 'bg-red-500/10'
                } hover:shadow-md transition-all`}
              >
                <div className="flex items-start gap-4">
                  {correct ? (
                    <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground mb-2">
                      {index + 1}. {q.question}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Your answer: <span className={correct ? 'text-green-400' : 'text-red-400'}>{q.options[selected!]}</span>
                    </p>
                    <p className="text-sm text-foreground bg-black/20 p-3 rounded-lg">{q.explanation}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Quiz</h1>
        <p className="text-lg text-muted-foreground">Test your knowledge with AI-generated quizzes</p>
      </div>

      {currentQuestion === 0 && !isSubmitted ? (
        <>
          {/* Difficulty Selector */}
          <Card className="p-8 rounded-2xl border-0 bg-gradient-to-br from-card to-card/50">
            <h2 className="text-2xl font-bold text-foreground mb-6">Choose Difficulty Level</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['easy', 'medium', 'hard'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setDifficulty(level)}
                  className={`p-6 rounded-xl border-2 transition-all duration-200 ${
                    difficulty === level
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/10 hover:border-primary/50'
                  }`}
                >
                  <h3 className="text-lg font-semibold text-foreground mb-2 capitalize">{level}</h3>
                  <p className="text-sm text-muted-foreground">
                    {level === 'easy' && 'Perfect for beginners'}
                    {level === 'medium' && 'Moderate challenge'}
                    {level === 'hard' && 'Advanced concepts'}
                  </p>
                </button>
              ))}
            </div>
            <Button onClick={handleSubmit} className="mt-6 bg-primary hover:bg-primary/90 rounded-xl h-11 px-8 w-full gap-2">
              <Zap className="w-4 h-4" />
              Start Quiz
            </Button>
          </Card>
        </>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Question {currentQuestion + 1} of {currentQuiz.length}
              </span>
              <span className="text-sm font-medium text-muted-foreground">{Math.round(((currentQuestion + 1) / currentQuiz.length) * 100)}%</span>
            </div>
            <div className="w-full bg-border rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / currentQuiz.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <Card className="p-8 rounded-2xl border-0 bg-gradient-to-br from-card to-card/50">
            <h2 className="text-2xl font-bold text-foreground mb-8">{currentQ.question}</h2>

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
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left font-medium ${
                      showCorrect
                        ? 'border-green-500 bg-green-500/10 text-green-400'
                        : showIncorrect
                          ? 'border-red-500 bg-red-500/10 text-red-400'
                          : isSelected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-secondary/10 hover:border-primary/50 text-foreground hover:text-primary'
                    } ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          showCorrect
                            ? 'border-green-400 bg-green-400'
                            : showIncorrect
                              ? 'border-red-400 bg-red-400'
                              : isSelected
                                ? 'border-primary bg-primary'
                                : 'border-border'
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
              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 mb-6">
                <p className="text-sm text-blue-300">
                  <span className="font-semibold">Explanation:</span> {currentQ.explanation}
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
                variant="outline"
                className="flex-1 rounded-xl h-11 border-border hover:bg-muted disabled:opacity-50"
              >
                Previous
              </Button>

              {!isSubmitted ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!isAnswered}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-11 disabled:opacity-50"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-primary hover:bg-primary/90 rounded-xl h-11"
                >
                  {currentQuestion === currentQuiz.length - 1 ? 'View Results' : 'Next Question'}
                </Button>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
