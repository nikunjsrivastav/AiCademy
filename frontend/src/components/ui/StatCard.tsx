import React from 'react'
import clsx from 'clsx'
import { Card } from './Card'

export interface StatCardProps {
  label: string
  value: string | number
  subValue?: string
  icon?: React.ReactNode
  trend?: {
    value: string
    positive?: boolean
  }
  badge?: React.ReactNode
  className?: string
}

/**
 * StatCard with unified layout:
 * - Top Row: Category label on left, icon box on top-right (consistent across all cards)
 * - Value: Large bold metric + optional subValue with whitespace-nowrap
 * - Footer: Badge or trend indicator placed consistently at the bottom
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  icon,
  trend,
  badge,
  className,
}) => {
  return (
    <Card className={clsx('relative p-5 flex flex-col justify-between', className)}>
      {/* Top Row: Label left, Icon top-right (always in exact same position) */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider truncate">
          {label}
        </span>
        {icon && (
          <div className="w-9 h-9 rounded-[8px] bg-accent-soft/80 border border-accent/20 flex items-center justify-center text-fg shrink-0 shadow-sm">
            {icon}
          </div>
        )}
      </div>

      {/* Middle Row: Metric Value */}
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-fg font-sans">{value}</span>
          {subValue && (
            <span className="text-xs text-muted whitespace-nowrap truncate">{subValue}</span>
          )}
        </div>

        {/* Bottom Row: Badge or Trend (full width, never wrapped) */}
        {(badge || trend) && (
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-line/60">
            {badge && <div className="shrink-0">{badge}</div>}
            {trend && (
              <div className="flex items-center gap-1 text-[11px] whitespace-nowrap">
                <span
                  className={clsx(
                    'font-semibold',
                    trend.positive ? 'text-[#1ca330] dark:text-[#27c93f]' : 'text-[#d83a31] dark:text-[#ff5f56]',
                  )}
                >
                  {trend.positive ? '↑' : '↓'} {trend.value}
                </span>
                <span className="text-muted">vs last week</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
