'use client'

import { useRouter } from 'next/navigation'
import { Users, ChevronRight } from 'lucide-react'
import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
  CommandGroup, CommandItem,
} from '@cloud/ui'
import { SEED_CUSTOMERS } from '@/lib/data/customers'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()

  const handleSelect = (id: string) => {
    onClose()
    router.push(`/customers/${id}`)
  }

  return (
    <CommandDialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <CommandInput placeholder="Search customers…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Customers">
          {SEED_CUSTOMERS.map((c) => (
            <CommandItem
              key={c.id}
              value={c.name}
              onSelect={() => handleSelect(c.id)}
              className="gap-2"
            >
              <Users size={14} className="text-content-tertiary" />
              <span>{c.name}</span>
              <span className="ml-auto text-xs text-content-tertiary">
                {c.address.split(',').slice(-2).join(',').trim()}
              </span>
              <ChevronRight size={12} className="text-content-tertiary" />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
