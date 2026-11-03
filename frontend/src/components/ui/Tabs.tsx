import React from 'react'
import clsx from 'clsx'

export interface TabItem {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: React.ReactNode
}

export interface TabsProps {
  tabs: TabItem[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'underline' | 'pills'
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className,
}) => {
  return (
    <div
      role="tablist"
      className={clsx(
        'flex items-center gap-1 overflow-x-auto no-scrollbar',
        variant === 'underline' ? 'border-b border-line' : 'p-1 bg-surface-2 rounded-xl border border-line',
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={clsx(
              'flex items-center gap-2 px-3.5 py-2 text-xs font-medium transition-all select-none whitespace-nowrap cursor-pointer',
              variant === 'underline' && [
                'relative border-b-2 -mb-px',
                isActive
                  ? 'border-accent text-accent font-semibold'
                  : 'border-transparent text-muted hover:text-fg hover:border-line-strong',
              ],
              variant === 'pills' && [
                'rounded-lg',
                isActive
                  ? 'bg-surface text-fg font-semibold shadow-sm border border-line'
                  : 'text-muted hover:text-fg hover:bg-surface-3/50',
              ],
            )}
          >
            {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge}
          </button>
        )
      })}
    </div>
  )
}
