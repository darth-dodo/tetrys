import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINO_SHAPES
} from '@/types/tetris'
import type {
  TetrominoType,
  TetrominoShape
} from '@/types/tetris'

/**
 * Test helper functions for Tetris composable tests
 */

/**
 * Create an empty game board
 * @returns A 2D array representing an empty board (BOARD_HEIGHT x BOARD_WIDTH)
 */
export function createEmptyBoard(): (TetrominoType | null)[][] {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null))
}

/**
 * Create a board with some pre-placed pieces for testing
 * Places I pieces and O pieces at the bottom of the board
 * @returns A 2D array representing a board with existing pieces
 */
export function createBoardWithPieces(): (TetrominoType | null)[][] {
  const board = createEmptyBoard()

  // Place some I pieces at the bottom (rows 19, columns 0-3)
  for (let x = 0; x < 4; x++) {
    board[BOARD_HEIGHT - 1][x] = 'I'
  }

  // Place some O pieces (2x2 square at rows 18-19, columns 5-6)
  for (let x = 5; x < 7; x++) {
    board[BOARD_HEIGHT - 1][x] = 'O'
    board[BOARD_HEIGHT - 2][x] = 'O'
  }

  return board
}

/**
 * Create a tetromino shape of the specified type
 * Uses the first rotation (index 0) of the shape
 * @param type - The type of tetromino to create ('I', 'O', 'T', 'S', 'Z', 'J', 'L')
 * @returns A TetrominoShape object with shape array and type
 */
export function createTetromino(type: TetrominoType): TetrominoShape {
  return {
    shape: TETROMINO_SHAPES[type][0],
    type
  }
}

/**
 * Create a tetromino shape with a specific rotation
 * @param type - The type of tetromino to create
 * @param rotationIndex - The rotation index (0-3, depending on piece type)
 * @returns A TetrominoShape object with specified rotation
 */
export function createTetrominoWithRotation(
  type: TetrominoType,
  rotationIndex: number
): TetrominoShape {
  const shapes = TETROMINO_SHAPES[type]
  const index = rotationIndex % shapes.length
  return {
    shape: shapes[index],
    type
  }
}

/**
 * Count the number of filled cells on the board
 * @param board - The game board to count
 * @returns The number of non-null cells
 */
export function countFilledCells(board: (TetrominoType | null)[][]): number {
  return board.reduce(
    (total, row) => total + row.filter(cell => cell !== null).length,
    0
  )
}

/**
 * Check if a board is completely empty
 * @param board - The game board to check
 * @returns true if all cells are null, false otherwise
 */
export function isBoardEmpty(board: (TetrominoType | null)[][]): boolean {
  return board.every(row => row.every(cell => cell === null))
}

/**
 * Get a specific cell value from the board
 * @param board - The game board
 * @param x - The x coordinate (column)
 * @param y - The y coordinate (row)
 * @returns The cell value, or undefined if out of bounds
 */
export function getCell(
  board: (TetrominoType | null)[][],
  x: number,
  y: number
): TetrominoType | null | undefined {
  if (y < 0 || y >= BOARD_HEIGHT || x < 0 || x >= BOARD_WIDTH) {
    return undefined
  }
  return board[y][x]
}

/**
 * Create a custom board pattern for testing
 * @param pattern - Array of [x, y, type] tuples to place on the board
 * @returns A board with the specified pattern
 */
export function createBoardWithPattern(
  pattern: Array<[number, number, TetrominoType]>
): (TetrominoType | null)[][] {
  const board = createEmptyBoard()
  pattern.forEach(([x, y, type]) => {
    if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
      board[y][x] = type
    }
  })
  return board
}
