import { describe, it, expect } from 'vitest'
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'
import type { TetrominoType } from '@/types/tetris'

describe('Tetris Types and Constants', () => {
  it('should have correct board dimensions', () => {
    expect(BOARD_WIDTH).toBe(10)
    expect(BOARD_HEIGHT).toBe(20)
  })

  it('should define all tetromino types', () => {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
    expect(types).toHaveLength(7)
    expect(types.includes('I')).toBe(true)
    expect(types.includes('O')).toBe(true)
    expect(types.includes('T')).toBe(true)
    expect(types.includes('S')).toBe(true)
    expect(types.includes('Z')).toBe(true)
    expect(types.includes('J')).toBe(true)
    expect(types.includes('L')).toBe(true)
  })
})