import {
  Building2,
  Download,
  LayoutDashboard,
  Package,
  ScanLine,
  Settings,
  Smartphone,
  Store,
  Upload,
} from 'lucide-react'
import { Sidebar as UiSidebar, type SidebarSection } from '@cloud/ui'
import { SidebarHeader } from './sidebar-header'
import { UserMenu } from './user-menu'

const SECTIONS: SidebarSection[] = [
  {
    label: 'Manage',
    items: [
      { icon: <LayoutDashboard size={14} />, label: 'Overview' },
      { icon: <Upload size={14} />, label: 'App Publish' },
      { icon: <Download size={14} />, label: 'App Store' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { href: '/customers', icon: <Building2 size={14} />, label: 'Customers' },
      { href: '/merchants', icon: <Store size={14} />, label: 'Merchants' },
    ],
  },
  {
    label: 'Devices',
    items: [{ icon: <Smartphone size={14} />, label: 'Devices' }],
  },
  {
    label: 'Develop',
    items: [
      { icon: <ScanLine size={14} />, label: 'Sample Devices' },
      { href: '/devices/orders', icon: <Package size={14} />, label: 'Sample Orders' },
    ],
  },
  {
    label: 'System',
    items: [{ icon: <Settings size={14} />, label: 'Settings' }],
  },
]

export function Sidebar() {
  return (
    <div className="flex flex-col h-full">
      <SidebarHeader />
      <UiSidebar sections={SECTIONS} footer={<UserMenu />} className="flex-1 min-h-0" />
    </div>
  )
}
