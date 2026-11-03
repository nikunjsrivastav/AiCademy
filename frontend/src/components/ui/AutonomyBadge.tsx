import React from 'react'
import clsx from 'clsx'
import type { AutonomyLevel } from '@/types/agents'

export interface AutonomyBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: AutonomyLevel
  size?: 'sm' | 'md'
  showDot?: boolean
}

const config: Record<
  AutonomyLevel,
  { label: string; description: string; dotClass: string; textClass: string; bgClass: string }
> = {
  auto: {
    label: 'Auto',
    description: 'Autonomous execution: Low-risk action executed without human intervention',
    dotClass: 'bg-[#1ca330] dark:bg-[#27c93f]',
    textClass: 'text-[#1ca330] dark:text-[#27c93f]',
    bgClass: 'bg-[#1ca330]/10 border-[#1ca330]/20',
  },
  needs_approval: {
    label: 'Needs Approval',
    description: 'Human-in-the-loop: Requires professor verification before final action',
    dotClass: 'bg-[#b37e09] dark:bg-[#ffbd2e]',
    textClass: 'text-[#b37e09] dark:text-[#ffbd2e]',
    bgClass: 'bg-[#b37e09]/10 border-[#b37e09]/20',
  },
  never: {
    label: 'Never Allowed',
    description: 'Guardrail: Action prohibited by policy (e.g. grade finalization without review)',
    dotClass: 'bg-[#d83a31] dark:bg-[#ff5f56]',
    textClass: 'text-[#d83a31] dark:text-[#ff5f56]',
    bgClass: 'bg-[#d83a31]/10 border-[#d83a31]/20',
  },
}

export const AutonomyBadge: React.FC<AutonomyBadgeProps> = ({
  level,
  size = 'sm',
  showDot = true,
  className,
  ...props
}) => {
  const item = config[level]

  const sizes = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5',
    md: 'text-xs px-3 py-1 gap-2',
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-[6px] border select-none whitespace-nowrap',
        item.bgClass,
        item.textClass,
        sizes[size],
        className,
      )}
      title={item.description}
      {...props}
    >
      {showDot && <span className={clsx('w-2 h-2 rounded-full shrink-0', item.dotClass)} />}
      <span>{item.label}</span>
    </span>
  )
}
