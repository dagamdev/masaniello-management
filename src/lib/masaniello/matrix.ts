import type { Config } from '@/types'

let lastConfigKey: string | null = null
let lastMatrix: number[][] | null = null

export function getMatrix(config: Config): number[][] {
  const key = createConfigKey(config)

  if (key === lastConfigKey && lastMatrix) {
    return lastMatrix
  }

  const matrix = calculateMatris(config)
  lastConfigKey = key
  lastMatrix = matrix

  return matrix
}

function createConfigKey(config: Config): string {
  const {
    expectedITMs,
    allOperations,
    brokerPayout,
    totalRisk,
    progressiveMode,
    reinvestmentPercent
  } = config

  return JSON.stringify({
    expectedITMs,
    allOperations,
    brokerPayout,
    totalRisk,
    progressiveMode,
    reinvestmentPercent
  })
}

export function calculateMatris (config: Config) {
  // console.log('Aclculate matrix ', config)
  const { allOperations, expectedITMs, brokerPayout} = config
  let matrix: Array<number[]> = []
  const total = allOperations
  const winners = expectedITMs
  const newMatrix: number[][] = [] = [[]]
  const profit = brokerPayout / 100 + 1

  for (let col=0; col<winners; col++) {
    const cellValue = getCellValue(winners, total, col, 0)
    newMatrix[0][col] = cellValue
  }

  matrix = newMatrix

  function getCellValue (winners: number, total: number, x: number, y: number): number {
    if (x === winners) return 1
    const value = newMatrix[y]?.[x]
    if (value) {
      return value
    }

    if (winners - x === total - y) {
      return profit**(total-y)
    } else {
      const nextRow = getCellValue(winners, total, x, y+1)
      const nextRowTwo = getCellValue(winners, total, x+1, y+1)

      if (newMatrix[y+1]) {
        newMatrix[y+1][x] = nextRow
      } else {
        newMatrix[y+1] = []
        newMatrix[y+1][x] = nextRow
      }
      
      if (newMatrix[y+1].length < winners && winners-1 >= x+1) {
        newMatrix[y+1][x+1] = nextRowTwo
      }

      return profit * (nextRow || 1) * nextRowTwo / (nextRow + (profit - 1) * nextRowTwo)
    }
  }

  return matrix
}
