import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from '@/components/ui/CommandPalette'

interface AppShellProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}

/**
 * AppShell per DESIGN.md & Spacing System:
 * - Canvas floor: Chalk Canvas #f6f7fb
 * - Surfaces: Paper White #ffffff
 * - Responsive page padding: p-4 (mobile 16px) -> sm:p-6 (tablet 24px) -> lg:p-8 (desktop 32px)
 * - Maximum content width: max-w-7xl (1280px)
 * - Responsive section spacing: space-y-6 sm:space-y-8
 */
export const AppShell: React.FC<AppShellProps> = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="h-screen h-[100dvh] flex bg-bg text-fg antialiased selection:bg-accent-soft overflow-hidden">
      {/* Workshop Sidebar with mobile drawer support */}
      <Sidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area with isolated vertical scroll */}
      <div className="flex-1 flex flex-col h-screen h-[100dvh] min-w-0 overflow-y-auto overflow-x-hidden">
        <Topbar
          title={title}
          subtitle={subtitle}
          actions={actions}
          onToggleSidebar={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in space-y-6 sm:space-y-8">
          {children ?? <Outlet />}
        </main>
      </div>

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette />
    </div>
  )
}
