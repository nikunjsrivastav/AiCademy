import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Sparkles,
  TrendingUp,
  Database,
  ShieldAlert,
  Cpu,
  Activity,
  Users,
  Bot,
  PlayCircle,
  LogOut,
  Moon,
  Sun,
  Settings as SettingsIcon,
  X,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { AIBadge } from '@/components/ui/AIBadge'
import { ExtensionTag } from '@/components/ui/ExtensionTag'

interface NavEntry {
  to: string
  label: string
  icon: React.FC<{ className?: string }>
  badge?: React.ReactNode
  extension?: boolean
}

export interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  if (!user) return null

  const studentLinks: NavEntry[] = [
    { to: '/s/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/s/courses', label: 'My Courses', icon: BookOpen },
    {
      to: '/s/coach',
      label: 'Study Coach',
      icon: Sparkles,
      badge: <AIBadge size="sm" label="Agent" />,
      extension: true,
    },
    { to: '/s/progress', label: 'My Progress', icon: TrendingUp },
    {
      to: '/s/memory',
      label: 'Agent Memory',
      icon: Database,
      extension: true,
    },
    { to: '/s/settings', label: 'Settings', icon: SettingsIcon },
  ]

  const professorLinks: NavEntry[] = [
    { to: '/p/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/p/courses', label: 'Course Studio', icon: BookOpen },
    {
      to: '/p/approvals',
      label: 'Approval Queue',
      icon: ShieldAlert,
      extension: true,
    },
    {
      to: '/p/insights',
      label: 'Insights Copilot',
      icon: Sparkles,
      badge: <AIBadge size="sm" label="Agent" />,
      extension: true,
    },
    {
      to: '/p/agents',
      label: 'Agent Control',
      icon: Cpu,
      extension: true,
    },
    {
      to: '/p/memory',
      label: 'Agent Memory',
      icon: Database,
      extension: true,
    },
    { to: '/p/settings', label: 'Settings', icon: SettingsIcon },
  ]

  const adminLinks: NavEntry[] = [
    { to: '/a/overview', label: 'Overview', icon: Activity },
    { to: '/a/users', label: 'Users Directory', icon: Users },
    { to: '/a/courses', label: 'All Courses', icon: BookOpen },
    {
      to: '/a/runs',
      label: 'Global Agent Runs',
      icon: Bot,
      extension: true,
    },
    {
      to: '/a/simulator',
      label: 'Event Simulator',
      icon: PlayCircle,
      extension: true,
    },
    { to: '/a/settings', label: 'Settings', icon: SettingsIcon },
  ]

  const links =
    user.role === 'student'
      ? studentLinks
      : user.role === 'professor'
        ? professorLinks
        : adminLinks

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const roleLabel = {
    student: 'Student',
    professor: 'Professor',
    administrator: 'Administrator',
  }[user.role]

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-xs animate-fade-in"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'w-64 min-w-[16rem] h-full flex flex-col border-r border-line bg-surface shrink-0 select-none shadow-[2px_0_12px_rgba(40,46,62,0.04)] dark:shadow-[2px_0_16px_rgba(0,0,0,0.2)]',
          'fixed inset-y-0 left-0 z-50 md:static transition-transform duration-200',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 hidden md:flex',
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-line shrink-0">
          <div className="flex items-center gap-3">
            {/* Brand mark per DESIGN.md line 14 & 235 */}
            <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center text-accent-contrast shadow-[0_2px_6px_var(--accent)/30]">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-fg font-sans">AiCademy</span>
              </div>
              <p className="text-[11px] text-muted tracking-wide font-medium">Digital Classroom</p>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="md:hidden p-1.5 rounded-[8px] text-muted hover:text-fg hover:bg-surface-2 cursor-pointer"
              aria-label="Close navigation sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Role Banner */}
        <div className="px-6 py-2.5 border-b border-line bg-surface-2/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span className="text-xs font-semibold text-fg">{roleLabel}</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-[4px] bg-surface border border-line text-muted">
            {user.role === 'student' ? 'Learner' : user.role === 'professor' ? 'Faculty' : 'Admin'}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold text-muted uppercase tracking-wider">
            Workspace
          </div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => onClose?.()}
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-medium transition-all group select-none',
                  isActive
                    ? 'bg-accent-soft text-accent font-semibold border border-accent/20 shadow-sm'
                    : 'text-charcoal hover:text-fg hover:bg-surface-2',
                )
              }
            >
            <div className="flex items-center gap-2.5 truncate">
              <link.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
              <span className="truncate">{link.label}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {link.extension && <ExtensionTag className="text-[8px] px-1" />}
              {link.badge}
            </div>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Profile and Controls */}
      <div className="p-4 border-t border-line bg-surface space-y-3 shrink-0">
        {/* User Card */}
        <div className="flex items-center justify-between p-2.5 rounded-[8px] bg-surface-2 border border-line">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm"
              style={{
                backgroundColor: `hsl(${user.profile.avatarHue ?? 220}, 75%, 48%)`,
              }}
            >
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-fg truncate">{user.name}</p>
              <p className="text-[10px] text-muted truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Theme Toggle & Logout */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[8px] text-xs text-charcoal hover:text-fg hover:bg-surface-2 transition-colors border border-line cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-[#ffbd2e]" /> : <Moon className="w-3.5 h-3.5 text-muted" />}
            <span className="capitalize font-medium">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[8px] text-xs text-charcoal hover:text-[#d83a31] hover:bg-[#d83a31]/10 transition-colors border border-line cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="font-medium">Exit</span>
          </button>
        </div>
      </div>
    </aside>
  </>
)
}
