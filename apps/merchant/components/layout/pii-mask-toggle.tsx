'use client'

import { Eye, EyeOff } from 'lucide-react'
import { ToggleSwitch } from '@cloud/ui'
import { usePIIMask } from './pii-mask-context'

interface PIIMaskToggleProps {
  className?: string
}

export function PIIMaskToggle({ className }: PIIMaskToggleProps) {
  const { maskOn, setMaskOn } = usePIIMask()
  return (
    <div className={`inline-flex items-center gap-2 text-sm text-content-secondary ${className ?? ''}`}>
      {maskOn ? <EyeOff size={13} /> : <Eye size={13} />}
      <ToggleSwitch
        size="sm"
        checked={maskOn}
        onCheckedChange={setMaskOn}
        label={<span className="text-xs text-content-secondary cursor-pointer">Mask PII</span>}
      />
    </div>
  )
}
