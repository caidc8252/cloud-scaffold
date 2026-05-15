'use client'

import { useState, useEffect } from 'react'
import { Layout, Toaster } from '@cloud/ui'
import { Sidebar } from '@/components/layout/sidebar'
import { ConsoleHeader } from '@/components/layout/console-header'
import { CommandPalette } from '@/components/layout/command-palette'

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
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
    <>
      <Layout
        sidebar={<Sidebar />}
        header={<ConsoleHeader onSearchClick={() => setCmdkOpen(true)} />}
      >
        {children}
      </Layout>
      <CommandPalette open={cmdkOpen} onClose={() => setCmdkOpen(false)} />
      <Toaster />
    </>
  )
}
