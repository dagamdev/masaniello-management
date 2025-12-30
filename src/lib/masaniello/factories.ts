import type { Config, Operation, Session } from '@/types'
import { getMatrix } from './matrix'
import { calculateAmount } from './engine'
import { DEFAULT_CONFIG } from '@/utils/constants'

export function createDefaultOperation (config: Config): Operation {
  const matrix = getMatrix(config)

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

export function createNewSession (name: string): Session {
  const config = { ...DEFAULT_CONFIG }

  return {
    id: crypto.randomUUID(),
    name,
    config,
    operations: [createDefaultOperation(config)],
    createdAt: Date.now(),
    cycleStatus: "active",
  }
}