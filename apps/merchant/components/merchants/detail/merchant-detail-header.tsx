'use client'

import { ChevronLeft, Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@cloud/ui'
import type { Merchant } from '../data/types'
import { MerchantAvatar } from '../merchant-avatar'
import { TagChip } from '../tag-chip'

interface MerchantDetailHeaderProps {
  merchant: Merchant
  onEdit: () => void
}

export function MerchantDetailHeader({ merchant, onEdit }: MerchantDetailHeaderProps) {
  const router = useRouter()
  return (
    <div className="flex items-center gap-3 flex-wrap mb-5">
      <button
        type="button"
        onClick={() => router.push('/merchants')}
        className="p-1 rounded-md text-content-tertiary hover:bg-surface-hover hover:text-content-primary"
        aria-label="Back to merchants"
      >
        <ChevronLeft size={16} />
      </button>
      <MerchantAvatar name={merchant.name} size={44} />
      <div className="flex-1 min-w-[240px]">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-[22px] font-semibold tracking-tight text-content-primary leading-none">{merchant.name}</h1>
          <span className="text-[11.5px] text-content-tertiary">·</span>
          <span className="font-mono text-[11.5px] text-content-tertiary">{merchant.mid}</span>
          <span className="text-[11.5px] text-content-tertiary">·</span>
          <span className="text-[11.5px] text-content-tertiary">{merchant.country}</span>
        </div>
        {merchant.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {merchant.tags.map((t) => (
              <TagChip key={t} label={t} />
            ))}
          </div>
        )}
      </div>
      <Button variant="outline" iconLeft={<Pencil size={14} />} onClick={onEdit}>
        Edit merchant
      </Button>
    </div>
  )
}
