import { describe, it, expect, beforeEach } from 'vitest'
import {
  createEmptyBoard,
  createBoardWithPieces,
  createBoardWithCompleteRow,
  createBoardWithCompleteRows,
  clearLocalStorage,
  setupLocalStorage,
  getLocalStorageData,
  countFilledCells,
  isRowComplete,
  getCompleteRows,
  createBoardFromPattern
} from './helpers'
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'

describe('Test Helpers', () => {
  beforeEach(() => {
    clearLocalStorage()
  })

  describe('createEmptyBoard', () => {
    it('should create a board with correct dimensions', () => {
      const board = createEmptyBoard()
      expect(board).toHaveLength(BOARD_HEIGHT)
      expect(board[0]).toHaveLength(BOARD_WIDTH)
    })

    it('should create a board filled with null values', () => {
      const board = createEmptyBoard()
      const allNull = board.every(row => row.every(cell => cell === null))
      expect(allNull).toBe(true)
    })
  })

  describe('createBoardWithPieces', () => {
    it('should place pieces at specified positions', () => {
      const board = createBoardWithPieces([
        { type: 'I', x: 0, y: 19 },
        { type: 'O', x: 5, y: 18 }
      ])

      expect(board[19][0]).toBe('I')
      expect(board[18][5]).toBe('O')
    })

    it('should ignore out-of-bounds positions', () => {
      const board = createBoardWithPieces([
        { type: 'I', x: -1, y: 0 },
        { type: 'O', x: 0, y: -1 },
        { type: 'T', x: BOARD_WIDTH, y: 0 },
        { type: 'S', x: 0, y: BOARD_HEIGHT }
      ])

      expect(countFilledCells(board)).toBe(0)
    })
  })

  describe('createBoardWithCompleteRow', () => {
    it('should create a board with one complete row', () => {
      const board = createBoardWithCompleteRow(19, 'I')
      expect(isRowComplete(board[19])).toBe(true)
      expect(board[19].every(cell => cell === 'I')).toBe(true)
    })

    it('should not fill other rows', () => {
      const board = createBoardWithCompleteRow(19, 'I')
      expect(countFilledCells(board)).toBe(BOARD_WIDTH)
    })
  })

  describe('createBoardWithCompleteRows', () => {
    it('should create multiple complete rows', () => {
      const board = createBoardWithCompleteRows([17, 18, 19], 'T')
      const completeRows = getCompleteRows(board)
      expect(completeRows).toEqual([17, 18, 19])
    })
  })

  describe('localStorage helpers', () => {
    it('should set and get data from localStorage', () => {
      const data = { score: 1000, level: 5 }
      setupLocalStorage({ gameData: data })

      const retrieved = getLocalStorageData<{ score: number; level: number }>('gameData')
      expect(retrieved).toEqual(data)
    })

    it('should return null for non-existent keys', () => {
      const retrieved = getLocalStorageData('nonExistent')
      expect(retrieved).toBeNull()
    })

    it('should clear all localStorage data', () => {
      setupLocalStorage({ key1: 'value1', key2: 'value2' })
      clearLocalStorage()
      expect(localStorage.length).toBe(0)
    })
  })

  describe('countFilledCells', () => {
    it('should count filled cells correctly', () => {
      const board = createBoardWithPieces([
        { type: 'I', x: 0, y: 0 },
        { type: 'O', x: 1, y: 0 },
        { type: 'T', x: 2, y: 0 }
      ])

      expect(countFilledCells(board)).toBe(3)
    })

    it('should return 0 for empty board', () => {
      const board = createEmptyBoard()
      expect(countFilledCells(board)).toBe(0)
    })
  })

  describe('isRowComplete', () => {
    it('should return true for complete row', () => {
      const row = Array(BOARD_WIDTH).fill('I')
      expect(isRowComplete(row)).toBe(true)
    })

    it('should return false for incomplete row', () => {
      const row = Array(BOARD_WIDTH).fill('I')
      row[5] = null
      expect(isRowComplete(row)).toBe(false)
    })
  })

  describe('getCompleteRows', () => {
    it('should find all complete rows', () => {
      const board = createBoardWithCompleteRows([18, 19])
      const completeRows = getCompleteRows(board)
      expect(completeRows).toEqual([18, 19])
    })

    it('should return empty array for board with no complete rows', () => {
      const board = createEmptyBoard()
      const completeRows = getCompleteRows(board)
      expect(completeRows).toEqual([])
    })
  })

  describe('createBoardFromPattern', () => {
    it('should create board from pattern string', () => {
      const pattern = [
        '..........',
        '..........',
        '....XX....',
        '....XX....'
      ]
      const board = createBoardFromPattern(pattern, 'O')

      expect(board[2][4]).toBe('O')
      expect(board[2][5]).toBe('O')
      expect(board[3][4]).toBe('O')
      expect(board[3][5]).toBe('O')
      expect(board[0][0]).toBeNull()
    })

    it('should handle patterns with different tetromino types', () => {
      const pattern = ['XXXX......']
      const board = createBoardFromPattern(pattern, 'I')

      expect(board[0][0]).toBe('I')
      expect(board[0][3]).toBe('I')
      expect(board[0][4]).toBeNull()
    })
  })
})
