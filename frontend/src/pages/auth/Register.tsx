import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  BookOpen,
  Sparkles,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { getRoleHome } from '@/auth/RoleGuard'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { AIBadge } from '@/components/ui/AIBadge'
import { useToast } from '@/components/ui/Toast'

export const Register: React.FC = () => {
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'student' | 'professor'>('student')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const newUser = await register({
        name,
        email,
        password,
        role,
      })
      showToast(`Welcome to AiCademy, ${newUser.name}!`, 'success')
      navigate(getRoleHome(newUser.role), { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 py-8 sm:p-6 md:p-12 selection:bg-accent-soft">
      <div className="w-full max-w-lg space-y-6 text-center">
        {/* Header */}
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
              Create your classroom account
            </h1>
            <p className="text-sm text-muted max-w-sm mx-auto leading-relaxed">
              Join the university digital classroom with AI tutors, rubric graders, and learning agents.
            </p>
          </div>
        </div>

        {/* Register Card */}
        <Card className="text-left p-6 sm:p-8 space-y-6">
          {/* Role Selector Tabs */}
          <div>
            <label className="block text-xs font-semibold text-fg mb-2">Select Your Role</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-surface-2 rounded-[8px] border border-line">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-[6px] text-xs font-medium transition-all cursor-pointer select-none ${
                  role === 'student'
                    ? 'bg-accent text-accent-contrast font-semibold shadow-sm'
                    : 'text-charcoal hover:text-fg'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('professor')}
                className={`flex items-center justify-center gap-2 py-2 px-4 rounded-[6px] text-xs font-medium transition-all cursor-pointer select-none ${
                  role === 'professor'
                    ? 'bg-accent text-accent-contrast font-semibold shadow-sm'
                    : 'text-charcoal hover:text-fg'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Professor</span>
              </button>
            </div>
          </div>

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
              <label className="block text-xs font-semibold text-fg mb-1.5" htmlFor="name-input">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'student' ? 'e.g. Alex Morgan' : 'e.g. Dr. Jordan Hayes'}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-[8px] border border-line bg-surface text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg mb-1.5" htmlFor="email-reg-input">
                University Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email-reg-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@university.edu"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-[8px] border border-line bg-surface text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg mb-1.5" htmlFor="password-reg-input">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password-reg-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-2.5 rounded-[8px] border border-line bg-surface text-sm text-fg placeholder:text-subtle focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create Classroom Account
            </Button>
          </form>

          {/* Footer Link to Login */}
          <div className="pt-4 border-t border-line text-center">
            <p className="text-xs text-muted">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold text-accent hover:underline transition-colors"
              >
                Sign In to existing account
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
