import React from 'react'
import clsx from 'clsx'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'flat' | 'interactive' | 'feature' | 'tinted'
  padding?: 'standard' | 'compact' | 'none' | 'loose'
  noPadding?: boolean
  showMacChrome?: boolean
}

/**
 * Quizlet Card per DESIGN.md & Spacing System:
 * - Default Card: 8px border-radius, #ffffff surface, 1px #d9dde8 border, rgba(40,46,62,0.1) 0px 4px 16px 0px shadow.
 * - Standard padding: p-6 (24px)
 * - Compact padding: p-4 (16px)
 * - Loose padding: p-8 (32px)
 * - Feature Card: 24px border-radius.
 * - Tinted Panel: #edefff (Lilac Wash) background.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'standard',
      noPadding = false,
      children,
      ...props
    },
    ref,
  ) => {
    const base = 'transition-all duration-200 border border-line'

    const variants = {
      default:
        'rounded-[8px] bg-surface text-fg shadow-[0_2px_8px_rgba(40,46,62,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)]',
      interactive:
        'rounded-[8px] bg-surface text-fg shadow-[0_2px_8px_rgba(40,46,62,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(40,46,62,0.08)] dark:hover:shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:-translate-y-0.5 hover:border-accent/40 cursor-pointer',
      flat: 'rounded-[8px] bg-surface text-fg border-line',
      feature:
        'rounded-[12px] bg-surface text-fg shadow-[0_4px_16px_rgba(40,46,62,0.06)] dark:shadow-[0_6px_20px_rgba(0,0,0,0.3)]',
      tinted:
        'rounded-[8px] bg-surface-2 text-fg border-line shadow-xs',
    }

    const paddingClasses = {
      standard: 'p-6',
      compact: 'p-4',
      none: '',
      loose: 'p-8',
    }

    const resolvedPadding = noPadding ? '' : paddingClasses[padding]

    return (
      <div
        ref={ref}
        className={clsx(base, variants[variant], resolvedPadding, className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className={clsx('flex items-center justify-between gap-4 pb-4 border-b border-line mb-4', className)} {...props}>
    {children}
  </div>
)

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className,
  children,
  ...props
}) => (
  <h3 className={clsx('text-base font-semibold text-fg tracking-tight', className)} {...props}>
    {children}
  </h3>
)

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className,
  children,
  ...props
}) => (
  <p className={clsx('text-xs text-muted mt-0.5', className)} {...props}>
    {children}
  </p>
)
