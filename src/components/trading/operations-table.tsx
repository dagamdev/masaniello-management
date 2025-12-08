"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Trophy, XCircle, RefreshCw, Copy } from "lucide-react"
import { useTradingStore } from "@/lib/store"
import { translations } from "@/lib/translations"
import type { Language, Trade } from "@/lib/types"
import { toast } from "sonner"

interface OperationsTableProps {
  lang: Language
}

export function OperationsTable({ lang }: OperationsTableProps) {
  const { getActiveSession, markTrade, updateTradeResult, deleteTrade, restoreTrade, resetCycle } = useTradingStore()
  const t = translations[lang]

  const session = getActiveSession()
  const trades = session?.trades || []
  const config = session?.config || {
    totalRiesgo: 100,
    cantidadTrades: 3,
    itmEsperados: 1,
    pagaBroker: 85,
    progressiveMode: false,
    reinvestmentPercent: 50,
  }
  const cycleStatus = session?.cycleStatus || "active"

  const completedTrades = trades.filter((trade) => trade.result !== null)
  const winningTrades = completedTrades.filter((trade) => trade.result === "W").length
  const totalCompletedTrades = completedTrades.length
  const currentITMPercent =
    totalCompletedTrades > 0 ? ((winningTrades / totalCompletedTrades) * 100).toFixed(2) : "0.00"

  const canDelete = (trade: Trade) => {
    const isLastTrade = trade.id === trades[trades.length - 1]?.id
    const lastTradeHasResult = trades[trades.length - 1]?.result !== null
    return trades.length > 1 && (!isLastTrade || lastTradeHasResult)
  }

  const copyInvestment = async (amount: number) => {
    try {
      await navigator.clipboard.writeText(amount.toFixed(2))
      toast.success(t.investmentCopied, {
        description: `€${amount.toFixed(2)}`,
      })
    } catch {
      toast.error("Error copying to clipboard")
    }
  }

  const handleDelete = (tradeId: number) => {
    deleteTrade(tradeId)
    toast(t.operationDeleted, {
      description: `#${tradeId}`,
      action: {
        label: t.undo,
        onClick: () => {
          restoreTrade()
          toast.success(t.operationRestored)
        },
      },
      duration: 5000,
    })
  }

  const getStatusText = (trade: Trade) => {
    if (trade.result === null) return t.markWL
    if (trade.result === "W") return t.hasWon
    const maxLosses = config.cantidadTrades - config.itmEsperados
    const currentLosses = trades.filter((t) => t.result === "L").length
    const remainingLosses = maxLosses - currentLosses
    if (remainingLosses <= 0) return lang === "es" ? "Sin margen" : "No margin"
    return lang === "es"
      ? `${remainingLosses} fallo${remainingLosses > 1 ? "s" : ""} disponible${remainingLosses > 1 ? "s" : ""}`
      : `${remainingLosses} failure${remainingLosses > 1 ? "s" : ""} left`
  }

  const WLButtons = ({ trade }: { trade: Trade }) => {
    const baseClass = "w-8 h-8 rounded font-bold text-sm border-2 transition-all"

    if (trade.result === null) {
      return (
        <div className="flex gap-1">
          <button
            onClick={() => markTrade(trade.id, "W")}
            disabled={cycleStatus !== "active"}
            className={`${baseClass} bg-success/20 hover:bg-success text-success border-success disabled:opacity-50`}
          >
            W
          </button>
          <button
            onClick={() => markTrade(trade.id, "L")}
            disabled={cycleStatus !== "active"}
            className={`${baseClass} bg-destructive/20 hover:bg-destructive text-destructive border-destructive disabled:opacity-50`}
          >
            L
          </button>
        </div>
      )
    }
    return (
      <div className="flex gap-1">
        <button
          onClick={() => updateTradeResult(trade.id, "W")}
          disabled={cycleStatus !== "active"}
          className={`${baseClass} ${
            trade.result === "W"
              ? "bg-success text-white border-success"
              : "bg-success/20 hover:bg-success text-success border-success"
          } disabled:opacity-50`}
        >
          W
        </button>
        <button
          onClick={() => updateTradeResult(trade.id, "L")}
          disabled={cycleStatus !== "active"}
          className={`${baseClass} ${
            trade.result === "L"
              ? "bg-destructive text-white border-destructive"
              : "bg-destructive/20 hover:bg-destructive text-destructive border-destructive"
          } disabled:opacity-50`}
        >
          L
        </button>
      </div>
    )
  }

  const TradeCard = ({ trade }: { trade: Trade }) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      {/* Número y botones W/L */}
      <span className="text-base font-bold text-primary w-8">#{trade.id}</span>
      <WLButtons trade={trade} />

      {/* Inversión con copy */}
      <button
        onClick={() => copyInvestment(trade.inversion)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted/50 hover:bg-muted transition-colors min-w-[90px]"
        title={t.copyInvestment}
      >
        <span className="font-mono text-sm font-medium">€{trade.inversion.toFixed(2)}</span>
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {/* Datos en grid flexible - text sizes normalized */}
      <div className="flex-1 flex items-center gap-3 text-sm flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground hidden sm:inline">{t.return}:</span>
          <span
            className={`font-mono font-medium ${trade.result === null ? "text-muted-foreground" : trade.retorno >= 0 ? "text-success" : "text-destructive"}`}
          >
            {trade.result === null ? "-" : `€${trade.retorno.toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground hidden sm:inline">{t.balance}:</span>
          <span className="font-mono font-semibold">{trade.result === null ? "-" : `€${trade.saldo.toFixed(2)}`}</span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <span className="text-muted-foreground">ITM:</span>
          <span className="font-mono">{trade.result === null ? "-" : `${trade.itmPercent.toFixed(1)}%`}</span>
        </div>
        <span className="text-muted-foreground text-xs hidden lg:inline italic">{getStatusText(trade)}</span>
      </div>

      {/* Botón eliminar */}
      <Button
        onClick={() => handleDelete(trade.id)}
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
        disabled={!canDelete(trade)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )

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
        {trades.map((trade) => (
          <TradeCard key={trade.id} trade={trade} />
        ))}
      </div>
    </Card>
  )
}
