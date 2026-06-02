'use client'

import Link from 'next/link'
import { FileText, MessageSquare, CheckCircle2, Brain, ArrowRight, Upload } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function Dashboard() {
  // Mock stats data
  const stats = [
    {
      label: 'Documents',
      value: '12',
      icon: FileText,
      color: 'from-blue-500/20 to-blue-600/20',
      iconColor: 'text-blue-500',
    },
    {
      label: 'Chunks',
      value: '2,847',
      icon: CheckCircle2,
      color: 'from-purple-500/20 to-purple-600/20',
      iconColor: 'text-purple-500',
    },
    {
      label: 'Questions',
      value: '156',
      icon: MessageSquare,
      color: 'from-cyan-500/20 to-cyan-600/20',
      iconColor: 'text-cyan-500',
    },
    {
      label: 'Quizzes',
      value: '8',
      icon: Brain,
      color: 'from-amber-500/20 to-amber-600/20',
      iconColor: 'text-amber-500',
    },
  ]

  // Mock recent documents
  const recentDocuments = [
    {
      id: '1',
      name: 'Biology Chapter 5',
      pages: 24,
      status: 'indexed',
      uploadDate: '2 days ago',
    },
    {
      id: '2',
      name: 'History Notes',
      pages: 18,
      status: 'indexed',
      uploadDate: '5 days ago',
    },
    {
      id: '3',
      name: 'Physics Problem Set',
      pages: 12,
      status: 'processing',
      uploadDate: 'Just now',
    },
    {
      id: '4',
      name: 'Chemistry Equations',
      pages: 8,
      status: 'indexed',
      uploadDate: '1 week ago',
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'indexed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            Indexed
          </span>
        )
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
            Processing
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Failed
          </span>
        )
      default:
        return null
    }
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card
              key={index}
              className={`p-6 rounded-2xl glass glass-hover animate-rise delay-${index + 1}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <div>
                <p className="text-white/55 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-3xl font-semibold text-white">{stat.value}</p>
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

        {/* Recent Documents */}
        <Card className="p-8 rounded-2xl glass lg:col-span-2 animate-rise delay-3">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Recent Documents</h2>
            <Link href="/documents" className="text-primary hover:text-primary/80 text-sm font-medium transition-colors">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 rounded-xl border border-white/8 bg-white/5 hover:bg-white/8 hover:border-white/15 transition-colors duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl liquid-glass flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white group-hover:text-primary transition-colors">{doc.name}</p>
                    <p className="text-xs text-white/50">{doc.pages} pages • {doc.uploadDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">{getStatusBadge(doc.status)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
