import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyProps extends React.ComponentProps<"div"> {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

function Empty({
  className,
  icon,
  title,
  description,
  action,
  ...props
}: EmptyProps) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "rounded-xl border border-dashed border-line-default bg-surface-1 p-6 flex flex-col items-center text-center gap-2",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="bg-surface-3 rounded-full p-2 size-9 flex items-center justify-center text-content-tertiary mb-1">
          {icon}
        </div>
      )}
      <p className="text-[13px] font-medium text-content-primary">{title}</p>
      {description && (
        <p className="text-[12px] text-content-tertiary">{description}</p>
      )}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}

export { Empty, type EmptyProps }
