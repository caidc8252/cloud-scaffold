'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Users, Package, FileText, User, Settings, Bell,
} from 'lucide-react'
import { UserMenu } from './user-menu'

interface NavItemProps {
  href?: string
  icon: React.ReactNode
  label: string
  active?: boolean
  disabled?: boolean
}

function NavItem({ href, icon, label, active, disabled }: NavItemProps) {
  const base =
    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-fast cursor-pointer select-none'
  const activeClass = 'bg-surface-2 text-content-primary shadow-1'
  const idleClass   = 'text-content-secondary hover:bg-surface-hover hover:text-content-primary'
  const disabledClass = 'text-content-secondary cursor-default'
  const iconClass = active ? 'text-primary-700' : 'text-content-tertiary'

  const cls = `${base} ${active ? activeClass : disabled ? disabledClass : idleClass}`

  if (disabled || !href) {
    return (
      <div className={cls} aria-disabled>
        <span className={iconClass}>{icon}</span>
        <span className="flex-1">{label}</span>
      </div>
    )
  }

  return (
    <Link href={href} className={cls}>
      <span className={iconClass}>{icon}</span>
      <span className="flex-1">{label}</span>
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  const isCustomers = pathname.startsWith('/customers')
  const isOrders    = pathname.startsWith('/orders')
  const isSettings  = pathname.startsWith('/settings')

  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-line-subtle">
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: 'linear-gradient(135deg, oklch(55% 0.18 262), oklch(40% 0.14 262))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'oklch(99% 0 0)',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          T
        </div>
        <div>
          <div className="text-sm font-semibold text-content-primary leading-none">TOMS</div>
          <div className="text-xs text-content-tertiary leading-none mt-0.5">Carbon · Merchant</div>
        </div>
      </div>

      {/* Manage section */}
      <div className="px-3 pt-4 pb-1">
        <div className="text-xs font-semibold text-content-tertiary uppercase tracking-wider px-1 mb-1.5">
          Manage
        </div>
        <nav className="flex flex-col gap-0.5">
          <NavItem href="/customers" icon={<Users size={15} />} label="Customers" active={isCustomers} />
          <NavItem href="/orders"    icon={<Package size={15} />} label="Orders"    active={isOrders}    disabled />
          <NavItem icon={<FileText size={15} />} label="Contracts" disabled />
          <NavItem icon={<User size={15} />}     label="Operators" disabled />
        </nav>
      </div>

      {/* System section */}
      <div className="px-3 pt-3 pb-1">
        <div className="text-xs font-semibold text-content-tertiary uppercase tracking-wider px-1 mb-1.5">
          System
        </div>
        <nav className="flex flex-col gap-0.5">
          <NavItem icon={<Bell size={15} />}     label="Notifications" disabled />
          <NavItem href="/settings" icon={<Settings size={15} />} label="Settings" active={isSettings} disabled />
        </nav>
      </div>

      <div className="flex-1" />

      {/* User footer */}
      <div className="border-t border-line-subtle p-3">
        <UserMenu />
      </div>
    </div>
  )
}
