export type Language = "es" | "en"

export type TradeResult = "W" | "L" | null

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
}

export interface Session {
  id: string
  name: string
  config: Config
  trades: Trade[]
  createdAt: number
}
