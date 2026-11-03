import React from 'react'
import clsx from 'clsx'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './Button'

export interface ErrorStateProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}) => {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-8 text-center rounded-[8px] border border-[#d83a31]/25 bg-[#d83a31]/5 shadow-[0_2px_4px_rgba(40,46,62,0.04)]',
        className,
      )}
    >
      <div className="w-12 h-12 rounded-[8px] bg-[#d83a31]/10 border border-[#d83a31]/20 flex items-center justify-center text-[#d83a31] mb-4 shadow-sm">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-fg mb-1">{title}</h3>
      <p className="text-xs text-rose-300/90 max-w-sm mb-5">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Try Again
        </Button>
      )}
    </div>
  )
}
