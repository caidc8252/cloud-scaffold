'use client'

import { usePathname, useParams } from 'next/navigation'
import { AppHeader, type BreadcrumbItemDef } from '@cloud/ui'
import { SEED_CUSTOMERS } from '@/lib/data/customers'

interface ConsoleHeaderProps {
  onSearchClick: () => void
}

export function ConsoleHeader({ onSearchClick }: ConsoleHeaderProps) {
  const pathname = usePathname()
  const params = useParams<{ id?: string }>()

  const customer = params.id ? SEED_CUSTOMERS.find((c) => c.id === params.id) : null
  const crumbs = buildCrumbs(pathname, customer?.name)

  return <AppHeader breadcrumbs={crumbs} onSearchClick={onSearchClick} />
}

function buildCrumbs(pathname: string, customerName?: string): BreadcrumbItemDef[] {
  if (pathname === '/customers') return [{ label: 'Customers' }]
  if (pathname === '/customers/new') return [{ label: 'Customers', href: '/customers' }, { label: 'New' }]
  if (pathname.startsWith('/customers/') && pathname !== '/customers/new') {
    return [
      { label: 'Customers', href: '/customers' },
      { label: customerName ?? '…' },
    ]
  }
  if (pathname === '/orders') return [{ label: 'Orders' }]
  if (pathname === '/settings') return [{ label: 'Settings' }]
  return [{ label: 'Dashboard' }]
}
