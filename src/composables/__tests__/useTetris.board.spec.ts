import { describe, it, expect, beforeEach } from 'vitest'
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  TETROMINO_SHAPES
} from '@/types/tetris'
import type {
  TetrominoType,
  TetrominoShape,
  Position
} from '@/types/tetris'

/**
 * Test Helpers
 */

// Create an empty board
function createEmptyBoard(): (TetrominoType | null)[][] {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null))
}

// Create a board with some existing pieces
function createBoardWithPieces(): (TetrominoType | null)[][] {
  const board = createEmptyBoard()
  // Place some I pieces at the bottom
  for (let x = 0; x < 4; x++) {
    board[BOARD_HEIGHT - 1][x] = 'I'
  }
  // Place some O pieces
  for (let x = 5; x < 7; x++) {
    board[BOARD_HEIGHT - 1][x] = 'O'
    board[BOARD_HEIGHT - 2][x] = 'O'
  }
  return board
}

// Create a tetromino shape
function createTetromino(type: TetrominoType): TetrominoShape {
  return {
    shape: TETROMINO_SHAPES[type][0],
    type
  }
}

// Extract placePiece function from useTetris (pure function)
function placePiece(
  board: (TetrominoType | null)[][],
  piece: TetrominoShape,
  position: Position
): (TetrominoType | null)[][] {
  const newBoard = board.map(row => [...row])

  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x] && position.y + y >= 0) {
        newBoard[position.y + y][position.x + x] = piece.type
      }
    }
  }

  return newBoard
}

