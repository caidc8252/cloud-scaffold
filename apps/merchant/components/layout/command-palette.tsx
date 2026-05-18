'use client'

import {
  CommandDialog, CommandInput, CommandList, CommandEmpty,
} from '@cloud/ui'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  return (
    <CommandDialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <CommandInput placeholder="Search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
      </CommandList>
    </CommandDialog>
  )
}
