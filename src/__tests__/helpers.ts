import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'
import type { TetrominoType } from '@/types/tetris'

/**
 * Creates an empty game board filled with null values
 * @returns A 2D array representing an empty game board
 */
export function createEmptyBoard(): (TetrominoType | null)[][] {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null))
}

/**
 * Creates a game board with specified pieces at given positions
 * @param pieces - Array of objects containing piece type and coordinates
 * @returns A 2D array representing a game board with pieces
 *
 * @example
 * const board = createBoardWithPieces([
 *   { type: 'I', x: 0, y: 19 },
 *   { type: 'O', x: 4, y: 18 }
 * ])
 */
export function createBoardWithPieces(
  pieces: Array<{ type: TetrominoType; x: number; y: number }>
): (TetrominoType | null)[][] {
  const board = createEmptyBoard()

  pieces.forEach(({ type, x, y }) => {
    if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      board[y][x] = type
    }
  })

  return board
}

/**
 * Creates a board with a complete row at the specified y position
 * Useful for testing line clearing functionality
 * @param y - The row index to fill (0 is top, BOARD_HEIGHT-1 is bottom)
 * @param type - The tetromino type to fill with (defaults to 'I')
 * @returns A board with one complete row
 */
export function createBoardWithCompleteRow(
  y: number,
  type: TetrominoType = 'I'
): (TetrominoType | null)[][] {
  const board = createEmptyBoard()

  if (y >= 0 && y < BOARD_HEIGHT) {
    board[y] = Array(BOARD_WIDTH).fill(type)
  }

  return board
}

/**
 * Creates a board with multiple complete rows
 * @param rows - Array of row indices to fill
 * @param type - The tetromino type to fill with (defaults to 'I')
 * @returns A board with multiple complete rows
 */
export function createBoardWithCompleteRows(
  rows: number[],
  type: TetrominoType = 'I'
): (TetrominoType | null)[][] {
  const board = createEmptyBoard()

  rows.forEach(y => {
    if (y >= 0 && y < BOARD_HEIGHT) {
      board[y] = Array(BOARD_WIDTH).fill(type)
    }
  })

  return board
}

/**
 * Clears all localStorage data
 * Useful for resetting state between tests
 */
export function clearLocalStorage(): void {
  localStorage.clear()
}

/**
 * Sets up localStorage with mock game data
 * @param data - Object containing key-value pairs to store
 */
export function setupLocalStorage(data: Record<string, any>): void {
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, JSON.stringify(value))
  })
}

/**
 * Retrieves parsed data from localStorage
 * @param key - The localStorage key
 * @returns Parsed data or null if not found
 */
export function getLocalStorageData<T>(key: string): T | null {
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

/**
 * Counts the number of filled cells in a board
 * @param board - The game board to analyze
 * @returns The count of non-null cells
 */
export function countFilledCells(board: (TetrominoType | null)[][]): number {
  return board.reduce((count, row) => {
    return count + row.filter(cell => cell !== null).length
  }, 0)
}

/**
 * Checks if a row is complete (all cells filled)
 * @param row - The row to check
 * @returns True if all cells are filled
 */
export function isRowComplete(row: (TetrominoType | null)[]): boolean {
  return row.every(cell => cell !== null)
}

/**
 * Gets all complete row indices in a board
 * @param board - The game board to analyze
 * @returns Array of row indices that are complete
 */
export function getCompleteRows(board: (TetrominoType | null)[][]): number[] {
  return board
    .map((row, index) => (isRowComplete(row) ? index : -1))
    .filter(index => index !== -1)
}

/**
 * Creates a board with a specific pattern for testing collision detection
 * @param pattern - String representation of the board ('X' = filled, '.' = empty)
 * @returns A game board matching the pattern
 *
 * @example
 * const board = createBoardFromPattern([
 *   '..........',
 *   '..........',
 *   '....XX....',
 *   '....XX....'
 * ])
 */
export function createBoardFromPattern(
  pattern: string[],
  fillType: TetrominoType = 'I'
): (TetrominoType | null)[][] {
  const board = createEmptyBoard()

  pattern.forEach((row, y) => {
    if (y < BOARD_HEIGHT) {
      row.split('').forEach((cell, x) => {
        if (x < BOARD_WIDTH && cell === 'X') {
          board[y][x] = fillType
        }
      })
    }
  })

  return board
}

/**
 * Prints a board to console for debugging tests
 * @param board - The board to print
 * @param label - Optional label to print before the board
 */
export function printBoard(
  board: (TetrominoType | null)[][],
  label?: string
): void {
  if (label) {
    console.log(`\n${label}:`)
  }
  console.log(
    board
      .map(row =>
        row.map(cell => (cell ? cell : '.')).join(' ')
      )
      .join('\n')
  )
}
