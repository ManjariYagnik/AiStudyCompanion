'use client'

import { useState } from 'react'
import { FileText, Zap, BookOpen } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SummarySection() {
  const [summary, setSummary] = useState({
    title: 'Biology Chapter 5: Cell Structure and Function',
    source: 'Biology Chapter 5.pdf',
    bulletPoints: [
      'Cells are the basic units of life and are the smallest units capable of independent life',
      'Two main types of cells: prokaryotic (bacteria) and eukaryotic (animals, plants, fungi)',
      'Cell membrane acts as a selective barrier, controlling what enters and exits the cell',
      'Nucleus contains genetic material (DNA) and controls cell activities',
      'Mitochondria produces ATP through cellular respiration for energy',
      'Endoplasmic reticulum synthesizes proteins and lipids',
      'Golgi apparatus packages and modifies proteins for transport',
      'Lysosomes break down waste materials and cellular debris',
    ],
    keyConcepts: [
      { term: 'Prokaryotic', definition: 'Cells without a membrane-bound nucleus; includes bacteria' },
      { term: 'Eukaryotic', definition: 'Cells with a membrane-bound nucleus; includes animal and plant cells' },
      { term: 'ATP', definition: 'Adenosine triphosphate; primary energy currency of the cell' },
      { term: 'Photosynthesis', definition: 'Process by which plants convert light energy into chemical energy' },
      { term: 'Osmosis', definition: 'Movement of water across a semipermeable membrane' },
    ],
    importantTakeaways: [
      'Cell theory states all living organisms are made of cells',
      'Surface-to-volume ratio affects cell size and function',
      'Specialized organelles in eukaryotic cells perform specific functions',
      'Transport mechanisms: diffusion, osmosis, active transport, and endocytosis',
      'Cell division occurs through mitosis (body cells) or meiosis (sex cells)',
    ],
  })

  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerateSummary = () => {
    setIsGenerating(true)
    setTimeout(() => setIsGenerating(false), 2000)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Summary</h1>
        <p className="text-lg text-muted-foreground">
          Get AI-powered summaries of your study materials
        </p>
      </div>

      {/* Action Section */}
      <div className="flex gap-4">
        <Button
          onClick={handleGenerateSummary}
          disabled={isGenerating}
          className="bg-primary hover:bg-primary/90 rounded-xl h-11 px-6 gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate Summary
            </>
          )}
        </Button>
      </div>

      {/* Summary Card */}
      {summary && (
        <div className="space-y-6">
          {/* Main Summary Card */}
          <Card className="p-8 rounded-2xl border-0 bg-gradient-to-br from-card to-card/50">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">{summary.source}</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground">{summary.title}</h2>
            </div>

            {/* Bullet Points */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Key Points</h3>
              <ul className="space-y-3">
                {summary.bulletPoints.map((point, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                    <span className="text-foreground/90 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Concepts Grid */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Key Concepts & Definitions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.keyConcepts.map((concept, index) => (
                <Card key={index} className="p-4 rounded-xl border-0 bg-secondary/10 hover:bg-secondary/20 transition-colors">
                  <h4 className="font-semibold text-foreground mb-2">{concept.term}</h4>
                  <p className="text-sm text-muted-foreground">{concept.definition}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Important Takeaways */}
          <Card className="p-6 rounded-2xl border-0 bg-gradient-to-br from-secondary/20 to-secondary/5">
            <h3 className="text-lg font-bold text-foreground mb-4">Important Takeaways</h3>
            <ul className="space-y-2">
              {summary.importantTakeaways.map((takeaway, index) => (
                <li key={index} className="flex gap-3 items-start">
                  <div className="w-1 h-1 rounded-full bg-accent mt-2.5 flex-shrink-0" />
                  <span className="text-foreground/90">{takeaway}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!summary && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-6">
            <BookOpen className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">No summary yet</h3>
          <p className="text-muted-foreground max-w-sm mb-6">Upload a document first to generate a summary</p>
          <Button className="bg-primary hover:bg-primary/90 rounded-xl">Upload Document</Button>
        </div>
      )}
    </div>
  )
}
