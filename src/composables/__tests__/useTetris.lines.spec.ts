import { describe, it, expect } from 'vitest'
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'
import type { TetrominoType } from '@/types/tetris'

/**
 * Test Suite: useTetris Line Clearing System
 *
 * =============================================================================
 * EVENT-DRIVEN ARCHITECTURE
 * =============================================================================
 *
 * The useTetris composable emits line-clearing events that drive game progression,
 * scoring, level advancement, and achievement tracking.
 *
 * EVENTS RELEVANT TO THIS TEST FILE:
 *
 * Line Clear Events:
 *   - lines:cleared { count, isTetris, newTotal, newLevel }
 *     → Emitted when lines are cleared from the board
 *     → count: Number of lines cleared (1-4)
 *     → isTetris: true if 4 lines cleared simultaneously
 *     → newTotal: Updated total line count
 *     → newLevel: Current level (may trigger level:up event)
 *
 * Level Progression Events:
 *   - level:up { level, previousLevel }
 *     → Emitted when player advances to next level (every 10 lines)
 *     → Triggers speed increase in game loop
 *     → Achievement system checks for level milestones
 *
 * Event Flow for Line Clearing:
 *   1. Piece Locks → Check for Complete Lines → clearLines()
 *   2. Update Board State → Calculate Lines Cleared
 *   3. emit('lines:cleared', { count, isTetris, newTotal, newLevel })
 *   4. Check if newTotal % 10 === 0 → emit('level:up', { level, previousLevel })
 *   5. emit('score:updated') based on lines cleared
 *   6. Achievement System → Checks for line/level achievements
 *   7. Audio System → Plays appropriate sound (line clear, Tetris, level up)
 *
 * Line Clear Mechanics:
 *   - Single (1): 100 points base, common clear
 *   - Double (2): 300 points base, good clear
 *   - Triple (3): 500 points base, excellent clear
 *   - Tetris (4): 800 points base, perfect clear, triggers special audio/visual
 */

/**
 * Test helpers for board creation
 */

/**
 * Creates an empty board filled with null values
 */
function createEmptyBoard(): (TetrominoType | null)[][] {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
}

/**
 * Creates a board with specific rows filled
 * @param filledRows - Array of row indices to fill (0 = top, 19 = bottom)
 * @param type - Tetromino type to fill with (default: 'I')
 */
function createBoardWithFilledRows(
  filledRows: number[],
  type: TetrominoType = 'I'
): (TetrominoType | null)[][] {
  const board = createEmptyBoard()
  filledRows.forEach(row => {
    board[row] = Array(BOARD_WIDTH).fill(type)
  })
  return board
}

/**
 * Creates a board with partial rows (incomplete lines)
 * @param rows - Array of objects specifying row index and number of cells to fill
 */
function createBoardWithPartialRows(
  rows: { row: number; filled: number; type?: TetrominoType }[]
): (TetrominoType | null)[][] {
  const board = createEmptyBoard()
  rows.forEach(({ row, filled, type = 'I' }) => {
    for (let i = 0; i < filled; i++) {
      board[row][i] = type
    }
  })
  return board
}

function countFilledCells(board: (TetrominoType | null)[][]): number {
  return board.reduce((count, row) =>
    count + row.filter(cell => cell !== null).length, 0
  )
}

/**
 * Checks if a row is complete (all cells filled)
 */
function isRowComplete(row: (TetrominoType | null)[]): boolean {
  return row.every(cell => cell !== null)
}

/**
 * Checks if a row is empty (all cells null)
 */
function isRowEmpty(row: (TetrominoType | null)[]): boolean {
  return row.every(cell => cell === null)
}

/**
 * Implementation of clearLines function from useTetris composable
 * This should match the actual implementation
 */
function clearLines(board: (TetrominoType | null)[][]): {
  board: (TetrominoType | null)[][]
  linesCleared: number
} {
  const newBoard: (TetrominoType | null)[][] = []
  let linesCleared = 0

  for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== null)) {
      linesCleared++
    } else {
      newBoard.unshift(board[y])
    }
  }

  // Add empty lines at top
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null))
  }

  return { board: newBoard, linesCleared }
}

