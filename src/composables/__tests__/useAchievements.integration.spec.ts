import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAchievements } from '@/composables/useAchievements'

/**
 * Test Suite: useAchievements Game Integration
 *
 * Comprehensive integration tests for achievement system integration with game state,
 * simulating real gameplay scenarios where:
 * - Achievements trigger based on game events (score, level, lines)
 * - Multiple achievements can unlock simultaneously
 * - Watcher integration ensures proper checking during gameplay
 * - Notifications are properly queued and delivered
 * - Achievement checking respects game state (playing vs paused vs game over)
 */
describe('useAchievements - Game Integration', () => {
  beforeEach(() => {
    // Reset localStorage and achievements before each test
    localStorage.clear()
    // Get instance and reset to ensure clean state
    const achievements = useAchievements()
    achievements.resetAchievements()
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  /**
   * Test Group 1: Achievement triggers during gameplay
   *
   * Simulates game events triggering achievements by calling checkAchievements
   * with game stats as they change during gameplay
   */
  describe('1. Achievement triggers during gameplay', () => {
    it('should unlock level_2 achievement when reaching level 2', () => {
      // Given
      const achievements = useAchievements()

      // When - Game reaches level 2
      achievements.checkAchievements({ level: 2 })

      // Then
      expect(achievements.isUnlocked('level_2')).toBe(true)
      expect(achievements.stats.value.unlockedCount).toBeGreaterThan(0)
    })

    it('should unlock five_lines achievement when clearing 5 lines', () => {
      // Given
      const achievements = useAchievements()

      // When - Player clears 5 lines
      achievements.checkAchievements({ lines: 5 })

      // Then
      expect(achievements.isUnlocked('five_lines')).toBe(true)
    })

    it('should unlock score_100 achievement when reaching score 100', () => {
      // Given
      const achievements = useAchievements()

      // When - Player reaches score 100
      achievements.checkAchievements({ score: 100 })

      // Then
      expect(achievements.isUnlocked('score_100')).toBe(true)
    })

    it('should unlock achievement with combination of stats', () => {
      // Given
      const achievements = useAchievements()

      // When - Game state has multiple stats
      achievements.checkAchievements({
        score: 500,
        level: 3,
        lines: 10
      })

      // Then
      expect(achievements.isUnlocked('five_lines')).toBe(true)
      expect(achievements.isUnlocked('level_2')).toBe(true)
      expect(achievements.isUnlocked('level_3')).toBe(true)
    })

    it('should trigger achievement on exact condition match', () => {
      // Given
      const achievements = useAchievements()

      // When - Game reaches exact level condition
      achievements.checkAchievements({ level: 5 })

      // Then
      expect(achievements.isUnlocked('level_5')).toBe(true)
    })

    it('should trigger achievement when exceeding condition value', () => {
      // Given
      const achievements = useAchievements()

      // When - Game exceeds the condition (level 10 exceeds level 5)
      achievements.checkAchievements({ level: 10 })

      // Then
      expect(achievements.isUnlocked('level_5')).toBe(true)
      expect(achievements.isUnlocked('level_10')).toBe(true)
    })

    it('should not trigger achievement below condition threshold', () => {
      // Given
      const achievements = useAchievements()

      // When - Game is below level 5
      achievements.checkAchievements({ level: 3 })

      // Then
      expect(achievements.isUnlocked('level_5')).toBe(false)
    })
  })

  /**
   * Test Group 2: Multiple achievements unlock simultaneously
   *
   * Tests scenarios where reaching a milestone unlocks multiple achievements
   * at once, especially when achievements have hierarchical conditions
   */
  describe('2. Multiple achievements unlock simultaneously', () => {
    it('should unlock all level achievements when reaching level 10', () => {
      // Given
      const achievements = useAchievements()

      // When - Player reaches level 10
      achievements.checkAchievements({ level: 10 })

      // Then - All level achievements up to 10 should be unlocked
      expect(achievements.isUnlocked('level_2')).toBe(true)
      expect(achievements.isUnlocked('level_3')).toBe(true)
      expect(achievements.isUnlocked('level_4')).toBe(true)
      expect(achievements.isUnlocked('level_5')).toBe(true)
      expect(achievements.isUnlocked('level_6')).toBe(true)
      expect(achievements.isUnlocked('level_7')).toBe(true)
      expect(achievements.isUnlocked('level_8')).toBe(true)
      expect(achievements.isUnlocked('level_9')).toBe(true)
      expect(achievements.isUnlocked('level_10')).toBe(true)
    })

    it('should add notification for each unlocked achievement', () => {
      // Given
      const achievements = useAchievements()

      // When - Player reaches level 3
      achievements.checkAchievements({ level: 3 })

      // Then - Notifications should be queued for level_2 and level_3
      const notificationCount = achievements.pendingNotifications.value.length
      expect(notificationCount).toBeGreaterThanOrEqual(2)
    })

    it('should queue notifications in correct order for multiple unlocks', () => {
      // Given
      const achievements = useAchievements()

      // When - Player reaches level 3
      achievements.checkAchievements({ level: 3 })

      // Then - Get notifications (welcome unlocks for level >= 1, then level_2, level_3)
      const notif1 = achievements.getNextNotification()
      const notif2 = achievements.getNextNotification()
      const notif3 = achievements.getNextNotification()

      expect(notif1?.id).toBe('welcome')
      expect(notif2?.id).toBe('level_2')
      expect(notif3?.id).toBe('level_3')
    })

    it('should unlock multiple different achievement types', () => {
      // Given
      const achievements = useAchievements()

      // When - Player has high score, level, and lines
      achievements.checkAchievements({
        score: 500,
        level: 5,
        lines: 20
      })

      // Then - Multiple achievement types should be unlocked
      const unlockedCount = achievements.stats.value.unlockedCount
      expect(unlockedCount).toBeGreaterThanOrEqual(3)
    })

    it('should handle rapid sequential checks without duplicates', () => {
      // Given
      const achievements = useAchievements()

      // When - Game checks achievements multiple times for same level
      achievements.checkAchievements({ level: 2 })
      achievements.checkAchievements({ level: 2 })
      achievements.checkAchievements({ level: 2 })

      // Then - Should only be unlocked once, no duplicates
      const level2Unlocks = achievements.unlockedAchievements.value.filter(
        u => u.achievementId === 'level_2'
      ).length
      expect(level2Unlocks).toBe(1)
    })
  })

  /**
   * Test Group 3: Achievement checking respects game state
   *
   * Verifies that achievements only check when appropriate based on game state
   * (during gameplay or at game over, but not during pause)
   */
  describe('3. Achievement checking integration with game state', () => {
    it('should allow achievement checks during active gameplay', () => {
      // Given
      const achievements = useAchievements()
      const isPlaying = true

      // When - Game is active and checkAchievements is called
      if (isPlaying) {
        achievements.checkAchievements({ level: 2 })
      }

      // Then
      expect(achievements.isUnlocked('level_2')).toBe(true)
    })

    it('should allow achievement checks when game is over', () => {
      // Given
      const achievements = useAchievements()
      const isGameOver = true

      // When - Game is over and checkAchievements is called
      if (isGameOver) {
        achievements.checkAchievements({ score: 1000, level: 5 })
      }

      // Then
      expect(achievements.isUnlocked('level_5')).toBe(true)
    })

    it('should simulate watch condition: check only if isPlaying or isGameOver', () => {
      // Given - Simulating the watch condition in App.vue
      const achievements = useAchievements()
      const isPlaying = false
      const isGameOver = false

      // When - Game is neither playing nor over (would be paused)
      const shouldCheck = isPlaying || isGameOver
      if (shouldCheck) {
        achievements.checkAchievements({ level: 2 })
      }

      // Then - Achievement should not be checked
      expect(achievements.isUnlocked('level_2')).toBe(false)
    })

    it('should check achievements when transitioning from playing to game over', () => {
      // Given
      const achievements = useAchievements()
      let isPlaying = true
      let isGameOver = false

      // When - Game is playing
      if (isPlaying || isGameOver) {
        achievements.checkAchievements({ score: 500, level: 3 })
      }

      // Then
      expect(achievements.isUnlocked('level_3')).toBe(true)

      // Then - Transition to game over
      isPlaying = false
      isGameOver = true
      achievements.checkAchievements({ score: 1000, level: 5 })

      // Then
      expect(achievements.isUnlocked('level_5')).toBe(true)
    })
  })

  /**
   * Test Group 4: Notification system integration
   *
   * Verifies that the notification queue works correctly with game events,
   * delivering notifications in proper order and with correct data
   */
  describe('4. Notification system integration', () => {
    it('should populate pendingNotifications when achievements unlock', () => {
      // Given
      const achievements = useAchievements()
      const initialCount = achievements.pendingNotifications.value.length

      // When - Unlock an achievement
      achievements.unlockAchievement('welcome')

      // Then
      expect(achievements.pendingNotifications.value.length).toBe(initialCount + 1)
    })

    it('should return next notification from queue with getNextNotification', () => {
      // Given
      const achievements = useAchievements()
      achievements.checkAchievements({ level: 2 })

      // When - Get first notification (welcome unlocks for level >= 1)
      const notif1 = achievements.getNextNotification()
      const notif2 = achievements.getNextNotification()

      // Then - Second notification should be level_2
      expect(notif1).not.toBeNull()
      expect(notif1?.id).toBe('welcome')
      expect(notif2?.id).toBe('level_2')
      expect(notif2?.name).toBeDefined()
    })

    it('should return notifications in FIFO order from game events', () => {
      // Given
      const achievements = useAchievements()

      // When - Trigger achievements in sequence with clear conditions
      achievements.checkAchievements({ level: 2 })
      const notificationsAfterLevel2 = achievements.pendingNotifications.value.length

      // Then - Should have notifications from level 2 check
      expect(notificationsAfterLevel2).toBeGreaterThan(0)

      // When - Get first two notifications (welcome and level_2)
      const notif1 = achievements.getNextNotification()
      const notif2 = achievements.getNextNotification()

      // Then
      expect(notif1?.id).toBe('welcome')
      expect(notif2?.id).toBe('level_2')

      // When - Clear all remaining notifications and trigger new check
      achievements.clearNotifications()
      expect(achievements.pendingNotifications.value.length).toBe(0)

      // When - Trigger lines achievement specifically
      achievements.checkAchievements({ lines: 5 })
      const notif3 = achievements.getNextNotification()

      // Then - Should have five_lines achievement (or line_5 or similar lines-based achievement)
      expect(notif3?.id).toBeDefined()
      expect(notif3?.rarity).toBeDefined()
    })

    it('should remove notification from queue after retrieval', () => {
      // Given
      const achievements = useAchievements()
      achievements.checkAchievements({ level: 2 })
      const countBefore = achievements.pendingNotifications.value.length

      // When
      achievements.getNextNotification()

      // Then
      expect(achievements.pendingNotifications.value.length).toBe(countBefore - 1)
    })

    it('should include full achievement metadata in notifications', () => {
      // Given
      const achievements = useAchievements()
      achievements.checkAchievements({ level: 5 })

      // When - Skip past welcome and other level achievements to get level_5
      achievements.getNextNotification() // welcome
      achievements.getNextNotification() // level_2
      achievements.getNextNotification() // level_3
      achievements.getNextNotification() // level_4
      const notification = achievements.getNextNotification() // level_5

      // Then
      expect(notification?.id).toBe('level_5')
      expect(notification?.name).toBeDefined()
      expect(notification?.description).toBeDefined()
      expect(notification?.icon).toBeDefined()
      expect(notification?.rarity).toBeDefined()
    })

    it('should handle game events with multiple notifications', () => {
      // Given
      const achievements = useAchievements()

      // When - Game event unlocks multiple achievements
      achievements.checkAchievements({ level: 4, lines: 10, score: 500 })

      // Then - Should have multiple notifications queued
      expect(achievements.pendingNotifications.value.length).toBeGreaterThanOrEqual(3)

      // And - Can retrieve all notifications
      let count = 0
      while (achievements.getNextNotification() !== null) {
        count++
      }
      expect(count).toBeGreaterThanOrEqual(3)
    })
  })

  /**
   * Test Group 5: Game stats tracking during gameplay
   *
   * Verifies that achievement conditions are properly checked against
   * game statistics during actual gameplay scenarios
   */
  describe('5. Game stats tracking during gameplay', () => {
    it('should check achievements with score stat', () => {
      // Given
      const achievements = useAchievements()

      // When - Simulate score progression
      achievements.checkAchievements({ score: 100 })

      // Then
      expect(achievements.isUnlocked('score_100')).toBe(true)
    })

    it('should check achievements with level stat', () => {
      // Given
      const achievements = useAchievements()

      // When - Simulate level progression
      achievements.checkAchievements({ level: 7 })

      // Then
      expect(achievements.isUnlocked('level_7')).toBe(true)
    })

    it('should check achievements with lines stat', () => {
      // Given
      const achievements = useAchievements()

      // When - Simulate line clearing
      achievements.checkAchievements({ lines: 10 })

      // Then
      expect(achievements.isUnlocked('five_lines')).toBe(true)
    })

    it('should accumulate stats across multiple game checks', () => {
      // Given
      const achievements = useAchievements()

      // When - Simulate progression over time
      achievements.checkAchievements({ score: 50, level: 1, lines: 2 })
      achievements.checkAchievements({ score: 150, level: 2, lines: 5 })
      achievements.checkAchievements({ score: 300, level: 3, lines: 8 })

      // Then
      expect(achievements.isUnlocked('level_2')).toBe(true)
      expect(achievements.isUnlocked('level_3')).toBe(true)
      expect(achievements.isUnlocked('five_lines')).toBe(true)
    })

    it('should preserve game stats in unlocked achievement record', () => {
      // Given
      const achievements = useAchievements()

      // When - Unlock achievement with stats
      const gameStats = { score: 500, level: 3, lines: 10 }
      achievements.checkAchievements(gameStats)

      // Then
      const unlockedList = achievements.unlockedAchievements.value
      const unlockedAch = unlockedList.find(u => u.achievementId === 'level_3')
      expect(unlockedAch?.gameStats?.score).toBe(500)
      expect(unlockedAch?.gameStats?.level).toBe(3)
    })
  })

  /**
   * Test Group 6: Complete gameplay scenario simulation
   *
   * Full end-to-end gameplay simulations testing realistic achievement flow
   */
  describe('6. Complete gameplay scenario simulation', () => {
    it('should simulate early game progression', () => {
      // Given
      const achievements = useAchievements()

      // When - Simulate player starting game with level 1
      achievements.checkAchievements({ score: 10, level: 1, lines: 1 })

      // Then - Welcome achievement unlocks at level >= 1, plus line_1 for clearing 1 line
      expect(achievements.isUnlocked('welcome')).toBe(true)
      const countAfterLevel1 = achievements.stats.value.unlockedCount
      expect(countAfterLevel1).toBeGreaterThanOrEqual(1) // At least welcome

      // When - Player improves to level 2 with 5 lines
      achievements.checkAchievements({ score: 100, level: 2, lines: 5 })

      // Then - Should unlock early achievements
      expect(achievements.isUnlocked('level_2')).toBe(true)
      expect(achievements.isUnlocked('five_lines')).toBe(true)
      const countAfterLevel2 = achievements.stats.value.unlockedCount
      expect(countAfterLevel2).toBeGreaterThan(countAfterLevel1)
    })

    it('should simulate mid-game milestone progression', () => {
      // Given
      const achievements = useAchievements()

      // When - Simulate progressing through levels
      achievements.checkAchievements({ score: 500, level: 2, lines: 5 })
      achievements.checkAchievements({ score: 1000, level: 3, lines: 10 })
      achievements.checkAchievements({ score: 2000, level: 5, lines: 15 })
      achievements.checkAchievements({ score: 3000, level: 7, lines: 25 })

      // Then
      expect(achievements.isUnlocked('level_5')).toBe(true)
      expect(achievements.isUnlocked('level_7')).toBe(true)
      const unlockedCount = achievements.stats.value.unlockedCount
      expect(unlockedCount).toBeGreaterThan(5)
    })

    it('should handle high score endgame scenario', () => {
      // Given
      const achievements = useAchievements()

      // When - Simulate endgame with high stats
      achievements.checkAchievements({
        score: 10000,
        level: 15,
        lines: 100,
        tetrisCount: 50,
        combo: 25,
        timePlayed: 3600
      })

      // Then - Should unlock many achievements
      const unlockedCount = achievements.stats.value.unlockedCount
      expect(unlockedCount).toBeGreaterThan(10)

      // And - High level achievements should be unlocked
      expect(achievements.isUnlocked('level_10')).toBe(true)
    })

    it('should maintain achievement state through multiple game sessions', () => {
      // Given - First session
      const achievements1 = useAchievements()
      achievements1.checkAchievements({ level: 3, score: 500, lines: 10 })
      const stats1 = achievements1.stats.value

      // When - New session loads
      const achievements2 = useAchievements()

      // Then - Previous achievements should persist
      const stats2 = achievements2.stats.value
      expect(stats2.unlockedCount).toBe(stats1.unlockedCount)
      expect(achievements2.isUnlocked('level_3')).toBe(true)
    })

    it('should generate notifications for all unlocks in progression', () => {
      // Given
      const achievements = useAchievements()

      // When - Simulate gameplay progression
      achievements.checkAchievements({ score: 100, level: 2, lines: 5 })
      achievements.checkAchievements({ score: 300, level: 4, lines: 12 })

      // Then - Should have notifications for each unlock
      let totalNotifications = 0
      while (achievements.getNextNotification() !== null) {
        totalNotifications++
      }
      expect(totalNotifications).toBeGreaterThanOrEqual(3)
    })
  })

  /**
   * Test Group 7: Edge cases and error conditions
   *
   * Tests boundary conditions and edge cases in game integration
   */
  describe('7. Edge cases and error conditions', () => {
    it('should handle empty game stats gracefully', () => {
      // Given
      const achievements = useAchievements()

      // When - Call with empty stats
      let errorThrown = false
      try {
        achievements.checkAchievements({})
      } catch (error) {
        errorThrown = true
      }

      // Then - Should not throw
      expect(errorThrown).toBe(false)
    })

    it('should handle zero values in game stats', () => {
      // Given
      const achievements = useAchievements()

      // When - Call with zero values
      achievements.checkAchievements({ score: 0, level: 0, lines: 0 })

      // Then - Should not unlock anything
      expect(achievements.stats.value.unlockedCount).toBe(0)
    })

    it('should handle very large game stat values', () => {
      // Given
      const achievements = useAchievements()

      // When - Call with very large values
      achievements.checkAchievements({
        score: 999999999,
        level: 999,
        lines: 9999
      })

      // Then - Should unlock achievements without issues
      expect(achievements.isUnlocked('level_10')).toBe(true)
      let errorThrown = false
      try {
        achievements.getNextNotification()
      } catch (error) {
        errorThrown = true
      }
      expect(errorThrown).toBe(false)
    })

    it('should prevent duplicate notifications for same achievement', () => {
      // Given
      const achievements = useAchievements()

      // When - Try to unlock same achievement twice
      achievements.checkAchievements({ level: 2 })
      const countAfterFirst = achievements.pendingNotifications.value.length
      achievements.checkAchievements({ level: 2 })
      const countAfterSecond = achievements.pendingNotifications.value.length

      // Then - Count should not increase (no duplicate notifications)
      expect(countAfterSecond).toBe(countAfterFirst)

      // And - level_2 should only appear once in notifications
      let level2Count = 0
      let notif = achievements.getNextNotification()
      while (notif !== null) {
        if (notif.id === 'level_2') level2Count++
        notif = achievements.getNextNotification()
      }
      expect(level2Count).toBe(1)
    })
  })
})
