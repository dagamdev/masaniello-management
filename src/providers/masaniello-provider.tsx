'use client'

import { useEffect } from 'react'
import { useMasanielloStore } from '@/stores/masaniello-store'

export function MasanielloProvider({ children }: { children: React.ReactNode }) {
  const initializeStore = useMasanielloStore(s => s.initializeStore)

  useEffect(() => {
    console.log('masaniello provider')
    initializeStore()
  }, [initializeStore])

  return children
}
