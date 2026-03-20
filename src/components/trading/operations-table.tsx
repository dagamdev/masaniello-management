"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, XCircle, RefreshCw, Trash } from "lucide-react"
import { useMasanielloStore } from "@/stores/masaniello-store"
import { translations } from "@/lib/translations"
import type { Language } from "@/types"
import { OperationCard } from "./operation-card"
import { useRef, useState } from "react"
import { toast } from "sonner"

interface OperationsTableProps {
  lang: Language
}

export function OperationsTable({ lang }: OperationsTableProps) {
  const { getActiveSession, resetCycle, clearAllTrades } = useMasanielloStore()
  const t = translations[lang]
  const activeDeleteToastRef = useRef<string | number | null>(null)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const session = getActiveSession()
  const operations = session?.operations || []
  const cycleStatus = session?.cycleStatus || "active"

  const completedTrades = operations.filter((operation) => operation.result !== null)
  const winningTrades = completedTrades.filter((operation) => operation.result === "W").length
  const losingTrades = completedTrades.filter((operation) => operation.result === "L").length
  const totalCompletedTrades = completedTrades.length
  const currentITMPercent =totalCompletedTrades > 0 ? ((winningTrades / totalCompletedTrades) * 100).toFixed(2) : "0.00"

  const handleClearAll = () => {
    setShowClearConfirm(true)
  }

  const confirmClearAll = () => {
    clearAllTrades()
    setShowClearConfirm(false)
    toast.success(t.allOperationsCleared)
  }

  return (
    <>
      <Card className="overflow-hidden py-0 gap-0">
        <div className="bg-primary text-primary-foreground px-4 py-2 flex justify-between items-center">
          <h2 className="font-bold text-base sm:text-lg">{t.operations}</h2>
          <div className="flex items-center gap-4">
            <span className="sm:text-sm font-mono">
              <span className="text-success font-bold">{winningTrades}W</span>
              <span className="mx-1">/</span>
              <span className="text-red-500 font-bold">{losingTrades}L</span>
              <span className="mx-1">/</span>
              <span className="font-bold">{totalCompletedTrades}</span>
            </span>
            <span className="text-sm sm:text-base font-mono">
              ITM: <span className="text-success font-bold">{currentITMPercent}%</span>
            </span>
            <Button
              onClick={handleClearAll}
              variant="secondary"
              size="sm"
              className="h-7 cursor-pointer"
              disabled={operations.length <= 1}
            >
              <Trash className="h-3.5 w-3.5" />
              <span className="hidden sm:inline text-xs">{t.clearAllOperations}</span>
            </Button>
          </div>
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
        <div className='flex flex-col-reverse'>
          {operations.map((operation, opi) => (
            <OperationCard key={operation.id} operations={operations} operation={operation} lang={lang} index={opi} activeDeleteToastRef={activeDeleteToastRef} />
          ))}
        </div>
      </Card> 

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-destructive">{t.confirmClearAll}</h3>
            <p className="text-sm text-muted-foreground">{t.clearAllConfirm}</p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" className="cursor-pointer" onClick={() => setShowClearConfirm(false)}>
                {t.cancel}
              </Button>
              <Button variant="destructive" className="cursor-pointer" onClick={confirmClearAll}>
                {t.delete}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}
