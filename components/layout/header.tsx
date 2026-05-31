'use client'

import { Search, Bell, User } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="hidden lg:flex fixed top-0 left-64 right-0 h-16 bg-card border-b border-border items-center justify-between px-6 z-30">
      {/* Search */}
      <div className="flex-1 max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary transition-smooth"
          />
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4 ml-6">
        <button className="p-2 rounded-lg hover:bg-muted transition-smooth text-muted-foreground hover:text-foreground">
          <Bell className="w-5 h-5" />
        </button>
        
        <div className="w-px h-6 bg-border" />
        
        <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition-smooth text-foreground">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-sm font-medium">
            JD
          </div>
          <span className="text-sm">John Doe</span>
        </button>
      </div>
    </header>
  )
}
