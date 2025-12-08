export type Language = "es" | "en"

export type OperationResult = "W" | "L" | null

export type CycleStatus = "active" | "won" | "lost"

// export interface Operation {
//   id: string
//   result: OperationResult
//   investment: number
//   profit: number
//   balance: number
//   itmPercent: number
//   status: string
// }
export type Operation = [string, 0 | 1 | null]

export interface Config {
  totalRisk: number
  operationCount: number
  expectedITMs: number
  brokerPayout: number
  progressiveMode: boolean
  reinvestmentPercent: number
}

export interface Session {
  id: string
  name: string
  config: Config
  operations: Array<[string, 0 | 1]>
  createdAt: number
  cycleStatus: CycleStatus
}
