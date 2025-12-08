"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Trophy, XCircle, RefreshCw, Copy } from "lucide-react"
import { useOperationStore } from "@/stores/operation-store"
import { translations } from "@/lib/translations"
import type { Language, Operation } from "@/types"
import { toast } from "sonner"
import { useEffect, useRef } from "react"
import { OperationCard } from "./operation-card"
import { calculateAmount } from "@/lib/masaniello"
import { useMasanielloStore } from "@/stores/masaniello-store"

interface OperationsTableProps {
  lang: Language
}

export function OperationsTable({ lang }: OperationsTableProps) {
  const balance = useRef(0)
  const lastAmount = useRef(0)
  const value = useRef(0)
  const { getActiveSession, deleteOperation, restoreOperation, resetCycle } = useOperationStore()
  const { matris, updateMatris } = useMasanielloStore()
  const t = translations[lang]

  const session = getActiveSession()
  
  useEffect(() => {
    if (session) {
      balance.current = session.config.totalRisk
    }
  }, [session])

  const operations = session?.operations || []
  const config = session?.config || {
    totalRisk: 100,
    operationCount: 10,
    expectedITMs: 4,
    brokerPayout: 85,
    progressiveMode: false,
    reinvestmentPercent: 50
  }

  updateMatris(config.operationCount, config.expectedITMs, config.brokerPayout)
  const cycleStatus = session?.cycleStatus || "active"

  const completedOperations = operations.filter((operation) => operation.at(1) !== null)
  const winningOperations = completedOperations.filter((operation) => operation[1] === 1).length
  const totalCompletedOperations = completedOperations.length
  const currentITMPercent = totalCompletedOperations > 0 ? ((winningOperations / totalCompletedOperations) * 100).toFixed(2) : "0.00"


  return (
    <Card className="overflow-hidden py-0">
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
          <Button onClick={resetCycle} size="sm" className="h-8 text-sm gap-1.5 shrink-0">
            <RefreshCw className="h-4 w-4" />
            {t.newCycle}
          </Button>
        </div>
      )}

      {/* Lista de operaciones */}
      <div>
        {operations.map((operation, opi, arr) => {
          const profit = config.brokerPayout / 100 + 1

          if (opi === 0) {
            lastAmount.current = calculateAmount(0, 0, matris, profit, balance.current, config.expectedITMs)
            value.current = lastAmount.current
          }

          const winnins = operations.filter((o, i) => i <= opi && o[1] === 1).length
          const losses = operations.filter((o, i) => i <= opi && o[1] !== 1).length
      
          if (operation[1] === 1) balance.current += lastAmount.current * (profit - 1)
          else balance.current -= lastAmount.current
          
          // Ganado
          if (winnins === config.expectedITMs) {
            return <OperationCard operation={operation} index={opi + 1} lang={lang} amount={0} balance={balance.current}/>
          }
      
          // Perdido
          if (losses >= config.operationCount - config.expectedITMs + 1) {
            balance.current -= lastAmount.current
            return <OperationCard operation={operation} index={opi + 1} lang={lang} amount={0} balance={balance.current}/>
          }
          if (opi + 1 === config.operationCount) {
            return <OperationCard operation={operation} index={opi + 1} lang={lang} amount={balance.current} balance={balance.current}/>
          }
      
          value.current = calculateAmount(winnins, losses, matris, profit, balance.current, config.expectedITMs, opi + 2 === config.operationCount)
          return <OperationCard operation={operation} index={opi + 1} lang={lang} amount={value.current} balance={balance.current}/>
        })}
      </div>
    </Card>
  )
}
