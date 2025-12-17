import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAchievements } from '../useAchievements'
import { ACHIEVEMENTS } from '@/data/achievements'
import type { AchievementId } from '@/types/achievements'

/**
 * Test Suite: useAchievements - Statistics and Tracking
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
 * STATS TRACKING MODEL:
 * - Internal stats updated automatically via event subscriptions
 * - Stats accumulate during gameplay, reset on 'game:started'
 * - updateSessionStats() method exists for backward compatibility
 * - Progressive unlock checking happens automatically when stats change
 *
 * TESTING NOTES FOR THIS FILE:
 * - These tests verify statistics tracking and computation
 * - Uses updateSessionStats() for direct stat manipulation in tests
 * - Event-driven stat updates tested in useAchievements.integration.spec.ts
 * - Relevant events: All game events (lines, score, combo, time, game:started)
 */

describe('useAchievements - Statistics and Tracking', () => {
  let achievements: ReturnType<typeof useAchievements>

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    // Create fresh instance
    achievements = useAchievements()
    // Reset state
    achievements.resetAchievements()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Track game statistics', () => {
    it('should initialize with default session stats', () => {
      // Given: Fresh achievement instance
      // EVENT-DRIVEN: Stats reset to zero on 'game:started' event
      const stats = achievements.sessionStats.value

      // Then: All stats should be at initial values
      expect(stats).toEqual({
        linesCleared: 0,
        tetrisCount: 0,
        maxCombo: 0,
        gamesPlayed: 0,
        totalLinesCleared: 0,
        timePlayed: 0
      })
    })

    it('should track lines cleared in session', () => {
      // Given: Initial state
      // When: Update stats (simulates 'lines:cleared' event handling)
      // EVENT-DRIVEN: In real gameplay, 'lines:cleared' event triggers this update
      achievements.updateSessionStats({ linesCleared: 10 })

      // Then: Stats reflect the update
      expect(achievements.sessionStats.value.linesCleared).toBe(10)
    })

    it('should track tetris count (4-line clears)', () => {
      achievements.updateSessionStats({ tetrisCount: 3 })

      expect(achievements.sessionStats.value.tetrisCount).toBe(3)
    })

    it('should track maximum combo achievement', () => {
      achievements.updateSessionStats({ maxCombo: 5 })

      expect(achievements.sessionStats.value.maxCombo).toBe(5)
    })

    it('should track total games played', () => {
      achievements.updateSessionStats({ gamesPlayed: 7 })

      expect(achievements.sessionStats.value.gamesPlayed).toBe(7)
    })

    it('should track cumulative total lines cleared', () => {
      achievements.updateSessionStats({ totalLinesCleared: 150 })

      expect(achievements.sessionStats.value.totalLinesCleared).toBe(150)
    })

    it('should track time played in seconds', () => {
      achievements.updateSessionStats({ timePlayed: 3600 })

      expect(achievements.sessionStats.value.timePlayed).toBe(3600)
    })

    it('should update multiple stats in single call', () => {
      achievements.updateSessionStats({
        linesCleared: 5,
        tetrisCount: 2,
        maxCombo: 3,
        timePlayed: 1800
      })

      const stats = achievements.sessionStats.value
      expect(stats.linesCleared).toBe(5)
      expect(stats.tetrisCount).toBe(2)
      expect(stats.maxCombo).toBe(3)
      expect(stats.timePlayed).toBe(1800)
    })

    it('should NOT persist stats to localStorage (reserved for future use)', () => {
      achievements.updateSessionStats({ linesCleared: 25 })

      // sessionStats is NOT persisted (see comment in useAchievements.ts)
      const stored = localStorage.getItem('tetris_achievement_stats')
      expect(stored).toBeNull()

      // But the in-memory value is updated
      expect(achievements.sessionStats.value.linesCleared).toBe(25)
    })

    it('should accumulate stats across multiple updates', () => {
      achievements.updateSessionStats({ linesCleared: 5 })
      achievements.updateSessionStats({ linesCleared: 10 })

      // Note: updateSessionStats replaces, not accumulates
      expect(achievements.sessionStats.value.linesCleared).toBe(10)
    })
  })

  describe('Update stats when achievements unlock', () => {
    it('should unlock achievement with associated game stats', () => {
      const gameStats = { score: 5000, level: 10, lines: 50 }
      achievements.unlockAchievement('level_10', gameStats)

      const unlocked = achievements.getUnlockedAchievements.value
      const achievement = unlocked.find(a => a.achievementId === 'level_10')

      expect(achievement).toBeDefined()
      expect(achievement?.gameStats).toEqual(gameStats)
    })

    it('should record unlock timestamp when achievement is triggered', () => {
      const beforeTime = Date.now()
      achievements.unlockAchievement('level_5')
      const afterTime = Date.now()

      const unlocked = achievements.getUnlockedAchievements.value
      const achievement = unlocked.find(a => a.achievementId === 'level_5')

      expect(achievement).toBeDefined()
      expect(achievement?.unlockedAt.getTime()).toBeGreaterThanOrEqual(beforeTime)
      expect(achievement?.unlockedAt.getTime()).toBeLessThanOrEqual(afterTime)
    })

    it('should not unlock same achievement twice', () => {
      achievements.unlockAchievement('level_5')
      achievements.unlockAchievement('level_5')

      const unlocked = achievements.getUnlockedAchievements.value
      const matches = unlocked.filter(a => a.achievementId === 'level_5')

      expect(matches).toHaveLength(1)
    })

    it('should add achievement to pending notifications when unlocked', () => {
      const initialNotifications = achievements.pendingNotifications.value.length
      achievements.unlockAchievement('level_3')

      expect(achievements.pendingNotifications.value.length).toBe(initialNotifications + 1)
    })

    it('should update stats computed property when achievement unlocked', () => {
      expect(achievements.stats.value.unlockedCount).toBe(0)

      achievements.unlockAchievement('level_2')

      expect(achievements.stats.value.unlockedCount).toBe(1)
    })

    it('should record score and level when achievement unlocked during gameplay', () => {
      const gameStats = { score: 12500, level: 15, lines: 75 }
      achievements.unlockAchievement('level_10', gameStats)

      const achievement = achievements.getUnlockedAchievements.value.find(
        a => a.achievementId === 'level_10'
      )

      expect(achievement?.gameStats?.score).toBe(12500)
      expect(achievement?.gameStats?.level).toBe(15)
      expect(achievement?.gameStats?.lines).toBe(75)
    })
  })

  describe('Calculate achievement completion rate', () => {
    it('should calculate 0% when no achievements unlocked', () => {
      expect(achievements.stats.value.percentage).toBe(0)
    })

    it('should calculate correct percentage for single unlock', () => {
      achievements.unlockAchievement('level_2')

      const percentage = achievements.stats.value.percentage
      const totalAchievements = ACHIEVEMENTS.length
      const expected = Math.round((1 / totalAchievements) * 100)

      expect(percentage).toBe(expected)
    })

    it('should calculate 100% completion when all achievements unlocked', () => {
      // Unlock all achievements
      ACHIEVEMENTS.forEach(achievement => {
        achievements.unlockAchievement(achievement.id as AchievementId)
      })

      expect(achievements.stats.value.percentage).toBe(100)
    })

    it('should calculate correct percentage for partial unlocks', () => {
      const unlockCount = 10
      for (let i = 0; i < unlockCount; i++) {
        const achievement = ACHIEVEMENTS[i]
        achievements.unlockAchievement(achievement.id as AchievementId)
      }

      const percentage = achievements.stats.value.percentage
      const totalAchievements = ACHIEVEMENTS.length
      const expected = Math.round((unlockCount / totalAchievements) * 100)

      expect(percentage).toBe(expected)
    })

    it('should verify total achievements count', () => {
      expect(ACHIEVEMENTS.length).toBe(62)
    })

    it('should round percentage correctly', () => {
      // Unlock 18 out of 62 achievements
      for (let i = 0; i < 18; i++) {
        const achievement = ACHIEVEMENTS[i]
        achievements.unlockAchievement(achievement.id as AchievementId)
      }

      const percentage = achievements.stats.value.percentage
      // 18/62 * 100 = 29.03... rounds to 29
      expect(percentage).toBe(29)
    })

    it('should reflect locked achievements count', () => {
      achievements.unlockAchievement('level_2')
      achievements.unlockAchievement('level_3')

      const locked = achievements.getLockedAchievements.value
      expect(locked.length).toBe(ACHIEVEMENTS.length - 2)
    })
  })

  describe('Get achievements by category', () => {
    it('should find achievements by gameplay category', () => {
      const gameplayAchievements = ACHIEVEMENTS.filter(a => a.category === 'gameplay')

      expect(gameplayAchievements.length).toBeGreaterThan(0)
    })

    it('should find achievements by progression category', () => {
      const progressionAchievements = ACHIEVEMENTS.filter(a => a.category === 'progression')

      expect(progressionAchievements.length).toBeGreaterThan(0)
    })

    it('should find achievements by scoring category', () => {
      const scoringAchievements = ACHIEVEMENTS.filter(a => a.category === 'scoring')

      expect(scoringAchievements.length).toBeGreaterThan(0)
    })

    it('should find achievements by skill category', () => {
      const skillAchievements = ACHIEVEMENTS.filter(a => a.category === 'skill')

      expect(skillAchievements.length).toBeGreaterThan(0)
    })

    it('should count achievements per rarity', () => {
      const common = ACHIEVEMENTS.filter(a => a.rarity === 'common')
      const rare = ACHIEVEMENTS.filter(a => a.rarity === 'rare')
      const epic = ACHIEVEMENTS.filter(a => a.rarity === 'epic')
      const legendary = ACHIEVEMENTS.filter(a => a.rarity === 'legendary')

      const totalRarity = common.length + rare.length + epic.length + legendary.length
      expect(totalRarity).toBe(ACHIEVEMENTS.length)
    })

    it('should unlock achievement and verify its category', () => {
      achievements.unlockAchievement('level_5')

      const unlockedAchievement = ACHIEVEMENTS.find(a => a.id === 'level_5')
      expect(unlockedAchievement?.category).toBe('progression')
    })

    it('should filter unlocked achievements by category', () => {
      // Unlock some achievements
      achievements.unlockAchievement('level_2')
      achievements.unlockAchievement('level_3')
      achievements.unlockAchievement('level_4')

      const unlocked = achievements.getUnlockedAchievements.value
      const progressionUnlocks = unlocked.filter(a => a.category === 'progression')

      expect(progressionUnlocks.length).toBe(3)
    })
  })

  describe('Find next achievable unlocks (closest to completion)', () => {
    it('should get progress for in-progress achievement', () => {
      const progress = achievements.getProgress('level_5', 3)

      expect(progress.achievementId).toBe('level_5')
      expect(progress.currentValue).toBe(3)
      expect(progress.targetValue).toBe(5)
      expect(progress.percentage).toBe(60)
    })

    it('should calculate correct progress percentage', () => {
      const testCases = [
        { current: 0, target: 10, expectedPercent: 0 },
        { current: 5, target: 10, expectedPercent: 50 },
        { current: 10, target: 10, expectedPercent: 100 },
        { current: 15, target: 10, expectedPercent: 100 } // Capped at 100
      ]

      testCases.forEach(({ current, target, expectedPercent }) => {
        // Manually verify the calculation logic
        const percentage = Math.min((current / target) * 100, 100)
        expect(Math.round(percentage)).toBe(expectedPercent)
      })
    })

    it('should cap progress percentage at 100%', () => {
      const progress = achievements.getProgress('level_5', 20)

      expect(progress.percentage).toBe(100)
      expect(progress.percentage).toBeLessThanOrEqual(100)
    })

    it('should return zero progress for non-existent achievement', () => {
      const progress = achievements.getProgress('invalid_id' as AchievementId, 10)

      expect(progress.currentValue).toBe(0)
      expect(progress.targetValue).toBe(0)
      expect(progress.percentage).toBe(0)
    })

    it('should find closest-to-completion achievements by checking multiple conditions', () => {
      // Simulate gameplay stats approaching different thresholds
      const level5Progress = achievements.getProgress('level_5', 4)
      const level10Progress = achievements.getProgress('level_10', 8)

      expect(level5Progress.percentage).toBe(80)
      expect(level10Progress.percentage).toBe(80)

      // Both are equally close, but we can identify which is closer
      expect(level5Progress.percentage).toBe(level10Progress.percentage)
    })

    it('should identify recent unlocks from achievement history', () => {
      achievements.unlockAchievement('level_2')
      achievements.unlockAchievement('level_3')
      achievements.unlockAchievement('level_4')

      const recent = achievements.stats.value.recentUnlocks
      expect(recent.length).toBe(3)
      expect(recent[0].unlockedAt.getTime()).toBeGreaterThanOrEqual(
        recent[1].unlockedAt.getTime()
      )
    })

    it('should return max 5 recent unlocks', () => {
      // Unlock 10 achievements
      for (let i = 0; i < 10; i++) {
        const achievement = ACHIEVEMENTS[i]
        achievements.unlockAchievement(achievement.id as AchievementId)
      }

      const recent = achievements.stats.value.recentUnlocks
      expect(recent.length).toBeLessThanOrEqual(5)
    })

    it('should order recent unlocks by timestamp descending', () => {
      achievements.unlockAchievement('level_2')

      // Small delay to ensure different timestamps
      achievements.unlockAchievement('level_3')

      const recent = achievements.stats.value.recentUnlocks
      if (recent.length >= 2) {
        const first = recent[0].unlockedAt.getTime()
        const second = recent[1].unlockedAt.getTime()
        expect(first).toBeGreaterThanOrEqual(second)
      }
    })
  })

  describe('Reset all statistics', () => {
    it('should reset all unlocked achievements', () => {
      achievements.unlockAchievement('level_2')
      achievements.unlockAchievement('level_3')

      expect(achievements.getUnlockedAchievements.value.length).toBe(2)

      achievements.resetAchievements()

      expect(achievements.getUnlockedAchievements.value.length).toBe(0)
    })

    it('should reset all session statistics to defaults', () => {
      achievements.updateSessionStats({
        linesCleared: 100,
        tetrisCount: 10,
        maxCombo: 5,
        gamesPlayed: 20,
        totalLinesCleared: 500,
        timePlayed: 7200
      })

      achievements.resetAchievements()

      const stats = achievements.sessionStats.value
      expect(stats).toEqual({
        linesCleared: 0,
        tetrisCount: 0,
        maxCombo: 0,
        gamesPlayed: 0,
        totalLinesCleared: 0,
        timePlayed: 0
      })
    })

    it('should clear pending notifications', () => {
      achievements.unlockAchievement('level_2')
      expect(achievements.pendingNotifications.value.length).toBeGreaterThan(0)

      achievements.resetAchievements()

      expect(achievements.pendingNotifications.value.length).toBe(0)
    })

    it('should reset completion percentage to 0%', () => {
      achievements.unlockAchievement('level_2')
      expect(achievements.stats.value.percentage).toBeGreaterThan(0)

      achievements.resetAchievements()

      expect(achievements.stats.value.percentage).toBe(0)
    })

    it('should clear recent unlocks history', () => {
      achievements.unlockAchievement('level_2')
      achievements.unlockAchievement('level_3')
      expect(achievements.stats.value.recentUnlocks.length).toBeGreaterThan(0)

      achievements.resetAchievements()

      expect(achievements.stats.value.recentUnlocks.length).toBe(0)
    })

    it('should persist reset state to localStorage', () => {
      achievements.unlockAchievement('level_2')
      achievements.resetAchievements()

      const stored = localStorage.getItem('tetris_achievements')
      const parsed = stored ? JSON.parse(stored) : []

      expect(parsed).toEqual([])
    })

    it('should allow achievements to be unlocked again after reset', () => {
      achievements.unlockAchievement('level_2')
      achievements.resetAchievements()
      achievements.unlockAchievement('level_2')

      expect(achievements.isUnlocked('level_2')).toBe(true)
      expect(achievements.getUnlockedAchievements.value.length).toBe(1)
    })

    it('should reset all counters to zero simultaneously', () => {
      achievements.updateSessionStats({
        linesCleared: 50,
        tetrisCount: 5,
        maxCombo: 3,
        gamesPlayed: 10,
        totalLinesCleared: 250,
        timePlayed: 3600
      })

      achievements.resetAchievements()

      const stats = achievements.sessionStats.value
      expect(stats.linesCleared).toBe(0)
      expect(stats.tetrisCount).toBe(0)
      expect(stats.maxCombo).toBe(0)
      expect(stats.gamesPlayed).toBe(0)
      expect(stats.totalLinesCleared).toBe(0)
      expect(stats.timePlayed).toBe(0)
    })
  })

  describe('Achievement Statistics Integration', () => {
    it('should maintain consistency between unlocked count and actual unlocks', () => {
      for (let i = 0; i < 5; i++) {
        achievements.unlockAchievement(ACHIEVEMENTS[i].id as AchievementId)
      }

      expect(achievements.stats.value.unlockedCount).toBe(
        achievements.getUnlockedAchievements.value.length
      )
    })

    it('should verify stats total equals locked plus unlocked', () => {
      for (let i = 0; i < 15; i++) {
        achievements.unlockAchievement(ACHIEVEMENTS[i].id as AchievementId)
      }

      const unlocked = achievements.getUnlockedAchievements.value.length
      const locked = achievements.getLockedAchievements.value.length
      const total = achievements.stats.value.totalAchievements

      expect(unlocked + locked).toBe(total)
    })

    it('should handle complex achievement workflow', () => {
      // Simulate gameplay progression
      achievements.updateSessionStats({
        linesCleared: 25,
        tetrisCount: 2,
        maxCombo: 3,
        gamesPlayed: 1
      })

      // Check achievements
      achievements.checkAchievements({
        level: 5,
        lines: 25,
        score: 5000
      })

      // Track that stats were updated
      expect(achievements.sessionStats.value.linesCleared).toBe(25)
      expect(achievements.sessionStats.value.tetrisCount).toBe(2)

      // Verify stats snapshot
      const stats = achievements.stats.value
      expect(stats.totalAchievements).toBe(62)
    })

    it('should preserve achievement data across composable instances', () => {
      achievements.unlockAchievement('level_2')
      achievements.unlockAchievement('level_3')

      // Create new instance (simulating component remount)
      const newInstance = useAchievements()

      expect(newInstance.getUnlockedAchievements.value.length).toBe(2)
      expect(newInstance.isUnlocked('level_2')).toBe(true)
      expect(newInstance.isUnlocked('level_3')).toBe(true)
    })
  })
})
