import React from 'react'
import clsx from 'clsx'
import { Sparkles, Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ai' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

/**
 * Button per DESIGN.md & UI consistency:
 * - Rounded-[8px] radius matching the 8px border-radius of the cards, panels, and containers around it
 * - Primary: Iris Bolt #4255ff background, text #ffffff, font-semibold
 * - Outline: 1px #4255ff border, #4255ff text, hover #edefff
 * - Secondary: Mist border #d9dde8, surface background, hover surface-2
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const base =
      'inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-150 cursor-pointer select-none rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]'

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5 min-h-[36px] sm:min-h-[32px]',
      md: 'text-sm px-4 py-2 gap-2 min-h-[44px] sm:min-h-[38px]',
      lg: 'text-base px-5 py-2.5 gap-2.5 font-semibold min-h-[44px]',
    }

    const variants = {
      primary:
        'bg-accent hover:bg-accent-hover text-accent-contrast shadow-[0_2px_4px_rgba(40,46,62,0.1)] focus-visible:outline-accent font-semibold',
      secondary:
        'bg-surface hover:bg-surface-2 text-fg border border-line hover:border-line-strong focus-visible:outline-line-strong',
      outline:
        'border border-accent hover:bg-accent-soft text-accent focus-visible:outline-accent font-semibold',
      ghost:
        'bg-transparent hover:bg-surface-2 text-accent hover:text-accent-hover focus-visible:outline-accent',
      dark:
        'bg-[#282e3e] text-white hover:opacity-90 shadow-sm focus-visible:outline-[#282e3e]',
      danger:
        'bg-[#d83a31] hover:bg-[#b82e26] text-white shadow-sm focus-visible:outline-[#d83a31]',
      ai:
        'bg-accent hover:bg-accent-hover text-accent-contrast shadow-[0_2px_4px_rgba(40,46,62,0.1)] focus-visible:outline-accent font-semibold',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(base, sizes[size], variants[variant], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
        ) : (
          leftIcon ?? (variant === 'ai' ? <Sparkles className="w-3.5 h-3.5 text-white/90" /> : null)
        )}
        {children !== undefined && children !== null && <span>{children}</span>}
        {!isLoading && rightIcon}
      </button>
    )
  },
)

Button.displayName = 'Button'
