'use client'

import { useEffect, useState } from 'react'
import { FileText, Zap, BookOpen, AlertCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  type DocumentSummary,
  type StudyDocument,
  listDocuments,
  generateSummaryStream,
} from '@/lib/api'

const STAGE_LABEL: Record<string, string> = {
  reading: 'Reading document…',
  summarizing: 'Summarizing sections',
  structuring: 'Structuring summary…',
}

export function SummarySection() {
  const [documents, setDocuments] = useState<StudyDocument[]>([])
  const [selectedId, setSelectedId] = useState<string>('')
  const [summary, setSummary] = useState<DocumentSummary | null>(null)
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [stage, setStage] = useState<{ stage: string; detail?: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    setSummary(null)
    setStage({ stage: 'reading' })
    await generateSummaryStream(selectedId, {
      onStage: (stage, detail) => setStage({ stage, detail }),
      onResult: (s) => {
        setSummary(s)
        setGenerating(false)
        setStage(null)
      },
      onError: (detail) => {
        setError(detail)
        setGenerating(false)
        setStage(null)
      },
    })
  }

  const stageText = stage
    ? STAGE_LABEL[stage.stage] + (stage.detail ? ` ${stage.detail}` : '')
    : ''

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-5xl text-white mb-1">Summary</h1>
        <p className="text-base text-white/55">
          Get AI-powered summaries of your study materials
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Action Section */}
      {loadingDocs ? (
        <div className="flex items-center text-white/55">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading documents…
        </div>
      ) : indexed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center animate-rise">
          <div className="w-20 h-20 rounded-2xl liquid-glass flex items-center justify-center mb-6">
            <BookOpen className="w-9 h-9 text-white/70" />
          </div>
          <h3 className="font-display text-2xl text-white mb-2">No documents ready</h3>
          <p className="text-white/55 max-w-sm">
            Upload and index a document first to generate a summary.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white focus:outline-none focus:border-white/25 transition-colors cursor-pointer"
          >
            {indexed.map((doc) => (
              <option key={doc.id} value={doc.id} className="bg-[#0d1320]">
                {doc.name}
              </option>
            ))}
          </select>
          <Button
            onClick={handleGenerate}
            disabled={generating || !selectedId}
            className="bg-primary hover:bg-primary/90 text-[#010828] rounded-xl h-11 px-6 font-medium cursor-pointer"
          >
            {generating ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {stageText || 'Generating…'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Zap className="size-4" />
                Generate Summary
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Generating skeleton with stage feedback */}
      {generating && !summary && (
        <Card className="p-8 rounded-2xl glass animate-rise">
          <div className="flex items-center gap-2 text-sm text-white/60 mb-6">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>{stageText || 'Working…'}</span>
          </div>
          <div className="h-6 w-2/3 rounded-lg bg-white/10 animate-pulse mb-6" />
          <div className="space-y-2.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-3 rounded-full bg-white/10 animate-pulse"
                style={{ width: `${90 - i * 8}%` }}
              />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-20 rounded-xl bg-white/5 border border-white/8 animate-pulse" />
            ))}
          </div>
        </Card>
      )}

      {/* Summary Card */}
      {summary && (
        <div className="space-y-6">
          {/* Main Summary Card */}
          <Card className="p-8 rounded-2xl glass animate-rise">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg liquid-glass flex items-center justify-center">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm text-white/55 font-medium">{summary.source}</span>
              </div>
              <h2 className="font-display text-3xl text-white">{summary.title}</h2>
            </div>

            {/* Bullet Points */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Key Points</h3>
              <ul className="space-y-3">
                {summary.bulletPoints.map((point, index) => (
                  <li key={index} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                    <span className="text-white/80 leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          {/* Concepts Grid */}
          {summary.keyConcepts.length > 0 && (
            <div className="animate-rise delay-1">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Key Concepts &amp; Definitions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {summary.keyConcepts.map((concept, index) => (
                  <Card key={index} className="p-4 rounded-xl glass glass-hover">
                    <h4 className="font-semibold text-white mb-1">{concept.term}</h4>
                    <p className="text-sm text-white/60 leading-relaxed">{concept.definition}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Important Takeaways */}
          {summary.importantTakeaways.length > 0 && (
            <Card className="p-6 rounded-2xl glass animate-rise delay-2">
              <h3 className="text-lg font-semibold text-white mb-4">Important Takeaways</h3>
              <ul className="space-y-2.5">
                {summary.importantTakeaways.map((takeaway, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary mt-2 flex-shrink-0" />
                    <span className="text-white/80 leading-relaxed">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
