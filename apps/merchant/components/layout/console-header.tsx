'use client'

import React from 'react'
import { usePathname, useParams } from 'next/navigation'
import { Search, Bell } from 'lucide-react'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@cloud/ui'
import { SEED_CUSTOMERS } from '@/lib/data/customers'

interface ConsoleHeaderProps {
  onSearchClick: () => void
}

export function ConsoleHeader({ onSearchClick }: ConsoleHeaderProps) {
  const pathname = usePathname()
  const params = useParams<{ id?: string }>()

  const customer = params.id ? SEED_CUSTOMERS.find((c) => c.id === params.id) : null

  const crumbs = buildCrumbs(pathname, customer?.name)

  return (
    <div className="flex items-center gap-3 w-full">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.href ? (
                  <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1" />

      <button
        onClick={onSearchClick}
        className="flex items-center gap-2 px-3 h-8 rounded-lg border border-line-default bg-surface-2 text-sm text-content-tertiary hover:bg-surface-hover hover:text-content-primary transition-colors cursor-pointer"
      >
        <Search size={13} />
        <span>Search…</span>
        <kbd className="ml-1 text-xs font-mono bg-surface-3 px-1.5 py-0.5 rounded border border-line-subtle">
          ⌘K
        </kbd>
      </button>

      <button className="flex items-center justify-center w-8 h-8 rounded-lg text-content-secondary hover:bg-surface-hover hover:text-content-primary transition-colors cursor-pointer">
        <Bell size={15} />
      </button>
    </div>
  )
}

interface Crumb { label: string; href?: string }

function buildCrumbs(pathname: string, customerName?: string): Crumb[] {
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
