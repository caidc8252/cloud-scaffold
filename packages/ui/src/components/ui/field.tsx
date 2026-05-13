import * as React from 'react'
import { cn } from '@/lib/utils'
import { Label } from './label'

export interface FieldProps {
  label?: React.ReactNode
  /** Shown below the control in muted text; hidden when error is present */
  hint?: React.ReactNode
  /** Shown in red with role="alert"; replaces hint when present */
  error?: React.ReactNode
  required?: boolean
  /** Omit for radio/checkbox groups — there is no single target element id */
  htmlFor?: string
  className?: string
  children: React.ReactNode
}

export const Field: React.FC<FieldProps> = ({ label, hint, error, required, htmlFor, className, children }) => (
  <div className={cn('flex flex-col gap-1.5', className)}>
    {label && (
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive" aria-hidden>*</span>}
      </Label>
    )}
    {children}
    {error ? (
      <p role="alert" className="text-xs text-destructive">{error}</p>
    ) : hint ? (
      <p className="text-xs text-muted-foreground">{hint}</p>
    ) : null}
  </div>
)
