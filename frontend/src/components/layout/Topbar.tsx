import React from 'react'
import { Search, Command, Menu } from 'lucide-react'
import { DemoRoleSwitcher } from './DemoRoleSwitcher'
import { NotificationsPopover } from '@/components/ui/NotificationsPopover'
import { useAuth } from '@/auth/AuthContext'

interface TopbarProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  onToggleSidebar?: () => void
}

/**
 * Top Navigation Bar per DESIGN.md:
 * - Background #ffffff, height ~56px, shadow rgba(40, 46, 62, 0.1) 0px 4px 16px 0px
 * - Search bar: background #f6f7fb, border-radius 200px, placeholder #939bb4
 */
export const Topbar: React.FC<TopbarProps> = ({
  title,
  subtitle,
  actions,
  onToggleSidebar,
}) => {
  const { user } = useAuth()
  const showDemoSwitcher = import.meta.env.VITE_ENABLE_DEMO_SWITCHER === 'true'

  return (
    <header className="h-16 border-b border-line bg-surface px-8 sm:px-10 lg:px-12 flex items-center justify-between sticky top-0 z-20 select-none shadow-[0_1px_3px_rgba(40,46,62,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-4 min-w-0">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="md:hidden p-2 -ml-1 rounded-[8px] border border-line text-charcoal hover:text-fg hover:bg-surface-2 transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="min-w-0 flex flex-col justify-center py-1">
          <h1 className="text-base sm:text-lg font-bold text-fg tracking-tight truncate font-sans leading-tight">
            {title ?? 'Digital Classroom'}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted truncate font-medium leading-normal mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Quizlet Search Bar */}
        <button
          type="button"
          onClick={() => {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))
          }}
          className="hidden md:flex items-center gap-2.5 px-4 py-1.5 rounded-[8px] bg-bg hover:bg-surface-2 text-xs text-muted hover:text-fg transition-colors border border-transparent hover:border-line cursor-pointer"
          title="Search courses, materials, assignments, and agent runs (Ctrl+K)"
        >
          <Search className="w-4 h-4 text-subtle" />
          <span className="text-sm text-subtle">Search courses, study tools...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-surface border border-line text-muted">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Notifications Popover */}
        <NotificationsPopover />

        <div className="h-4 w-px bg-line" />

        {/* Account Profile / Demo Role Switcher */}
        {showDemoSwitcher ? (
          <div className="flex items-center gap-1.5">
            <DemoRoleSwitcher />
          </div>
        ) : user ? (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] bg-bg border border-line">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-xs"
              style={{
                backgroundColor: `hsl(${user.profile?.avatarHue ?? 220}, 70%, 45%)`,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-fg leading-none truncate max-w-[120px]">
                {user.name}
              </span>
              <span className="text-[10px] text-muted capitalize leading-tight mt-0.5">
                {user.role}
              </span>
            </div>
          </div>
        ) : null}

        {actions && (
          <>
            <div className="h-4 w-px bg-line" />
            <div className="flex items-center gap-2">{actions}</div>
          </>
        )}
      </div>
    </header>
  )
}
