import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Role } from '@/types/domain'
import type { LoginRequest, RegisterRequest } from '@/types/api'
import * as authService from '@/services/auth'
import { tokenStorage } from '@/services/tokenStorage'
import { UNAUTHORIZED_EVENT } from '@/services/http'
import { DEMO_PASSWORD } from '@/mocks/db/seed'

export interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  role: Role | null
  login: (req: LoginRequest) => Promise<User>
  register: (req: RegisterRequest) => Promise<User>
  logout: () => void
  switchDemoAccount: (email: string) => Promise<User>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => tokenStorage.get())
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const logout = useCallback(() => {
    tokenStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  // Listen for 401 unauthorized events emitted from the HTTP interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [logout])

  // Hydrate user on mount if token exists
  useEffect(() => {
    let mounted = true
    const checkMe = async () => {
      const stored = tokenStorage.get()
      if (!stored) {
        if (mounted) setIsLoading(false)
        return
      }
      try {
        const res = await authService.getMe()
        if (mounted) {
          setUser(res.user)
          setToken(stored)
        }
      } catch {
        if (mounted) {
          logout()
        }
      } finally {
        if (mounted) setIsLoading(false)
      }
    }
    checkMe()
    return () => {
      mounted = false
    }
  }, [logout])

  const login = async (req: LoginRequest): Promise<User> => {
    setIsLoading(true)
    try {
      const res = await authService.login(req)
      tokenStorage.set(res.token)
      setToken(res.token)
      setUser(res.user)
      return res.user
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (req: RegisterRequest): Promise<User> => {
    setIsLoading(true)
    try {
      const res = await authService.register(req)
      tokenStorage.set(res.token)
      setToken(res.token)
      setUser(res.user)
      return res.user
    } finally {
      setIsLoading(false)
    }
  }

  const switchDemoAccount = async (email: string): Promise<User> => {
    return login({ email, password: DEMO_PASSWORD })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        role: user?.role ?? null,
        login,
        register,
        logout,
        switchDemoAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
