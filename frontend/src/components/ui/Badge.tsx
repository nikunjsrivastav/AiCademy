import React from 'react'
import clsx from 'clsx'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'brand' | 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'ai' | 'dark'
  size?: 'sm' | 'md'
  dot?: boolean
}

/**
 * Badge Tag per DESIGN.md:
 * - Radii: rounded-[6px] matching the geometric aesthetic
 * - whitespace-nowrap to strictly prevent vertical text wrapping
 */
export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  ...props
}) => {
  const base = 'inline-flex items-center font-medium rounded-[6px] select-none whitespace-nowrap'

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
  }

  const variants = {
    brand: 'bg-accent-soft text-accent border border-accent/25',
    neutral: 'bg-surface-2 text-muted border border-line',
    success: 'bg-[#1ca330]/10 text-[#1ca330] dark:text-[#27c93f] border border-[#1ca330]/20',
    warning: 'bg-[#b37e09]/10 text-[#b37e09] dark:text-[#ffbd2e] border border-[#b37e09]/20 font-semibold',
    danger: 'bg-[#d83a31]/10 text-[#d83a31] dark:text-[#ff5f56] border border-[#d83a31]/20',
    info: 'bg-accent-soft text-accent border border-accent/25',
    ai: 'bg-accent-soft text-accent border border-accent/30 font-semibold',
    dark: 'bg-[#282e3e] text-white border border-[#282e3e]',
  }

  const dotColors = {
    brand: 'bg-accent',
    neutral: 'bg-[#586380]',
    success: 'bg-[#1ca330] dark:bg-[#27c93f]',
    warning: 'bg-[#b37e09] dark:bg-[#ffbd2e]',
    danger: 'bg-[#d83a31] dark:bg-[#ff5f56]',
    info: 'bg-accent',
    ai: 'bg-accent',
    dark: 'bg-white',
  }

  return (
    <span className={clsx(base, sizes[size], variants[variant], className)} {...props}>
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  )
}
