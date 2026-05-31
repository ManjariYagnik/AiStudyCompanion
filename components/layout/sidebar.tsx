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
    href: '/',
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
        className="fixed top-4 left-4 z-40 lg:hidden p-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 transition-smooth"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 pt-6 px-4 flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="mb-8 px-2">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-sidebar-foreground">
            <Brain className="w-6 h-6 text-sidebar-primary" />
            <span>Study Companion</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent/20 text-opacity-70'
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border pt-4 pb-6">
          <div className="px-4 py-3 rounded-lg bg-gradient-to-br from-sidebar-primary/10 to-sidebar-accent/10">
            <p className="text-xs text-sidebar-foreground/60 mb-2">Pro Tip</p>
            <p className="text-xs text-sidebar-foreground/80">Upload PDF, DOCX, or TXT files to get started</p>
          </div>
        </div>
      </aside>
    </>
  )
}
