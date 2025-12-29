import { DeletedOperation } from "@/stores/masaniello-store"
import type { Config, CycleStatus, Operation, OperationResult } from "@/types"

type CycleCursor = {
  winnins: number
  losses: number
  cycleCount: number
  amountToRisk: number
  balance: number
  offCycle: boolean
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

export function calculateAmount (winnins: number, losses: number, matris: number[][], profit: number, balance: number, expectedITMs: number, isLast = false) {
  if (isLast) return balance

  const valor1 = winnins + 1 >= expectedITMs ? 1 : matris[losses + winnins + 1][winnins + 1]
  const valor2 = matris[losses + winnins + 1]?.[winnins]
  if (typeof valor2 === 'undefined') return balance
  
  return (1 - profit * valor1 / (valor2 + (profit - 1) * valor1)) * balance
}

// export function getUpdatedOperations ({ operations, matrix, config, fromIndex = 0 }: {
//   operations: Operation[]
//   matrix: number[][]
//   config: Config
//   fromIndex?: number
// }): Operation[] {
//   const { totalRisk, brokerPayout, expectedITMs, progressiveMode, reinvestmentPercent } = config
//   let balance = totalRisk, offCycle = false, amountToRisk = totalRisk, cycleCount = 0
//   const profitPercent = matrix[0][0] - 1
//   let winnins = 0, losses = 0

//   return operations.map((operation, opi) => {
//     if (opi < fromIndex) {
//       if (operation.result === 'W') {
//         winnins++
//       }
//       else if (operation.result === 'L') {
//         losses++
//       }

//       if (progressiveMode && winnins >= config.expectedITMs || losses >= config.allOperations - config.expectedITMs) {
//         cycleCount++
//         winnins = 0
//         losses = 0
//         amountToRisk = (1 + profitPercent * (reinvestmentPercent / 100)) ** cycleCount * totalRisk
//       } else amountToRisk += operation.profit

//       if (opi === fromIndex - 1) {
//         balance = operation.balance
//       }
//       return operation
//     }

//     if (offCycle) return {
//       ...operation,
//       status: 'Fuera de ciclo.'
//     }

//     // console.log(matrix)
//     const profitMultiplier = brokerPayout / 100 + 1
//     let amount = calculateAmount(winnins, losses, matrix, profitMultiplier, amountToRisk, expectedITMs)
//     // console.log('masaniello 96', {amount, winnins, losses, balance, amountToRisk, expectedITMs})
//     let profit = operation.profit

//     if (operation.result === 'W') {
//       profit = amount * (profitMultiplier - 1)
//       winnins++
//     }
//     else if (operation.result === 'L') {
//       profit = -amount
//       losses++
//     }
//     balance += profit
//     amountToRisk += profit

//     const winRate = winnins || losses ? (winnins / (winnins + losses)) * 100 : 0
//     // console.log({amount, balance, profitMultiplier, winRate})
//     const endCycle = winnins >= config.expectedITMs || losses >= config.allOperations - config.expectedITMs
//     if (endCycle) cycleCount++

//     const status = getOperationStatus({
//       losses,
//       winnins,
//       operationResult: operation.result,
//       config,
//       offCycle,
//       cycleCount
//     })

//     if (endCycle) {
//       console.log('finish cycle', amount, winnins >= config.expectedITMs, losses >= config.allOperations - config.expectedITMs)
      
//       if (config.progressiveMode) {
//         winnins = 0
//         losses = 0
//         amountToRisk = (1 + profitPercent * (reinvestmentPercent / 100)) ** cycleCount * totalRisk
//       } else {

//         offCycle = true
//       }
//     }

//     return {
//       ...operation,
//       amount,
//       balance,
//       winRate,
//       profit,
//       status
//     }
//   })
// }

export class MasanielloEngine {
  private operations: Operation[]
  private config: Config
  private matrix: number[][]
  private profitMultiplier: number

  constructor({
    operations,
    config,
    matrix
  }: {
    operations: Operation[]
    config: Config
    matrix: number[][]
  }) {
    this.operations = operations.slice()
    this.config = config
    this.matrix = matrix
    this.profitMultiplier = config.brokerPayout / 100 + 1
  }

  private buildCursor(untilIndex: number): CycleCursor {
    const profitPercent = this.matrix[0][0] - 1
  
    let cursor: CycleCursor = {
      winnins: 0,
      losses: 0,
      cycleCount: 0,
      amountToRisk: this.config.totalRisk,
      balance: this.config.totalRisk,
      offCycle: false
    }
  
    for (let i = 0; i < untilIndex; i++) {
      const op = this.operations[i]
  
      if (op.result === 'W') cursor.winnins++
      else if (op.result === 'L') cursor.losses++
  
      const endCycle = this.isEndCycle({
        winnins: cursor.winnins,
        losses: cursor.losses
      })
  
      if (this.config.progressiveMode && endCycle) {
        cursor.cycleCount++
        cursor.winnins = 0
        cursor.losses = 0
  
        cursor.amountToRisk =
          this.config.totalRisk *
          (1 + profitPercent * (this.config.reinvestmentPercent / 100)) **
            cursor.cycleCount
      } else {
        cursor.amountToRisk += op.profit
      }
  
      cursor.balance = op.balance
    }
  
    return cursor
  }

  recalculateFrom(fromIndex: number) {
    const cursor = this.buildCursor(fromIndex)
    const profitMultiplier = this.profitMultiplier
  
    for (let i = fromIndex; i < this.operations.length; i++) {
      const op = this.operations[i]
  
      if (cursor.offCycle) {
        this.operations[i] = {
          ...op,
          status: 'Fuera de ciclo.'
        }
        continue
      }
  
      const amount = this.calculateAmount(
        cursor.winnins,
        cursor.losses,
        cursor.amountToRisk
      )
  
      let profit = 0
  
      if (op.result === 'W') {
        profit = amount * (profitMultiplier - 1)
        cursor.winnins++
      } else if (op.result === 'L') {
        profit = -amount
        cursor.losses++
      }
  
      cursor.balance += profit
      cursor.amountToRisk += profit
  
      const endCycle = this.isEndCycle({
        winnins: cursor.winnins,
        losses: cursor.losses
      })
  
      const status = this.getOperationStatus({
        losses: cursor.losses,
        winnins: cursor.winnins,
        operationResult: op.result,
        cycleCount: cursor.cycleCount
      })
  
      this.operations[i] = {
        ...op,
        amount,
        profit,
        balance: cursor.balance,
        winRate:
          cursor.winnins || cursor.losses
            ? (cursor.winnins /
                (cursor.winnins + cursor.losses)) *
              100
            : 0,
        status
      }
  
      if (endCycle) {
        cursor.cycleCount++
  
        if (this.config.progressiveMode) {
          cursor.winnins = 0
          cursor.losses = 0
          cursor.amountToRisk =
            this.config.totalRisk *
            (1 +
              (this.matrix[0][0] - 1) *
                (this.config.reinvestmentPercent / 100)) **
              cursor.cycleCount
        } else {
          cursor.offCycle = true
        }
      }
    }
  }  

  private calculateCycleState(untilIndex?: number) {
    const profitPercent = this.matrix[0][0] - 1

    let winnins = 0
    let losses = 0
    let cycleCount = 0
    let amountToRisk = this.config.totalRisk

    const limit = untilIndex ?? this.operations.length

    for (let i = 0; i < limit; i++) {
      const op = this.operations[i]

      if (op.result === 'W') winnins++
      else if (op.result === 'L') losses++

      const endCycle =
        winnins >= this.config.expectedITMs ||
        losses >= this.config.allOperations - this.config.expectedITMs

      if (this.config.progressiveMode && endCycle) {
        cycleCount++
        winnins = 0
        losses = 0

        amountToRisk =
          this.config.totalRisk *
          (1 + profitPercent * (this.config.reinvestmentPercent / 100)) **
            cycleCount
      } else {
        amountToRisk += op.profit
      }
    }

    return { winnins, losses, cycleCount, amountToRisk }
  }

  private getOperationStatus ({ losses, operationResult, winnins, offCycle = false, cycleCount = 0 }: {
    losses: number
    operationResult: OperationResult
    winnins: number
    offCycle?: boolean
    cycleCount?: number
  }) {
    const { allOperations, expectedITMs, progressiveMode } = this.config
    const remainingOTMs = allOperations - expectedITMs - losses
  
    // console.log({winnins, losses}, offCycle && !progressiveMode, winnins >= expectedITMs, losses >= allOperations - expectedITMs)
  
    if (offCycle && !progressiveMode) {
      return 'Fuera de ciclo'
    } else if (winnins >= expectedITMs) {
      return `✅ Has ganado${progressiveMode ? ` el ciclo ${cycleCount}` : ''}`
    } else if (losses > allOperations - expectedITMs) {
      return `❌ Has perdido${progressiveMode ? ` el ciclo ${cycleCount}` : ''}`
    }
  
    return operationResult === null ? 'Seleciona el resultado.' : `Te quedan ${remainingOTMs} OTM${remainingOTMs > 1 ? 's' : ''}.`
  }

  private calculateAmount(
    winnins: number,
    losses: number,
    balance: number
  ) {
    const valor1 = winnins + 1 >= this.config.expectedITMs ? 1 : this.matrix[losses + winnins + 1][winnins + 1]
    const valor2 = this.matrix[losses + winnins + 1]?.[winnins]
    if (typeof valor2 === 'undefined') return balance

    return (1 - this.profitMultiplier * valor1 / (valor2 + (this.profitMultiplier - 1) * valor1)) * balance
  }

  private isEndCycle({ winnins, losses }: {
    winnins: number
    losses: number
  }): boolean {
    return (
      winnins >= this.config.expectedITMs ||
      losses > this.config.allOperations - this.config.expectedITMs
    )
  }

  // tengo que agregar logica para el modo progresivo
  private appendNextOperation(
    winnins: number,
    losses: number,
    balance: number
  ) {
    const endCycle = this.isEndCycle({ winnins, losses })

    if (endCycle && !this.config.progressiveMode) return

    const amount = this.calculateAmount(winnins, losses, balance)

    this.operations.push({
      id: crypto.randomUUID(),
      result: null,
      amount,
      profit: 0,
      balance,
      winRate: 0,
      status: 'Selecciona el resultado.'
    })
  } 

  markOperation(result: 'W' | 'L') {
    const lastIndex = this.operations.length - 1
    const op = this.operations[lastIndex]

    const state = this.calculateCycleState(lastIndex)

    const profit =
      result === 'W'
        ? op.amount * (this.profitMultiplier - 1)
        : -op.amount

    const winnins = result === 'W' ? state.winnins + 1 : state.winnins
    const losses = result === 'L' ? state.losses + 1 : state.losses

    const balance = op.balance + profit

    this.operations[lastIndex] = {
      ...op,
      result,
      profit,
      balance,
      winRate: winnins || losses
      ? (winnins /
          (winnins + losses)) *
        100
      : 0,
      status: this.getOperationStatus({
        winnins,
        losses,
        operationResult: result,
        cycleCount: state.cycleCount
      })
    }

    this.appendNextOperation(winnins, losses, balance)
  }

  updateOperationResult(
    operationIndex: number,
    newResult: 'W' | 'L'
  ) {
    // 1️⃣ Cambiar el resultado
    this.operations[operationIndex] = {
      ...this.operations[operationIndex],
      result: newResult
    }
  
    // 2️⃣ Recalcular todo desde ahí
    this.recalculateFrom(operationIndex)
  }
  
  deleteOperation (operationId: string): DeletedOperation {
    const operationIndex = this.operations.findIndex(o => o.id === operationId)
    
    if (operationIndex === -1) throw new Error('Operation not found')
    
    const [deletedOperation] = this.operations.splice(operationIndex, 1)
    this.recalculateFrom(operationIndex)


    return {
      operation: deletedOperation,
      index: operationIndex
    }
  }

  restoreOperation(deletedOperation: DeletedOperation) {
    this.operations.splice(deletedOperation.index, 0, deletedOperation.operation)
    this.recalculateFrom(deletedOperation.index)
  }

  getResult() {
    const { winnins, losses } = this.calculateCycleState()

    let cycleStatus: CycleStatus = 'active'

    if (!this.config.progressiveMode) {
      if (winnins >= this.config.expectedITMs) cycleStatus = 'won'
      else if (
        losses > this.config.allOperations - this.config.expectedITMs
      ) {
        cycleStatus = 'lost'
      }
    }

    return {
      operations: this.operations,
      cycleStatus
    }
  }

}

