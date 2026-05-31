'use client'

import { useState } from 'react'
import { Send, MessageCircle, Lightbulb, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function QASection() {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([
    {
      id: '1',
      type: 'question',
      text: 'What is the difference between prokaryotic and eukaryotic cells?',
      timestamp: '2 minutes ago',
    },
    {
      id: '2',
      type: 'answer',
      text: 'Prokaryotic cells lack a membrane-bound nucleus and organelles, while eukaryotic cells contain a nucleus and specialized organelles. Prokaryotes are simpler and smaller (bacteria), while eukaryotes are more complex (animals, plants, fungi). Eukaryotic cells are typically larger and compartmentalize their functions through organelles.',
      source: { file: 'Biology Chapter 5.pdf', page: 12 },
      timestamp: '2 minutes ago',
    },
    {
      id: '3',
      type: 'question',
      text: 'How does mitochondria produce energy?',
      timestamp: 'Just now',
    },
    {
      id: '4',
      type: 'answer',
      text: 'Mitochondria produce energy through cellular respiration. Glucose is broken down in a series of chemical reactions, releasing energy that is used to create ATP (adenosine triphosphate), the cell\'s energy currency. This process occurs in three main stages: glycolysis, the citric acid cycle, and the electron transport chain. Each stage releases energy that is captured in ATP molecules.',
      source: { file: 'Biology Chapter 5.pdf', page: 15 },
      timestamp: 'Just now',
    },
  ])

  const suggestedQuestions = [
    'What is photosynthesis?',
    'How does cell division work?',
    'What are organelles?',
    'Explain the cell membrane',
    'What is ATP?',
  ]

  const handleSendQuestion = () => {
    if (question.trim()) {
      const newMessage = {
        id: String(messages.length + 1),
        type: 'question',
        text: question,
        timestamp: 'Just now',
      }
      setMessages([...messages, newMessage])
      setQuestion('')

      // Simulate AI response
      setTimeout(() => {
        const response = {
          id: String(messages.length + 2),
          type: 'answer',
          text: 'This is a sample AI response. In a real application, this would be dynamically generated based on your uploaded documents and the question asked.',
          source: { file: 'Biology Chapter 5.pdf', page: 8 },
          timestamp: 'Just now',
        }
        setMessages((prev) => [...prev, response])
      }, 1500)
    }
  }

  const handleSuggestedQuestion = (q: string) => {
    setQuestion(q)
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
          <Card className="flex-1 p-6 rounded-2xl border-0 bg-card/50 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Start a conversation</h3>
                <p className="text-muted-foreground text-sm">Ask a question about your study materials</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.type === 'question' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs lg:max-w-md ${
                      msg.type === 'question'
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-lg p-4'
                        : 'bg-secondary/20 text-foreground rounded-2xl rounded-tl-lg p-4'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    {msg.type === 'answer' && msg.source && (
                      <div className="mt-3 pt-3 border-t border-current border-opacity-20 text-xs opacity-75">
                        <p>Source: {msg.source.file}</p>
                        <p>Page {msg.source.page}</p>
                      </div>
                    )}
                    <p className="text-xs opacity-60 mt-2">{msg.timestamp}</p>
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Input */}
          <Card className="p-4 rounded-xl border-0 bg-card/50">
            <div className="flex gap-3">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendQuestion()}
                placeholder="Ask a question..."
                className="flex-1 bg-input border border-border rounded-lg px-4 py-2 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
              />
              <Button
                onClick={handleSendQuestion}
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
                  onClick={() => handleSuggestedQuestion(q)}
                  className="w-full text-left p-3 rounded-lg bg-secondary/10 hover:bg-secondary/20 transition-colors group text-sm text-foreground/80 hover:text-foreground"
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
