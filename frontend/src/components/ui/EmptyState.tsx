import React from 'react'
import clsx from 'clsx'
import { FolderOpen } from 'lucide-react'
import { Button } from './Button'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionIcon?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 md:p-12 text-center rounded-[8px] border border-dashed border-line bg-surface/50 shadow-[0_2px_4px_rgba(40,46,62,0.04)]',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-[8px] bg-surface-2 border border-line flex items-center justify-center text-muted mb-4 shadow-sm">
        {icon ?? <FolderOpen className="w-6 h-6 text-subtle" />}
      </div>
      <h3 className="text-base font-semibold text-fg mb-1">{title}</h3>
      {description && <p className="text-xs text-muted max-w-sm mb-5">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction} leftIcon={actionIcon}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
