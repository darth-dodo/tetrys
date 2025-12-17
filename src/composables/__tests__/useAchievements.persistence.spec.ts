import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { useAchievements } from '../useAchievements'
import { clearLocalStorage, getLocalStorageData } from '@/__tests__/helpers'
import type { UnlockedAchievement } from '@/types/achievements'

/**
 * Test suite for useAchievements localStorage persistence
 *
 * EVENT-DRIVEN ARCHITECTURE OVERVIEW:
 * ====================================
 * useAchievements now operates as an event-driven system using mitt (event bus):
 *
 * INCOMING EVENTS (subscribed via eventBus.on):
 * - 'lines:cleared' → Updates internal linesCleared stat, triggers unlock check
 * - 'score:updated' → Updates internal score stat, triggers unlock check
 * - 'combo:updated' → Updates internal maxCombo stat, triggers unlock check
 * - 'time:tick' → Updates internal timePlayed stat, triggers unlock check
 * - 'game:started' → Resets all internal stats to zero for new game
 *
 * OUTGOING EVENTS (emitted via eventBus.emit):
 * - 'achievement:unlocked' → { id, rarity, timestamp } when achievement is unlocked
 *
 * PERSISTENCE MODEL:
 * - Unlocked achievements persist to localStorage automatically after unlock
 * - Internal session stats (lines, score, combo, time) do NOT persist
 * - Stats reset on 'game:started' event for clean game sessions
 * - Persistence happens synchronously after achievement unlock
 *
 * TESTING NOTES FOR THIS FILE:
 * - These tests verify localStorage save/load behavior
 * - Direct unlock calls used to test persistence (bypass event system)
 * - Event-driven persistence is tested in useAchievements.integration.spec.ts
 * - Relevant events: None directly tested here (persistence testing only)
 *
 * BDD style tests with Given-When-Then pattern
 * Tests cover:
 * - Default initialization with empty achievements
 * - Saving and loading achievements from localStorage
 * - Persisting achievement unlock timestamps
 * - Persisting achievement progress data
 * - Error handling for quota exceeded and invalid data
 * - Data structure validation and integrity
 * - Concurrent access handling
 */

/**
 * Helper to create a test component that uses the achievements composable
 */
function createAchievementsTestComponent() {
  return defineComponent({
    setup() {
      return { achievements: useAchievements() }
    },
    render() {
      return h('div')
    }
  })
}

