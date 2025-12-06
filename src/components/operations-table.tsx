"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useTradingStore } from "@/stores/store"
import { translations } from "@/lib/translations"
import type { Language, Trade } from "@/types"

interface OperationsTableProps {
  lang: Language
}

export function OperationsTable({ lang }: OperationsTableProps) {
  const { getActiveSession, markTrade, updateTradeResult, deleteTrade } = useTradingStore()
  const t = translations[lang]

  const session = getActiveSession()
  const trades = session?.trades || []
  const config = session?.config || { totalRiesgo: 100, cantidadTrades: 3, itmEsperados: 1, pagaBroker: 85 }

  const completedTrades = trades.filter((trade) => trade.result !== null)
  const winningTrades = completedTrades.filter((trade) => trade.result === "W").length
  const totalCompletedTrades = completedTrades.length
  const currentITMPercent =
    totalCompletedTrades > 0 ? ((winningTrades / totalCompletedTrades) * 100).toFixed(2) : "0.00"

  const canDelete = (trade: Trade) => {
    const isLastTrade = trade.id === trades[trades.length - 1]?.id
    return trades.length > 1 && (!isLastTrade || trade.result !== null)
  }

  const getFallosPendientes = (trade: Trade) => {
    if (trade.result === null) return t.markWL
    if (trade.result === "W") return t.hasWon
    const maxLosses = config.cantidadTrades - config.itmEsperados
    return `${t.remaining} ${maxLosses} OTM`
  }

  return (
    <Card className="overflow-hidden py-0">
      <div className="bg-primary text-primary-foreground px-4 py-2 flex justify-between items-center">
        <h2 className="font-bold text-xl">{t.operations}</h2>
        <div className="text-base font-mono font-bold">
          ITM: <span className="text-success">{currentITMPercent}%</span>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-semibold">{t.number}</th>
              <th className="p-3 text-left font-semibold">W - L</th>
              <th className="p-3 text-right font-semibold">{t.investment}</th>
              <th className="p-3 text-right font-semibold">{t.return}</th>
              <th className="p-3 text-right font-semibold">{t.balance}</th>
              <th className="p-3 text-right font-semibold">% ITM</th>
              <th className="p-3 text-left font-semibold">{t.pendingFailures}</th>
              <th className="p-3 text-center font-semibold">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b hover:bg-muted/30 transition-colors">
                <td className="p-3 font-medium">{trade.id}</td>
                <td className="p-3">
                  {trade.result === null ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => markTrade(trade.id, "W")}
                        className="inline-flex items-center justify-center w-8 h-8 rounded font-bold bg-success/20 hover:bg-success text-success-foreground border-2 border-success transition-colors cursor-pointer"
                        title={t.markAsWin}
                      >
                        W
                      </button>
                      <button
                        onClick={() => markTrade(trade.id, "L")}
                        className="inline-flex items-center justify-center w-8 h-8 rounded font-bold bg-destructive/20 hover:bg-destructive text-destructive-foreground border-2 border-destructive transition-colors cursor-pointer"
                        title={t.markAsLoss}
                      >
                        L
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateTradeResult(trade.id, "W")}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold border-2 transition-colors cursor-pointer ${
                          trade.result === "W"
                            ? "bg-success text-success-foreground border-success"
                            : "bg-success/20 hover:bg-success text-success-foreground border-success"
                        }`}
                        title={t.markAsWin}
                      >
                        W
                      </button>
                      <button
                        onClick={() => updateTradeResult(trade.id, "L")}
                        className={`inline-flex items-center justify-center w-8 h-8 rounded font-bold border-2 transition-colors cursor-pointer ${
                          trade.result === "L"
                            ? "bg-destructive text-destructive-foreground border-destructive"
                            : "bg-destructive/20 hover:bg-destructive text-destructive-foreground border-destructive"
                        }`}
                        title={t.markAsLoss}
                      >
                        L
                      </button>
                    </div>
                  )}
                </td>
                <td className="p-3 text-right font-mono">€ {trade.inversion.toFixed(2)}</td>
                <td
                  className={`p-3 text-right font-mono ${trade.result === null ? "" : trade.retorno >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {trade.result === null ? "-" : `€ ${trade.retorno.toFixed(2)}`}
                </td>
                <td className="p-3 text-right font-mono font-semibold">
                  {trade.result === null ? "-" : `€ ${trade.saldo.toFixed(2)}`}
                </td>
                <td className="p-3 text-right font-mono">
                  {trade.result === null ? "-" : `${trade.itmPercent.toFixed(2)}%`}
                </td>
                <td className="p-3 text-muted-foreground">{getFallosPendientes(trade)}</td>
                <td className="p-3 text-center">
                  <Button
                    onClick={() => deleteTrade(trade.id)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={!canDelete(trade)}
                    title={
                      trades.length <= 1
                        ? t.cannotDeleteLast
                        : !canDelete(trade)
                          ? t.cannotDeleteUnmarked
                          : t.deleteOperation
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
