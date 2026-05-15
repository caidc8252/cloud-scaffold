import { Users, Package, ScrollText, Settings } from 'lucide-react'
import { Sidebar as UiSidebar, type SidebarSection } from '@cloud/ui'
import { UserMenu } from './user-menu'
import { Logo } from './logo'

const SECTIONS: SidebarSection[] = [
  {
    label: 'Manage',
    items: [
      { href: '/customers', icon: <Users size={14} />, label: 'Customers' },
      {
        icon: <Package size={14} />,
        label: 'Devices',
        children: [
          { href: '/devices/orders', label: 'Sample Orders' },
          { href: '/devices/models', label: 'Device Models' },
        ],
      },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/audit', icon: <ScrollText size={14} />, label: 'Audit log' },
      { href: '/settings', icon: <Settings size={14} />, label: 'Settings' },
    ],
  },
]

export function Sidebar() {
  return (
    <UiSidebar
      brand={{ logo: <Logo size={32} />, title: 'TOMS', subtitle: 'Carbon · Merchant' }}
      sections={SECTIONS}
      footer={<UserMenu />}
    />
  )
}
