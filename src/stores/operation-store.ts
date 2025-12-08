import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Session, Config, Operation, CycleStatus } from "@/types"

const defaultConfig: Config = {
  totalRisk: 100,
  operationCount: 10,
  expectedITMs: 4,
  brokerPayout: 85,
  progressiveMode: false,
  reinvestmentPercent: 50,
}

const createDefaultOperation = (): Operation => [crypto.randomUUID(), null]

const createNewSession = (name: string): Session => {
  const config = { ...defaultConfig }
  return {
    id: crypto.randomUUID(),
    name,
    config,
    operations: [],
    createdAt: Date.now(),
    cycleStatus: "active",
  }
}

interface OperationStore {
  balance: number
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

export const useOperationStore = create<OperationStore>()((set, get) => ({
    balance: defaultConfig.totalRisk,
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

        const newTrade = createDefaultOperation()
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

    markOperation: (tradeId, result) => {
      
    },

    updateOperationResult: (tradeId, newResult) => {
      
    },

    deleteOperation: (tradeId) => {
      
    },

    restoreOperation: () => {
      
    },

    getActiveSession: () => {
      const state = get()
      return state.sessions.find((s) => s.id === state.activeSessionId)
    },
  })
)
