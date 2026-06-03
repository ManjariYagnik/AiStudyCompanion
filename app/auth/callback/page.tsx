'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

function CallbackInner() {
  const params = useSearchParams()
  const router = useRouter()
  const { applyToken } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = params.get('token')
    const err = params.get('error')
    if (err) {
      setError(err)
      return
    }
    if (!token) {
      setError('No sign-in token was returned.')
      return
    }
    applyToken(token)
      .then(() => router.replace('/dashboard'))
      .catch(() => setError('Could not complete sign-in.'))
  }, [params, applyToken, router])

  return (
    <div className="app-backdrop min-h-screen flex items-center justify-center px-6 text-center">
      {error ? (
        <div className="glass rounded-2xl p-8 max-w-sm animate-rise">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive mb-3" />
          <p className="text-white font-medium mb-1">Sign-in failed</p>
          <p className="text-white/55 text-sm mb-5">{error}</p>
          <button
            onClick={() => router.replace('/login')}
            className="h-10 px-6 rounded-xl bg-primary text-[#010828] font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
          >
            Back to login
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-white/70">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Signing you in…
        </div>
      )}
    </div>
  )
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  )
}
