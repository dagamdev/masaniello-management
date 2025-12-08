"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useTradingStore } from "@/lib/store"
import { translations } from "@/lib/translations"
import type { Language } from "@/lib/types"

interface ConfigPanelProps {
  lang: Language
}

export function ConfigPanel({ lang }: ConfigPanelProps) {
  const { getActiveSession, updateConfig } = useTradingStore()
  const t = translations[lang]

  const session = getActiveSession()

  const config = {
    totalRiesgo: session?.config?.totalRiesgo ?? 100,
    cantidadTrades: session?.config?.cantidadTrades ?? 3,
    itmEsperados: session?.config?.itmEsperados ?? 1,
    pagaBroker: session?.config?.pagaBroker ?? 85,
    progressiveMode: session?.config?.progressiveMode ?? false,
    reinvestmentPercent: session?.config?.reinvestmentPercent ?? 50,
  }

  return (
    <Card className="overflow-hidden pt-0">
      <div className="bg-primary text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 font-bold text-center text-sm sm:text-lg">
        {t.configuration}
      </div>
      <div className="p-1.5 sm:p-2 grid grid-cols-2 gap-x-2 sm:gap-x-3 gap-y-1.5 sm:gap-y-2">
        <div className="space-y-0.5">
          <label className="font-medium text-muted-foreground block text-[10px] sm:text-xs">{t.totalRisk}</label>
          <Input
            type="number"
            value={config.totalRiesgo}
            onChange={(e) => updateConfig({ ...config, totalRiesgo: Number(e.target.value) })}
            className="text-right font-mono h-7 sm:h-8 text-xs sm:text-sm"
          />
        </div>
        <div className="space-y-0.5">
          <label className="font-medium text-muted-foreground block text-[10px] sm:text-xs">{t.tradeCount}</label>
          <Input
            type="number"
            value={config.cantidadTrades}
            onChange={(e) => updateConfig({ ...config, cantidadTrades: Number(e.target.value) })}
            className="text-right font-mono h-7 sm:h-8 text-xs sm:text-sm"
          />
        </div>
        <div className="space-y-0.5">
          <label className="font-medium text-muted-foreground block text-[10px] sm:text-xs">{t.brokerPayout}</label>
          <Input
            type="number"
            step="1"
            value={config.pagaBroker}
            onChange={(e) => updateConfig({ ...config, pagaBroker: Number(e.target.value) })}
            className="text-right font-mono h-7 sm:h-8 text-xs sm:text-sm"
          />
        </div>
        <div className="space-y-0.5">
          <label className="font-medium text-muted-foreground block text-[10px] sm:text-xs">{t.expectedITM}</label>
          <Input
            type="number"
            value={config.itmEsperados}
            onChange={(e) => updateConfig({ ...config, itmEsperados: Number(e.target.value) })}
            className="text-right font-mono h-7 sm:h-8 text-xs sm:text-sm"
          />
        </div>
        <div className="col-span-2 flex items-center justify-between border-t pt-1.5 sm:pt-2 mt-0.5 sm:mt-1">
          <label className="font-medium text-muted-foreground text-[10px] sm:text-xs">{t.progressiveMode}</label>
          <Switch
            checked={config.progressiveMode}
            onCheckedChange={(checked) => updateConfig({ ...config, progressiveMode: checked })}
            className="scale-90 sm:scale-100"
          />
        </div>
        {config.progressiveMode && (
          <div className="col-span-2 space-y-0.5">
            <label className="font-medium text-muted-foreground block text-[10px] sm:text-xs">
              {t.reinvestmentPercent}
            </label>
            <Input
              type="number"
              min="1"
              max="100"
              value={config.reinvestmentPercent}
              onChange={(e) => {
                const value = Math.min(100, Math.max(1, Number(e.target.value)))
                updateConfig({ ...config, reinvestmentPercent: value })
              }}
              className="text-right font-mono h-7 sm:h-8 text-xs sm:text-sm"
            />
          </div>
        )}
      </div>
    </Card>
  )
}
