import React from 'react'
import clsx from 'clsx'
import { Sparkles } from 'lucide-react'

export interface AIBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md'
  label?: string
}

/**
 * AI Badge per DESIGN.md:
 * Rounded-[6px], Iris Bolt (#4255ff) accent mark, whitespace-nowrap.
 */
export const AIBadge: React.FC<AIBadgeProps> = ({
  className,
  size = 'sm',
  label = 'AI',
  ...props
}) => {
  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-[6px] select-none whitespace-nowrap',
        'bg-accent-soft text-accent border border-accent/25',
        sizes[size],
        className,
      )}
      title="Autonomous AiCademy Agent output"
      {...props}
    >
      <Sparkles className={clsx('text-accent shrink-0', size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3')} />
      <span className="font-semibold tracking-wide">{label}</span>
    </span>
  )
}
