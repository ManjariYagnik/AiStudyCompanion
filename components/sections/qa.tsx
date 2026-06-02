'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle, Lightbulb, ArrowRight, Loader2, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type Citation, askQuestion } from '@/lib/api'

interface Message {
  id: string
  type: 'question' | 'answer'
  text: string
  citations?: Citation[]
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

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || pending) return
    setError(null)

    const userMsg: Message = { id: crypto.randomUUID(), type: 'question', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setQuestion('')
    setPending(true)

    try {
      const res = await askQuestion(trimmed)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          type: 'answer',
          text: res.answer,
          citations: res.citations,
        },
      ])
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Ask Questions</h1>
        <p className="text-lg text-muted-foreground">
          Ask anything about your study materials and get instant answers with citations
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Chat Area */}
        <div className="lg:col-span-3 flex flex-col h-[600px]">
          {/* Messages */}
          <Card
            ref={scrollRef}
            className="flex-1 p-6 rounded-2xl border-0 bg-card/50 overflow-y-auto mb-4 space-y-4"
          >
            {messages.length === 0 && !pending ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Start a conversation</h3>
                <p className="text-muted-foreground text-sm">
                  Ask a question about your uploaded study materials
                </p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'question' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md ${
                        msg.type === 'question'
                          ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-lg p-4'
                          : 'bg-secondary/20 text-foreground rounded-2xl rounded-tl-lg p-4'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      {msg.type === 'answer' && msg.citations && msg.citations.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-current/20 space-y-2">
                          <p className="text-xs font-medium opacity-75">Sources</p>
                          {msg.citations.map((c, i) => (
                            <div key={i} className="text-xs opacity-75">
                              <div className="flex items-center gap-1.5 font-medium">
                                <FileText className="h-3 w-3 flex-shrink-0" />
                                <span>
                                  {c.file} · p.{c.page}
                                </span>
                              </div>
                              <p className="mt-0.5 italic opacity-80">“{c.snippet}”</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {pending && (
                  <div className="flex justify-start">
                    <div className="bg-secondary/20 text-foreground rounded-2xl rounded-tl-lg p-4 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Searching your notes…</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </Card>

          {error && (
            <p className="mb-2 text-sm text-destructive">{error}</p>
          )}

          {/* Input */}
          <Card className="p-4 rounded-xl border-0 bg-card/50">
            <div className="flex gap-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send(question)}
                placeholder="Ask a question..."
                disabled={pending}
                className="flex-1 bg-input border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth disabled:opacity-60"
              />
              <Button
                onClick={() => send(question)}
                disabled={pending || !question.trim()}
                className="bg-primary hover:bg-primary/90 rounded-lg px-4 gap-2"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        </div>

        {/* Suggested Questions Sidebar */}
        <div>
          <Card className="p-6 rounded-2xl border-0 bg-card/50 sticky top-20">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-foreground">Try asking...</h3>
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => send(q)}
                  disabled={pending}
                  className="w-full text-left p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors group text-sm text-foreground/80 hover:text-foreground disabled:opacity-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span>{q}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
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
