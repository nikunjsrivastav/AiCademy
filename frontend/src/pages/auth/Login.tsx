import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Sparkles,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getRoleHome } from '@/auth/RoleGuard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AIBadge } from '@/components/ui/AIBadge'
import { useToast } from '@/components/ui/Toast'

export const Login: React.FC = () => {
  const { login, switchDemoAccount, isAuthenticated, user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const showDemoLogins = import.meta.env.VITE_ENABLE_DEMO_SWITCHER === 'true'

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname
      navigate(from || getRoleHome(user.role), { replace: true })
    }
  }, [isAuthenticated, user, navigate, location])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const loggedInUser = await login({ email, password })
      showToast(`Welcome back, ${loggedInUser.name}!`, 'success')
      navigate(getRoleHome(loggedInUser.role), { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid email or password'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickLogin = async (demoEmail: string) => {
    setError(null)
    setIsSubmitting(true)
    try {
      const switchedUser = await switchDemoAccount(demoEmail)
      showToast(`Logged in as ${switchedUser.name} (${switchedUser.role})`, 'success')
      navigate(getRoleHome(switchedUser.role), { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to switch account'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-8 sm:p-6 md:p-12 selection:bg-accent-soft">
      <div className="w-full max-w-lg space-y-6 text-center">
        {/* Brand Anchor */}
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-accent-contrast shadow-[0_4px_12px_var(--accent)/30]">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                AiCademy Classroom
              </span>
              <AIBadge size="sm" label="Agentic" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-fg font-sans">
              Sign in to your classroom
            </h1>
            <p className="text-sm text-muted max-w-sm mx-auto leading-relaxed">
              Course-grounded AI tutors, rubric grading, and autonomous agents with human verification.
            </p>
          </div>
        </div>

        {/* Quizlet Study Card per DESIGN.md (8px radius, #ffffff surface, 1px #d9dde8 border) */}
        <Card className="text-left p-6 sm:p-8 space-y-6">
          {/* Quick Demo Persona Bar (Only shown when VITE_ENABLE_DEMO_SWITCHER=true) */}
          {showDemoLogins && (
            <div className="p-4 rounded-[8px] bg-surface-2 border border-line space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-fg flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-accent" /> Developer Demo Switcher
                </span>
                <span className="text-[11px] font-medium text-accent bg-surface px-2 py-0.5 rounded-[4px] border border-accent/20">
                  Quick Login
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('student1@aicademy.dev')}
                  className="py-2 px-2.5 rounded-[8px] text-xs font-medium text-center bg-surface hover:bg-surface-3 border border-line text-fg transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
                >
                  <span className="block text-[10px] text-muted">Learner</span>
                  <span className="font-semibold text-accent truncate block">Student (Aarav)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('prof.rao@aicademy.dev')}
                  className="py-2 px-2.5 rounded-[8px] text-xs font-medium text-center bg-surface hover:bg-surface-3 border border-line text-fg transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
                >
                  <span className="block text-[10px] text-muted">Faculty</span>
                  <span className="font-semibold text-accent truncate block">Prof. Rao</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('admin@aicademy.dev')}
                  className="py-2 px-2.5 rounded-[8px] text-xs font-medium text-center bg-surface hover:bg-surface-3 border border-line text-fg transition-all hover:scale-[1.02] cursor-pointer shadow-sm"
                >
                  <span className="block text-[10px] text-muted">Console</span>
                  <span className="font-semibold text-accent truncate block">Admin (Ada)</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-[8px] bg-[#d83a31]/10 border border-[#d83a31]/20 text-[#d83a31] text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#d83a31] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-fg mb-1.5" htmlFor="email-input">
                University Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-[8px] border border-line bg-surface text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-fg" htmlFor="password-input">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-[8px] border border-line bg-surface text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            {/* Primary Filled Pill Button per DESIGN.md */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to AiCademy
            </Button>
          </form>

          {/* Footer Link to Register */}
          <div className="pt-4 border-t border-line text-center">
            <p className="text-xs text-muted">
              New to AiCademy?{' '}
              <Link
                to="/register"
                className="font-semibold text-accent hover:underline transition-colors"
              >
                Create student or faculty account
              </Link>
            </p>
          </div>
        </Card>

        {/* Security & System Info */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1ca330]" /> Role-based Bearer JWT
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-accent" /> Human-in-the-Loop Safe
          </span>
        </div>
      </div>
    </div>
  )
}
