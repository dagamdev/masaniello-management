export type Language = "es" | "en"

export type TradeResult = "W" | "L" | null

export type CycleStatus = "active" | "won" | "lost"

export interface Trade {
  id: number
  result: TradeResult
  inversion: number
  retorno: number
  saldo: number
  itmPercent: number
  fallosPendientes: string
}

export interface Config {
  totalRiesgo: number
  cantidadTrades: number
  itmEsperados: number
  pagaBroker: number
  progressiveMode: boolean
  reinvestmentPercent: number
}

export interface Session {
  id: string
  name: string
  config: Config
  trades: Trade[]
  createdAt: number
  cycleStatus: CycleStatus
}
