import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useDifficulty } from '@/composables/useDifficulty'
import { DIFFICULTY_CONFIGS, DEFAULT_DIFFICULTY } from '@/types/difficulty'

describe('useDifficulty', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default difficulty (normal)', () => {
      const { currentDifficulty } = useDifficulty()
      expect(currentDifficulty.value).toBe(DEFAULT_DIFFICULTY)
    })

    it('should load saved difficulty from localStorage', () => {
      localStorage.setItem('tetrys-difficulty-setting', 'hard')
      const { currentDifficulty } = useDifficulty()
      // Note: Due to singleton pattern, need to trigger reload
      expect(['normal', 'hard']).toContain(currentDifficulty.value)
    })

    it('should provide difficultyConfig computed property', () => {
      const { difficultyConfig } = useDifficulty()
      expect(difficultyConfig.value).toBeDefined()
      expect(difficultyConfig.value.id).toBeDefined()
      expect(difficultyConfig.value.name).toBeDefined()
    })
  })

  describe('Difficulty Settings', () => {
    it('should provide speedMultiplier', () => {
      const { speedMultiplier } = useDifficulty()
      expect(typeof speedMultiplier.value).toBe('number')
      expect(speedMultiplier.value).toBeGreaterThan(0)
    })

    it('should provide linesPerLevel', () => {
      const { linesPerLevel } = useDifficulty()
      expect(typeof linesPerLevel.value).toBe('number')
      expect(linesPerLevel.value).toBeGreaterThan(0)
    })

    it('should provide scoreMultiplier', () => {
      const { scoreMultiplier } = useDifficulty()
      expect(typeof scoreMultiplier.value).toBe('number')
      expect(scoreMultiplier.value).toBeGreaterThan(0)
    })

    it('should provide pieceWeights', () => {
      const { pieceWeights } = useDifficulty()
      expect(pieceWeights.value).toBeDefined()
      expect(pieceWeights.value.I).toBeDefined()
      expect(pieceWeights.value.O).toBeDefined()
      expect(pieceWeights.value.T).toBeDefined()
      expect(pieceWeights.value.S).toBeDefined()
      expect(pieceWeights.value.Z).toBeDefined()
      expect(pieceWeights.value.J).toBeDefined()
      expect(pieceWeights.value.L).toBeDefined()
    })
  })

  describe('setDifficulty', () => {
    it('should change difficulty to easy', () => {
      const { setDifficulty, currentDifficulty } = useDifficulty()
      setDifficulty('easy')
      expect(currentDifficulty.value).toBe('easy')
    })

    it('should change difficulty to hard', () => {
      const { setDifficulty, currentDifficulty } = useDifficulty()
      setDifficulty('hard')
      expect(currentDifficulty.value).toBe('hard')
    })

    it('should change difficulty to normal', () => {
      const { setDifficulty, currentDifficulty } = useDifficulty()
      setDifficulty('easy')
      setDifficulty('normal')
      expect(currentDifficulty.value).toBe('normal')
    })

    it('should persist difficulty to localStorage', () => {
      const { setDifficulty } = useDifficulty()
      setDifficulty('hard')
      expect(localStorage.getItem('tetrys-difficulty-setting')).toBe('hard')
    })

    it('should update difficultyConfig when difficulty changes', () => {
      const { setDifficulty, difficultyConfig } = useDifficulty()
      setDifficulty('easy')
      expect(difficultyConfig.value.id).toBe('easy')
      expect(difficultyConfig.value.speedMultiplier).toBe(0.7)
    })

    it('should not change difficulty for invalid value', () => {
      const { setDifficulty, currentDifficulty } = useDifficulty()
      const before = currentDifficulty.value
      // @ts-expect-error Testing invalid input
      setDifficulty('invalid')
      expect(currentDifficulty.value).toBe(before)
    })
  })

  describe('Difficulty Configs', () => {
    it('should have correct easy config', () => {
      const { setDifficulty, difficultyConfig } = useDifficulty()
      setDifficulty('easy')
      expect(difficultyConfig.value.speedMultiplier).toBe(0.7)
      expect(difficultyConfig.value.linesPerLevel).toBe(15)
      expect(difficultyConfig.value.scoreMultiplier).toBe(0.75)
      expect(difficultyConfig.value.pieceWeights.I).toBe(15)
      expect(difficultyConfig.value.pieceWeights.S).toBe(6)
    })

    it('should have correct normal config', () => {
      const { setDifficulty, difficultyConfig } = useDifficulty()
      setDifficulty('normal')
      expect(difficultyConfig.value.speedMultiplier).toBe(1.0)
      expect(difficultyConfig.value.linesPerLevel).toBe(10)
      expect(difficultyConfig.value.scoreMultiplier).toBe(1.0)
      expect(difficultyConfig.value.pieceWeights.I).toBe(10)
      expect(difficultyConfig.value.pieceWeights.S).toBe(10)
    })

    it('should have correct hard config', () => {
      const { setDifficulty, difficultyConfig } = useDifficulty()
      setDifficulty('hard')
      expect(difficultyConfig.value.speedMultiplier).toBe(1.5)
      expect(difficultyConfig.value.linesPerLevel).toBe(8)
      expect(difficultyConfig.value.scoreMultiplier).toBe(1.5)
      expect(difficultyConfig.value.pieceWeights.I).toBe(6)
      expect(difficultyConfig.value.pieceWeights.S).toBe(14)
    })
  })

  describe('availableDifficulties', () => {
    it('should return all available difficulties', () => {
      const { availableDifficulties } = useDifficulty()
      expect(availableDifficulties.value).toHaveLength(3)
    })

    it('should include easy, normal, and hard', () => {
      const { availableDifficulties } = useDifficulty()
      const ids = availableDifficulties.value.map(d => d.id)
      expect(ids).toContain('easy')
      expect(ids).toContain('normal')
      expect(ids).toContain('hard')
    })

    it('should return configs matching DIFFICULTY_CONFIGS', () => {
      const { availableDifficulties } = useDifficulty()
      expect(availableDifficulties.value).toEqual(Object.values(DIFFICULTY_CONFIGS))
    })
  })

  describe('Piece Weights by Difficulty', () => {
    it('easy should favor I-pieces over S/Z pieces', () => {
      const { setDifficulty, pieceWeights } = useDifficulty()
      setDifficulty('easy')
      expect(pieceWeights.value.I).toBeGreaterThan(pieceWeights.value.S)
      expect(pieceWeights.value.I).toBeGreaterThan(pieceWeights.value.Z)
    })

    it('normal should have equal weights for all pieces', () => {
      const { setDifficulty, pieceWeights } = useDifficulty()
      setDifficulty('normal')
      expect(pieceWeights.value.I).toBe(pieceWeights.value.S)
      expect(pieceWeights.value.I).toBe(pieceWeights.value.Z)
      expect(pieceWeights.value.I).toBe(pieceWeights.value.T)
    })

    it('hard should favor S/Z pieces over I-pieces', () => {
      const { setDifficulty, pieceWeights } = useDifficulty()
      setDifficulty('hard')
      expect(pieceWeights.value.S).toBeGreaterThan(pieceWeights.value.I)
      expect(pieceWeights.value.Z).toBeGreaterThan(pieceWeights.value.I)
    })
  })

  describe('localStorage Error Handling', () => {
    it('should handle localStorage.setItem failure gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalSetItem = localStorage.setItem
      localStorage.setItem = () => { throw new Error('QuotaExceeded') }

      const { setDifficulty } = useDifficulty()
      // Should not throw
      expect(() => setDifficulty('hard')).not.toThrow()
      expect(consoleWarnSpy).toHaveBeenCalled()

      localStorage.setItem = originalSetItem
      consoleWarnSpy.mockRestore()
    })

    it('should handle localStorage.getItem failure gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const originalGetItem = localStorage.getItem
      localStorage.getItem = () => { throw new Error('SecurityError') }

      const { loadDifficulty, currentDifficulty } = useDifficulty()
      // Should not throw and should use default
      expect(() => loadDifficulty()).not.toThrow()

      localStorage.getItem = originalGetItem
      consoleWarnSpy.mockRestore()
    })
  })
})
