'use client'

import { Search, Bell, User } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')

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

        <button className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-white/8 transition-colors text-white cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-semibold text-white">
            JD
          </div>
          <span className="text-sm font-medium">John Doe</span>
        </button>
      </div>
    </header>
  )
}
