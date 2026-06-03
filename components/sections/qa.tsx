'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle, Lightbulb, ArrowRight, Loader2, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type Citation, askQuestionStream } from '@/lib/api'

type Stage = 'searching' | 'reading' | 'writing'

interface Message {
  id: string
  type: 'question' | 'answer'
  text: string
  citations?: Citation[]
  streaming?: boolean
  stage?: Stage
}

const STAGE_LABEL: Record<Stage, string> = {
  searching: 'Searching your notes…',
  reading: 'Reading sources…',
  writing: 'Writing answer…',
}

export function QASection() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions = [
    'Summarize the key concepts',
    'What are the main definitions?',
    'Explain this in simple terms',
    'What should I focus on for an exam?',
    'List the important formulas',
  ]

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, pending])

  const patch = (id: string, fn: (m: Message) => Message) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? fn(m) : m)))

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || pending) return
    setError(null)

    // Optimistic: show the user's message and an answer placeholder instantly.
    const userId = crypto.randomUUID()
    const answerId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      { id: userId, type: 'question', text: trimmed },
      { id: answerId, type: 'answer', text: '', streaming: true, stage: 'searching' },
    ])
    setQuestion('')
    setPending(true)

    await askQuestionStream(trimmed, undefined, {
      onSources: (citations) =>
        patch(answerId, (m) => ({ ...m, citations, stage: 'reading' })),
      onToken: (tok) =>
        patch(answerId, (m) => ({ ...m, text: m.text + tok, stage: 'writing' })),
      onDone: () => {
        patch(answerId, (m) => ({ ...m, streaming: false }))
        setPending(false)
      },
      onError: (detail) => {
        setError(detail)
        setMessages((prev) => prev.filter((m) => m.id !== answerId))
        setPending(false)
      },
    })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-5xl text-white mb-1">Ask Questions</h1>
        <p className="text-base text-white/55">
          Ask anything about your study materials and get instant answers with citations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col h-[600px]">
          {/* Messages */}
          <Card
            ref={scrollRef}
            className="flex-1 p-6 rounded-2xl glass overflow-y-auto mb-4 space-y-4 animate-rise"
          >
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl liquid-glass flex items-center justify-center mb-4">
                  <MessageCircle className="w-7 h-7 text-white/70" />
                </div>
                <h3 className="font-display text-2xl text-white mb-1">Start a conversation</h3>
                <p className="text-white/55 text-sm">
                  Ask a question about your uploaded study materials
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === 'question' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md animate-rise ${
                      msg.type === 'question'
                        ? 'bg-primary/15 border border-primary/30 text-white rounded-2xl rounded-tr-md p-4'
                        : 'glass text-white rounded-2xl rounded-tl-md p-4'
                    }`}
                  >
                    {/* Stage feedback + skeleton while no text has streamed yet */}
                    {msg.type === 'answer' && msg.streaming && !msg.text && (
                      <div>
                        <div className="flex items-center gap-2 text-xs text-white/60">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                          <span>{STAGE_LABEL[msg.stage ?? 'searching']}</span>
                        </div>
                        <div className="mt-3 space-y-2">
                          <div className="h-2.5 w-3/4 rounded-full bg-white/10 animate-pulse" />
                          <div className="h-2.5 w-full rounded-full bg-white/10 animate-pulse" />
                          <div className="h-2.5 w-2/3 rounded-full bg-white/10 animate-pulse" />
                        </div>
                      </div>
                    )}

                    {/* Progressive answer text (tokens appended as they arrive) */}
                    {msg.text && (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {msg.text}
                        {msg.streaming && (
                          <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-primary/80 animate-pulse" />
                        )}
                      </p>
                    )}

                    {/* Citations — streamed in early, before the answer text */}
                    {msg.type === 'answer' && msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                        <p className="text-xs font-medium text-white/50">Sources</p>
                        {msg.citations.map((c, i) => (
                          <div key={i} className="text-xs text-white/60 animate-rise">
                            <div className="flex items-center gap-1.5 font-medium text-white/80">
                              <FileText className="h-3 w-3 flex-shrink-0 text-primary" />
                              <span>
                                {c.file} · p.{c.page}
                              </span>
                            </div>
                            <p className="mt-0.5 italic text-white/55">“{c.snippet}”</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </Card>

          {error && <p className="mb-2 text-sm text-destructive">{error}</p>}

          {/* Input */}
          <Card className="p-2 rounded-full glass flex items-center gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(question)}
              placeholder="Ask a question..."
              aria-label="Ask a question"
              className="flex-1 bg-transparent rounded-full px-4 py-2 text-white placeholder:text-white/40 focus:outline-none"
            />
            <Button
              onClick={() => send(question)}
              disabled={pending || !question.trim()}
              size="icon"
              aria-label="Send question"
              className="bg-primary hover:bg-primary/90 text-[#010828] rounded-full size-10 shrink-0 disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </Button>
          </Card>
        </div>

        {/* Suggested Questions Sidebar */}
        <div>
          <Card className="p-6 rounded-2xl glass sticky top-20 animate-rise delay-1">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-white">Try asking...</h3>
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => send(q)}
                  disabled={pending}
                  className="w-full text-left p-3 rounded-xl border border-white/8 bg-white/5 hover:bg-white/8 hover:border-white/15 transition-colors group text-sm text-white/75 hover:text-white disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span>{q}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity text-primary" />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
