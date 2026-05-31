'use client'

import { useState } from 'react'
import { Moon, Sun, Bell, Lock, Trash2, HelpCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function SettingsSection() {
  const [isDarkMode, setIsDarkMode] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(false)

  const handleToggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-lg text-muted-foreground">Manage your preferences and account</p>
      </div>

      {/* Appearance Settings */}
      <Card className="p-8 rounded-2xl border-0 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
            {isDarkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          </div>
          <h2 className="text-xl font-bold text-foreground">Appearance</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/10">
            <div>
              <p className="font-medium text-foreground">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Easy on the eyes during night study sessions</p>
            </div>
            <button
              onClick={handleToggleDarkMode}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="p-8 rounded-2xl border-0 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Notifications</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/10">
            <div>
              <p className="font-medium text-foreground">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Get notified about quiz results and summaries</p>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifications ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  notifications ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/10">
            <div>
              <p className="font-medium text-foreground">Email Updates</p>
              <p className="text-sm text-muted-foreground">Receive weekly study tips and recommendations</p>
            </div>
            <button
              onClick={() => setEmailUpdates(!emailUpdates)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                emailUpdates ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  emailUpdates ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      {/* Privacy & Security */}
      <Card className="p-8 rounded-2xl border-0 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Privacy & Security</h2>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start rounded-lg h-11 border-border hover:bg-muted">
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full justify-start rounded-lg h-11 border-border hover:bg-muted">
            <Lock className="w-4 h-4 mr-2" />
            Two-Factor Authentication
          </Button>
          <Button variant="outline" className="w-full justify-start rounded-lg h-11 border-border hover:bg-muted">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear Data & Cache
          </Button>
        </div>
      </Card>

      {/* Account Management */}
      <Card className="p-8 rounded-2xl border-0 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
            <Trash2 className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Account Management</h2>
        </div>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start rounded-lg h-11 border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete All Documents
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start rounded-lg h-11 border-destructive/30 hover:bg-destructive/10 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        </div>
      </Card>

      {/* Help & Support */}
      <Card className="p-8 rounded-2xl border-0 bg-gradient-to-br from-card to-card/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Help & Support</h2>
        </div>

        <div className="space-y-3 text-sm">
          <div className="p-4 rounded-lg bg-secondary/10">
            <p className="font-medium text-foreground mb-1">Version</p>
            <p className="text-muted-foreground">Study Companion v1.0.0</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/10">
            <p className="font-medium text-foreground mb-1">About</p>
            <p className="text-muted-foreground">Study Companion helps you learn smarter with AI-powered tools for document summarization, Q&A, and quiz generation.</p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <Button variant="outline" className="w-full justify-start rounded-lg h-11 border-border hover:bg-muted">
            <HelpCircle className="w-4 h-4 mr-2" />
            Documentation
          </Button>
          <Button variant="outline" className="w-full justify-start rounded-lg h-11 border-border hover:bg-muted">
            <HelpCircle className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </Card>
    </div>
  )
}
