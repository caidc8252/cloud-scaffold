import { Users, Package, FileText, User, Settings, Bell, BarChart2 } from 'lucide-react'
import { Sidebar as UiSidebar, type SidebarSection } from '@cloud/ui'
import { UserMenu } from './user-menu'

const SECTIONS: SidebarSection[] = [
  {
    label: 'Manage',
    items: [
      { href: '/customers', icon: <Users size={15} />, label: 'Customers' },
      { href: '/orders',    icon: <Package size={15} />, label: 'Orders' },
      { href: '/contracts', icon: <FileText size={15} />, label: 'Contracts' },
      { href: '/operators', icon: <User size={15} />,    label: 'Operators' },
      {
        icon: <BarChart2 size={15} />,
        label: 'Reports',
        children: [
          { href: '/reports/sales',    label: 'Sales' },
          { href: '/reports/carbon',   label: 'Carbon' },
          { href: '/reports/invoices', label: 'Invoices' },
        ],
      },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/notifications', icon: <Bell size={15} />,     label: 'Notifications' },
      { href: '/settings',      icon: <Settings size={15} />, label: 'Settings' },
    ],
  },
]

export function Sidebar() {
  return (
    <UiSidebar
      brand={{ title: 'TOMS', subtitle: 'Carbon · Merchant' }}
      sections={SECTIONS}
      footer={<UserMenu />}
    />
  )
}
