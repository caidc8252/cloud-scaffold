'use client'

import { useParams, usePathname } from 'next/navigation'
import { AppHeader, type BreadcrumbItemDef } from '@cloud/ui'
import { findMerchant } from '@/components/merchants/data/helpers'
import { SEED_CUSTOMERS } from '@/lib/data/customers'
import { SEED_ORDERS } from '@/lib/data/orders'

interface PortalHeaderProps {
  onSearchClick: () => void
}

export function PortalHeader({ onSearchClick }: PortalHeaderProps) {
  const pathname = usePathname()
  const params = useParams<{ id?: string }>()
  const crumbs = buildBreadcrumbs(pathname, params.id)
  return <AppHeader breadcrumbs={crumbs} onSearchClick={onSearchClick} />
}

function buildBreadcrumbs(pathname: string, id?: string): BreadcrumbItemDef[] {
  if (pathname === '/') return [{ label: 'Dashboard' }]

  if (pathname === '/merchants') return [{ label: 'Merchants' }]
  if (pathname === '/merchants/new') {
    return [{ label: 'Merchants', href: '/merchants' }, { label: 'New merchant' }]
  }
  const merchantDetail = pathname.match(/^\/merchants\/([^/]+)$/)
  if (merchantDetail) {
    const merchant = findMerchant(merchantDetail[1])
    return [
      { label: 'Merchants', href: '/merchants' },
      { label: merchant?.name ?? merchantDetail[1] },
    ]
  }

  if (pathname === '/customers') return [{ label: 'Customers' }]
  if (pathname === '/customers/new') {
    return [{ label: 'Customers', href: '/customers' }, { label: 'New' }]
  }
  if (pathname.startsWith('/customers/')) {
    const customer = id ? SEED_CUSTOMERS.find((c) => c.id === id) : null
    return [
      { label: 'Customers', href: '/customers' },
      { label: customer?.name ?? '…' },
    ]
  }

  if (pathname === '/devices/orders') return [{ label: 'Devices' }, { label: 'Sample Orders' }]
  if (pathname === '/devices/orders/new') {
    return [
      { label: 'Devices' },
      { label: 'Sample Orders', href: '/devices/orders' },
      { label: 'New' },
    ]
  }
  if (pathname.startsWith('/devices/orders/')) {
    const order = id ? SEED_ORDERS.find((o) => o.id === id) : null
    return [
      { label: 'Devices' },
      { label: 'Sample Orders', href: '/devices/orders' },
      { label: order?.id ?? '…' },
    ]
  }

  if (pathname === '/settings') return [{ label: 'Settings' }]
  return []
}
