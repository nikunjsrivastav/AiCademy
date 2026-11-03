import React from 'react'
import clsx from 'clsx'

export interface SectionProps extends Omit<React.HTMLAttributes<HTMLElement>, 'title'> {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  spacing?: 'compact' | 'standard' | 'loose'
  className?: string
  children: React.ReactNode
}

/**
 * Standard Section component enforcing consistent vertical rhythm:
 * - Header: Title + optional subtitle on left, actions on right
 * - Spacing: compact (space-y-3), standard (space-y-4), loose (space-y-6)
 */
export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  actions,
  spacing = 'standard',
  className,
  children,
  ...props
}) => {
  const spacingClasses = {
    compact: 'space-y-3',
    standard: 'space-y-4',
    loose: 'space-y-6',
  }

  return (
    <section className={clsx(spacingClasses[spacing], className)} {...props}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            {typeof title === 'string' ? (
              <h2 className="text-lg font-bold font-sans text-fg tracking-tight">{title}</h2>
            ) : (
              title
            )}
            {subtitle && (
              <p className="text-xs text-charcoal mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
