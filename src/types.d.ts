export type Language = "es" | "en"

export type TradeResult = "W" | "L" | null

export type CycleStatus = "active" | "won" | "lost"

export interface Operation {
  id: string
  index: number
  result: TradeResult
  amount: number
  profit: number
  balance: number
  winRate: number
  status: string
}

export interface Config {
  totalRisk: number
  allOperations: number
  expectedITMs: number
  brokerPayour: number
  progressiveMode: boolean
  reinvestmentPercent: number
}

export interface Session {
  id: string
  name: string
  config: Config
  operations: Operation[]
  createdAt: number
  cycleStatus: CycleStatus
}
