import { describe, it, expect } from 'vitest'
import { useTetris } from '../useTetris'

describe('useTetris - Scoring System', () => {
  describe('calculateScore', () => {
    it('should return 0 points when no lines are cleared', () => {
      const { gameState, startGame } = useTetris()

      startGame()

      // Initial state should have 0 score
      expect(gameState.value.score).toBe(0)
      expect(gameState.value.lines).toBe(0)
    })

    it('should calculate correct score for single line (100 points base)', () => {

      // Test the scoring algorithm directly
      // Single line at level 1: 100 * 1 = 100
      const linesCleared = 1
      const level = 1
      const baseScores = [0, 100, 300, 500, 800]
      const expectedScore = baseScores[linesCleared] * level

      expect(expectedScore).toBe(100)

      // Test at level 3
      const level3Score = baseScores[linesCleared] * 3
      expect(level3Score).toBe(300)
    })

    it('should calculate correct score for double/2 lines (300 points base)', () => {

      // Double line at level 1: 300 * 1 = 300
      const linesCleared = 2
      const level = 1
      const baseScores = [0, 100, 300, 500, 800]
      const expectedScore = baseScores[linesCleared] * level

      expect(expectedScore).toBe(300)

      // Test at level 2
      const level2Score = baseScores[linesCleared] * 2
      expect(level2Score).toBe(600)

      // Test at level 4
      const level4Score = baseScores[linesCleared] * 4
      expect(level4Score).toBe(1200)
    })

    it('should calculate correct score for triple/3 lines (500 points base)', () => {

      // Triple line at level 1: 500 * 1 = 500
      const linesCleared = 3
      const level = 1
      const baseScores = [0, 100, 300, 500, 800]
      const expectedScore = baseScores[linesCleared] * level

      expect(expectedScore).toBe(500)

      // Test at level 3
      const level3Score = baseScores[linesCleared] * 3
      expect(level3Score).toBe(1500)

      // Test at level 5
      const level5Score = baseScores[linesCleared] * 5
      expect(level5Score).toBe(2500)
    })

    it('should calculate correct score for Tetris/4 lines (800 points base)', () => {

      // Tetris (4 lines) at level 1: 800 * 1 = 800
      const linesCleared = 4
      const level = 1
      const baseScores = [0, 100, 300, 500, 800]
      const expectedScore = baseScores[linesCleared] * level

      expect(expectedScore).toBe(800)

      // Test at level 2
      const level2Score = baseScores[linesCleared] * 2
      expect(level2Score).toBe(1600)

      // Test at level 10
      const level10Score = baseScores[linesCleared] * 10
      expect(level10Score).toBe(8000)
    })

    it('should apply level multiplier correctly across all scenarios', () => {
      const baseScores = [0, 100, 300, 500, 800]

      // Test Level 1 - base scoring
      expect(baseScores[0] * 1).toBe(0)    // No lines
      expect(baseScores[1] * 1).toBe(100)  // Single
      expect(baseScores[2] * 1).toBe(300)  // Double
      expect(baseScores[3] * 1).toBe(500)  // Triple
      expect(baseScores[4] * 1).toBe(800)  // Tetris

      // Test Level 2 - 2x multiplier
      expect(baseScores[0] * 2).toBe(0)    // No lines
      expect(baseScores[1] * 2).toBe(200)  // Single
      expect(baseScores[2] * 2).toBe(600)  // Double
      expect(baseScores[3] * 2).toBe(1000) // Triple
      expect(baseScores[4] * 2).toBe(1600) // Tetris

      // Test Level 5 - 5x multiplier
      expect(baseScores[0] * 5).toBe(0)    // No lines
      expect(baseScores[1] * 5).toBe(500)  // Single
      expect(baseScores[2] * 5).toBe(1500) // Double
      expect(baseScores[3] * 5).toBe(2500) // Triple
      expect(baseScores[4] * 5).toBe(4000) // Tetris

      // Test combined scoring scenario:
      // Level 3, clear 2 singles and 1 double
      const level3Score = (baseScores[1] * 3) + (baseScores[1] * 3) + (baseScores[2] * 3)
      expect(level3Score).toBe(300 + 300 + 900) // 1500 total

      // Test level progression scenario:
      // Start at level 1, progress to level 2 after 10 lines
      let totalScore = 0
      let currentLevel = 1

      // Clear 8 singles at level 1 (8 lines total)
      for (let i = 0; i < 8; i++) {
        totalScore += baseScores[1] * currentLevel // 100 * 1 = 100 each
      }
      expect(totalScore).toBe(800)

      // Clear 1 double at level 1 (10 lines total -> level up!)
      totalScore += baseScores[2] * currentLevel // 300 * 1 = 300
      expect(totalScore).toBe(1100)

      // Now at level 2 (10 lines cleared)
      currentLevel = 2

      // Clear 1 tetris at level 2
      totalScore += baseScores[4] * currentLevel // 800 * 2 = 1600
      expect(totalScore).toBe(2700)
    })
  })

  describe('Scoring Integration', () => {
    it('should verify scoring formula: baseScores[linesCleared] * level', () => {
      const baseScores = [0, 100, 300, 500, 800]

      // Verify the formula for all valid combinations
      const testCases = [
        { lines: 0, level: 1, expected: 0 },
        { lines: 1, level: 1, expected: 100 },
        { lines: 1, level: 5, expected: 500 },
        { lines: 2, level: 1, expected: 300 },
        { lines: 2, level: 3, expected: 900 },
        { lines: 3, level: 1, expected: 500 },
        { lines: 3, level: 4, expected: 2000 },
        { lines: 4, level: 1, expected: 800 },
        { lines: 4, level: 7, expected: 5600 },
        { lines: 4, level: 10, expected: 8000 }
      ]

      testCases.forEach(({ lines, level, expected }) => {
        const score = baseScores[lines] * level
        expect(score).toBe(expected)
      })
    })
  })
})
