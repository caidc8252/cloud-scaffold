import * as React from 'react'
import { cn } from '@/lib/utils'

export type SortDir = 'asc' | 'desc' | null

export interface TableColumn<R> {
  key: string
  title: React.ReactNode
  /** render takes priority over field when both are provided */
  render?: (row: R) => React.ReactNode
  /** Simple string access fallback; ignored when render is present */
  field?: keyof R
  sortable?: boolean
  width?: number | string
  align?: 'left' | 'right' | 'center'
}

export interface TableProps<R> {
  columns: TableColumn<R>[]
  rows: R[]
  rowKey: (row: R, index: number) => string | number
  sort?: { key: string; dir: Exclude<SortDir, null> }
  /** Pass null to clear the current sort */
  onSortChange?: (sort: { key: string; dir: Exclude<SortDir, null> } | null) => void
  empty?: React.ReactNode
  className?: string
}

export function Table<R>({ columns, rows, rowKey, sort, onSortChange, empty = 'No data', className }: TableProps<R>) {
  const handleSort = (col: TableColumn<R>) => {
    if (!col.sortable || !onSortChange) return
    if (!sort || sort.key !== col.key) onSortChange({ key: col.key, dir: 'asc' })
    else if (sort.dir === 'asc') onSortChange({ key: col.key, dir: 'desc' })
    else onSortChange(null)
  }

  return (
    <div className={cn('w-full overflow-auto', className)}>
      <table className="w-full text-md border-collapse">
        <thead className="bg-surface-3 sticky top-0 z-10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width, textAlign: col.align ?? 'left' }}
                className="px-4 py-3 text-xs font-medium text-content-tertiary uppercase tracking-wide border-b border-line-default"
              >
                {col.sortable ? (
                  <button
                    onClick={() => handleSort(col)}
                    className="inline-flex items-center gap-1 cursor-pointer hover:text-content-primary focus-visible:outline-none"
                  >
                    {col.title}
                    <span className={cn('text-xs', sort?.key === col.key ? 'opacity-100' : 'opacity-30')}>
                      {sort?.key === col.key && sort.dir === 'desc' ? '▼' : '▲'}
                    </span>
                  </button>
                ) : col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-content-tertiary">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                className="border-b border-line-subtle hover:bg-surface-hover transition-colors duration-fast"
              >
                {columns.map((col) => (
                  <td key={col.key} style={{ textAlign: col.align ?? 'left' }} className="px-4 py-3 text-content-primary">
                    {col.render ? col.render(row) : col.field != null ? String(row[col.field] ?? '') : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
