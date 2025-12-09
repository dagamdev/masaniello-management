"use client"

import { Card } from "@/components/ui/card"
import { useOperationStore } from "@/lib/store"
import { translations } from "@/lib/translations"
import type { Language } from "@/types"
import { DEFAULT_CONFIG } from "@/utils/constants"

interface ObjectivePanelProps {
  lang: Language
}

export function ObjectivePanel({ lang }: ObjectivePanelProps) {
  const { getActiveSession } = useOperationStore()
  const t = translations[lang]

  const session = getActiveSession()
  const config = session?.config || DEFAULT_CONFIG

  const winRate = config.allOperations > 0 ? ((config.expectedITMs / config.allOperations) * 100).toFixed(2) : "0.00"
  const saldoFinalObjetivo = config.totalRisk + config.totalRisk * (config.brokerPayour / 100)
  const gananciaNeta = config.totalRisk * (config.brokerPayour / 100)
  const rendimiento = saldoFinalObjetivo > 0 ? ((gananciaNeta / saldoFinalObjetivo) * 100).toFixed(2) : "0.00"

  return (
    <Card className="overflow-hidden pt-0">
      <div className="bg-primary text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 font-bold text-center text-sm sm:text-lg">
        {t.objective}
      </div>
      <div className="p-1.5 sm:p-2 space-y-0.5 sm:space-y-1">
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground text-[10px] sm:text-xs">{t.expectedWinRate}</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-primary">{winRate}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground text-[10px] sm:text-xs">{t.finalBalance}</span>
          <span className="text-xs sm:text-sm font-mono font-bold">€{saldoFinalObjetivo.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground text-[10px] sm:text-xs">{t.performance}</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-success">{rendimiento}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground text-[10px] sm:text-xs">{t.netProfit}</span>
          <span className="text-xs sm:text-sm font-mono font-bold text-success">€{gananciaNeta.toFixed(2)}</span>
        </div>
      </div>
    </Card>
  )
}
