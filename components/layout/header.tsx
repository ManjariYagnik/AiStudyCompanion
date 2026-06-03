'use client'

import { Search, Bell, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const { user, logout } = useAuth()
  const initials = (user?.name || user?.email || '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')

  return (
    <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 bg-[#080b14]/70 backdrop-blur-xl border-b border-white/8 items-center justify-between px-6 z-30">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 transition-colors group-focus-within:text-primary" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search documents"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/20 focus:bg-white/8 transition-colors"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-3 ml-6">
        <button
          aria-label="Notifications"
          className="p-2.5 rounded-full text-white/60 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
        >
          <Bell className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-white/10" />

        <div className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full text-white">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-semibold text-[#010828]">
            {initials}
          </div>
          <span className="text-sm font-medium max-w-[12rem] truncate">{user?.email}</span>
        </div>

        <button
          onClick={logout}
          aria-label="Sign out"
          title="Sign out"
          className="p-2.5 rounded-full text-white/60 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
