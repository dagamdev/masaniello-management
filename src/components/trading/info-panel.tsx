"use client"

import { Card } from "@/components/ui/card"
import { translations } from "@/lib/translations"
import type { Language } from "@/lib/types"

interface InfoPanelProps {
  lang: Language
}

export function InfoPanel({ lang }: InfoPanelProps) {
  const t = translations[lang]

  return (
    <Card className="overflow-hidden pt-0">
      <div className="bg-primary text-primary-foreground px-2 sm:px-3 py-1 sm:py-1.5 font-bold text-center text-sm sm:text-lg">
        {t.information}
      </div>
      <div className="p-1.5 sm:p-2 space-y-0.5 sm:space-y-1">
        <div className="flex items-start gap-1">
          <span className="font-bold min-w-[28px] sm:min-w-[32px] text-[10px] sm:text-xs">ITM:</span>
          <span className="text-muted-foreground text-[10px] sm:text-xs">{t.itmInfo}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold min-w-[28px] sm:min-w-[32px] text-[10px] sm:text-xs">OTM:</span>
          <span className="text-muted-foreground text-[10px] sm:text-xs">{t.otmInfo}</span>
        </div>
        <div className="pt-0.5 sm:pt-1 border-t">
          <div className="font-bold mb-0.5 text-[10px] sm:text-xs">{t.brokerPayout.replace(" (%)", "")}:</div>
          <div className="text-muted-foreground text-[10px] sm:text-xs">{t.brokerPayoutInfo}</div>
        </div>
      </div>
    </Card>
  )
}
