import { LayoutDashboard } from 'lucide-react'
import { Sidebar as UiSidebar, type SidebarSection } from '@cloud/ui'
import { UserMenu } from './user-menu'
import { Logo } from './logo'

const SECTIONS: SidebarSection[] = [
  {
    items: [
      { href: '/', icon: <LayoutDashboard size={14} />, label: 'Dashboard' },
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
