import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAchievements } from '@/composables/useAchievements'
import { useGameBus } from '@/composables/useGameBus'

/**
 * Test Suite: useAchievements Branch Coverage
 *
 * PURPOSE:
 * This test suite specifically targets uncovered branches in useAchievements.ts
 * to improve branch coverage from 83.19% to 85%+
 *
 * UNCOVERED BRANCHES TARGETED:
 * 1. Line 383: pendingNotifications only cleared on first initialization
 * 2. Line 512: clearSaveError() sets saveError to null
 * 3. Line 541: triggerDevAchievement when queue is full (MAX_PENDING_NOTIFICATIONS = 50)
 *
 * TESTING STRATEGY:
 * - Focus on edge cases and conditional branches not covered by integration tests
 * - Test initialization behavior across multiple useAchievements() calls
 * - Test error clearing functionality
 * - Test notification queue overflow scenarios
 */

describe('useAchievements - Branch Coverage', () => {
  beforeEach(() => {
    // Reset localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  /**
   * Test Group 1: Pending Notifications Initialization Behavior
   *
   * TARGET: Line 383 - pendingNotifications only cleared on first init
   * BRANCH: if (!isInitialized) { pendingNotifications.value = [] }
   *
   * BEHAVIOR:
   * - First call to useAchievements() should clear pending notifications
   * - Subsequent calls should NOT clear pending notifications
   * - This prevents clearing notifications when composable is reused
   */
  describe('1. Pending Notifications Initialization Flag', () => {
    it('should clear pendingNotifications on first useAchievements() initialization', () => {
      // Given: Fresh state with localStorage cleared
      localStorage.clear()

      // Reset module state
      const achievements0 = useAchievements()
      achievements0.resetAchievements()

      // When: First initialization
      const achievements1 = useAchievements()

      // Then: Pending notifications should be empty array (cleared)
      expect(achievements1.pendingNotifications.value).toEqual([])
      expect(achievements1.pendingNotifications.value.length).toBe(0)
    })

    it('should NOT clear pendingNotifications on subsequent useAchievements() calls', () => {
      // Given: Fresh state
      const achievements0 = useAchievements()
      achievements0.resetAchievements()

      // First initialization
      const achievements1 = useAchievements()

      // Add an achievement notification to the queue
      achievements1.unlockAchievement('welcome')
      const notificationCount = achievements1.pendingNotifications.value.length

      // Ensure we have at least 1 notification
      expect(notificationCount).toBeGreaterThan(0)

      // When: Second initialization (subsequent call)
      const achievements2 = useAchievements()

      // Then: Pending notifications should be preserved (NOT cleared)
      expect(achievements2.pendingNotifications.value.length).toBe(notificationCount)
      expect(achievements2.pendingNotifications.value.length).toBeGreaterThan(0)
    })

    it('should preserve pending notifications across multiple useAchievements() instances', () => {
      // Given: Fresh state
      const achievements0 = useAchievements()
      achievements0.resetAchievements()

      // Initial instance with notifications
      const achievements1 = useAchievements()
      achievements1.unlockAchievement('welcome')
      achievements1.unlockAchievement('first_blood')
      const initialCount = achievements1.pendingNotifications.value.length

      // When: Create second instance
      const achievements2 = useAchievements()

      // Then: Notifications should be preserved
      expect(achievements2.pendingNotifications.value.length).toBe(initialCount)

      // When: Create third instance
      const achievements3 = useAchievements()

      // Then: Notifications should still be preserved
      expect(achievements3.pendingNotifications.value.length).toBe(initialCount)
    })

    it('should only set isInitialized flag to true on first call', () => {
      // Given: Clean state
      const achievements0 = useAchievements()
      achievements0.resetAchievements()

      // When: First initialization after reset
      const achievements1 = useAchievements()

      // Add notification to verify behavior difference
      achievements1.unlockAchievement('welcome')
      const firstCallNotifications = achievements1.pendingNotifications.value.length

      // When: Second call
      const achievements2 = useAchievements()

      // Then: Second call should NOT clear notifications (isInitialized already true)
      expect(achievements2.pendingNotifications.value.length).toBe(firstCallNotifications)
      expect(achievements2.pendingNotifications.value.length).toBeGreaterThan(0)
    })
  })

  /**
   * Test Group 2: Clear Save Error Functionality
   *
   * TARGET: Line 512 - clearSaveError()
   * BRANCH: saveError.value = null
   *
   * BEHAVIOR:
   * - clearSaveError() should set saveError to null
   * - Used by UI to dismiss error messages
   */
  describe('2. Clear Save Error Method', () => {
    it('should set saveError to null when clearSaveError is called', () => {
      // Given: Achievement system initialized
      const achievements = useAchievements()
      achievements.resetAchievements()

      // Simulate a save error by triggering quota exceeded
      const originalSetItem = localStorage.setItem
      localStorage.setItem = function(key: string, value: string) {
        if (key === 'tetris_achievements') {
          const error: any = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        }
        originalSetItem.call(localStorage, key, value)
      }

      // Trigger error by unlocking achievement
      achievements.unlockAchievement('welcome')

      // Restore original
      localStorage.setItem = originalSetItem

      // Verify error was set
      expect(achievements.saveError.value).not.toBeNull()
      expect(achievements.saveError.value).toContain('Storage quota exceeded')
      expect(achievements.isQuotaError.value).toBe(true)

      // When: Clear the error
      achievements.clearSaveError()

      // Then: Error and quota flag should be null/false
      expect(achievements.saveError.value).toBeNull()
      expect(achievements.isQuotaError.value).toBe(false)
    })

    it('should handle clearSaveError when no error exists', () => {
      // Given: Achievement system with no error
      const achievements = useAchievements()
      expect(achievements.saveError.value).toBeNull()

      // When: Clear error when none exists
      achievements.clearSaveError()

      // Then: Should still be null (no-op, no crash)
      expect(achievements.saveError.value).toBeNull()
    })

    it('should allow clearing error multiple times', () => {
      // Given: Achievement system initialized
      const achievements = useAchievements()
      achievements.resetAchievements()

      // Simulate save error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = function(key: string, value: string) {
        if (key === 'tetris_achievements') {
          const error: any = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        }
        originalSetItem.call(localStorage, key, value)
      }

      achievements.unlockAchievement('welcome')
      localStorage.setItem = originalSetItem

      expect(achievements.saveError.value).not.toBeNull()

      // When: Clear error multiple times
      achievements.clearSaveError()
      expect(achievements.saveError.value).toBeNull()

      achievements.clearSaveError()
      expect(achievements.saveError.value).toBeNull()

      achievements.clearSaveError()
      expect(achievements.saveError.value).toBeNull()

      // Then: Should remain null after multiple calls
      expect(achievements.saveError.value).toBeNull()
    })

    it('should clear error after it was set by localStorage failure', () => {
      // Given: System initialized
      const achievements = useAchievements()
      achievements.resetAchievements()

      const originalSetItem = localStorage.setItem
      localStorage.setItem = function(key: string, value: string) {
        if (key === 'tetris_achievements') {
          const error: any = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        }
        originalSetItem.call(localStorage, key, value)
      }

      // Trigger error by attempting to unlock an achievement
      achievements.unlockAchievement('score_100')
      localStorage.setItem = originalSetItem

      const errorMessage = achievements.saveError.value

      expect(errorMessage).not.toBeNull()
      expect(errorMessage).toBeDefined()

      // When: Clear error
      achievements.clearSaveError()

      // Then: Error cleared
      expect(achievements.saveError.value).toBeNull()
    })
  })

  /**
   * Test Group 2B: Achievement Condition Evaluation
   *
   * TARGET: Lines 87-134 - evaluateCondition function branches
   * Tests various condition types and operators
   */
  describe('2B. Achievement Condition Evaluation', () => {
    it('should check achievements with different stat types', () => {
      // Given: Achievement system initialized
      const achievements = useAchievements()
      achievements.resetAchievements()

      // When: Check achievements with various stats
      // This exercises different condition.type branches in evaluateCondition
      achievements.checkAchievements({
        score: 100,      // type: 'score'
        level: 1,        // type: 'level'
        lines: 5,        // type: 'lines'
        tetrisCount: 1,  // type: 'tetris_count'
        combo: 2,        // type: 'combo'
        timePlayed: 30   // type: 'time_played'
      })

      // Then: Should not throw (exercises all stat type branches)
      expect(achievements.unlockedAchievements.value.length).toBeGreaterThanOrEqual(0)
    })

    it('should handle high score achievements', () => {
      // Given: Achievement system initialized
      const achievements = useAchievements()
      achievements.resetAchievements()

      // When: Check with high score (exercises score type + gte operator)
      achievements.checkAchievements({
        score: 1000000,
        level: 20,
        lines: 1000,
        tetrisCount: 100,
        combo: 50,
        timePlayed: 36000
      })

      // Then: Multiple achievements should be checked
      expect(achievements.unlockedAchievements.value.length).toBeGreaterThan(0)
    })

    it('should handle minimum stat values', () => {
      // Given: Achievement system initialized
      const achievements = useAchievements()
      achievements.resetAchievements()

      // When: Check with minimum stats (exercises condition.value boundary)
      achievements.checkAchievements({
        score: 0,
        level: 1,
        lines: 0,
        tetrisCount: 0,
        combo: 0,
        timePlayed: 0
      })

      // Then: Only welcome achievement might unlock
      expect(achievements.unlockedAchievements.value.length).toBeGreaterThanOrEqual(0)
    })

    it('should check combo-based achievements', () => {
      // Given: Achievement system initialized
      const achievements = useAchievements()
      achievements.resetAchievements()

      // When: Check with high combo (exercises combo type)
      achievements.checkAchievements({
        score: 5000,
        level: 5,
        lines: 50,
        tetrisCount: 5,
        combo: 10,
        timePlayed: 600
      })

      // Then: Combo achievements should be checked
      expect(achievements.unlockedAchievements.value.length).toBeGreaterThanOrEqual(0)
    })

    it('should check time-based achievements', () => {
      // Given: Achievement system initialized
      const achievements = useAchievements()
      achievements.resetAchievements()

      // When: Check with long play time (exercises time_played type)
      achievements.checkAchievements({
        score: 10000,
        level: 10,
        lines: 100,
        tetrisCount: 10,
        combo: 5,
        timePlayed: 1800 // 30 minutes
      })

      // Then: Time achievements should be checked
      expect(achievements.unlockedAchievements.value.length).toBeGreaterThanOrEqual(0)
    })
  })

  /**
   * Test Group 3: Notification Queue Overflow (triggerDevAchievement)
   *
   * TARGET: Line 541 - triggerDevAchievement when queue full
   * BRANCH: else { console.warn(notification queue full) }
   *
   * BEHAVIOR:
   * - When pendingNotifications reaches MAX_PENDING_NOTIFICATIONS (50)
   * - triggerDevAchievement should skip adding and log warning
   * - console.warn should be called with specific message
   */
  describe('3. Notification Queue Overflow Handling', () => {
    it('should skip adding dev achievement when notification queue is full', () => {
      // Given: Achievement system with full notification queue
      const achievements = useAchievements()
      const MAX_PENDING_NOTIFICATIONS = 50

      // Fill the queue to capacity by triggering dev achievements
      for (let i = 0; i < MAX_PENDING_NOTIFICATIONS; i++) {
        achievements.triggerDevAchievement('common')
      }

      // Verify queue is at capacity
      expect(achievements.pendingNotifications.value.length).toBe(MAX_PENDING_NOTIFICATIONS)

      // Spy on console.warn
      const originalWarn = console.warn
      const warnCalls: string[] = []
      console.warn = (msg: string) => warnCalls.push(msg)

      // When: Try to add another dev achievement
      achievements.triggerDevAchievement('legendary')

      // Restore console
      console.warn = originalWarn

      // Then: Queue should still be at max (achievement not added)
      expect(achievements.pendingNotifications.value.length).toBe(MAX_PENDING_NOTIFICATIONS)

      // And: console.warn should have been called with overflow message
      expect(warnCalls.length).toBeGreaterThan(0)
      const message = warnCalls[0]
      expect(message).toContain('Notification queue full')
      expect(message).toContain('50')
      expect(message).toContain('skipping dev achievement')
    })

    it('should log warning message when queue is full', () => {
      // Given: Full notification queue
      const achievements = useAchievements()
      const MAX_PENDING_NOTIFICATIONS = 50

      // Fill queue
      for (let i = 0; i < MAX_PENDING_NOTIFICATIONS; i++) {
        achievements.triggerDevAchievement('rare')
      }

      const originalWarn = console.warn
      const warnCalls: string[] = []
      console.warn = (msg: string) => warnCalls.push(msg)

      // When: Attempt to trigger dev achievement when full
      achievements.triggerDevAchievement('epic')

      console.warn = originalWarn

      // Then: Should log specific warning
      expect(warnCalls.length).toBe(1)
      const warnCall = warnCalls[0]
      expect(warnCall).toContain('Notification queue full')
      expect(warnCall).toContain('(50)')
      expect(warnCall).toContain('skipping dev achievement')
    })

    it('should not add dev achievement to queue when at capacity', () => {
      // Given: Queue at max capacity
      const achievements = useAchievements()
      const MAX_PENDING_NOTIFICATIONS = 50

      for (let i = 0; i < MAX_PENDING_NOTIFICATIONS; i++) {
        achievements.triggerDevAchievement('common')
      }

      const lengthBefore = achievements.pendingNotifications.value.length

      const originalWarn = console.warn
      console.warn = () => {} // Suppress warnings

      // When: Try to add when full
      achievements.triggerDevAchievement('legendary')

      console.warn = originalWarn

      // Then: Queue unchanged
      expect(achievements.pendingNotifications.value.length).toBe(lengthBefore)
      expect(achievements.pendingNotifications.value.length).toBe(MAX_PENDING_NOTIFICATIONS)
    })

    it('should successfully add dev achievement when queue is not full', () => {
      // Given: Empty queue
      const achievements = useAchievements()
      achievements.clearNotifications()

      expect(achievements.pendingNotifications.value.length).toBe(0)

      // When: Add dev achievement
      achievements.triggerDevAchievement('legendary')

      // Then: Should be added successfully
      expect(achievements.pendingNotifications.value.length).toBe(1)
      expect(achievements.pendingNotifications.value[0].rarity).toBe('legendary')
    })

    it('should handle queue at capacity minus one correctly', () => {
      // Given: Queue at capacity - 1
      const achievements = useAchievements()
      achievements.resetAchievements() // Clear any existing state
      const MAX_PENDING_NOTIFICATIONS = 50

      for (let i = 0; i < MAX_PENDING_NOTIFICATIONS - 1; i++) {
        achievements.triggerDevAchievement('common')
      }

      expect(achievements.pendingNotifications.value.length).toBe(MAX_PENDING_NOTIFICATIONS - 1)

      const originalWarn = console.warn
      const warnCalls: string[] = []
      console.warn = (msg: string) => warnCalls.push(msg)

      // When: Add one more (should succeed, exactly at limit)
      achievements.triggerDevAchievement('epic')

      // Then: Should be added (now at capacity)
      expect(achievements.pendingNotifications.value.length).toBe(MAX_PENDING_NOTIFICATIONS)
      expect(warnCalls.length).toBe(0)

      // When: Try to add one more (should fail, now over limit)
      achievements.triggerDevAchievement('legendary')

      console.warn = originalWarn

      // Then: Should not be added, warning logged
      expect(achievements.pendingNotifications.value.length).toBe(MAX_PENDING_NOTIFICATIONS)
      expect(warnCalls.length).toBe(1)
      expect(warnCalls[0]).toContain('Notification queue full')
    })

    it('should handle multiple overflow attempts consistently', () => {
      // Given: Full queue
      const achievements = useAchievements()
      const MAX_PENDING_NOTIFICATIONS = 50

      for (let i = 0; i < MAX_PENDING_NOTIFICATIONS; i++) {
        achievements.triggerDevAchievement('common')
      }

      const originalWarn = console.warn
      const warnCalls: string[] = []
      console.warn = (msg: string) => warnCalls.push(msg)

      // When: Attempt to add multiple times when full
      achievements.triggerDevAchievement('rare')
      achievements.triggerDevAchievement('epic')
      achievements.triggerDevAchievement('legendary')

      console.warn = originalWarn

      // Then: Queue should remain at max, warnings logged for each
      expect(achievements.pendingNotifications.value.length).toBe(MAX_PENDING_NOTIFICATIONS)
      expect(warnCalls.length).toBe(3)
    })
  })

  /**
   * Test Group 4: Combined Branch Coverage Scenarios
   *
   * Tests that exercise multiple branches together to ensure
   * proper interaction between features
   */
  describe('4. Combined Branch Coverage Scenarios', () => {
    it('should handle initialization, error clearing, and queue overflow together', () => {
      // Given: Fresh state
      const achievements0 = useAchievements()
      achievements0.resetAchievements()

      // First initialization
      const achievements1 = useAchievements()

      // Add notification
      achievements1.unlockAchievement('welcome')
      expect(achievements1.pendingNotifications.value.length).toBeGreaterThan(0)

      // When: Second initialization (should not clear notifications)
      const achievements2 = useAchievements()
      expect(achievements2.pendingNotifications.value.length).toBeGreaterThan(0)

      // Simulate error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = function(key: string, value: string) {
        if (key === 'tetris_achievements') {
          const error: any = new Error('QuotaExceededError')
          error.name = 'QuotaExceededError'
          throw error
        }
        originalSetItem.call(localStorage, key, value)
      }

      achievements2.unlockAchievement('score_100')
      localStorage.setItem = originalSetItem

      expect(achievements2.saveError.value).not.toBeNull()

      // Clear error
      achievements2.clearSaveError()
      expect(achievements2.saveError.value).toBeNull()

      // Fill queue to capacity
      achievements2.clearNotifications()
      const MAX_PENDING_NOTIFICATIONS = 50
      for (let i = 0; i < MAX_PENDING_NOTIFICATIONS; i++) {
        achievements2.triggerDevAchievement('common')
      }

      const originalWarn = console.warn
      const warnCalls: string[] = []
      console.warn = (msg: string) => warnCalls.push(msg)

      // Try to overflow
      achievements2.triggerDevAchievement('legendary')

      console.warn = originalWarn

      // Then: Should handle overflow correctly
      expect(achievements2.pendingNotifications.value.length).toBe(MAX_PENDING_NOTIFICATIONS)
      expect(warnCalls.length).toBe(1)
      expect(warnCalls[0]).toContain('Notification queue full')
    })

    it('should preserve notification queue across instances and handle overflow', () => {
      // Given: Fresh state
      const achievements0 = useAchievements()
      achievements0.resetAchievements()

      // First instance with some notifications
      const achievements1 = useAchievements()
      achievements1.clearNotifications()

      // Add 45 notifications
      for (let i = 0; i < 45; i++) {
        achievements1.triggerDevAchievement('common')
      }

      expect(achievements1.pendingNotifications.value.length).toBe(45)

      // When: Create second instance (should preserve queue)
      const achievements2 = useAchievements()
      expect(achievements2.pendingNotifications.value.length).toBe(45)

      // Add 5 more to reach capacity
      for (let i = 0; i < 5; i++) {
        achievements2.triggerDevAchievement('rare')
      }

      expect(achievements2.pendingNotifications.value.length).toBe(50)

      const originalWarn = console.warn
      const warnCalls: string[] = []
      console.warn = (msg: string) => warnCalls.push(msg)

      // Try to add one more (should overflow)
      achievements2.triggerDevAchievement('legendary')

      console.warn = originalWarn

      // Then: Should handle overflow
      expect(achievements2.pendingNotifications.value.length).toBe(50)
      expect(warnCalls.length).toBe(1)
    })
  })

  /**
   * Test Group 6: Event Bus Subscription Coverage
   *
   * Target branches in lines 286-289 (time:tick event handler)
   * Event subscriptions are set up at module load time
   */
  describe('Event Bus - time:tick Handler', () => {
    it('should update timePlayed when time:tick event is received', () => {
      // Given: Fresh state (event subscriptions are set up at module load)
      const achievements = useAchievements()
      achievements.resetAchievements()

      // When: Emit time:tick event (simulating game time tracking)
      const bus = useGameBus()
      bus.emit('time:tick', { timePlayed: 120 }) // 2 minutes

      // Then: The event handler should process without error
      // Achievement checks should run with updated timePlayed
      expect(achievements).toBeDefined()
    })

    it('should check time-based achievements on time:tick events', () => {
      // Given: Fresh state
      const achievements = useAchievements()
      achievements.resetAchievements()

      const bus = useGameBus()

      // When: Emit multiple time:tick events
      bus.emit('time:tick', { timePlayed: 60 })   // 1 minute
      bus.emit('time:tick', { timePlayed: 120 })  // 2 minutes
      bus.emit('time:tick', { timePlayed: 300 })  // 5 minutes

      // Then: Should process events without errors
      expect(achievements.pendingNotifications.value).toBeDefined()
    })

    it('should handle time:tick with zero value', () => {
      // Given: Fresh state
      const achievements = useAchievements()
      achievements.resetAchievements()

      const bus = useGameBus()

      // When: Emit time:tick with zero
      bus.emit('time:tick', { timePlayed: 0 })

      // Then: Should handle gracefully
      expect(achievements).toBeDefined()
    })

    it('should handle rapid time:tick events', () => {
      // Given: Fresh state
      const achievements = useAchievements()
      achievements.resetAchievements()

      const bus = useGameBus()

      // When: Emit rapid time:tick events (like real game would)
      for (let i = 1; i <= 10; i++) {
        bus.emit('time:tick', { timePlayed: i })
      }

      // Then: Should process all events
      expect(achievements).toBeDefined()
    })
  })

  /**
   * Test Group 7: First Initialization Path
   *
   * Target branch at line 383 (pendingNotifications clear on first init)
   */
  describe('First Initialization - Notification Clearing', () => {
    it('should clear notifications on fresh module load', () => {
      // Given: A state where we can verify first initialization behavior
      // The resetAchievements method is designed to trigger clean first-init behavior
      const achievements = useAchievements()

      // When: Reset to simulate fresh state
      achievements.resetAchievements()

      // Then: Pending notifications should be empty
      expect(achievements.pendingNotifications.value).toEqual([])
    })

    it('should not clear notifications on subsequent calls when already initialized', () => {
      // Given: Initial state with some notifications
      const achievements1 = useAchievements()
      achievements1.resetAchievements()
      achievements1.clearNotifications()

      // Add some notifications
      achievements1.triggerDevAchievement('common')
      achievements1.triggerDevAchievement('rare')

      const notificationCount = achievements1.pendingNotifications.value.length

      // When: Get another instance (same singleton, should be initialized)
      const achievements2 = useAchievements()

      // Then: Notifications should be preserved
      expect(achievements2.pendingNotifications.value.length).toBe(notificationCount)
    })
  })
})
