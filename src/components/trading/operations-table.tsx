"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, XCircle, RefreshCw } from "lucide-react"
import { useOperationStore } from "@/lib/store"
import { translations } from "@/lib/translations"
import type { Language } from "@/types"
import { OperationCard } from "./operation-card"
import { useRef } from "react"

interface OperationsTableProps {
  lang: Language
}

export function OperationsTable({ lang }: OperationsTableProps) {
  const { getActiveSession, resetCycle } = useOperationStore()
  const t = translations[lang]
  const activeDeleteToastRef = useRef<string | number | null>(null)

  const session = getActiveSession()
  const operations = session?.operations || []
  const cycleStatus = session?.cycleStatus || "active"

  const completedTrades = operations.filter((operation) => operation.result !== null)
  const winningTrades = completedTrades.filter((operation) => operation.result === "W").length
  const totalCompletedTrades = completedTrades.length
  const currentITMPercent =totalCompletedTrades > 0 ? ((winningTrades / totalCompletedTrades) * 100).toFixed(2) : "0.00"

  return (
    <Card className="overflow-hidden py-0 gap-0">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex justify-between items-center">
        <h2 className="font-bold text-base sm:text-lg">{t.operations}</h2>
        <span className="text-sm sm:text-base font-mono">
          ITM: <span className="text-success font-bold">{currentITMPercent}%</span>
        </span>
      </div>

      {/* Notificación de ciclo */}
      {cycleStatus !== "active" && (
        <div
          className={`px-4 py-3 flex items-center justify-between gap-2 ${cycleStatus === "won" ? "bg-success/20" : "bg-destructive/20"}`}
        >
          <div className="flex items-center gap-2">
            {cycleStatus === "won" ? (
              <Trophy className="h-5 w-5 text-success shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
            )}
            <div>
              <p className={`text-sm font-medium ${cycleStatus === "won" ? "text-success" : "text-destructive"}`}>
                {cycleStatus === "won" ? t.cycleWon : t.cycleLost}
              </p>
            </div>
          </div>
          <Button onClick={resetCycle} size="sm" className="h-8 text-sm gap-1.5 shrink-0 cursor-pointer">
            <RefreshCw className="h-4 w-4" />
            {t.newCycle}
          </Button>
        </div>
      )}

      {/* Lista de operaciones */}
      <div>
        {operations.map((operation, opi) => (
          <OperationCard key={operation.id} operations={operations} operation={operation} lang={lang} index={opi} activeDeleteToastRef={activeDeleteToastRef} />
        ))}
      </div>
    </Card>
  )
}
