import React from 'react'
import clsx from 'clsx'

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  htmlFor?: string
  helperText?: React.ReactNode
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Standard FormField component:
 * - Label to input: mb-1.5 (6px)
 * - Input to helper/error: mt-1.5 (6px)
 * - Error text in red
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  htmlFor,
  helperText,
  error,
  required,
  className,
  children,
  ...props
}) => {
  return (
    <div className={clsx('space-y-1.5', className)} {...props}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="block text-xs font-semibold text-fg tracking-wide uppercase"
        >
          {label}
          {required && <span className="text-[#d83a31] ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-[11px] text-[#d83a31] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11px] text-muted">{helperText}</p>
      ) : null}
    </div>
  )
}
