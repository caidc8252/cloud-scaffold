import { Badge } from '@cloud/ui'

interface TagChipProps {
  label: string
}

export function TagChip({ label }: TagChipProps) {
  return (
    <Badge tone="info" variant="outline" className="rounded-full px-2 py-0.5 text-[11px] font-medium">
      {label}
    </Badge>
  )
}
