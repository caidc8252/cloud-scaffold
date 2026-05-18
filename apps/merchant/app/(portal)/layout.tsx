'use client'

import { useState, useEffect } from 'react'
import { Layout, Toaster } from '@cloud/ui'
import { Sidebar } from '@/components/layout/sidebar'
import { PortalHeader } from '@/components/layout/portal-header'
import { CommandPalette } from '@/components/layout/command-palette'
import { PIIMaskProvider } from '@/components/layout/pii-mask-context'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [cmdkOpen, setCmdkOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdkOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <PIIMaskProvider>
      <Layout
        sidebar={<Sidebar />}
        header={<PortalHeader onSearchClick={() => setCmdkOpen(true)} />}
      >
        {children}
      </Layout>
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />
      <Toaster />
    </PIIMaskProvider>
  )
}
