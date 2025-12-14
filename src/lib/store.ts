import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Session, Config, Operation, CycleStatus } from "@/types"
import { DEFAULT_CONFIG } from "@/utils/constants"
import { calculateAmount, calculateMatris, getOperationStatus, getUpdatedOperations } from "./masaniello"

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

interface OperationStore {
  sessions: Session[]
  activeSessionId: string | null
  deletedOperation?: { operation: Operation; index: number }
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

export const useOperationStore = create<OperationStore>()(
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

          const updatedOperations = getUpdatedOperations({
            operations,
            matrix,
            config
          })
          // console.log(updatedOperations)
          
          return {
            sessions: state.sessions.map((s) => (s.id === state.activeSessionId ? { ...s, config, operations: updatedOperations } : s)),
            matrix
          }
        })
      },

      markOperation: (operationId, result) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state
          const { config, operations } = session
          const operation = operations.find(o => o.id === operationId)
          if (!operation) return state
          const { matrix } = state
          const profitPercent = matrix[0][0] - 1

          let winnins = 0, losses = 0, cycleCount = 0, amountToRisk = config.totalRisk
          for (let i=0; i<operations.length; i++) {
            const op = operations[i]
            if (op.result === 'W') winnins++
            else if (op.result === 'L') losses++

            if (config.progressiveMode && winnins >= config.expectedITMs || losses >= config.allOperations - config.expectedITMs) {
              cycleCount++
              winnins = 0
              losses = 0
              amountToRisk = (1 + profitPercent * (config.reinvestmentPercent / 100)) ** cycleCount * config.totalRisk
            } else amountToRisk += operation.profit
          }

          const profitMultiplier = config.brokerPayout / 100 + 1
          let balance = operation.balance, profit = operation.profit
          const amount = calculateAmount(winnins, losses, matrix, profitMultiplier, amountToRisk, config.expectedITMs)

          if (result === 'W') {
            profit = amount * (profitMultiplier - 1)
            winnins++
          }
          else if (result === 'L') {
            profit = -amount
            losses++
          }
          balance += profit
          amountToRisk += profit

          const winRate = winnins || losses ? (winnins / (winnins + losses)) * 100 : 0
          const updatedOperation = {
            ...operation,
            amount,
            balance,
            winRate,
            result,
            profit,
            status: getOperationStatus({
              config,
              losses,
              operationResult: result,
              winnins,
              cycleCount
            })
          }
          const updatedOperations = session.operations.slice()
          updatedOperations.splice(-1, 1, updatedOperation)

          const newAmount = calculateAmount(winnins, losses, matrix, profitMultiplier, amountToRisk, session.config.expectedITMs)
          let cycleStatus: CycleStatus = 'active'

          if (winnins >= config.expectedITMs && !config.progressiveMode) {
            cycleStatus = 'won'
          } else if (losses >= config.allOperations - config.expectedITMs && !config.progressiveMode) cycleStatus = 'lost'
          else {
            updatedOperations.push({
              id: crypto.randomUUID(),
              result: null,
              amount: newAmount,
              balance: 0,
              profit: 0,
              winRate: 0,
              status: 'Seleciona el resultado.'
            })
          }

          return { sessions: state.sessions.map((s) => (s.id === state.activeSessionId ? { ...s, operations: updatedOperations, cycleStatus } : s)) }
        })
      },

      updateOperationResult: (operationId, newResult) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state
          const { config, operations } = session
          let operationIndex = 0
          const operation = operations.find((o, i) => {
            if (o.id === operationId) operationIndex = i
            return o.id === operationId
          })
          if (!operation) return state
          const { matrix } = state
          const profitPercent = matrix[0][0] - 1

          let winnins = 0, losses = 0, cycleCount = 0, amountToRisk = config.totalRisk
          for (let i=0; i<=operationIndex; i++) {
            const op = operations[i]
            if (op.result === 'W') winnins++
            else if (op.result === 'L') losses++

            if (config.progressiveMode && winnins >= config.expectedITMs || losses >= config.allOperations - config.expectedITMs) {
              cycleCount++
              winnins = 0
              losses = 0
              amountToRisk = (1 + profitPercent * (config.reinvestmentPercent / 100)) ** cycleCount * config.totalRisk
            } else amountToRisk += operation.profit
          }

          const profitMultiplier = config.brokerPayout / 100 + 1
          let balance = operation.balance, profit = operation.profit

          if (newResult === 'W') {
            profit = operation.amount * (profitMultiplier - 1)
            winnins++
            losses--
          }
          else if (newResult === 'L') {
            profit = -operation.amount
            losses++
            winnins--
          }
          balance += profit

          console.log('update op',{winnins, losses})
          const winRate = winnins || losses ? (winnins / (winnins + losses)) * 100 : 0
          const updatedOperation = {
            ...operation,
            balance,
            winRate,
            result: newResult,
            profit,
            status: getOperationStatus({
              config,
              losses,
              winnins,
              operationResult: newResult,
              cycleCount
            })
          }
          console.log(updatedOperation)
          let updatedOperations = session.operations.slice()
          updatedOperations.splice(operationIndex, 1, updatedOperation)
          updatedOperations = getUpdatedOperations({
            operations: updatedOperations,
            matrix,
            config,
            fromIndex: operationIndex+1
          })

          let allWinnins = 0, allLosses = 0
          for (let i=0; i<updatedOperations.length; i++) {
            const op = updatedOperations[i]
            if (op.result === 'W') allWinnins++
            else if (op.result === 'L') allLosses++
          }

          console.log({winnins, losses, allWinnins, allLosses, updatedOperations})
          let cycleStatus: CycleStatus = 'active'

          if (allWinnins >= config.expectedITMs && !config.progressiveMode) {
            cycleStatus = 'won'
          } else if (allLosses >= config.allOperations - config.expectedITMs && !config.progressiveMode) cycleStatus = 'lost'

          return { sessions: state.sessions.map((s) => (s.id === state.activeSessionId ? { ...s, operations: updatedOperations, cycleStatus } : s)) }
        })
      },

      deleteOperation: (operationId) => {
        set((state) => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state
          const {config, operations} = session
          let operationIndex = 0

          const operation = operations.find((o, i) => {
            if (o.id === operationId) operationIndex = i
            return o.id === operationId
          })
          if (!operation) return state
          const { matrix } = state

          let updatedOperations = operations.slice()
          updatedOperations.splice(operationIndex, 1)
          const profitMultiplier = config.brokerPayout / 100 + 1
          
          // let balance = config.totalRisk
          updatedOperations = getUpdatedOperations({
            operations: updatedOperations,
            matrix,
            config,
            fromIndex: operationIndex
          })
          
          const lastOperation = updatedOperations.at(-1)
          if (lastOperation && lastOperation.result !== null) {
            let winnins = 0, losses = 0
            for (let i=0; i<=updatedOperations.length-1; i++) {
              const operation = updatedOperations[i]

              if (operation.result === 'W') winnins++
              else if (operation.result === 'L') losses++
            }

            updatedOperations.push({
              id: crypto.randomUUID(),
              result: null,
              amount: calculateAmount(winnins, losses, matrix, profitMultiplier, lastOperation.balance, config.expectedITMs),
              balance: lastOperation.balance,
              profit: 0,
              winRate: 0,
              status: 'Seleciona el resultado.'
            })
          }

          return {
            sessions: state.sessions.map((s) => s.id === state.activeSessionId ? {
              ...s, operations: updatedOperations,
              cycleStatus: s.cycleStatus !== 'active' ? 'active' : s.cycleStatus 
            } : s),
            deletedOperation: { operation, index: operationIndex }
          }
        })
      },

      restoreOperation: () => {
        set(state => {
          const session = state.sessions.find((s) => s.id === state.activeSessionId)
          if (!session) return state
          const { config, operations } = session
          const { deletedOperation } = state
          if (!deletedOperation) return state
          
          const { matrix } = state

          let updatedOperations = operations.slice()
          updatedOperations.splice(deletedOperation.index, 0, deletedOperation.operation)
          const profitMultiplier = config.brokerPayout / 100 + 1
          
          // let balance = config.totalRisk
          updatedOperations = getUpdatedOperations({
            operations: updatedOperations,
            matrix,
            config,
            fromIndex: deletedOperation.index
          })

          let allWinnins = 0, allLosses = 0
          for (let i=0; i<updatedOperations.length; i++) {
            const op = updatedOperations[i]
            if (op.result === 'W') allWinnins++
            else if (op.result === 'L') allLosses++
          }

          console.log({allWinnins, allLosses, updatedOperations})
          let cycleStatus: CycleStatus = 'active'

          if (allWinnins >= config.expectedITMs) {
            cycleStatus = 'won'
          } else if (allLosses >= config.allOperations - config.expectedITMs) cycleStatus = 'lost'

          return { sessions: state.sessions.map((s) => (s.id === state.activeSessionId ? { ...s, operations: updatedOperations, cycleStatus } : s)) }
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
