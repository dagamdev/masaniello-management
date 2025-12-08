"use client"

import { Card } from "@/components/ui/card"
import { useOperationStore } from "@/stores/operation-store"
import { translations } from "@/lib/translations"
import type { Language } from "@/types"

interface ObjectiveInfoPanelProps {
  lang: Language
}

export function ObjectiveInfoPanel({ lang }: ObjectiveInfoPanelProps) {
  const { getActiveSession } = useOperationStore()
  const t = translations[lang]

  const session = getActiveSession()
  const config = session?.config || { totalRisk: 100, operationCount: 10, expectedITMs: 4, brokerPayout: 85 }

  const winRate = config.operationCount > 0 ? ((config.expectedITMs / config.operationCount) * 100).toFixed(2) : "0.00"
  const saldoFinalObjetivo = config.totalRisk + config.totalRisk * (config.brokerPayout / 100)
  const gananciaNeta = config.totalRisk * (config.brokerPayout / 100)
  const rendimiento = saldoFinalObjetivo > 0 ? ((gananciaNeta / saldoFinalObjetivo) * 100).toFixed(2) : "0.00"

  return (
    <Card className="overflow-hidden pt-0">
      <div className="bg-primary text-primary-foreground px-2 py-1 font-bold text-center text-sm">
        {t.objective} / {t.information}
      </div>
      <div className="p-1.5 grid grid-cols-2 gap-x-2 gap-y-0.5">
        {/* Objetivo */}
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground text-[10px]">{t.expectedWinRate}</span>
          <span className="text-xs font-mono font-bold text-primary">{winRate}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground text-[10px]">{t.finalBalance}</span>
          <span className="text-xs font-mono font-bold">€{saldoFinalObjetivo.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground text-[10px]">{t.performance}</span>
          <span className="text-xs font-mono font-bold text-success">{rendimiento}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground text-[10px]">{t.netProfit}</span>
          <span className="text-xs font-mono font-bold text-success">€{gananciaNeta.toFixed(2)}</span>
        </div>

        {/* Informacion */}
        <div className="col-span-2 pt-1 mt-1 border-t flex flex-wrap gap-x-3 gap-y-0.5 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="font-bold">ITM:</span>
            <span className="text-muted-foreground">{t.itmInfo}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-bold">OTM:</span>
            <span className="text-muted-foreground">{t.otmInfo}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
