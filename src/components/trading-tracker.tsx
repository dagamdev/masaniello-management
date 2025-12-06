"use client"

import { useEffect } from "react"
import { useTradingStore } from "@/stores/store"
import { Header } from "@/components/header"
import { SessionManager } from "@/components/session-manager"
import { ConfigPanel } from "@/components/config-panel"
import { ObjectivePanel } from "@/components/objective-panel"
import { InfoPanel } from "@/components/info-panel"
import { OperationsTable } from "@/components/operations-table"
import type { Language } from "@/types"

interface TradingTrackerProps {
  lang: Language
}

export function TradingTracker({ lang }: TradingTrackerProps) {
  const { initializeStore } = useTradingStore()

  useEffect(() => {
    initializeStore()
  }, [initializeStore])

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <Header lang={lang} />
      <SessionManager lang={lang} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ConfigPanel lang={lang} />
        <ObjectivePanel lang={lang} />
        <InfoPanel lang={lang} />
      </div>

      <OperationsTable lang={lang} />
    </div>
  )
}
