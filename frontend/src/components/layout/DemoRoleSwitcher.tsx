import React, { useState } from 'react'
import clsx from 'clsx'
import { Users, RotateCcw, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { resetDemoData } from '@/services/demo'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface DemoAccount {
  name: string
  email: string
  role: 'student' | 'professor' | 'administrator'
  title: string
  avatarHue: number
}

const PRIMARY_DEMO_ACCOUNTS: DemoAccount[] = [
  {
    name: 'Aarav Sharma',
    email: 'student1@aicademy.dev',
    role: 'student',
    title: 'Primary Demo Student (CS)',
    avatarHue: 25,
  },
  {
    name: 'Dr. Priya Rao',
    email: 'prof.rao@aicademy.dev',
    role: 'professor',
    title: 'Professor & Course Owner',
    avatarHue: 280,
  },
  {
    name: 'Ada Okafor',
    email: 'admin@aicademy.dev',
    role: 'administrator',
    title: 'Platform Administrator',
    avatarHue: 200,
  },
]

const ALL_DEMO_ACCOUNTS: DemoAccount[] = [
  ...PRIMARY_DEMO_ACCOUNTS,
  {
    name: 'Dr. Wei Chen',
    email: 'prof.chen@aicademy.dev',
    role: 'professor',
    title: 'Professor (Algorithms & ML)',
    avatarHue: 160,
  },
  {
    name: 'Maya Lopez',
    email: 'student2@aicademy.dev',
    role: 'student',
    title: 'Student 2 (CS)',
    avatarHue: 330,
  },
  {
    name: 'Kenji Tanaka',
    email: 'student3@aicademy.dev',
    role: 'student',
    title: 'Student 3 (CS)',
    avatarHue: 210,
  },
  {
    name: 'Zara Ahmed',
    email: 'student4@aicademy.dev',
    role: 'student',
    title: 'Student 4 (Data Science)',
    avatarHue: 140,
  },
  {
    name: "Liam O'Brien",
    email: 'student5@aicademy.dev',
    role: 'student',
    title: 'Student 5 (CS)',
    avatarHue: 45,
  },
  {
    name: 'Sofia Rossi',
    email: 'student6@aicademy.dev',
    role: 'student',
    title: 'Student 6 (Data Science)',
    avatarHue: 300,
  },
  {
    name: 'Noah Kim',
    email: 'student7@aicademy.dev',
    role: 'student',
    title: 'Student 7 (CS)',
    avatarHue: 190,
  },
  {
    name: 'Fatima Bello',
    email: 'student8@aicademy.dev',
    role: 'student',
    title: 'Student 8 (Mathematics)',
    avatarHue: 95,
  },
]

export const DemoRoleSwitcher: React.FC = () => {
  const { user, switchDemoAccount } = useAuth()
  const { showToast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [switchingEmail, setSwitchingEmail] = useState<string | null>(null)

  const handleSwitch = async (email: string) => {
    setSwitchingEmail(email)
    try {
      const switchedUser = await switchDemoAccount(email)
      showToast(`Switched active user to ${switchedUser.name} (${switchedUser.role})`, 'success')
      setIsOpen(false)
    } catch {
      showToast('Failed to switch demo account', 'error')
    } finally {
      setSwitchingEmail(null)
    }
  }

  const handleResetData = async () => {
    if (!window.confirm('Reset all demo courses, submissions, doubts, and agent runs to initial seed state?')) {
      return
    }
    setIsResetting(true)
    try {
      await resetDemoData()
      showToast('Demo database reset to factory seed', 'success')
      await switchDemoAccount('student1@aicademy.dev')
      window.location.reload()
    } catch {
      showToast('Failed to reset demo data', 'error')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        {/* Quick Tabs for Primary Roles */}
        <div className="hidden sm:flex items-center bg-surface-2 p-1 rounded-[8px] border border-line text-xs">
          {PRIMARY_DEMO_ACCOUNTS.map((acc) => {
            const isCurrent = user?.email === acc.email
            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSwitch(acc.email)}
                disabled={switchingEmail !== null}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1 rounded-[6px] font-medium transition-all cursor-pointer select-none',
                  isCurrent
                    ? 'bg-accent text-accent-contrast font-semibold shadow-sm'
                    : 'text-charcoal hover:text-fg hover:bg-surface-3',
                )}
                title={`Switch to ${acc.name} (${acc.role})`}
              >
                <span
                  className={clsx(
                    'w-2 h-2 rounded-full shrink-0',
                    isCurrent ? 'bg-accent-contrast' : '',
                  )}
                  style={{ backgroundColor: isCurrent ? undefined : `hsl(${acc.avatarHue}, 75%, 50%)` }}
                />
                <span className="capitalize">{acc.role === 'administrator' ? 'Admin' : acc.role}</span>
              </button>
            )
          })}
        </div>

        {/* More Accounts Modal Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-[8px] border border-line bg-surface hover:bg-surface-2 text-xs font-medium text-charcoal hover:text-fg transition-colors cursor-pointer select-none"
          title="Browse all 11 demo personas or reset database"
        >
          <Users className="w-3.5 h-3.5 text-muted" />
          <span className="hidden sm:inline">All Personas</span>
          <ChevronDown className="w-3 h-3 text-muted" />
        </button>

        {/* Reset Database Button */}
        <button
          type="button"
          onClick={handleResetData}
          disabled={isResetting}
          className="flex items-center justify-center w-8 h-8 rounded-[8px] border border-line bg-surface hover:bg-surface-2 text-muted hover:text-fg transition-colors cursor-pointer"
          title="Reset demo database to original seed state"
        >
          <RotateCcw className={clsx('w-3.5 h-3.5', isResetting && 'animate-spin')} />
        </button>
      </div>

      {/* Modal for Selecting All Personas */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            <span className="font-semibold text-fg">University Personas</span>
          </div>
        }
        description="Select any of the 11 pre-seeded university personas across Student, Professor, and Administrator roles."
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
            {ALL_DEMO_ACCOUNTS.map((acc) => {
              const isCurrent = user?.email === acc.email
              const isSelected = switchingEmail === acc.email
              return (
                <div
                  key={acc.email}
                  onClick={() => handleSwitch(acc.email)}
                  className={clsx(
                    'flex items-center justify-between p-3.5 rounded-[8px] border transition-all cursor-pointer select-none text-left',
                    isCurrent
                      ? 'border-accent bg-accent-soft shadow-sm'
                      : 'border-line hover:border-line-strong hover:bg-surface-2',
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: `hsl(${acc.avatarHue}, 70%, 50%)` }}
                    >
                      {acc.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-fg truncate">{acc.name}</p>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-surface-2 border border-line text-muted uppercase">
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted truncate">{acc.title}</p>
                      <p className="text-[10px] font-mono text-subtle truncate">{acc.email}</p>
                    </div>
                  </div>
                  {isCurrent ? (
                    <div className="w-6 h-6 rounded-full bg-accent text-accent-contrast flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : isSelected ? (
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : null}
                </div>
              )
            })}
          </div>

          <div className="pt-3 border-t border-line flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetData}
              disabled={isResetting}
            >
              Reset Seed Data
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
