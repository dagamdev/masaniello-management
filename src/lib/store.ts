import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Session, Config, Operation, CycleStatus } from "@/types"

const defaultConfig: Config = {
  totalRisk: 100,
  allOperations: 10,
  expectedITMs: 4,
  brokerPayour: 85,
  progressiveMode: false,
  reinvestmentPercent: 50
}

const createDefaultOperation = (config: Config): Operation => ({
  id: crypto.randomUUID(),
  index: 1,
  result: null,
  amount: config.totalRisk * 0.1,
  profit: 0,
  balance: config.totalRisk,
  winRate: 0,
  status: "",
})

const createNewSession = (name: string): Session => {
  const config = { ...defaultConfig }
  return {
    id: crypto.randomUUID(),
    name,
    config,
    operations: [createDefaultOperation(config)],
    createdAt: Date.now(),
    cycleStatus: "active",
  }
}

interface OperationStore {
  sessions: Session[]
  activeSessionId: string | null
  deletedOperation: { operation: Operation; index: number } | null

  // Session actions
  createSession: (name: string) => void
  deleteSession: (id: string) => void
  updateSessionName: (id: string, name: string) => void
  setActiveSession: (id: string) => void
  resetCycle: () => void

  // Config actions
  updateConfig: (config: Config) => void

  // Operation actions
  markOperation: (operationId: string, result: "W" | "L") => void
  updateOperationResult: (operationId: string, result: "W" | "L") => void
  deleteOperation: (operationId: string) => void
  restoreOperation: () => void

  // Helpers
  getActiveSession: () => Session | undefined
  initializeStore: () => void
}

