import { Language, Operation } from "@/types"
import { Button } from "../ui/button"
import { toast } from "sonner"
import { useMasanielloStore } from "@/stores/masaniello-store"
import { Copy, Trash2 } from "lucide-react"
import { translations } from "@/lib/translations"
import { RefObject, useRef } from "react"

export function OperationCard ({ operations, operation, lang, index, activeDeleteToastRef }: { 
  operations: Operation[]
  operation: Operation
  lang: Language
  index: number
  activeDeleteToastRef: RefObject<string | number | null>
}) {
  const { deleteOperation, restoreOperation, getActiveSession, markOperation, updateOperationResult } = useMasanielloStore()
  const t = translations[lang]

  // console.log(operation)

  const canDelete = (operation: Operation) => {
    const isLastTrade = operation.id === operations[operations.length - 1]?.id
    const lastTradeHasResult = operations[operations.length - 1]?.result !== null
    return operations.length > 1 && (!isLastTrade || lastTradeHasResult)
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
    if (activeDeleteToastRef.current !== null) {
      toast.dismiss(activeDeleteToastRef.current)
    }

    deleteOperation(operation.id)

    const toastId = toast(t.operationDeleted, {
      description: `#${index+1}`,
      action: {
        label: t.undo,
        onClick: () => {
          restoreOperation()
          toast.success(t.operationRestored)
          activeDeleteToastRef.current = null
        },
      },
      duration: 5000,
      onDismiss: () => {
        activeDeleteToastRef.current = null
      },
      onAutoClose: () => {
        activeDeleteToastRef.current = null
      },
    })

    activeDeleteToastRef.current = toastId
  }

  const session = getActiveSession()
  const cycleStatus = session?.cycleStatus || "active"

  const WLButtons = ({ operation }: { operation: Operation }) => {
    const baseClass = "w-8 h-8 rounded font-bold text-sm border-2 transition-all"

    if (operation.result === null) {
      return (
        <div className="flex gap-1">
          <button
            onClick={() => markOperation("W")}
            disabled={cycleStatus !== "active"}
            className={`${baseClass} bg-success/20 hover:bg-success text-success hover:text-white border-success disabled:opacity-50 cursor-pointer`}
          >
            W
          </button>
          <button
            onClick={() => markOperation("L")}
            disabled={cycleStatus !== "active"}
            className={`${baseClass} bg-destructive/20 hover:bg-destructive text-destructive hover:text-white border-destructive disabled:opacity-50 cursor-pointer`}
          >
            L
          </button>
        </div>
      )
    }
    return (
      <div className="flex gap-1">
        <button
          onClick={() => updateOperationResult(operation.id, "W")}
          disabled={cycleStatus !== "active"}
          className={`${baseClass} ${
            operation.result === "W"
              ? "bg-success text-white border-success"
              : "bg-success/20 text-success border-success " + (cycleStatus !== 'active' ? '' : 'hover:bg-success hover:text-white cursor-pointer')
          } disabled:opacity-50`}
        >
          W
        </button>
        <button
          onClick={() => updateOperationResult(operation.id, "L")}
          disabled={cycleStatus !== "active"}
          className={`${baseClass} ${
            operation.result === "L"
              ? "bg-destructive text-white border-destructive"
              : "bg-destructive/20 text-destructive border-destructive " + (cycleStatus !== 'active' ? '' : 'hover:bg-destructive hover:text-white cursor-pointer')
          } disabled:opacity-50`}
        >
          L
        </button>
      </div>
    )
  }

  return (
    <div className={'flex items-center gap-3 px-4 py-3 border-b last:border-b-0 transition-colors ' + (cycleStatus !== 'active' ? '' : 'hover:bg-muted/30')}>
      {/* Número y botones W/L */}
      <span className="text-base font-bold text-primary w-8">#{index + 1}</span>
      <WLButtons operation={operation} />

      {/* Inversión con copy */}
      <button
        onClick={() => copyInvestment(operation.amount)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted/50 hover:bg-muted transition-colors min-w-[90px] cursor-pointer"
        title={t.copyInvestment}
      >
        <span className="font-mono text-sm font-medium">€{operation.amount.toFixed(2)}</span>
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {/* Datos en grid flexible - text sizes normalized */}
      <div className="flex-1 flex items-center gap-3 text-sm flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground hidden sm:inline">{t.return}:</span>
          <span
            className={`font-mono font-medium ${operation.result === null ? "text-muted-foreground" : operation.profit >= 0 ? "text-success" : "text-destructive"}`}
          >
            {operation.result === null ? "-" : `€${operation.profit.toFixed(2)}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground hidden sm:inline">{t.balance}:</span>
          <span className="font-mono font-semibold">{operation.result === null ? "-" : `€${operation.balance.toFixed(2)}`}</span>
        </div>
        <div className="hidden md:flex items-center gap-1">
          <span className="text-muted-foreground">ITM:</span>
          <span className="font-mono">{operation.result === null ? "-" : `${operation.winRate.toFixed(2)}%`}</span>
        </div>
        <span className="text-muted-foreground text-xs italic">{operation.status}</span>
      </div>

      {/* Botón eliminar */}
      <Button
        onClick={() => handleDelete()}
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
        disabled={cycleStatus !== "active" || !canDelete(operation)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}