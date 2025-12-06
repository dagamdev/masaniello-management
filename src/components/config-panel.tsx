"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useTradingStore } from "@/stores/store"
import { translations } from "@/lib/translations"
import type { Language } from "@/types"

interface ConfigPanelProps {
  lang: Language
}

export function ConfigPanel({ lang }: ConfigPanelProps) {
  const { getActiveSession, updateConfig } = useTradingStore()
  const t = translations[lang]

  const session = getActiveSession()
  const config = session?.config || { totalRiesgo: 100, cantidadTrades: 3, itmEsperados: 1, pagaBroker: 85 }

  return (
    <Card className="overflow-hidden pt-0">
      <div className="bg-primary text-primary-foreground px-3 py-1.5 font-bold text-center text-lg">
        {t.configuration}
      </div>
      <div className="p-2 grid grid-cols-2 gap-x-3 gap-y-2">
        <div className="space-y-0.5">
          <label className="font-medium text-muted-foreground block text-xs">{t.totalRisk}</label>
          <Input
            type="number"
            value={config.totalRiesgo}
            onChange={(e) => updateConfig({ ...config, totalRiesgo: Number(e.target.value) })}
            className="text-right font-mono h-8 text-sm"
          />
        </div>
        <div className="space-y-0.5">
          <label className="font-medium text-muted-foreground block text-xs">{t.tradeCount}</label>
          <Input
            type="number"
            value={config.cantidadTrades}
            onChange={(e) => updateConfig({ ...config, cantidadTrades: Number(e.target.value) })}
            className="text-right font-mono h-8 text-sm"
          />
        </div>
        <div className="space-y-0.5">
          <label className="font-medium text-muted-foreground block text-xs">{t.brokerPayout}</label>
          <Input
            type="number"
            step="1"
            value={config.pagaBroker}
            onChange={(e) => updateConfig({ ...config, pagaBroker: Number(e.target.value) })}
            className="text-right font-mono h-8 text-sm"
          />
        </div>
        <div className="space-y-0.5">
          <label className="font-medium text-muted-foreground block text-xs">{t.expectedITM}</label>
          <Input
            type="number"
            value={config.itmEsperados}
            onChange={(e) => updateConfig({ ...config, itmEsperados: Number(e.target.value) })}
            className="text-right font-mono h-8 text-sm"
          />
        </div>
      </div>
    </Card>
  )
}
