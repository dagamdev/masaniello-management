"use client"

import { Card } from "@/components/ui/card"
import { useMasanielloStore } from "@/stores/masaniello-store"
import { translations } from "@/lib/translations"
import type { Config, Language } from "@/types"
import { DEFAULT_CONFIG } from "@/utils/constants"

interface ObjectiveInfoPanelProps {
  lang: Language
}

export function ObjectiveInfoPanel({ lang }: ObjectiveInfoPanelProps) {
  const { getActiveSession, matrix } = useMasanielloStore()
  const t = translations[lang]

  const session = getActiveSession()
  const config: Config = session?.config || DEFAULT_CONFIG

  const winRate = config.allOperations > 0 ? ((config.expectedITMs / config.allOperations) * 100).toFixed(2) : "0"
  const profitPercent = matrix.length ?( matrix[0][0] - 1) * 100 : 0
  const profit = config.totalRisk * (profitPercent / 100)
  const saldoFinalObjetivo = config.totalRisk + profit

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
          <span className="text-xs font-mono font-bold">${+saldoFinalObjetivo.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground text-[10px]">{t.performance}</span>
          <span className="text-xs font-mono font-bold text-success">{+profitPercent.toFixed(2)}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-medium text-muted-foreground text-[10px]">{t.netProfit}</span>
          <span className="text-xs font-mono font-bold text-success">€{+profit.toFixed(2)}</span>
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
