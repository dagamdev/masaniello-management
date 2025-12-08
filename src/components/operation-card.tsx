'use client'

import { Copy, Trash2 } from "lucide-react"
import { Button } from "./ui/button"
import { Language, Operation } from "@/types"
import { useOperationStore } from "@/stores/operation-store"
import { toast } from "sonner"
import { translations } from "@/lib/translations"

export function OperationCard ({ operation, index, lang, amount, balance }: { 
  operation: Operation
  index: number
  lang: Language
  amount: number
  balance: number
}) {
  const [operationId, operationResult] = operation
  const { markOperation, getActiveSession, updateOperationResult, deleteOperation, restoreOperation } = useOperationStore()
  const session = getActiveSession()
  const cycleStatus = session?.cycleStatus || "active"
  const t = translations[lang]

  const retorno = 23, itmPercent = 30

  const WLButtons = ({ operation }: { operation: Operation }) => {
    const baseClass = "w-8 h-8 rounded font-bold text-sm border-2 transition-all"

    if (operationResult === null) {
      return (
        <div className="flex gap-1">
          <button
            onClick={() => markOperation(operationId, "W")}
            disabled={cycleStatus !== "active"}
            className={`${baseClass} bg-success/20 hover:bg-success text-success border-success disabled:opacity-50`}
          >
            W
          </button>
          <button
            onClick={() => markOperation(operationId, "L")}
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
          onClick={() => updateOperationResult(operationId, "W")}
          disabled={cycleStatus !== "active"}
          className={`${baseClass} ${
            operationResult === 1
              ? "bg-success text-white border-success"
              : "bg-success/20 hover:bg-success text-success border-success"
          } disabled:opacity-50`}
        >
          W
        </button>
        <button
          onClick={() => updateOperationResult(operationId, "L")}
          disabled={cycleStatus !== "active"}
          className={`${baseClass} ${
            operationResult === 0
              ? "bg-destructive text-white border-destructive"
              : "bg-destructive/20 hover:bg-destructive text-destructive border-destructive"
          } disabled:opacity-50`}
        >
          L
        </button>
      </div>
    )
  }

  const operations = session?.operations ?? []

  const canDelete = ([operationId, operationResult]: Operation) => {
    const isLastOperation = operationId === operations.at(-1)?.[0]
    const lastOperationHasResult = operations.at(-1)?.[1] !== null
    return operations.length > 1 && (!isLastOperation || lastOperationHasResult)
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

  const handleDelete = () => {
    deleteOperation(operationId)
    toast(t.operationDeleted, {
      description: `#${index}`,
      action: {
        label: t.undo,
        onClick: () => {
          restoreOperation()
          toast.success(t.operationRestored)
        },
      },
      duration: 5000,
    })
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors">
      {/* Número y botones W/L */}
      <span className="text-base font-bold text-primary w-8">#{index++}</span>
      <WLButtons operation={operation} />

      {/* Inversión con copy */}
      <button
        onClick={() => copyInvestment(amount)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted/50 hover:bg-muted transition-colors min-w-[90px]"
        title={t.copyInvestment}
      >
        <span className="font-mono text-sm font-medium">€{amount.toFixed(2)}</span>
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {/* Datos en grid flexible - text sizes normalized */}
      <div className="flex-1 flex items-center gap-3 text-sm flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground hidden sm:inline">{t.return}:</span>
          <span
            className={`font-mono font-medium ${operationResult === null ? "text-muted-foreground" : retorno >= 0 ? "text-success" : "text-destructive"}`}
          >
            {operationResult === null ? "-" : `€${retorno.toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground hidden sm:inline">{t.balance}:</span>
          <span className="font-mono font-semibold">{operationResult === null ? "-" : `€${balance.toFixed(2)}`}</span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <span className="text-muted-foreground">ITM:</span>
          <span className="font-mono">{operationResult === null ? "-" : `${itmPercent.toFixed(1)}%`}</span>
        </div>
        <span className="text-muted-foreground text-xs hidden lg:inline italic">Te quedan 3 OTMs</span>
      </div>

      {/* Botón eliminar */}
      <Button
        onClick={() => handleDelete()}
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
        disabled={!canDelete(operation)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}