export const useOperationStore = create<OperationStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      deletedOperation: null,

      initializeStore: () => {
        const { sessions } = get()
        if (sessions.length === 0) {
          const defaultSession = createNewSession("Gestión 1")
          set({ sessions: [defaultSession], activeSessionId: defaultSession.id })
        } else if (!get().activeSessionId && sessions.length > 0) {
          set({ activeSessionId: sessions[0].id })
        }
      },

      createSession: (name) => {
        const newSession = createNewSession(name)
        set((state) => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: newSession.id,
        }))
      },

      deleteSession: (id) => {
        set((state) => {
          if (state.sessions.length <= 1) return state
          const newSessions = state.sessions.filter((s) => s.id !== id)
          const newActiveId = state.activeSessionId === id ? newSessions[0]?.id : state.activeSessionId
          return { sessions: newSessions, activeSessionId: newActiveId }
        })
      },

      updateSessionName: (id, name) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === id ? { ...s, name } : s)),
        }))
      },

      setActiveSession: (id) => {
        set({ activeSessionId: id })
      },

      resetCycle: () => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state

          const newTrade = createDefaultOperation(session.config)
          return {
            sessions: state.sessions.map((s) =>
              s.id === state.activeSessionId ? { ...s, trades: [newTrade], cycleStatus: "active" as CycleStatus } : s,
            ),
          }
        })
      },

      updateConfig: (config) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === state.activeSessionId ? { ...s, config } : s)),
        }))
      },

      markOperation: (operationId, result) => {
        console.log("markOperation", operationId, result)
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state

          const { config, operations } = session
          console.log({config, operations})

          const updatedTrades = operations.map((trade) => {
            if (trade.id === operationId) {
              let retorno = 0
              let newSaldo = trade.balance

              if (result === "W") {
                retorno = trade.amount * (config.brokerPayour / 100)
                newSaldo = trade.balance + retorno
              } else {
                retorno = -trade.amount
                newSaldo = trade.balance - trade.amount
              }

              const completedTrades = operations.slice(0, trade.index)
              const wins = completedTrades.filter((t) => t.result === "W").length + (result === "W" ? 1 : 0)
              const itmPercent = (wins / trade.index) * 100

              return {
                ...trade,
                result,
                retorno: Math.round(retorno * 100) / 100,
                saldo: Math.round(newSaldo * 100) / 100,
                itmPercent: Math.round(itmPercent * 100) / 100,
                fallosPendientes: result === "W" ? "won" : "remaining",
              }
            }
            return trade
          })

          // Recalculate subsequent operations
          for (let i = 0; i < updatedTrades.length; i++) {
            if (updatedTrades[i].id > operationId && updatedTrades[i].result) {
              const prevTrade = updatedTrades[i - 1]
              updatedTrades[i].balance = prevTrade.balance

              if (updatedTrades[i].result === "W") {
                updatedTrades[i].profit = updatedTrades[i].amount * (config.brokerPayour / 100)
                updatedTrades[i].balance += updatedTrades[i].profit
              } else {
                updatedTrades[i].profit = -updatedTrades[i].amount
                updatedTrades[i].balance -= updatedTrades[i].amount
              }
              updatedTrades[i].balance = Math.round(updatedTrades[i].balance * 100) / 100
            }
          }

          const completedTradesCount = updatedTrades.filter((t) => t.result !== null).length
          const winsCount = updatedTrades.filter((t) => t.result === "W").length
          const lossesCount = updatedTrades.filter((t) => t.result === "L").length
          const maxLosses = config.allOperations - config.expectedITMs

          let cycleStatus: CycleStatus = "active"
          let shouldAddNewTrade = true

          // Check if cycle is complete
          if (!config.progressiveMode) {
            // Non-progressive mode: limit is allOperations
            if (completedTradesCount >= config.allOperations) {
              cycleStatus = winsCount >= config.expectedITMs ? "won" : "lost"
              shouldAddNewTrade = false
            } else if (lossesCount > maxLosses) {
              // Already exceeded max losses
              cycleStatus = "lost"
              shouldAddNewTrade = false
            } else if (winsCount >= config.expectedITMs) {
              // Already achieved ITM goal
              cycleStatus = "won"
              shouldAddNewTrade = false
            }
          }

          // Generate new trade if cycle is still active
          let finalTrades = updatedTrades
          if (shouldAddNewTrade) {
            const lastTrade = updatedTrades[updatedTrades.length - 1]
            const currentBalance = lastTrade.balance

            let consecutiveLosses = 0
            for (let i = updatedTrades.length - 1; i >= 0; i--) {
              if (updatedTrades[i].result === "L") consecutiveLosses++
              else if (updatedTrades[i].result === "W") break
            }

            const baseInversion = currentBalance * 0.1
            const multiplier = Math.pow(2, consecutiveLosses)
            let amount = Math.min(baseInversion * multiplier, currentBalance)
            amount = Math.round(amount * 100) / 100

            const newOperation: Operation = {
              id: crypto.randomUUID(),
              index: operations.length + 1,
              result: null,
              amount,
              profit: 0,
              balance: Math.round(currentBalance * 100) / 100,
              winRate: 0,
              status: "",
            }

            finalTrades = [...updatedTrades, newOperation]
          }

          return {
            sessions: state.sessions.map((s) =>
              s.id === state.activeSessionId ? { ...s, operations: finalTrades, cycleStatus } : s,
            ),
          }
        })
      },

      updateOperationResult: (operationId, newResult) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state

          const { config, operations } = session
          const initialBalance = config.totalRisk
          let tradeIndex = 0

          const updatedTrades = operations.map((trade) => {
            if (trade.id === operationId) {
              tradeIndex = trade.index
              const prevTrade = operations[trade.index - 2]
              const prevSaldo = prevTrade ? prevTrade.balance : initialBalance

              let retorno = 0
              if (newResult === "W") {
                retorno = trade.amount * (config.brokerPayour / 100)
              } else {
                retorno = -trade.amount
              }

              const newSaldo = prevSaldo + retorno
              const completedTrades = operations.slice(0, trade.index)
              const wins =
                completedTrades.filter((t) => t.result === "W").length +
                (newResult === "W" ? 1 : 0) -
                (trade.result === "W" ? 1 : 0)
              const itmPercent = Math.round((wins / trade.index) * 100)

              return {
                ...trade,
                result: newResult,
                retorno: Math.round(retorno * 100) / 100,
                saldo: Math.round(newSaldo * 100) / 100,
                itmPercent,
                fallosPendientes: newResult === "W" ? "won" : "remaining",
              }
            }
            return trade
          })

          // Recalculate subsequent operations
          for (let i = 0; i < updatedTrades.length; i++) {
            if (updatedTrades[i].index > tradeIndex && updatedTrades[i].result) {
              const prevTrade = updatedTrades[i - 1]
              updatedTrades[i].balance = prevTrade.balance

              if (updatedTrades[i].result === "W") {
                updatedTrades[i].profit = updatedTrades[i].amount * (config.brokerPayour / 100)
                updatedTrades[i].balance += updatedTrades[i].profit
              } else {
                updatedTrades[i].profit = -updatedTrades[i].amount
                updatedTrades[i].balance -= updatedTrades[i].amount
              }
              updatedTrades[i].balance = Math.round(updatedTrades[i].balance * 100) / 100

              const completedTradesUpToHere = updatedTrades.slice(0, i + 1)
              const winsUpToHere = completedTradesUpToHere.filter((t) => t.result === "W").length
              updatedTrades[i].winRate = Math.round((winsUpToHere / (i + 1)) * 100)
            }
          }

          return {
            sessions: state.sessions.map((s) => (s.id === state.activeSessionId ? { ...s, operations: updatedTrades } : s)),
          }
        })
      },

      deleteOperation: (tradeId) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session || session.operations.length <= 1) return state

          const { operations, config } = session
          const initialBalance = config.totalRisk

          const tradeIndex = operations.findIndex((t) => t.id === tradeId)
          const deletedTrade = operations[tradeIndex]

          const filteredTrades = operations.filter((t) => t.id !== tradeId)

          const recalculatedTrades = filteredTrades.map((trade, index) => {
            const newIndex = index + 1
            const prevTrade = index > 0 ? filteredTrades[index - 1] : null
            const prevSaldo = prevTrade ? prevTrade.balance : initialBalance

            let newSaldo = prevSaldo
            if (trade.result === "W") {
              newSaldo = prevSaldo + trade.amount * (config.brokerPayour / 100)
            } else if (trade.result === "L") {
              newSaldo = prevSaldo - trade.amount
            }

            const completedTrades = filteredTrades.slice(0, index + 1).filter((t) => t.result !== null)
            const wins = completedTrades.filter((t) => t.result === "W").length
            const totalCompleted = completedTrades.length
            const itmPercent = totalCompleted > 0 ? Math.round((wins / totalCompleted) * 100) : 0

            return {
              ...trade,
              index: newIndex,
              balance: trade.result ? Math.round(newSaldo * 100) / 100 : prevSaldo,
              winRate: trade.result ? itmPercent : 0,
            }
          })

          const lastTrade = recalculatedTrades[recalculatedTrades.length - 1]
          let finalTrades = recalculatedTrades

          if (lastTrade && lastTrade.result !== null) {
            let consecutiveLosses = 0
            for (let i = recalculatedTrades.length - 1; i >= 0; i--) {
              if (recalculatedTrades[i].result === "L") consecutiveLosses++
              else if (recalculatedTrades[i].result === "W") break
            }

            const currentBalance = lastTrade.balance
            const baseInversion = currentBalance * 0.1
            const multiplier = Math.pow(2, consecutiveLosses)
            let amount = Math.min(baseInversion * multiplier, currentBalance)
            amount = Math.round(amount * 100) / 100

            const newOperation: Operation = {
              id: crypto.randomUUID(),
              index: recalculatedTrades.length + 1,
              result: null,
              amount,
              profit: 0,
              balance: Math.round(currentBalance * 100) / 100,
              winRate: 0,
              status: "",
            }

            finalTrades = [...recalculatedTrades, newOperation]
          }

          return {
            sessions: state.sessions.map((s) =>
              s.id === state.activeSessionId ? { ...s, trades: finalTrades, cycleStatus: "active" as CycleStatus } : s,
            ),
            deletedTrade: { trade: deletedTrade, index: tradeIndex },
          }
        })
      },

      restoreOperation: () => {
        set((state) => {
          const { deletedOperation } = state
          if (!deletedOperation) return state

          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state

          const { operations, config } = session
          const initialBalance = config.totalRisk

          const newTrades = [...operations]
          newTrades.splice(deletedOperation.index, 0, deletedOperation.operation)

          const updatedTrades = newTrades.map((trade, index) => {
            const newIndex = index + 1
            const prevTrade = index > 0 ? newTrades[index - 1] : null
            const prevSaldo = prevTrade ? prevTrade.balance : initialBalance

            let newSaldo = prevSaldo
            if (trade.result === "W") {
              newSaldo = prevSaldo + trade.amount * (config.brokerPayour / 100)
            } else if (trade.result === "L") {
              newSaldo = prevSaldo - trade.amount
            }

            const completedTrades = newTrades.slice(0, index + 1)
            const wins = completedTrades.filter((t) => t.result === "W").length
            const totalCompleted = completedTrades.length
            const itmPercent = totalCompleted > 0 ? Math.round((wins / totalCompleted) * 100) : 0

            return {
              ...trade,
              index: newIndex,
              balance: trade.result ? Math.round(newSaldo * 100) / 100 : prevSaldo,
              winRate: trade.result ? itmPercent : 0,
            }
          })

          return {
            sessions: state.sessions.map((s) => (s.id === state.activeSessionId ? { ...s, trades: updatedTrades } : s)),
            deletedOperation: null,
          }
        })
      },

      getActiveSession: () => {
        const state = get()
        return state.sessions.find((s) => s.id === state.activeSessionId)
      },
    }),
    {
      name: "trading-storage",
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    },
  ),
)
