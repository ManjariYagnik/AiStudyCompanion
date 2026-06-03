'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Layers,
  BookOpen,
  CheckCircle2,
  MessageSquare,
  Brain,
  ArrowRight,
  Upload,
  Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { type StudyDocument, listDocuments, relativeTime } from '@/lib/api'

export function Dashboard() {
  const [docs, setDocs] = useState<StudyDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listDocuments()
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [])

  // Real, per-user stats derived from the document list.
  const indexed = docs.filter((d) => d.status === 'indexed')
  const totalChunks = docs.reduce((n, d) => n + (d.chunks || 0), 0)
  const totalPages = docs.reduce((n, d) => n + (d.pages || 0), 0)
  const stats = [
    { label: 'Documents', value: docs.length, icon: FileText, color: 'from-blue-500/20 to-blue-600/20', iconColor: 'text-blue-400' },
    { label: 'Indexed', value: indexed.length, icon: CheckCircle2, color: 'from-green-500/20 to-green-600/20', iconColor: 'text-green-400' },
    { label: 'Chunks', value: totalChunks.toLocaleString(), icon: Layers, color: 'from-purple-500/20 to-purple-600/20', iconColor: 'text-purple-400' },
    { label: 'Pages', value: totalPages.toLocaleString(), icon: BookOpen, color: 'from-amber-500/20 to-amber-600/20', iconColor: 'text-amber-400' },
  ]

  const recent = docs.slice(0, 4)

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      indexed: 'bg-green-500/20 text-green-400 border-green-500/30',
      processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${map[status] ?? map.failed}`}
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${status === 'processing' ? 'animate-pulse' : ''} ${
            status === 'indexed' ? 'bg-green-400' : status === 'processing' ? 'bg-yellow-400' : 'bg-red-400'
          }`}
        />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="space-y-4 animate-rise">
        <div className="relative">
          <span className="font-condiment text-neon text-2xl absolute -top-5 left-1 -rotate-6 select-none">
            study smarter
          </span>
          <h1 className="font-display text-5xl lg:text-6xl text-white mb-1 pt-3">Study Companion</h1>
          <p className="text-base text-white/55 max-w-2xl">
            Upload notes, summarize faster, and study smarter with AI-powered learning tools
          </p>
        </div>
      </div>

      {/* Stats Grid — real, per-user numbers */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className={`p-6 rounded-2xl glass animate-rise delay-${index + 1}`}>
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-white/55 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-semibold text-white">
                  {loading ? <span className="text-white/30">—</span> : stat.value}
                </p>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-8 rounded-2xl glass lg:col-span-1 animate-rise delay-2">
          <h2 className="text-lg font-semibold text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <Link href="/documents">
              <Button className="w-full justify-between group bg-primary hover:bg-primary/90 text-[#010828] rounded-xl h-12 cursor-pointer">
                <span className="flex items-center gap-3">
                  <Upload className="w-5 h-5" />
                  Upload Document
                </span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            {[
              { href: '/qa', icon: MessageSquare, label: 'Ask a Question' },
              { href: '/summary', icon: FileText, label: 'Get Summary' },
              { href: '/quiz', icon: Brain, label: 'Take Quiz' },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <Button
                  variant="outline"
                  className="w-full justify-between group rounded-xl h-12 border-white/12 bg-white/5 text-white hover:bg-white/10 hover:text-white cursor-pointer"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-5 h-5" />
                    {label}
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/60 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ))}
          </div>
        </Card>

        {/* Recent Documents — real */}
        <Card className="p-8 rounded-2xl glass lg:col-span-2 animate-rise delay-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Documents</h2>
            <Link href="/documents" className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
              View All →
            </Link>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-white/55">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-14 h-14 rounded-2xl liquid-glass flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-white/70" />
              </div>
              <p className="text-white/70 font-medium mb-1">No documents yet</p>
              <p className="text-white/45 text-sm mb-4">Upload your first study material to get started.</p>
              <Link href="/documents">
                <Button className="bg-primary hover:bg-primary/90 text-[#010828] rounded-xl cursor-pointer">
                  Upload Document
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((doc) => (
                <Link
                  key={doc.id}
                  href="/documents"
                  className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/5 hover:bg-white/8 hover:border-white/15 transition-colors duration-200 group cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white group-hover:text-primary transition-colors truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-white/50">
                        {doc.pages ? `${doc.pages} page${doc.pages === 1 ? '' : 's'} • ` : ''}
                        {relativeTime(doc.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">{getStatusBadge(doc.status)}</div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
