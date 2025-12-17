import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAchievements } from '@/composables/useAchievements'

/**
 * Test Suite: useAchievements - Compound Condition Support
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
 * COMPOUND CONDITION MODEL:
 * - Achievements can have primary condition + additional conditions
 * - ALL conditions must be met simultaneously for unlock
 * - Event-driven updates ensure stats are current for compound evaluation
 * - Example: "Quick Fingers" requires lines >= 50 AND timePlayed <= 180
 *
 * TESTING NOTES FOR THIS FILE:
 * - These tests verify compound condition logic (multiple requirements)
 * - Uses checkAchievements() for direct testing of compound evaluation
 * - Event-driven compound unlocks tested in integration tests
 * - Relevant events: Multiple (lines:cleared + time:tick for "Quick Fingers")
 *
 * Tests for compound achievement conditions where multiple conditions
 * must be met simultaneously (e.g., "Clear 50 lines in under 3 minutes")
 */
describe('useAchievements - Compound Condition Support', () => {
  beforeEach(() => {
    localStorage.clear()
    const achievements = useAchievements()
    achievements.resetAchievements()
  })

  afterEach(() => {
    localStorage.clear()
  })

  /**
   * Test 1: Quick Fingers - Compound Condition Achievement
   *
   * Tests the "Quick Fingers" achievement which requires:
   * - Primary: 50 lines cleared (lines >= 50)
   * - Additional: Within 3 minutes (time_played <= 180)
   *
   * EVENT-DRIVEN BEHAVIOR:
   * In real gameplay, both 'lines:cleared' and 'time:tick' events
   * update internal stats. Compound condition evaluated when stats change.
   * Both conditions must be true simultaneously for unlock.
   */
  describe('Quick Fingers Achievement', () => {
    it('should NOT unlock when lines met but time exceeded', () => {
      // Given: Clean achievement state
      const achievements = useAchievements()

      // When: 50 lines in 4 minutes (240 seconds) - TOO SLOW
      // EVENT-DRIVEN: Simulates multiple 'lines:cleared' + 'time:tick' events
      // accumulated to lines=50, timePlayed=240
      achievements.checkAchievements({
        lines: 50,
        timePlayed: 240
      })

      // Then: Compound condition fails (time exceeded limit)
      expect(achievements.isUnlocked('quick_fingers')).toBe(false)
    })

    it('should NOT unlock when time met but lines insufficient', () => {
      // Given
      const achievements = useAchievements()

      // When - Only 40 lines in 2 minutes
      achievements.checkAchievements({
        lines: 40,
        timePlayed: 120
      })

      // Then
      expect(achievements.isUnlocked('quick_fingers')).toBe(false)
    })

    it('should unlock when BOTH conditions are met', () => {
      // Given
      const achievements = useAchievements()

      // When - 50 lines in 2.5 minutes (150 seconds) - PERFECT!
      achievements.checkAchievements({
        lines: 50,
        timePlayed: 150
      })

      // Then
      expect(achievements.isUnlocked('quick_fingers')).toBe(true)
    })

    it('should unlock at exact threshold (50 lines, 180 seconds)', () => {
      // Given
      const achievements = useAchievements()

      // When - Exactly at the limit
      achievements.checkAchievements({
        lines: 50,
        timePlayed: 180
      })

      // Then
      expect(achievements.isUnlocked('quick_fingers')).toBe(true)
    })

    it('should unlock when exceeding requirements', () => {
      // Given
      const achievements = useAchievements()

      // When - 60 lines in 1 minute (way better than required)
      achievements.checkAchievements({
        lines: 60,
        timePlayed: 60
      })

      // Then
      expect(achievements.isUnlocked('quick_fingers')).toBe(true)
    })

    it('should fail when lines=49 and time=179 (just below thresholds)', () => {
      // Given
      const achievements = useAchievements()

      // When - Just below the lines requirement
      achievements.checkAchievements({
        lines: 49,
        timePlayed: 179
      })

      // Then
      expect(achievements.isUnlocked('quick_fingers')).toBe(false)
    })

    it('should add notification when compound achievement unlocked', () => {
      // Given
      const achievements = useAchievements()
      const initialNotifications = achievements.pendingNotifications.value.length

      // When
      achievements.checkAchievements({
        lines: 50,
        timePlayed: 150
      })

      // Then
      expect(achievements.pendingNotifications.value.length).toBeGreaterThan(initialNotifications)
      const notification = achievements.pendingNotifications.value.find(
        n => n.id === 'quick_fingers'
      )
      expect(notification).toBeDefined()
      expect(notification?.name).toBe('Quick Fingers')
    })

    it('should persist compound achievement unlock', () => {
      // Given
      const achievements1 = useAchievements()
      achievements1.checkAchievements({
        lines: 50,
        timePlayed: 150
      })

      // When - Load in new session
      const achievements2 = useAchievements()

      // Then
      expect(achievements2.isUnlocked('quick_fingers')).toBe(true)
    })

    it('should store game stats when compound achievement unlocked', () => {
      // Given
      const achievements = useAchievements()

      // When
      achievements.checkAchievements({
        lines: 50,
        timePlayed: 150,
        score: 5000,
        level: 5
      })

      // Then
      const unlockedList = achievements.unlockedAchievements.value
      const quickFingers = unlockedList.find(u => u.achievementId === 'quick_fingers')
      expect(quickFingers?.gameStats).toBeDefined()
      expect(quickFingers?.gameStats?.lines).toBe(50)
      expect(quickFingers?.gameStats?.timePlayed).toBe(150)
      expect(quickFingers?.gameStats?.score).toBe(5000)
      expect(quickFingers?.gameStats?.level).toBe(5)
    })
  })

  /**
   * Test 2: Backward Compatibility
   *
   * Ensures existing achievements without additionalConditions
   * continue to work exactly as before
   */
  describe('Backward Compatibility', () => {
    it('should unlock achievements without additionalConditions normally', () => {
      // Given
      const achievements = useAchievements()

      // When - Test a simple achievement (level_2)
      achievements.checkAchievements({ level: 2 })

      // Then
      expect(achievements.isUnlocked('level_2')).toBe(true)
    })

    it('should unlock score achievements without additionalConditions', () => {
      // Given
      const achievements = useAchievements()

      // When
      achievements.checkAchievements({ score: 100 })

      // Then
      expect(achievements.isUnlocked('score_100')).toBe(true)
    })

    it('should unlock line achievements without additionalConditions', () => {
      // Given
      const achievements = useAchievements()

      // When
      achievements.checkAchievements({ lines: 5 })

      // Then
      expect(achievements.isUnlocked('five_lines')).toBe(true)
    })

    it('should handle missing stats gracefully for compound conditions', () => {
      // Given
      const achievements = useAchievements()

      // When - Only provide lines, no timePlayed
      achievements.checkAchievements({ lines: 60 })

      // Then - Should NOT unlock because timePlayed is undefined
      expect(achievements.isUnlocked('quick_fingers')).toBe(false)
    })
  })

  /**
   * Test 3: Edge Cases
   */
  describe('Edge Cases', () => {
    it('should handle undefined stats for compound conditions', () => {
      // Given
      const achievements = useAchievements()

      // When - Call with empty stats
      let errorThrown = false
      try {
        achievements.checkAchievements({})
      } catch (error) {
        errorThrown = true
      }

      // Then - Should not crash
      expect(errorThrown).toBe(false)
      expect(achievements.isUnlocked('quick_fingers')).toBe(false)
    })

    it('should evaluate conditions independently', () => {
      // Given
      const achievements = useAchievements()

      // When - First call: good lines, bad time
      achievements.checkAchievements({ lines: 50, timePlayed: 240 })
      expect(achievements.isUnlocked('quick_fingers')).toBe(false)

      // Second call: bad lines, good time (separate game)
      achievements.checkAchievements({ lines: 40, timePlayed: 120 })

      // Then - Still not unlocked (conditions must be met in same check)
      expect(achievements.isUnlocked('quick_fingers')).toBe(false)
    })

    it('should work with multiple compound achievements', () => {
      // Given - If we add more compound achievements in the future
      const achievements = useAchievements()

      // When - Unlock quick_fingers
      achievements.checkAchievements({ lines: 50, timePlayed: 150 })

      // Then
      expect(achievements.isUnlocked('quick_fingers')).toBe(true)
      // Other achievements should remain independent
      expect(achievements.getUnlockedAchievements.value.length).toBeGreaterThan(0)
    })
  })
})
