import React from 'react'
import clsx from 'clsx'

export interface ExtensionTagProps extends React.HTMLAttributes<HTMLSpanElement> {
  label?: string
  title?: string
}

/**
 * Visual badge clearly marking features extending beyond the original PDF architecture proposal.
 * Mandated for UI transparency between PDF baseline and Agentic extension.
 */
export const ExtensionTag: React.FC<ExtensionTagProps> = ({
  className,
  label = 'EXT',
  title = 'EXTENSION: Agentic feature beyond the original PDF architecture proposal',
  ...props
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded-[4px] border select-none whitespace-nowrap',
        'bg-accent-soft text-accent border-accent/25',
        className,
      )}
      title={title}
      {...props}
    >
      {label}
    </span>
  )
}
