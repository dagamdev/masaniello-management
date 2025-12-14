import type { Config, Operation, OperationResult } from "@/types"

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

export function calculateAmount (winnins: number, losses: number, matris: number[][], profit: number, balance: number, expectedITMs: number, isLast = false) {
  if (isLast) return balance

  const valor1 = winnins + 1 >= expectedITMs ? 1 : matris[losses + winnins + 1][winnins + 1]
  const valor2 = matris[losses + winnins + 1]?.[winnins]
  if (typeof valor2 === 'undefined') return balance
  
  return (1 - profit * valor1 / (valor2 + (profit - 1) * valor1)) * balance
}

export function getUpdatedOperations ({ operations, matrix, config, fromIndex = 0 }: {
  operations: Operation[]
  matrix: number[][]
  config: Config
  fromIndex?: number
}): Operation[] {
  const { totalRisk, brokerPayout, expectedITMs, progressiveMode, reinvestmentPercent } = config
  let balance = totalRisk, offCycle = false, amountToRisk = totalRisk, cycleCount = 0
  const profitPercent = matrix[0][0] - 1
  let winnins = 0, losses = 0

  return operations.map((operation, opi) => {
    if (opi < fromIndex) {
      if (operation.result === 'W') {
        winnins++
      }
      else if (operation.result === 'L') {
        losses++
      }

      if (progressiveMode && winnins >= config.expectedITMs || losses >= config.allOperations - config.expectedITMs) {
        cycleCount++
        winnins = 0
        losses = 0
        amountToRisk = (1 + profitPercent * (reinvestmentPercent / 100)) ** cycleCount * totalRisk
      } else amountToRisk += operation.profit

      if (opi === fromIndex - 1) {
        balance = operation.balance
      }
      return operation
    }

    if (offCycle) return {
      ...operation,
      status: 'Fuera de ciclo.'
    }

    // console.log(matrix)
    const profitMultiplier = brokerPayout / 100 + 1
    let amount = calculateAmount(winnins, losses, matrix, profitMultiplier, amountToRisk, expectedITMs)
    console.log('masaniello 96', {amount, winnins, losses, balance, amountToRisk, expectedITMs})
    let profit = operation.profit

    if (operation.result === 'W') {
      profit = amount * (profitMultiplier - 1)
      winnins++
    }
    else if (operation.result === 'L') {
      profit = -amount
      losses++
    }
    balance += profit
    amountToRisk += profit

    const winRate = winnins || losses ? (winnins / (winnins + losses)) * 100 : 0
    // console.log({amount, balance, profitMultiplier, winRate})
    const endCycle = winnins >= config.expectedITMs || losses >= config.allOperations - config.expectedITMs
    if (endCycle) cycleCount++

    const status = getOperationStatus({
      losses,
      winnins,
      operationResult: operation.result,
      config,
      offCycle,
      cycleCount
    })

    if (endCycle) {
      console.log('finish cycle', amount, winnins >= config.expectedITMs, losses >= config.allOperations - config.expectedITMs)
      
      if (config.progressiveMode) {
        winnins = 0
        losses = 0
        amountToRisk = (1 + profitPercent * (reinvestmentPercent / 100)) ** cycleCount * totalRisk
      } else {

        offCycle = true
      }
    }

    return {
      ...operation,
      amount,
      balance,
      winRate,
      profit,
      status
    }
  })
}

export function getOperationStatus ({ losses, operationResult, winnins, config, offCycle = false, cycleCount = 0 }: {
  losses: number
  operationResult: OperationResult
  winnins: number
  config: Config
  offCycle?: boolean
  cycleCount?: number
}) {
  const { allOperations, expectedITMs, progressiveMode } = config
  const remainingOTMs = allOperations - expectedITMs - losses

  console.log({winnins, losses}, offCycle && !progressiveMode, winnins >= expectedITMs, losses >= allOperations - expectedITMs)

  if (offCycle && !progressiveMode) {
    return 'Fuera de ciclo'
  } else if (winnins >= expectedITMs) {
    return `✅ Has ganado${config.progressiveMode ? ` el ciclo ${cycleCount}` : ''}`
  } else if (losses >= allOperations - expectedITMs) {
    return `❌ Has perdido${config.progressiveMode ? ` el ciclo ${cycleCount}` : ''}`
  } 

  return operationResult === null ? 'Seleciona el resultado.' : `Te quedan ${remainingOTMs} OTM${remainingOTMs > 1 ? 's' : ''}.`
}
