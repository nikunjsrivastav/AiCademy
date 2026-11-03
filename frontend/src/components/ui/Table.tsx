import React from 'react'
import clsx from 'clsx'

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({
  className,
  children,
  ...props
}) => (
  <div className="w-full overflow-x-auto rounded-[8px] border border-line bg-surface shadow-[0_2px_4px_rgba(40,46,62,0.06)]">
    <table className={clsx('w-full text-left text-xs text-fg divide-y divide-line', className)} {...props}>
      {children}
    </table>
  </div>
)

export const TableHead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <thead className={clsx('bg-surface-2 text-muted font-medium uppercase tracking-wider text-[11px]', className)} {...props}>
    {children}
  </thead>
)

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  className,
  children,
  ...props
}) => (
  <tbody className={clsx('divide-y divide-line', className)} {...props}>
    {children}
  </tbody>
)

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({
  className,
  children,
  ...props
}) => (
  <tr className={clsx('hover:bg-surface-2/60 transition-colors', className)} {...props}>
    {children}
  </tr>
)

export const TableHeaderCell: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <th className={clsx('px-4 py-3 font-semibold text-muted select-none', className)} {...props}>
    {children}
  </th>
)

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  className,
  children,
  ...props
}) => (
  <td className={clsx('px-4 py-3 align-middle', className)} {...props}>
    {children}
  </td>
)
