import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Session, Config, Operation } from "@/types"
import { MasanielloEngine } from "@/lib/masaniello/engine"
import { getMatrix } from "@/lib/masaniello/matrix"
import { createDefaultOperation, createNewSession } from "@/lib/masaniello/factories"
import { updateSession } from "./helpers/masaniello"

export interface DeletedOperation {
  operation: Operation
  index: number
}

export interface MasanielloStore {
  sessions: Session[]
  activeSessionId: string | null
  deletedOperation?: DeletedOperation

  // Session actions
  createSession: (name: string) => void
  deleteSession: (id: string) => void
  updateSessionName: (id: string, name: string) => void
  setActiveSession: (id: string) => void
  resetCycle: () => void
  ensureActiveSession: (sessionId: string) => string | null

  // Config actions
  updateConfig: (config: Config) => void

  // Operation actions
  markOperation: (result: "W" | "L") => void
  updateOperationResult: (operationId: string, result: "W" | "L") => void
  deleteOperation: (operationId: string) => void
  restoreOperation: () => void

  // Helpers
  getActiveSession: () => Session | undefined
  initializeStore: () => void
}

export const useMasanielloStore = create<MasanielloStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      initializeStore: () => {
        const { sessions, activeSessionId } = get()

        // Ya está inicializado
        if (sessions.length > 0 && activeSessionId) return

        // No hay sesiones → crear la inicial
        if (sessions.length === 0) {
          const newSession = createNewSession("Gestión 1")

          set({
            sessions: [newSession],
            activeSessionId: newSession.id
          })
          return
        }

        // Hay sesiones pero no activa
        set({
          activeSessionId: sessions[0].id
        })
      },

      ensureActiveSession: (sessionId) => {
        const { sessions, activeSessionId } = get()
      
        if (sessions.length === 0) return null
      
        const exists = sessions.some(s => s.id === sessionId)
      
        if (exists) {
          if (activeSessionId !== sessionId) {
            set({ activeSessionId: sessionId })
          }
          return sessionId
        }
      
        const fallbackId = sessions[0].id
        set({ activeSessionId: fallbackId })
        return fallbackId
      },

      createSession: (name) => {
        const newSession = createNewSession(name)

        set((state) => ({
          sessions: [...state.sessions, newSession],
          activeSessionId: newSession.id
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
              s.id === state.activeSessionId ? { ...s, operations: [createDefaultOperation(session.config)], cycleStatus: 'active' } : s
            )
          }
        })
      },

      updateConfig: (config) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state
          const { operations } = session

          const engine = new MasanielloEngine({
            operations,
            config,
            matrix: getMatrix(config)
          })

          engine.recalculateFrom(0)
          
          return { ...updateSession(state, { ...engine.getResult(), config }) }
        })
      },

      markOperation: (result) => {
        set((state) => {
          const session = state.getActiveSession()
          if (!session) return state
          const { config } = session

          const engine = new MasanielloEngine({
            operations: session.operations,
            config,
            matrix: getMatrix(config)
          })
      
          engine.markOperation(result)
      
          return updateSession(state, engine.getResult())
        })
      },

      updateOperationResult: (operationId, newResult) => {
        set((state) => {
          const session = state.getActiveSession()
          if (!session) return state
          const { config } = session
      
          const operationIndex = session.operations.findIndex(
            o => o.id === operationId
          )
          if (operationIndex === -1) return state
      
          const engine = new MasanielloEngine({
            operations: session.operations,
            config,
            matrix: getMatrix(config)
          })
      
          engine.updateOperationResult(operationIndex, newResult)
      
          return updateSession(state, engine.getResult())
          
        })
      },

      deleteOperation: (operationId) => {
        set((state) => {
          const session = state.getActiveSession()
          if (!session) return state
          const { config } = session

          const engine = new MasanielloEngine({
            operations: session.operations,
            config,
            matrix: getMatrix(config)
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
          const { config } = session

          const engine = new MasanielloEngine({
            operations: session.operations,
            config,
            matrix: getMatrix(config)
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