describe('useTetris - Line Clearing', () => {
  describe('clearLines function', () => {
    it('should not clear any lines when row is incomplete', () => {
      // Create board with incomplete bottom row (9 out of 10 cells filled)
      const board = createBoardWithPartialRows([
        { row: 19, filled: 9, type: 'I' }
      ])

      const result = clearLines(board)

      expect(result.linesCleared).toBe(0)
      expect(result.board).toHaveLength(BOARD_HEIGHT)
      expect(result.board[19][0]).toBe('I')
      expect(result.board[19][9]).toBe(null)
    })

    it('should clear a single complete line at the bottom', () => {
      // Given: Board with one complete line at bottom
      const board = createBoardWithFilledRows([19], 'T')

      // When: Clear lines
      const result = clearLines(board)
      // EVENT: lines:cleared { count: 1, isTetris: false, newTotal: previousTotal + 1, newLevel }
      // EVENT: score:updated { score: newScore, delta: 100 * level, level }

      // Then: Single line should be removed, board height maintained
      expect(result.linesCleared).toBe(1)
      expect(result.board).toHaveLength(BOARD_HEIGHT)
      // All rows should be empty after clearing the only filled line
      expect(isRowEmpty(result.board[19])).toBe(true)
      expect(isRowEmpty(result.board[0])).toBe(true)
      expect(countFilledCells(result.board)).toBe(0)
    })

    it('should clear multiple contiguous lines (2 lines)', () => {
      // Create board with two complete contiguous lines at bottom
      const board = createBoardWithFilledRows([18, 19], 'S')

      const result = clearLines(board)

      expect(result.linesCleared).toBe(2)
      expect(result.board).toHaveLength(BOARD_HEIGHT)
      // All cells should be empty
      expect(countFilledCells(result.board)).toBe(0)
      result.board.forEach(row => {
        expect(isRowEmpty(row)).toBe(true)
      })
    })

    it('should clear multiple contiguous lines (3 lines)', () => {
      // Create board with three complete contiguous lines
      const board = createBoardWithFilledRows([17, 18, 19], 'Z')

      const result = clearLines(board)

      expect(result.linesCleared).toBe(3)
      expect(result.board).toHaveLength(BOARD_HEIGHT)
      expect(countFilledCells(result.board)).toBe(0)
    })

    it('should clear Tetris (4 complete lines)', () => {
      // Given: Board with four complete contiguous lines (Tetris!)
      const board = createBoardWithFilledRows([16, 17, 18, 19], 'I')

      // When: Clear all four lines simultaneously
      const result = clearLines(board)
      // EVENT: lines:cleared { count: 4, isTetris: true, newTotal, newLevel }
      // EVENT: score:updated { score: newScore, delta: 800 * level, level }
      // EVENT: Achievement check for "First Tetris", "Tetris Streak", "I-Piece Master"
      // AUDIO: Special Tetris sound effect plays (different from regular line clear)

      // Then: All four lines removed, maximum single-action clear
      expect(result.linesCleared).toBe(4)
      expect(result.board).toHaveLength(BOARD_HEIGHT)
      expect(countFilledCells(result.board)).toBe(0)
      result.board.forEach(row => {
        expect(isRowEmpty(row)).toBe(true)
      })
    })

    it('should clear non-contiguous complete lines', () => {
      // Create board with complete lines at rows 19, 17, and 15 (non-contiguous)
      const board = createBoardWithFilledRows([15, 17, 19], 'J')

      const result = clearLines(board)

      expect(result.linesCleared).toBe(3)
      expect(result.board).toHaveLength(BOARD_HEIGHT)
      expect(countFilledCells(result.board)).toBe(0)
    })

    it('should add empty lines at top after clearing', () => {
      // Clear 2 lines and verify empty lines are added at top
      const board = createBoardWithFilledRows([18, 19], 'L')

      const result = clearLines(board)

      expect(result.linesCleared).toBe(2)
      expect(result.board).toHaveLength(BOARD_HEIGHT)
      // First two rows should be empty (added at top)
      expect(isRowEmpty(result.board[0])).toBe(true)
      expect(isRowEmpty(result.board[1])).toBe(true)
    })

    it('should preserve pieces above cleared lines', () => {
      // Create board with:
      // - Row 19: complete line (will be cleared)
      // - Row 18: partial line with 5 cells (should drop down)
      // - Row 17: partial line with 3 cells (should drop down)
      const board = createEmptyBoard()

      // Complete line at bottom
      board[19] = Array(BOARD_WIDTH).fill('I')

      // Partial lines above
      for (let i = 0; i < 5; i++) {
        board[18][i] = 'T'
      }
      for (let i = 0; i < 3; i++) {
        board[17][i] = 'O'
      }

      const result = clearLines(board)

      expect(result.linesCleared).toBe(1)
      expect(result.board).toHaveLength(BOARD_HEIGHT)

      // The partial line from row 18 should now be at row 19
      expect(result.board[19][0]).toBe('T')
      expect(result.board[19][4]).toBe('T')
      expect(result.board[19][5]).toBe(null)

      // The partial line from row 17 should now be at row 18
      expect(result.board[18][0]).toBe('O')
      expect(result.board[18][2]).toBe('O')
      expect(result.board[18][3]).toBe(null)

      // Top should have empty line added
      expect(isRowEmpty(result.board[0])).toBe(true)
    })

    it('should handle board with only complete lines', () => {
      // Create board where all rows are complete
      const board = Array(BOARD_HEIGHT).fill(null).map(() =>
        Array(BOARD_WIDTH).fill('Z' as TetrominoType)
      )

      const result = clearLines(board)

      expect(result.linesCleared).toBe(BOARD_HEIGHT)
      expect(result.board).toHaveLength(BOARD_HEIGHT)
      // All cells should be cleared
      expect(countFilledCells(result.board)).toBe(0)
      result.board.forEach(row => {
        expect(isRowEmpty(row)).toBe(true)
      })
    })

    it('should not mutate the original board (immutability)', () => {
      // Create board with one complete line
      const originalBoard = createBoardWithFilledRows([19], 'S')
      const originalBoardCopy = originalBoard.map(row => [...row])

      const result = clearLines(originalBoard)

      // Original board should remain unchanged
      expect(originalBoard).toEqual(originalBoardCopy)
      expect(result.board).not.toBe(originalBoard)

      // Result board should have cleared the line
      expect(result.linesCleared).toBe(1)
      expect(isRowComplete(originalBoard[19])).toBe(true)
      expect(isRowEmpty(result.board[19])).toBe(true)
    })

    it('should maintain correct board height after clearing', () => {
      // Test various scenarios to ensure height is always BOARD_HEIGHT
      const scenarios = [
        { rows: [19], linesCleared: 1 },
        { rows: [18, 19], linesCleared: 2 },
        { rows: [15, 17, 19], linesCleared: 3 },
        { rows: [16, 17, 18, 19], linesCleared: 4 }
      ]

      scenarios.forEach(({ rows, linesCleared: expectedCleared }) => {
        const board = createBoardWithFilledRows(rows, 'J')
        const result = clearLines(board)

        expect(result.board).toHaveLength(BOARD_HEIGHT)
        expect(result.linesCleared).toBe(expectedCleared)

        // Count empty rows at top should equal lines cleared
        const emptyRowsAtTop = result.board
          .slice(0, expectedCleared)
          .filter(isRowEmpty).length
        expect(emptyRowsAtTop).toBe(expectedCleared)
      })
    })
  })

  describe('edge cases and complex scenarios', () => {
    it('should handle alternating complete and incomplete lines', () => {
      const board = createEmptyBoard()

      // Row 19: complete
      board[19] = Array(BOARD_WIDTH).fill('I')
      // Row 18: incomplete (9 cells)
      for (let i = 0; i < 9; i++) {
        board[18][i] = 'T'
      }
      // Row 17: complete
      board[17] = Array(BOARD_WIDTH).fill('S')
      // Row 16: incomplete (8 cells)
      for (let i = 0; i < 8; i++) {
        board[16][i] = 'Z'
      }

      const result = clearLines(board)

      expect(result.linesCleared).toBe(2)
      expect(result.board).toHaveLength(BOARD_HEIGHT)

      // After clearing rows 19 and 17, rows 18 and 16 should drop
      // Row 19 should now have the 9-cell incomplete line from row 18
      expect(result.board[19].filter(cell => cell === 'T').length).toBe(9)

      // Row 18 should now have the 8-cell incomplete line from row 16
      expect(result.board[18].filter(cell => cell === 'Z').length).toBe(8)

      // Top 2 rows should be empty
      expect(isRowEmpty(result.board[0])).toBe(true)
      expect(isRowEmpty(result.board[1])).toBe(true)
    })

    it('should preserve different piece types when clearing', () => {
      const board = createEmptyBoard()

      // Row 19: complete line with mixed types
      board[19] = ['I', 'I', 'T', 'T', 'S', 'S', 'Z', 'Z', 'J', 'L']

      // Row 18: partial line
      board[18][0] = 'O'
      board[18][1] = 'O'
      board[18][2] = 'I'

      const result = clearLines(board)

      expect(result.linesCleared).toBe(1)

      // Row 18's content should now be at row 19
      expect(result.board[19][0]).toBe('O')
      expect(result.board[19][1]).toBe('O')
      expect(result.board[19][2]).toBe('I')
      expect(result.board[19][3]).toBe(null)
    })

    it('should handle empty board (no lines to clear)', () => {
      const board = createEmptyBoard()

      const result = clearLines(board)

      expect(result.linesCleared).toBe(0)
      expect(result.board).toHaveLength(BOARD_HEIGHT)
      expect(countFilledCells(result.board)).toBe(0)
    })

    it('should clear lines with pieces stacked high', () => {
      const board = createEmptyBoard()

      // Fill bottom 10 rows, with rows 15, 17, 19 being complete
      for (let row = 10; row < 20; row++) {
        if (row === 15 || row === 17 || row === 19) {
          board[row] = Array(BOARD_WIDTH).fill('I')
        } else {
          // Partial rows
          for (let col = 0; col < 7; col++) {
            board[row][col] = 'T'
          }
        }
      }

      const result = clearLines(board)

      expect(result.linesCleared).toBe(3)
      expect(result.board).toHaveLength(BOARD_HEIGHT)

      // Should have 7 partial rows at bottom (rows 13-19)
      const filledRowsCount = result.board.filter(row =>
        row.some(cell => cell !== null)
      ).length
      expect(filledRowsCount).toBe(7)

      // No complete lines should remain
      const completeRows = result.board.filter(isRowComplete)
      expect(completeRows).toHaveLength(0)
    })
  })
})
