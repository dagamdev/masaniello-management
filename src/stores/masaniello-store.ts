import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Session, Config, Operation, CycleStatus } from "@/types"
import { DEFAULT_CONFIG } from "@/utils/constants"
import { calculateAmount, calculateMatris, MasanielloEngine } from "@/lib/masaniello"

const createDefaultOperation = (config: Config, matrix: number[][]): Operation => {
  return {
    id: crypto.randomUUID(),
    result: null,
    amount: calculateAmount(0, 0, matrix, config.brokerPayout / 100 + 1, config.totalRisk, config.expectedITMs),
    profit: 0,
    balance: config.totalRisk,
    winRate: 0,
    status: 'Seleciona el resultado.',
  }
}

const createNewSession = (name: string, matrix: number[][]): Session => {
  const config = { ...DEFAULT_CONFIG }

  return {
    id: crypto.randomUUID(),
    name,
    config,
    operations: [createDefaultOperation(config, matrix)],
    createdAt: Date.now(),
    cycleStatus: "active",
  }
}

export interface DeletedOperation {
  operation: Operation
  index: number
}

interface MasanielloStore {
  sessions: Session[]
  activeSessionId: string | null
  deletedOperation?: DeletedOperation
  matrix: number[][]

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

function updateSession(
  state: MasanielloStore,
  data: Partial<Session>
) {
  return {
    ...state,
    sessions: state.sessions.map(s =>
      s.id === state.activeSessionId
        ? { ...s, ...data }
        : s
    )
  }
}

export const useMasanielloStore = create<MasanielloStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      matrix: [],

      initializeStore: () => {
        const { sessions } = get()

        set(state => {
          const session = sessions.find(s => s.id === state.activeSessionId)
          if (session) {
            if (state.matrix.length) return state
            const matrix = calculateMatris(session.config)
            return { matrix }
          }

          const matrix = calculateMatris(DEFAULT_CONFIG)
          const newSession = createNewSession('Gestion 1', matrix)

          return { sessions: [...state.sessions, newSession], matrix, activeSessionId: newSession.id}
        })
      },

      createSession: (name) => {
        const newMatrix = calculateMatris(DEFAULT_CONFIG)
        const newSession = createNewSession(name, newMatrix)
        set((state) => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: newSession.id,
          matrix: newMatrix
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

          return {
            sessions: state.sessions.map((s) =>
              s.id === state.activeSessionId ? { ...s, operations: [createDefaultOperation(session.config, state.matrix)], cycleStatus: 'active' } : s
            )
          }
        })
      },

      updateConfig: (config) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state
          const { operations } = session
          const matrix = calculateMatris(config)

          const engine = new MasanielloEngine({
            operations,
            config,
            matrix
          })

          engine.recalculateFrom(0)
          
          return updateSession(state, {...engine.getResult(), config})
        })
      },

      markOperation: (operationId, result) => {
        set((state) => {
          const session = state.getActiveSession()
          if (!session) return state

          const engine = new MasanielloEngine({
            operations: session.operations,
            config: session.config,
            matrix: state.matrix
          })
      
          engine.markOperation(result)
      
          return updateSession(state, engine.getResult())
        })
      },

      updateOperationResult: (operationId, newResult) => {
        set((state) => {
          const session = state.getActiveSession()
          if (!session) return state
      
          const operationIndex = session.operations.findIndex(
            o => o.id === operationId
          )
          if (operationIndex === -1) return state
      
          const engine = new MasanielloEngine({
            operations: session.operations,
            config: session.config,
            matrix: state.matrix
          })
      
          engine.updateOperationResult(operationIndex, newResult)
      
          return updateSession(state, engine.getResult())
          
        })
      },

      deleteOperation: (operationId) => {
        set((state) => {
          const session = state.getActiveSession()
          if (!session) return state

          const engine = new MasanielloEngine({
            operations: session.operations,
            config: session.config,
            matrix: state.matrix
          })

          const deletedOperation = engine.deleteOperation(operationId)

          return { ...updateSession(state, engine.getResult()), deletedOperation }
        })
      },

      restoreOperation: () => {
        set(state => {
          const session = state.getActiveSession()
          if (!session) return state
          if (!state.deletedOperation) return state

          const engine = new MasanielloEngine({
            operations: session.operations,
            config: session.config,
            matrix: state.matrix
          })

          engine.restoreOperation(state.deletedOperation)

          return { ...updateSession(state, engine.getResult()), deletedOperation: undefined }
        })
      },

      getActiveSession: () => {
        const state = get()
        return state.sessions.find((s) => s.id === state.activeSessionId)
      },
    }),
    {
      name: "masaniello-storage",
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
      }),
    },
  ),
)
