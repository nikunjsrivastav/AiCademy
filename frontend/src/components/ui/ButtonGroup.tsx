import React from 'react'
import clsx from 'clsx'

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: 'sm' | 'md' | 'lg'
  align?: 'left' | 'center' | 'right' | 'between'
  className?: string
  children: React.ReactNode
}

/**
 * Standard ButtonGroup component:
 * - Spacing: sm (gap-2 / 8px), md (gap-3 / 12px), lg (gap-4 / 16px)
 * - Alignment: left, center, right, between
 */
export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  spacing = 'md',
  align = 'left',
  className,
  children,
  ...props
}) => {
  const spacingClasses = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  }

  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between',
  }

  return (
    <div
      className={clsx(
        'flex flex-wrap items-center',
        spacingClasses[spacing],
        alignClasses[align],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
