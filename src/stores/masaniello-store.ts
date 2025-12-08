import { create } from "zustand"
import { persist } from "zustand/middleware"
import { calculateMatris } from "@/lib/masaniello"

interface MasanielloStore {
  matris: number[][]
  balance: number

  updateMatris(totalOperations: number, ITMs: number, profitPercent: number): void
  updateBalance(balance: number): void
}

export const useMasanielloStore = create<MasanielloStore>()((set, get) => ({
  matris: [],
  balance: 0,

  updateMatris(totalOperations, ITMs, profitPercent) {
    set({matris: calculateMatris({totalOperations, ITMs, profitPercent})})
  },
  updateBalance(balance) {
    set({balance})
  },
}))
