'use client'

import { createContext, useCallback, useContext, useMemo, useState } from 'react'

interface PIIMaskValue {
  maskOn: boolean
  setMaskOn: (on: boolean) => void
  isRevealed: (scope: string) => boolean
  toggleReveal: (scope: string) => boolean
}

const PIIMaskContext = createContext<PIIMaskValue | null>(null)

export function PIIMaskProvider({ children }: { children: React.ReactNode }) {
  const [maskOn, setMaskOn] = useState(true)
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const isRevealed = useCallback((scope: string) => !!revealed[scope], [revealed])

  const toggleReveal = useCallback((scope: string) => {
    let nextValue = false
    setRevealed((prev) => {
      nextValue = !prev[scope]
      return { ...prev, [scope]: nextValue }
    })
    return nextValue
  }, [])

  const value = useMemo<PIIMaskValue>(
    () => ({ maskOn, setMaskOn, isRevealed, toggleReveal }),
    [maskOn, isRevealed, toggleReveal],
  )

  return <PIIMaskContext.Provider value={value}>{children}</PIIMaskContext.Provider>
}

export function usePIIMask(): PIIMaskValue {
  const ctx = useContext(PIIMaskContext)
  if (!ctx) throw new Error('usePIIMask must be used inside <PIIMaskProvider>')
  return ctx
}
