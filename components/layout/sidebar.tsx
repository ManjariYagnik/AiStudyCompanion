'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  BarChart3, 
  BookOpen, 
  MessageSquare, 
  FileText, 
  Brain, 
  Settings,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FileText,
  },
  {
    name: 'Summary',
    href: '/summary',
    icon: BookOpen,
  },
  {
    name: 'Q&A',
    href: '/qa',
    icon: MessageSquare,
  },
  {
    name: 'Quiz',
    href: '/quiz',
    icon: Brain,
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 lg:hidden p-2.5 rounded-xl liquid-glass text-white cursor-pointer transition-colors hover:bg-white/10"
        aria-label="Toggle navigation"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 z-40 pt-6 px-3 flex flex-col transition-transform duration-300',
          'bg-[#080b14]/80 backdrop-blur-xl border-r border-white/8',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo */}
        <div className="mb-8 px-3">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 text-white transition-opacity hover:opacity-90"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl liquid-glass">
              <Brain className="w-5 h-5 text-primary" />
            </span>
            <span className="font-display text-2xl leading-none">Study Companion</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200',
                  isActive
                    ? 'liquid-glass text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/5',
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
                )}
                <Icon className={cn('w-5 h-5 transition-colors', isActive ? 'text-primary' : 'text-white/50 group-hover:text-white/80')} />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="pt-4 pb-6">
          <div className="liquid-glass rounded-xl px-4 py-3">
            <p className="text-xs text-white/50 mb-1">Pro tip</p>
            <p className="text-xs text-white/75 leading-relaxed">
              Upload PDF, DOCX, or TXT files to start summarizing and asking questions.
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
