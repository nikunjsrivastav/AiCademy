import React from 'react'
import clsx from 'clsx'
import type { Confidence } from '@/types/domain'

export interface ConfidenceBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  confidence: Confidence | { score: number; level: 'high' | 'medium' | 'low'; reasons?: string[] }
  size?: 'sm' | 'md'
  showScore?: boolean
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({
  confidence,
  size = 'sm',
  showScore = true,
  className,
  ...props
}) => {
  const percent = Math.round(confidence.score * 100)
  const level = confidence.level

  const colors = {
    high: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    low: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  }

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
  }

  const tooltip = confidence.reasons && confidence.reasons.length > 0
    ? `Confidence: ${percent}% (${level})\n• ${confidence.reasons.join('\n• ')}`
    : `Confidence: ${percent}% (${level})`

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-[6px] border select-none whitespace-nowrap',
        colors[level],
        sizes[size],
        className,
      )}
      title={tooltip}
      {...props}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
      <span className="capitalize">{level} Confidence</span>
      {showScore && <span className="font-mono opacity-80">({percent}%)</span>}
    </span>
  )
}
