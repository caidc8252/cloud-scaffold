'use client'

import { useEffect } from 'react'
import { useTheme } from '@cloud/ui/lib/theme'

export function ThemeSync() {
  const { resolved } = useTheme()

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', resolved)
    if (resolved === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [resolved])

  return null
}
