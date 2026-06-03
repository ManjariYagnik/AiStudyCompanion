'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  type AuthUser,
  getMe,
  getToken,
  setToken,
  login as apiLogin,
  register as apiRegister,
} from '@/lib/api'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  applyToken: (token: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  // On mount, validate any stored token by fetching the current user.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false)
      return
    }
    getMe()
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password)
    setToken(res.token)
    setUser(res.user)
  }

  const register = async (email: string, password: string, name?: string) => {
    const res = await apiRegister(email, password, name)
    setToken(res.token)
    setUser(res.user)
  }

  // Adopt a token obtained out-of-band (e.g. from the OAuth callback redirect).
  const applyToken = async (token: string) => {
    setToken(token)
    const me = await getMe()
    setUser(me)
  }

  const logout = () => {
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, applyToken, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