describe('useTetris - placePiece Board Manipulation', () => {
  let emptyBoard: (TetrominoType | null)[][]

  beforeEach(() => {
    emptyBoard = createEmptyBoard()
  })

  describe('Test 1: Place piece on empty board correctly', () => {
    it('should place I piece horizontally on empty board', () => {
      const piece = createTetromino('I')
      const position: Position = { x: 3, y: 5 }

      const result = placePiece(emptyBoard, piece, position)

      // Verify the I piece is placed correctly (4 cells horizontally)
      expect(result[5][3]).toBe('I')
      expect(result[5][4]).toBe('I')
      expect(result[5][5]).toBe('I')
      expect(result[5][6]).toBe('I')

      // Verify surrounding cells remain empty
      expect(result[5][2]).toBeNull()
      expect(result[5][7]).toBeNull()
      expect(result[4][3]).toBeNull()
      expect(result[6][3]).toBeNull()
    })

    it('should place O piece (2x2 square) on empty board', () => {
      const piece = createTetromino('O')
      const position: Position = { x: 4, y: 8 }

      const result = placePiece(emptyBoard, piece, position)

      // Verify the O piece is placed correctly (2x2 square)
      expect(result[8][4]).toBe('O')
      expect(result[8][5]).toBe('O')
      expect(result[9][4]).toBe('O')
      expect(result[9][5]).toBe('O')

      // Verify corners remain empty
      expect(result[7][4]).toBeNull()
      expect(result[7][5]).toBeNull()

      // Verify row 10 exists (board is 0-19)
      expect(result[10]).toBeDefined()
      expect(result[10][4]).toBeNull()

      // Verify row 20 doesn't exist (beyond board)
      expect(result[20]).toBeUndefined()
    })

    it('should place T piece correctly on empty board', () => {
      const piece = createTetromino('T')
      const position: Position = { x: 3, y: 10 }

      const result = placePiece(emptyBoard, piece, position)

      // T shape: [[0, 1, 0], [1, 1, 1]]
      // Row 10: center cell only
      expect(result[10][3]).toBeNull()
      expect(result[10][4]).toBe('T')
      expect(result[10][5]).toBeNull()

      // Row 11: three cells
      expect(result[11][3]).toBe('T')
      expect(result[11][4]).toBe('T')
      expect(result[11][5]).toBe('T')
    })
  })

  describe('Test 2: Immutability - original board unchanged', () => {
    it('should not modify the original board when placing a piece', () => {
      const originalBoard = createEmptyBoard()
      const originalBoardCopy = originalBoard.map(row => [...row])
      const piece = createTetromino('L')
      const position: Position = { x: 2, y: 15 }

      const result = placePiece(originalBoard, piece, position)

      // Verify result board has the piece
      expect(result[15][4]).toBe('L')
      expect(result[16][2]).toBe('L')

      // Verify original board is unchanged
      expect(originalBoard).toEqual(originalBoardCopy)
      expect(originalBoard[15][4]).toBeNull()
      expect(originalBoard[16][2]).toBeNull()

      // Ensure they are different array references
      expect(result).not.toBe(originalBoard)
      expect(result[0]).not.toBe(originalBoard[0])
    })

    it('should maintain immutability with board containing existing pieces', () => {
      const boardWithPieces = createBoardWithPieces()
      const boardCopy = boardWithPieces.map(row => [...row])
      const piece = createTetromino('S')
      const position: Position = { x: 3, y: 5 }

      const result = placePiece(boardWithPieces, piece, position)

      // Verify original board still has the same pieces
      expect(boardWithPieces[BOARD_HEIGHT - 1][0]).toBe('I')
      expect(boardWithPieces[BOARD_HEIGHT - 1][5]).toBe('O')
      expect(boardWithPieces).toEqual(boardCopy)

      // Verify result has new piece added
      expect(result[5][4]).toBe('S')
      expect(result[6][3]).toBe('S')
    })
  })

  describe('Test 3: Piece partially above visible board', () => {
    it('should only place cells that are within visible board (y >= 0)', () => {
      const piece = createTetromino('I')
      // Position piece so top part is above board (y = -1 means first row at y=-1)
      const position: Position = { x: 3, y: -1 }

      const result = placePiece(emptyBoard, piece, position)

      // I piece is horizontal: [[1, 1, 1, 1]]
      // At y=-1, none should be placed since condition is position.y + y >= 0
      // With y=0 in loop, position.y + y = -1 + 0 = -1, which fails >= 0
      expect(result[0][3]).toBeNull()
      expect(result[0][4]).toBeNull()
      expect(result[0][5]).toBeNull()
      expect(result[0][6]).toBeNull()

      // Verify entire board remains empty
      const allNull = result.every(row => row.every(cell => cell === null))
      expect(allNull).toBe(true)
    })

    it('should place only visible portion when piece spans negative and positive y', () => {
      // T piece: [[0, 1, 0], [1, 1, 1]]
      const piece = createTetromino('T')
      // Position so first row is at y=-1, second row at y=0
      const position: Position = { x: 3, y: -1 }

      const result = placePiece(emptyBoard, piece, position)

      // First row of T (y=-1) should not be placed
      // Second row of T (y=0) should be placed
      expect(result[0][3]).toBe('T')
      expect(result[0][4]).toBe('T')
      expect(result[0][5]).toBe('T')

      // Rest of board should be empty
      for (let y = 1; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          expect(result[y][x]).toBeNull()
        }
      }
    })

    it('should handle J piece partially above board', () => {
      // J piece: [[1, 0, 0], [1, 1, 1]]
      const piece = createTetromino('J')
      const position: Position = { x: 2, y: -1 }

      const result = placePiece(emptyBoard, piece, position)

      // Only second row (y=0) should be visible
      expect(result[0][2]).toBe('J')
      expect(result[0][3]).toBe('J')
      expect(result[0][4]).toBe('J')

      // Verify first row content is not placed (was at y=-1)
      // All other rows should be empty
      for (let y = 1; y < BOARD_HEIGHT; y++) {
        const allNull = result[y].every(cell => cell === null)
        expect(allNull).toBe(true)
      }
    })
  })

  describe('Test 4: Overwriting existing pieces', () => {
    it('should overwrite existing pieces when placing new piece', () => {
      const boardWithPieces = createBoardWithPieces()
      const piece = createTetromino('I')
      // Place I piece where existing I pieces are
      const position: Position = { x: 0, y: BOARD_HEIGHT - 1 }

      const result = placePiece(boardWithPieces, piece, position)

      // New I piece should overwrite at same positions
      expect(result[BOARD_HEIGHT - 1][0]).toBe('I')
      expect(result[BOARD_HEIGHT - 1][1]).toBe('I')
      expect(result[BOARD_HEIGHT - 1][2]).toBe('I')
      expect(result[BOARD_HEIGHT - 1][3]).toBe('I')

      // O pieces should remain unchanged
      expect(result[BOARD_HEIGHT - 1][5]).toBe('O')
      expect(result[BOARD_HEIGHT - 1][6]).toBe('O')
    })

    it('should overwrite with different piece type', () => {
      const boardWithPieces = createBoardWithPieces()
      const piece = createTetromino('O')
      // Place O piece where I pieces are (2 rows above bottom since O is 2x2)
      const position: Position = { x: 0, y: BOARD_HEIGHT - 2 }

      const result = placePiece(boardWithPieces, piece, position)

      // O piece (2x2) overwrites part of the existing pieces
      expect(result[BOARD_HEIGHT - 2][0]).toBe('O')
      expect(result[BOARD_HEIGHT - 2][1]).toBe('O')
      expect(result[BOARD_HEIGHT - 1][0]).toBe('O')
      expect(result[BOARD_HEIGHT - 1][1]).toBe('O')

      // Original I pieces beyond O placement remain
      expect(result[BOARD_HEIGHT - 1][2]).toBe('I')
      expect(result[BOARD_HEIGHT - 1][3]).toBe('I')
    })

    it('should handle complex overwrite scenario with T piece', () => {
      const board = createEmptyBoard()
      // Place initial horizontal line of L pieces
      for (let x = 2; x < 6; x++) {
        board[10][x] = 'L'
      }

      const piece = createTetromino('T')
      const position: Position = { x: 3, y: 9 }

      const result = placePiece(board, piece, position)

      // T shape: [[0, 1, 0], [1, 1, 1]]
      // Row 9: center T cell
      expect(result[9][4]).toBe('T')

      // Row 10: T overwrites L pieces at positions 3, 4, 5
      expect(result[10][3]).toBe('T')
      expect(result[10][4]).toBe('T')
      expect(result[10][5]).toBe('T')

      // L piece at x=2 remains
      expect(result[10][2]).toBe('L')
    })
  })

  describe('Test 5: All 7 tetromino types placement', () => {
    it('should correctly place I tetromino', () => {
      const piece = createTetromino('I')
      const position: Position = { x: 0, y: 0 }

      const result = placePiece(emptyBoard, piece, position)

      // I shape: [[1, 1, 1, 1]]
      expect(result[0][0]).toBe('I')
      expect(result[0][1]).toBe('I')
      expect(result[0][2]).toBe('I')
      expect(result[0][3]).toBe('I')
    })

    it('should correctly place O tetromino', () => {
      const piece = createTetromino('O')
      const position: Position = { x: 1, y: 1 }

      const result = placePiece(emptyBoard, piece, position)

      // O shape: [[1, 1], [1, 1]]
      expect(result[1][1]).toBe('O')
      expect(result[1][2]).toBe('O')
      expect(result[2][1]).toBe('O')
      expect(result[2][2]).toBe('O')
    })

    it('should correctly place T tetromino', () => {
      const piece = createTetromino('T')
      const position: Position = { x: 2, y: 2 }

      const result = placePiece(emptyBoard, piece, position)

      // T shape: [[0, 1, 0], [1, 1, 1]]
      expect(result[2][3]).toBe('T')
      expect(result[3][2]).toBe('T')
      expect(result[3][3]).toBe('T')
      expect(result[3][4]).toBe('T')
    })

    it('should correctly place S tetromino', () => {
      const piece = createTetromino('S')
      const position: Position = { x: 3, y: 3 }

      const result = placePiece(emptyBoard, piece, position)

      // S shape: [[0, 1, 1], [1, 1, 0]]
      expect(result[3][4]).toBe('S')
      expect(result[3][5]).toBe('S')
      expect(result[4][3]).toBe('S')
      expect(result[4][4]).toBe('S')
    })

    it('should correctly place Z tetromino', () => {
      const piece = createTetromino('Z')
      const position: Position = { x: 4, y: 4 }

      const result = placePiece(emptyBoard, piece, position)

      // Z shape: [[1, 1, 0], [0, 1, 1]]
      expect(result[4][4]).toBe('Z')
      expect(result[4][5]).toBe('Z')
      expect(result[5][5]).toBe('Z')
      expect(result[5][6]).toBe('Z')
    })

    it('should correctly place J tetromino', () => {
      const piece = createTetromino('J')
      const position: Position = { x: 5, y: 5 }

      const result = placePiece(emptyBoard, piece, position)

      // J shape: [[1, 0, 0], [1, 1, 1]]
      expect(result[5][5]).toBe('J')
      expect(result[6][5]).toBe('J')
      expect(result[6][6]).toBe('J')
      expect(result[6][7]).toBe('J')
    })

    it('should correctly place L tetromino', () => {
      const piece = createTetromino('L')
      const position: Position = { x: 6, y: 6 }

      const result = placePiece(emptyBoard, piece, position)

      // L shape: [[0, 0, 1], [1, 1, 1]]
      expect(result[6][8]).toBe('L')
      expect(result[7][6]).toBe('L')
      expect(result[7][7]).toBe('L')
      expect(result[7][8]).toBe('L')
    })

    it('should place all 7 types on same board without interference', () => {
      let board = createEmptyBoard()

      const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
      const positions: Position[] = [
        { x: 0, y: 0 },  // I
        { x: 0, y: 2 },  // O
        { x: 0, y: 5 },  // T
        { x: 0, y: 8 },  // S
        { x: 4, y: 0 },  // Z
        { x: 4, y: 3 },  // J
        { x: 4, y: 6 }   // L
      ]

      // Place all pieces
      types.forEach((type, index) => {
        const piece = createTetromino(type)
        board = placePiece(board, piece, positions[index])
      })

      // Verify all pieces are present
      expect(board[0][0]).toBe('I')  // I piece
      expect(board[2][0]).toBe('O')  // O piece
      expect(board[6][0]).toBe('T')  // T piece
      expect(board[8][1]).toBe('S')  // S piece
      expect(board[0][4]).toBe('Z')  // Z piece
      expect(board[3][4]).toBe('J')  // J piece
      expect(board[6][6]).toBe('L')  // L piece

      // Count total placed cells
      let totalCells = 0
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          if (board[y][x] !== null) {
            totalCells++
          }
        }
      }

      // Each piece has 4 cells, so 7 pieces = 28 cells
      expect(totalCells).toBe(28)
    })
  })
})
