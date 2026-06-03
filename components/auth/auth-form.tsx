'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Brain, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { user, loading, login, register } = useAuth()
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isRegister = mode === 'register'

  // Already signed in → skip the form.
  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [loading, user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      if (isRegister) await register(email, password, name || undefined)
      else await login(email, password)
      router.replace('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
      setSubmitting(false)
    }
  }

  return (
    <div className="app-backdrop relative min-h-screen flex items-center justify-center px-6">
      <div className="texture-overlay" aria-hidden="true" />

      <div className="w-full max-w-md animate-rise">
        {/* Brand */}
        <Link href="/" className="mb-8 flex items-center justify-center gap-2.5 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl liquid-glass">
            <Brain className="w-5 h-5 text-neon" />
          </span>
          <span className="font-display text-2xl tracking-wide">Study Companion</span>
        </Link>

        <div className="glass rounded-2xl p-8">
          <h1 className="font-display text-4xl text-white mb-1">
            {isRegister ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-white/55 mb-6">
            {isRegister
              ? 'Start summarizing, asking, and quizzing your notes.'
              : 'Sign in to your study workspace.'}
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white/70 mb-1.5">
                  Name <span className="text-white/40">(optional)</span>
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/25 transition-colors"
                  placeholder="Ada Lovelace"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/70 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/25 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/70 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                className="w-full h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-white/40 focus:outline-none focus:border-white/25 transition-colors"
                placeholder={isRegister ? 'At least 8 characters' : '••••••••'}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-11 rounded-xl bg-primary text-[#010828] font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 cursor-pointer inline-flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/55">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <Link
              href={isRegister ? '/login' : '/register'}
              className="text-neon hover:underline font-medium"
            >
              {isRegister ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
