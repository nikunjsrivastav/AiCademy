import React from 'react'
import clsx from 'clsx'

export interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'standard' | 'narrow' | 'wide' | 'full'
  className?: string
  children: React.ReactNode
}

/**
 * Standard PageContainer enforcing consistent responsive padding and max content width:
 * - Mobile (<640px): 16px (px-4, py-6)
 * - Tablet (<1024px): 24px (sm:px-6, sm:py-8)
 * - Desktop (>=1024px): 32px (lg:px-8, sm:py-8)
 * - Standard Max Width: max-w-7xl (1280px)
 * - Section rhythm: space-y-6 sm:space-y-8
 */
export const PageContainer: React.FC<PageContainerProps> = ({
  maxWidth = 'standard',
  className,
  children,
  ...props
}) => {
  const maxWidthClasses = {
    standard: 'max-w-7xl',
    narrow: 'max-w-4xl',
    wide: 'max-w-[1400px]',
    full: 'max-w-full',
  }

  return (
    <div
      className={clsx(
        'w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8',
        maxWidthClasses[maxWidth],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
