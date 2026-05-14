import * as React from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  className?: string
  children?: React.ReactNode
}

function PageHeader({ title, description, className, children }: PageHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h1 className="text-3xl font-semibold text-content-primary tracking-[-0.02em]">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-content-tertiary mt-1">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  )
}

export { PageHeader }