describe('useAchievements localStorage Persistence', () => {
  beforeEach(() => {
    clearLocalStorage()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    clearLocalStorage()
  })

  // ============================================================================
  // Test 1: Initialize with default unlocked achievements (empty array)
  // ============================================================================
  describe('Default Initialization', () => {
    it('should initialize with empty unlocked achievements array', async () => {
      // Given: Fresh state with no localStorage data
      // EVENT-DRIVEN: On initialization, event subscriptions are set up
      clearLocalStorage()
      expect(localStorage.getItem('tetris_achievements')).toBeNull()

      // When: Creating achievements composable
      // EVENT-DRIVEN: Composable subscribes to game events (lines, score, combo, time)
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: Should have empty achievements array (no unlocks yet)
      expect(wrapper.vm.achievements.unlockedAchievements.value).toEqual([])
      expect(wrapper.vm.achievements.stats.value.unlockedCount).toBe(0)
      expect(wrapper.vm.achievements.stats.value.totalAchievements).toBeGreaterThan(0)

      wrapper.unmount()
    })

    it('should initialize with default session stats', async () => {
      // Given: Fresh state with no localStorage data
      clearLocalStorage()

      // When: Creating achievements composable
      // EVENT-DRIVEN: Stats initialized to zero, ready to receive events
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: Session stats should have default values (awaiting game events)
      // EVENT-DRIVEN: Stats will update when 'lines:cleared', 'score:updated', etc. fire
      const sessionStats = wrapper.vm.achievements.sessionStats.value
      expect(sessionStats.linesCleared).toBe(0)
      expect(sessionStats.tetrisCount).toBe(0)
      expect(sessionStats.maxCombo).toBe(0)
      expect(sessionStats.gamesPlayed).toBe(0)

      wrapper.unmount()
    })

    it('should not have pending notifications on initialization', async () => {
      // Given: Fresh state
      clearLocalStorage()

      // When: Creating achievements composable
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: No pending notifications
      expect(wrapper.vm.achievements.pendingNotifications.value).toEqual([])

      wrapper.unmount()
    })
  })

  // ============================================================================
  // Test 2: Save unlocked achievements to localStorage
  // ============================================================================
  describe('Save Achievements to localStorage', () => {
    it('should save unlocked achievements to localStorage with correct key', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Unlocking an achievement
      wrapper.vm.achievements.unlockAchievement('first_blood', {
        score: 100,
        level: 1,
        lines: 1
      })
      await flushPromises()

      // Then: Achievement should be saved to localStorage
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      expect(saved).not.toBeNull()
      expect(saved!.some(a => a.achievementId === 'first_blood')).toBe(true)

      wrapper.unmount()
    })

    it('should save multiple unlocked achievements', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Unlocking multiple achievements
      wrapper.vm.achievements.unlockAchievement('first_blood', { score: 100, level: 1, lines: 1 })
      wrapper.vm.achievements.unlockAchievement('tetris_novice', { score: 500, level: 2, lines: 4 })
      await flushPromises()

      // Then: Multiple achievements should be saved
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      expect(saved).not.toBeNull()
      expect(saved!.map(a => a.achievementId)).toContain('first_blood')
      expect(saved!.map(a => a.achievementId)).toContain('tetris_novice')

      wrapper.unmount()
    })

    it('should NOT save session stats to localStorage (reserved for future use)', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Updating session stats
      wrapper.vm.achievements.updateSessionStats({
        linesCleared: 10,
        tetrisCount: 2,
        gamesPlayed: 5
      })
      await flushPromises()

      // Then: Stats should NOT be saved to localStorage (see comment in useAchievements.ts)
      const stats = getLocalStorageData('tetris_achievement_stats')
      expect(stats).toBeNull()

      // But in-memory value is updated
      expect(wrapper.vm.achievements.sessionStats.value.linesCleared).toBe(10)
      expect(wrapper.vm.achievements.sessionStats.value.tetrisCount).toBe(2)
      expect(wrapper.vm.achievements.sessionStats.value.gamesPlayed).toBe(5)

      wrapper.unmount()
    })
  })

  // ============================================================================
  // Test 3: Load unlocked achievements from localStorage
  // ============================================================================
  describe('Load Achievements from localStorage', () => {
    it('should load achievements on initialization', async () => {
      // Given: Pre-existing data in localStorage
      const savedAchievements: UnlockedAchievement[] = [
        {
          achievementId: 'first_blood',
          unlockedAt: new Date('2024-01-01'),
          gameStats: { score: 100, level: 1, lines: 1 }
        }
      ]
      localStorage.setItem('tetris_achievements', JSON.stringify(savedAchievements))

      // When: Creating achievements composable
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: Should load achievements from storage
      expect(wrapper.vm.achievements.unlockedAchievements.value.length).toBeGreaterThanOrEqual(1)
      expect(wrapper.vm.achievements.unlockedAchievements.value.some(a => a.achievementId === 'first_blood')).toBe(true)

      wrapper.unmount()
    })

    it('should restore unlockedAt as Date object when loading', async () => {
      // Given: Achievements saved as JSON strings (dates become strings)
      const savedAchievements = [
        {
          achievementId: 'first_blood',
          unlockedAt: '2024-01-15T10:30:00.000Z',
          gameStats: { score: 100, level: 1, lines: 1 }
        }
      ]
      localStorage.setItem('tetris_achievements', JSON.stringify(savedAchievements))

      // When: Creating achievements composable
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: unlockedAt should be converted back to Date object
      const loaded = wrapper.vm.achievements.unlockedAchievements.value.find(
        a => a.achievementId === 'first_blood'
      )
      expect(loaded).toBeDefined()
      expect(loaded!.unlockedAt).toBeInstanceOf(Date)
      expect(loaded!.unlockedAt.toISOString()).toBe('2024-01-15T10:30:00.000Z')

      wrapper.unmount()
    })

    it('should NOT load session stats from localStorage (always reset to defaults)', async () => {
      // Given: Pre-existing stats in localStorage (from old version)
      const savedStats = {
        linesCleared: 25,
        tetrisCount: 5,
        maxCombo: 8,
        gamesPlayed: 10,
        totalLinesCleared: 50,
        timePlayed: 3600
      }
      localStorage.setItem('tetris_achievement_stats', JSON.stringify(savedStats))

      // When: Creating achievements composable
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: Stats are reset to defaults (not loaded from localStorage)
      const stats = wrapper.vm.achievements.sessionStats.value
      expect(stats.linesCleared).toBe(0)
      expect(stats.tetrisCount).toBe(0)
      expect(stats.maxCombo).toBe(0)
      expect(stats.gamesPlayed).toBe(0)

      wrapper.unmount()
    })

    it('should NOT merge loaded stats (always use defaults)', async () => {
      // Given: Partial stats saved in localStorage (from old version)
      const partialStats = {
        linesCleared: 15,
        gamesPlayed: 3
      }
      localStorage.setItem('tetris_achievement_stats', JSON.stringify(partialStats))

      // When: Creating achievements composable
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: All stats reset to defaults (not merged from localStorage)
      const stats = wrapper.vm.achievements.sessionStats.value
      expect(stats.linesCleared).toBe(0)
      expect(stats.gamesPlayed).toBe(0)
      expect(stats.tetrisCount).toBe(0)
      expect(stats.maxCombo).toBe(0)

      wrapper.unmount()
    })
  })

  // ============================================================================
  // Test 4: Handle invalid localStorage data gracefully
  // ============================================================================
  describe('Invalid localStorage Data Handling', () => {
    it('should handle corrupted JSON in achievements key gracefully', async () => {
      // Given: Invalid JSON in localStorage
      localStorage.setItem('tetris_achievements', '{invalid json}')

      // When: Creating achievements composable (error logged but caught)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: Should fall back to empty array without crashing
      expect(wrapper.vm.achievements.unlockedAchievements.value).toEqual([])
      expect(wrapper.vm.achievements.stats.value.unlockedCount).toBe(0)

      consoleSpy.mockRestore()
      wrapper.unmount()
    })

    it('should handle corrupted JSON in stats key gracefully', async () => {
      // Given: Invalid JSON in stats key
      localStorage.setItem('tetris_achievement_stats', 'not valid json at all')

      // When: Creating achievements composable (error logged but caught)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: Should use default stats without crashing
      const stats = wrapper.vm.achievements.sessionStats.value
      expect(stats.linesCleared).toBe(0)
      expect(stats.gamesPlayed).toBe(0)

      consoleSpy.mockRestore()
      wrapper.unmount()
    })

    it('should handle empty string in localStorage', async () => {
      // Given: Empty string in achievements key
      localStorage.setItem('tetris_achievements', '')

      // When: Creating achievements composable
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: Should fall back gracefully
      expect(wrapper.vm.achievements.unlockedAchievements.value).toEqual([])

      consoleSpy.mockRestore()
      wrapper.unmount()
    })

    it('should handle null values in localStorage data', async () => {
      // Given: Achievement data with null values
      const invalidData = [
        {
          achievementId: null,
          unlockedAt: null,
          gameStats: null
        }
      ]
      localStorage.setItem('tetris_achievements', JSON.stringify(invalidData))

      // When: Creating achievements composable (should not crash)
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      expect(() => {
        flushPromises()
      }).not.toThrow()

      wrapper.unmount()
    })

    it('should recover from invalid data and allow new saves', async () => {
      // Given: Invalid data in localStorage
      localStorage.setItem('tetris_achievements', '{corrupted}')

      // When: Creating composable and unlocking achievement
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      wrapper.vm.achievements.unlockAchievement('first_blood', {
        score: 100,
        level: 1,
        lines: 1
      })
      await flushPromises()

      // Then: Should save correctly
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      expect(saved).not.toBeNull()
      expect(saved!.some(a => a.achievementId === 'first_blood')).toBe(true)

      consoleSpy.mockRestore()
      wrapper.unmount()
    })
  })

  // ============================================================================
  // Test 5: Persist achievement unlock timestamp
  // ============================================================================
  describe('Achievement Unlock Timestamp Persistence', () => {
    it('should persist achievement unlock timestamp to localStorage', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Unlocking an achievement
      const beforeUnlock = new Date()
      wrapper.vm.achievements.unlockAchievement('tetris_master', {
        score: 100,
        level: 1,
        lines: 1
      })
      const afterUnlock = new Date()
      await flushPromises()

      // Then: Timestamp should be saved and be within expected range
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      expect(saved).not.toBeNull()
      const achievement = saved!.find(a => a.achievementId === 'tetris_master')
      expect(achievement).toBeDefined()
      const timestamp = new Date(achievement!.unlockedAt)
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeUnlock.getTime())
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterUnlock.getTime())

      wrapper.unmount()
    })

    it('should preserve unlock timestamp order when loading', async () => {
      // Given: Multiple achievements with timestamps
      const achievement1: UnlockedAchievement = {
        achievementId: 'first_blood',
        unlockedAt: new Date('2024-01-01T10:00:00Z')
      }
      const achievement2: UnlockedAchievement = {
        achievementId: 'tetris_novice',
        unlockedAt: new Date('2024-01-02T10:00:00Z')
      }
      localStorage.setItem('tetris_achievements', JSON.stringify([achievement1, achievement2]))

      // When: Loading achievements
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: Timestamps should be preserved and ordered
      const loaded = wrapper.vm.achievements.unlockedAchievements.value
      const a1 = loaded.find(a => a.achievementId === 'first_blood')
      const a2 = loaded.find(a => a.achievementId === 'tetris_novice')
      expect(a1).toBeDefined()
      expect(a2).toBeDefined()
      expect(a1!.unlockedAt.getTime()).toBeLessThan(a2!.unlockedAt.getTime())

      wrapper.unmount()
    })

    it('should update timestamp on subsequent saves', async () => {
      // Given: Achievement already unlocked with old timestamp
      const oldDate = new Date('2024-01-01T00:00:00Z')
      const oldAchievement: UnlockedAchievement = {
        achievementId: 'first_blood',
        unlockedAt: oldDate
      }
      localStorage.setItem('tetris_achievements', JSON.stringify([oldAchievement]))

      // When: Loading and then unlocking a different achievement
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      const beforeNewUnlock = new Date()
      wrapper.vm.achievements.unlockAchievement('tetris_novice', {
        score: 500,
        level: 2,
        lines: 4
      })
      const afterNewUnlock = new Date()
      await flushPromises()

      // Then: New achievement should have fresh timestamp
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      const newAchievement = saved!.find(a => a.achievementId === 'tetris_novice')
      expect(newAchievement).toBeDefined()
      expect(new Date(newAchievement!.unlockedAt).getTime()).toBeGreaterThanOrEqual(
        beforeNewUnlock.getTime()
      )
      expect(new Date(newAchievement!.unlockedAt).getTime()).toBeLessThanOrEqual(
        afterNewUnlock.getTime()
      )

      wrapper.unmount()
    })
  })

  // ============================================================================
  // Test 6: Persist achievement progress data
  // ============================================================================
  describe('Achievement Progress Data Persistence', () => {
    it('should persist game stats when unlocking achievement', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Unlocking achievement with game stats
      const gameStats = { score: 1500, level: 5, lines: 42 }
      wrapper.vm.achievements.unlockAchievement('level_5', gameStats)
      await flushPromises()

      // Then: Game stats should be saved
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      const achievement = saved!.find(a => a.achievementId === 'level_5')
      expect(achievement).toBeDefined()
      expect(achievement!.gameStats).toEqual(gameStats)

      wrapper.unmount()
    })

    it('should load achievement progress data correctly', async () => {
      // Given: Achievement with progress data in localStorage
      const savedAchievements: UnlockedAchievement[] = [
        {
          achievementId: 'tetris_master',
          unlockedAt: new Date(),
          gameStats: { score: 50000, level: 20, lines: 500 }
        }
      ]
      localStorage.setItem('tetris_achievements', JSON.stringify(savedAchievements))

      // When: Loading achievements
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: Progress data should be preserved
      const loaded = wrapper.vm.achievements.unlockedAchievements.value.find(
        a => a.achievementId === 'tetris_master'
      )
      expect(loaded).toBeDefined()
      expect(loaded!.gameStats).toEqual({
        score: 50000,
        level: 20,
        lines: 500
      })

      wrapper.unmount()
    })

    it('should calculate progress correctly for locked achievements', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Getting progress for locked achievement with value less than target
      const progress = wrapper.vm.achievements.getProgress('marathon_runner', 2500)

      // Then: Progress should show partial completion (not 100%)
      expect(progress.currentValue).toBe(2500)
      expect(progress.targetValue).toBeGreaterThan(0)
      expect(progress.percentage).toBeGreaterThan(0)
      expect(progress.percentage).toBeLessThanOrEqual(100)

      wrapper.unmount()
    })

    it('should persist and restore multiple achievements with different progress', async () => {
      // Given: Multiple achievements with progress data
      const achievements: UnlockedAchievement[] = [
        {
          achievementId: 'first_blood',
          unlockedAt: new Date('2024-01-01'),
          gameStats: { score: 100, level: 1, lines: 1 }
        },
        {
          achievementId: 'tetris_novice',
          unlockedAt: new Date('2024-01-02'),
          gameStats: { score: 500, level: 2, lines: 10 }
        },
        {
          achievementId: 'tetris_master',
          unlockedAt: new Date('2024-01-03'),
          gameStats: { score: 50000, level: 20, lines: 500 }
        }
      ]
      localStorage.setItem('tetris_achievements', JSON.stringify(achievements))

      // When: Loading achievements
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Then: All progress data should be preserved
      const loaded = wrapper.vm.achievements.unlockedAchievements.value
      loaded.forEach((achievement) => {
        const original = achievements.find(a => a.achievementId === achievement.achievementId)
        if (original) {
          expect(achievement.gameStats).toEqual(original.gameStats)
        }
      })

      wrapper.unmount()
    })
  })

  // ============================================================================
  // Test 7: Handle localStorage quota exceeded errors
  // ============================================================================
  describe('localStorage Quota Exceeded Error Handling', () => {
    it('should handle quota exceeded error without crashing', async () => {
      // Given: Mock localStorage to throw quota exceeded
      const originalSetItem = localStorage.setItem
      let callCount = 0
      localStorage.setItem = vi.fn((key: string, value: string) => {
        callCount++
        if (key === 'tetris_achievements' && callCount > 1) {
          const error = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        }
        originalSetItem(key, value)
      })

      // When: Unlocking first achievement (succeeds)
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      wrapper.vm.achievements.unlockAchievement('first_blood', {
        score: 100,
        level: 1,
        lines: 1
      })
      await flushPromises()

      // When: Attempting to unlock second (quota exceeded)
      expect(() => {
        wrapper.vm.achievements.unlockAchievement('tetris_novice', {
          score: 500,
          level: 2,
          lines: 4
        })
      }).not.toThrow()

      // Then: Should still be able to access achievements
      expect(wrapper.vm.achievements.unlockedAchievements.value).toBeDefined()

      localStorage.setItem = originalSetItem
      wrapper.unmount()
    })

    it('should handle quota exceeded error when updating session stats', async () => {
      // Given: Mock localStorage to throw quota exceeded for stats
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn((key: string, value: string) => {
        if (key === 'tetris_achievement_stats') {
          const error = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        }
        originalSetItem(key, value)
      })

      // When: Attempting to update session stats
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      expect(() => {
        wrapper.vm.achievements.updateSessionStats({
          linesCleared: 100,
          gamesPlayed: 10
        })
      }).not.toThrow()

      // Then: System should continue functioning
      expect(wrapper.vm.achievements.sessionStats.value).toBeDefined()

      localStorage.setItem = originalSetItem
      wrapper.unmount()
    })

    it('should gracefully degrade when storage is full', async () => {
      // Given: Simulate storage being full
      const originalSetItem = localStorage.setItem
      const storageFullAfter = 3
      let setCount = 0
      localStorage.setItem = vi.fn((key: string, value: string) => {
        setCount++
        if (setCount > storageFullAfter) {
          const error = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        }
        originalSetItem(key, value)
      })

      // When: Performing multiple operations
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      wrapper.vm.achievements.unlockAchievement('first_blood', {
        score: 100,
        level: 1,
        lines: 1
      })
      wrapper.vm.achievements.updateSessionStats({ linesCleared: 50 })
      await flushPromises()

      // Then: System should still function
      expect(wrapper.vm.achievements.unlockedAchievements.value).toBeDefined()

      localStorage.setItem = originalSetItem
      wrapper.unmount()
    })
  })

  // ============================================================================
  // Test 8: Clear all achievement data
  // ============================================================================
  describe('Clear Achievement Data', () => {
    it('should clear all achievement data', async () => {
      // Given: Component with unlocked achievements
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      wrapper.vm.achievements.unlockAchievement('first_blood', {
        score: 100,
        level: 1,
        lines: 1
      })
      wrapper.vm.achievements.unlockAchievement('tetris_novice', {
        score: 500,
        level: 2,
        lines: 4
      })
      await flushPromises()
      const countBefore = wrapper.vm.achievements.unlockedAchievements.value.length
      expect(countBefore).toBeGreaterThanOrEqual(2)

      // When: Resetting achievements
      wrapper.vm.achievements.resetAchievements()
      await flushPromises()

      // Then: All data should be cleared
      expect(wrapper.vm.achievements.unlockedAchievements.value).toEqual([])
      expect(wrapper.vm.achievements.stats.value.unlockedCount).toBe(0)

      wrapper.unmount()
    })

    it('should clear session stats when resetting', async () => {
      // Given: Component with session stats
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      wrapper.vm.achievements.updateSessionStats({
        linesCleared: 100,
        tetrisCount: 10,
        gamesPlayed: 5
      })
      await flushPromises()

      // When: Resetting achievements
      wrapper.vm.achievements.resetAchievements()

      // Then: Session stats should be reset to defaults
      const stats = wrapper.vm.achievements.sessionStats.value
      expect(stats.linesCleared).toBe(0)
      expect(stats.tetrisCount).toBe(0)
      expect(stats.gamesPlayed).toBe(0)

      wrapper.unmount()
    })

    it('should clear localStorage when resetting achievements', async () => {
      // Given: Data in localStorage
      const savedAchievements: UnlockedAchievement[] = [
        {
          achievementId: 'first_blood',
          unlockedAt: new Date()
        }
      ]
      localStorage.setItem('tetris_achievements', JSON.stringify(savedAchievements))
      localStorage.setItem('tetris_achievement_stats', JSON.stringify({ linesCleared: 50 }))

      // When: Creating composable and resetting
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      wrapper.vm.achievements.resetAchievements()

      // Then: localStorage should be cleared
      expect(getLocalStorageData('tetris_achievements')).toEqual([])

      wrapper.unmount()
    })

    it('should allow new achievements after reset', async () => {
      // Given: Component with achievements that were reset
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      wrapper.vm.achievements.unlockAchievement('first_blood', {
        score: 100,
        level: 1,
        lines: 1
      })
      wrapper.vm.achievements.resetAchievements()
      await flushPromises()

      // When: Unlocking new achievement after reset
      wrapper.vm.achievements.unlockAchievement('tetris_novice', {
        score: 500,
        level: 2,
        lines: 4
      })
      await flushPromises()

      // Then: New achievement should be properly saved
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      expect(saved).not.toBeNull()
      expect(saved!.some(a => a.achievementId === 'tetris_novice')).toBe(true)

      wrapper.unmount()
    })
  })

  // ============================================================================
  // Test 9: Verify data structure in localStorage (array of achievement IDs)
  // ============================================================================
  describe('localStorage Data Structure Validation', () => {
    it('should store achievements as array of objects with correct structure', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Unlocking achievement with full data
      wrapper.vm.achievements.unlockAchievement('first_blood', {
        score: 100,
        level: 1,
        lines: 1
      })
      await flushPromises()

      // Then: Verify localStorage structure
      const rawData = localStorage.getItem('tetris_achievements')
      expect(rawData).not.toBeNull()

      const parsed = JSON.parse(rawData!)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBeGreaterThan(0)
      const achievement = parsed.find((a: any) => a.achievementId === 'first_blood')
      expect(achievement).toBeDefined()
      expect(achievement).toHaveProperty('achievementId')
      expect(achievement).toHaveProperty('unlockedAt')
      expect(achievement).toHaveProperty('gameStats')
      expect(typeof achievement.achievementId).toBe('string')

      wrapper.unmount()
    })

    it('should maintain consistent data structure across multiple saves', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Unlocking multiple achievements
      wrapper.vm.achievements.unlockAchievement('first_blood', {
        score: 100,
        level: 1,
        lines: 1
      })
      wrapper.vm.achievements.unlockAchievement('quick_fingers', {
        score: 500,
        level: 2,
        lines: 4
      })
      await flushPromises()

      // Then: Each achievement should have consistent structure
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      expect(saved).not.toBeNull()
      saved!.forEach(achievement => {
        expect(achievement).toHaveProperty('achievementId')
        expect(achievement).toHaveProperty('unlockedAt')
        expect(typeof achievement.achievementId).toBe('string')
        // unlockedAt is stored as string in localStorage, verify it's a valid date string
        expect(typeof achievement.unlockedAt).toBe('string')
        expect(new Date(achievement.unlockedAt).toString()).not.toBe('Invalid Date')
      })

      wrapper.unmount()
    })

    it('should NOT store stats in localStorage (in-memory only)', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Updating session stats
      wrapper.vm.achievements.updateSessionStats({
        linesCleared: 50,
        tetrisCount: 3,
        maxCombo: 5,
        gamesPlayed: 2,
        totalLinesCleared: 100,
        timePlayed: 300
      })
      await flushPromises()

      // Then: Stats should NOT be in localStorage (reserved for future use)
      const rawStats = localStorage.getItem('tetris_achievement_stats')
      expect(rawStats).toBeNull()

      // But in-memory sessionStats has all properties
      const stats = wrapper.vm.achievements.sessionStats.value
      expect(stats).toHaveProperty('linesCleared', 50)
      expect(stats).toHaveProperty('tetrisCount', 3)
      expect(stats).toHaveProperty('maxCombo', 5)
      expect(stats).toHaveProperty('gamesPlayed', 2)
      expect(stats).toHaveProperty('totalLinesCleared', 100)
      expect(stats).toHaveProperty('timePlayed', 300)

      wrapper.unmount()
    })

    it('should preserve JSON serialization roundtrip integrity', async () => {
      // Given: Original achievement data
      const originalAchievements: UnlockedAchievement[] = [
        {
          achievementId: 'first_blood',
          unlockedAt: new Date('2024-01-01T12:00:00Z'),
          gameStats: { score: 100, level: 1, lines: 1 }
        }
      ]

      // When: Serializing and deserializing
      const serialized = JSON.stringify(originalAchievements)
      const deserialized = JSON.parse(serialized)

      // Then: Data should survive roundtrip
      expect(deserialized[0].achievementId).toBe(originalAchievements[0].achievementId)
      expect(deserialized[0].gameStats).toEqual(originalAchievements[0].gameStats)
    })
  })

  // ============================================================================
  // Test 10: Handle concurrent localStorage access
  // ============================================================================
  describe('Concurrent localStorage Access', () => {
    it('should handle rapid sequential unlocks without data loss', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Rapidly unlocking multiple achievements
      wrapper.vm.achievements.unlockAchievement('first_blood', {
        score: 100,
        level: 1,
        lines: 1
      })
      wrapper.vm.achievements.unlockAchievement('tetris_novice', {
        score: 500,
        level: 2,
        lines: 4
      })
      wrapper.vm.achievements.unlockAchievement('tetris_master', {
        score: 50000,
        level: 20,
        lines: 500
      })
      await flushPromises()

      // Then: All achievements should be saved
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      expect(saved).not.toBeNull()
      expect(saved!.length).toBeGreaterThanOrEqual(3)
      expect(saved!.map(a => a.achievementId)).toContain('first_blood')
      expect(saved!.map(a => a.achievementId)).toContain('tetris_novice')
      expect(saved!.map(a => a.achievementId)).toContain('tetris_master')

      wrapper.unmount()
    })

    it('should handle achievement unlocks without persisting stats', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Updating both achievements and stats in sequence
      wrapper.vm.achievements.unlockAchievement('first_blood', {
        score: 100,
        level: 1,
        lines: 1
      })
      wrapper.vm.achievements.updateSessionStats({ linesCleared: 10 })
      wrapper.vm.achievements.unlockAchievement('tetris_novice', {
        score: 500,
        level: 2,
        lines: 4
      })
      wrapper.vm.achievements.updateSessionStats({ gamesPlayed: 1 })
      await flushPromises()

      // Then: Only achievements are saved, stats stay in memory
      const achievements = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      const stats = getLocalStorageData('tetris_achievement_stats')
      expect(achievements).not.toBeNull()
      expect(achievements!.length).toBeGreaterThanOrEqual(2)
      expect(stats).toBeNull() // Stats not persisted

      // But in-memory stats are updated
      expect(wrapper.vm.achievements.sessionStats.value.linesCleared).toBe(10)
      expect(wrapper.vm.achievements.sessionStats.value.gamesPlayed).toBe(1)

      wrapper.unmount()
    })

    it('should maintain data consistency with concurrent read and write', async () => {
      // Given: Achievement data in localStorage
      const initialAchievements: UnlockedAchievement[] = [
        {
          achievementId: 'first_blood',
          unlockedAt: new Date(),
          gameStats: { score: 100, level: 1, lines: 1 }
        }
      ]
      localStorage.setItem('tetris_achievements', JSON.stringify(initialAchievements))

      // When: Loading and immediately unlocking new achievement
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      const loadedCount = wrapper.vm.achievements.unlockedAchievements.value.length
      wrapper.vm.achievements.unlockAchievement('tetris_novice', {
        score: 500,
        level: 2,
        lines: 4
      })
      await flushPromises()

      // Then: New achievement should be added to existing, not replace
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      expect(saved!.length).toBe(loadedCount + 1)

      wrapper.unmount()
    })

    it('should prevent duplicate achievements in concurrent operations', async () => {
      // Given: Component with achievements composable
      clearLocalStorage()
      const component = createAchievementsTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // When: Attempting to unlock same achievement twice rapidly
      wrapper.vm.achievements.unlockAchievement('level_10', {
        score: 100,
        level: 1,
        lines: 1
      })
      wrapper.vm.achievements.unlockAchievement('level_10', {
        score: 150,
        level: 2,
        lines: 2
      })
      await flushPromises()

      // Then: Should only be saved once (isUnlocked check prevents duplicates)
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      expect(saved).not.toBeNull()
      const levelTenCount = saved!.filter(a => a.achievementId === 'level_10').length
      expect(levelTenCount).toBe(1)

      wrapper.unmount()
    })

    it('should handle interleaved save and load operations correctly', async () => {
      // Given: Initial achievements in storage
      const initial: UnlockedAchievement[] = [
        {
          achievementId: 'first_blood',
          unlockedAt: new Date('2024-01-01'),
          gameStats: { score: 100, level: 1, lines: 1 }
        }
      ]
      localStorage.setItem('tetris_achievements', JSON.stringify(initial))

      // When: Loading and then saving additional achievement
      const component1 = createAchievementsTestComponent()
      const wrapper1 = mount(component1)
      await flushPromises()

      wrapper1.unmount()

      // Create fresh instance which loads from storage
      const component2 = createAchievementsTestComponent()
      const wrapper2 = mount(component2)
      await flushPromises()

      wrapper2.vm.achievements.unlockAchievement('tetris_novice', {
        score: 500,
        level: 2,
        lines: 4
      })
      await flushPromises()

      // Then: Should have both achievements
      const saved = getLocalStorageData<UnlockedAchievement[]>('tetris_achievements')
      expect(saved).not.toBeNull()
      expect(saved!.length).toBeGreaterThanOrEqual(2)

      wrapper2.unmount()
    })
  })
})
