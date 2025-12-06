"use client"

import { Card } from "@/components/ui/card"
import { translations } from "@/lib/translations"
import type { Language } from "@/types"

interface InfoPanelProps {
  lang: Language
}

export function InfoPanel({ lang }: InfoPanelProps) {
  const t = translations[lang]

  return (
    <Card className="overflow-hidden pt-0">
      <div className="bg-primary text-primary-foreground px-3 py-1.5 font-bold text-center text-lg">
        {t.information}
      </div>
      <div className="p-2 space-y-1">
        <div className="flex items-start gap-1">
          <span className="font-bold min-w-[32px] text-xs">ITM:</span>
          <span className="text-muted-foreground text-xs">{t.itmInfo}</span>
        </div>
        <div className="flex items-start gap-1">
          <span className="font-bold min-w-[32px] text-xs">OTM:</span>
          <span className="text-muted-foreground text-xs">{t.otmInfo}</span>
        </div>
        <div className="pt-1 border-t">
          <div className="font-bold mb-0.5 text-xs">{t.brokerPayout.replace(" (%)", "")}:</div>
          <div className="text-muted-foreground text-xs">{t.brokerPayoutInfo}</div>
        </div>
      </div>
    </Card>
  )
}
