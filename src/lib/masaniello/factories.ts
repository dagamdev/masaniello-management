import type { Config, Operation, Session } from '@/types'
import { getMatrix } from './matrix'
import { DEFAULT_CONFIG } from '@/utils/constants'
import { MasanielloEngine } from './engine'

export function createDefaultOperation (config: Config): Operation {
  const engine = new MasanielloEngine({
    operations: [],
    config,
    matrix: getMatrix(config)
  })

  return {
    id: crypto.randomUUID(),
    result: null,
    amount: engine.calculateAmount(0, 0, config.totalRisk),
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