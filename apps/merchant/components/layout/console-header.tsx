'use client'

import { AppHeader, type BreadcrumbItemDef } from '@cloud/ui'

interface ConsoleHeaderProps {
  onSearchClick: () => void
}

export function ConsoleHeader({ onSearchClick }: ConsoleHeaderProps) {
  const crumbs: BreadcrumbItemDef[] = [{ label: 'Dashboard' }]
  return <AppHeader breadcrumbs={crumbs} onSearchClick={onSearchClick} />
}
