import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Session, Config, Trade } from "@/types"

const defaultConfig: Config = {
  totalRiesgo: 100,
  cantidadTrades: 3,
  itmEsperados: 1,
  pagaBroker: 85,
}

const createDefaultTrade = (config: Config): Trade => ({
  id: 1,
  result: null,
  inversion: config.totalRiesgo * 0.1,
  retorno: 0,
  saldo: config.totalRiesgo,
  itmPercent: 0,
  fallosPendientes: "",
})

const createNewSession = (name: string): Session => {
  const config = { ...defaultConfig }
  return {
    id: crypto.randomUUID(),
    name,
    config,
    trades: [createDefaultTrade(config)],
    createdAt: Date.now(),
  }
}

interface TradingStore {
  sessions: Session[]
  activeSessionId: string | null
  theme: "light" | "dark" | "system"

  // Session actions
  createSession: (name: string) => void
  deleteSession: (id: string) => void
  updateSessionName: (id: string, name: string) => void
  setActiveSession: (id: string) => void

  // Config actions
  updateConfig: (config: Config) => void

  // Trade actions
  markTrade: (tradeId: number, result: "W" | "L") => void
  updateTradeResult: (tradeId: number, result: "W" | "L") => void
  deleteTrade: (tradeId: number) => void

  // Theme actions
  setTheme: (theme: "light" | "dark" | "system") => void

  // Helpers
  getActiveSession: () => Session | undefined
  initializeStore: () => void
}

export const useTradingStore = create<TradingStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      theme: "system",

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

      updateConfig: (config) => {
        set((state) => ({
          sessions: state.sessions.map((s) => (s.id === state.activeSessionId ? { ...s, config } : s)),
        }))
      },

      markTrade: (tradeId, result) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state

          const { config, trades } = session

          const updatedTrades = trades.map((trade) => {
            if (trade.id === tradeId) {
              let retorno = 0
              let newSaldo = trade.saldo

              if (result === "W") {
                retorno = trade.inversion * (config.pagaBroker / 100)
                newSaldo = trade.saldo + retorno
              } else {
                retorno = -trade.inversion
                newSaldo = trade.saldo - trade.inversion
              }

              const completedTrades = trades.slice(0, trade.id)
              const wins = completedTrades.filter((t) => t.result === "W").length + (result === "W" ? 1 : 0)
              const itmPercent = (wins / trade.id) * 100

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

          // Recalculate subsequent trades
          for (let i = 0; i < updatedTrades.length; i++) {
            if (updatedTrades[i].id > tradeId && updatedTrades[i].result) {
              const prevTrade = updatedTrades[i - 1]
              updatedTrades[i].saldo = prevTrade.saldo

              if (updatedTrades[i].result === "W") {
                updatedTrades[i].retorno = updatedTrades[i].inversion * (config.pagaBroker / 100)
                updatedTrades[i].saldo += updatedTrades[i].retorno
              } else {
                updatedTrades[i].retorno = -updatedTrades[i].inversion
                updatedTrades[i].saldo -= updatedTrades[i].inversion
              }
              updatedTrades[i].saldo = Math.round(updatedTrades[i].saldo * 100) / 100
            }
          }

          // Generate new trade
          const lastTrade = updatedTrades[updatedTrades.length - 1]
          const currentBalance = lastTrade.saldo

          let consecutiveLosses = 0
          for (let i = updatedTrades.length - 1; i >= 0; i--) {
            if (updatedTrades[i].result === "L") consecutiveLosses++
            else if (updatedTrades[i].result === "W") break
          }

          const baseInversion = currentBalance * 0.1
          const multiplier = Math.pow(2, consecutiveLosses)
          let inversion = Math.min(baseInversion * multiplier, currentBalance)
          inversion = Math.round(inversion * 100) / 100

          const newTrade: Trade = {
            id: trades.length + 1,
            result: null,
            inversion,
            retorno: 0,
            saldo: Math.round(currentBalance * 100) / 100,
            itmPercent: 0,
            fallosPendientes: "",
          }

          return {
            sessions: state.sessions.map((s) =>
              s.id === state.activeSessionId ? { ...s, trades: [...updatedTrades, newTrade] } : s,
            ),
          }
        })
      },

      updateTradeResult: (tradeId, newResult) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state

          const { config, trades } = session
          const initialBalance = config.totalRiesgo

          const updatedTrades = trades.map((trade) => {
            if (trade.id === tradeId) {
              const prevTrade = trades[tradeId - 2]
              const prevSaldo = prevTrade ? prevTrade.saldo : initialBalance

              let retorno = 0
              if (newResult === "W") {
                retorno = trade.inversion * (config.pagaBroker / 100)
              } else {
                retorno = -trade.inversion
              }

              const newSaldo = prevSaldo + retorno
              const completedTrades = trades.slice(0, trade.id)
              const wins =
                completedTrades.filter((t) => t.result === "W").length +
                (newResult === "W" ? 1 : 0) -
                (trade.result === "W" ? 1 : 0)
              const itmPercent = (wins / trade.id) * 100

              return {
                ...trade,
                result: newResult,
                retorno: Math.round(retorno * 100) / 100,
                saldo: Math.round(newSaldo * 100) / 100,
                itmPercent: Math.round(itmPercent * 100) / 100,
                fallosPendientes: newResult === "W" ? "won" : "remaining",
              }
            }
            return trade
          })

          // Recalculate subsequent trades
          for (let i = 0; i < updatedTrades.length; i++) {
            if (updatedTrades[i].id > tradeId && updatedTrades[i].result) {
              const prevTrade = updatedTrades[i - 1]
              updatedTrades[i].saldo = prevTrade.saldo

              if (updatedTrades[i].result === "W") {
                updatedTrades[i].retorno = updatedTrades[i].inversion * (config.pagaBroker / 100)
                updatedTrades[i].saldo += updatedTrades[i].retorno
              } else {
                updatedTrades[i].retorno = -updatedTrades[i].inversion
                updatedTrades[i].saldo -= updatedTrades[i].inversion
              }
              updatedTrades[i].saldo = Math.round(updatedTrades[i].saldo * 100) / 100

              const completedTradesUpToHere = updatedTrades.slice(0, i + 1)
              const winsUpToHere = completedTradesUpToHere.filter((t) => t.result === "W").length
              updatedTrades[i].itmPercent = (winsUpToHere / (i + 1)) * 100
            }
          }

          return {
            sessions: state.sessions.map((s) => (s.id === state.activeSessionId ? { ...s, trades: updatedTrades } : s)),
          }
        })
      },

      deleteTrade: (tradeId) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session || session.trades.length <= 1) return state

          const { trades, config } = session
          const initialBalance = config.totalRiesgo
          const filteredTrades = trades.filter((t) => t.id !== tradeId)

          const updatedTrades = filteredTrades.map((trade, index) => {
            const newId = index + 1
            const prevTrade = index > 0 ? filteredTrades[index - 1] : null
            let newSaldo = prevTrade ? prevTrade.saldo : initialBalance

            if (trade.result === "W") {
              newSaldo += trade.retorno
            } else if (trade.result === "L") {
              newSaldo += trade.retorno
            }

            const completedTrades = filteredTrades.slice(0, index + 1)
            const wins = completedTrades.filter((t) => t.result === "W").length
            const itmPercent = trade.result ? (wins / (index + 1)) * 100 : 0

            return {
              ...trade,
              id: newId,
              saldo: Math.round(newSaldo * 100) / 100,
              itmPercent: Math.round(itmPercent * 100) / 100,
            }
          })

          return {
            sessions: state.sessions.map((s) => (s.id === state.activeSessionId ? { ...s, trades: updatedTrades } : s)),
          }
        })
      },

      setTheme: (theme) => {
        set({ theme })
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
        theme: state.theme,
      }),
    },
  ),
)
