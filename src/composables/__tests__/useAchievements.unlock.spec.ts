import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAchievements } from '@/composables/useAchievements'
import type { AchievementId } from '@/types/achievements'

/**
 * Test Suite: useAchievements Unlock Logic and Progression
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
 * INTERNAL STATE MANAGEMENT:
 * - Stats tracking is event-driven and automatic (no manual checkAchievements calls)
 * - Progressive unlock checking happens automatically when stats are updated
 * - State resets on 'game:started' event for clean game sessions
 *
 * TESTING NOTES FOR THIS FILE:
 * - These tests focus on the unlock mechanism itself (unlockAchievement method)
 * - Direct unlock calls bypass event system (used for manual/forced unlocks)
 * - Event-driven unlocks are tested in useAchievements.integration.spec.ts
 * - Relevant events: None directly tested here (manual unlock testing only)
 *
 * Comprehensive tests for achievement unlock mechanics, progress tracking,
 * and duplicate prevention including:
 * - Unlock achievement by ID
 * - Prevent duplicate unlocks (same achievement twice)
 * - Track unlock timestamp
 * - Update achievement progress (0-100%)
 * - Trigger achievement unlock at 100% progress
 * - Check if achievement is unlocked
 * - Get list of all unlocked achievements
 * - Get list of locked achievements
 * - Calculate total completion percentage
 * - Unlock multiple achievements in sequence
 * - Handle invalid achievement IDs
 * - Verify achievement unlock notifications/events
 */
describe('useAchievements - Unlock Logic and Progression', () => {
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
   * Test 1: Unlock achievement by ID
   *
   * Given: A valid achievement ID
   * When: unlockAchievement is called
   * Then: Achievement should be marked as unlocked
   */
  describe('1. Unlock achievement by ID', () => {
    it('should unlock a valid achievement by ID', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'welcome'

      // When
      achievements.unlockAchievement(achievementId)

      // Then
      expect(achievements.isUnlocked(achievementId)).toBe(true)
    })

    it('should unlock achievement with game stats', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_2'
      const gameStats = { score: 1000, level: 2, lines: 5 }

      // When
      achievements.unlockAchievement(achievementId, gameStats)

      // Then
      expect(achievements.isUnlocked(achievementId)).toBe(true)
      const unlockedList = achievements.unlockedAchievements.value
      const unlockedAchievement = unlockedList.find(u => u.achievementId === achievementId)
      expect(unlockedAchievement?.gameStats).toEqual(gameStats)
    })

    it('should unlock multiple different achievements', () => {
      // Given
      const achievements = useAchievements()
      const ids: AchievementId[] = ['welcome', 'level_2', 'level_3']

      // When
      ids.forEach(id => achievements.unlockAchievement(id))

      // Then
      ids.forEach(id => {
        expect(achievements.isUnlocked(id)).toBe(true)
      })
    })

    it('should store achievement in unlocked achievements list', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_5'
      const initialCount = achievements.unlockedAchievements.value.length

      // When
      achievements.unlockAchievement(achievementId)

      // Then
      expect(achievements.unlockedAchievements.value.length).toBe(initialCount + 1)
    })
  })

  /**
   * Test 2: Prevent duplicate unlocks (same achievement twice)
   *
   * Given: An already unlocked achievement
   * When: unlockAchievement is called again with same ID
   * Then: Achievement should remain unlocked only once (no duplicates)
   */
  describe('2. Prevent duplicate unlocks (same achievement twice)', () => {
    it('should prevent duplicate unlock of same achievement', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'welcome'
      achievements.unlockAchievement(achievementId)
      const countAfterFirst = achievements.unlockedAchievements.value.length

      // When
      achievements.unlockAchievement(achievementId)

      // Then
      expect(achievements.unlockedAchievements.value.length).toBe(countAfterFirst)
    })

    it('should not add duplicate entries for same achievement', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_2'

      // When
      achievements.unlockAchievement(achievementId)
      achievements.unlockAchievement(achievementId)
      achievements.unlockAchievement(achievementId)

      // Then
      const count = achievements.unlockedAchievements.value.filter(
        u => u.achievementId === achievementId
      ).length
      expect(count).toBe(1)
    })

    it('should keep first unlock timestamp when attempting duplicate unlock', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_3'

      // When
      achievements.unlockAchievement(achievementId)
      const firstUnlock = achievements.unlockedAchievements.value.find(
        u => u.achievementId === achievementId
      )?.unlockedAt

      // Attempt duplicate
      achievements.unlockAchievement(achievementId)
      const secondUnlock = achievements.unlockedAchievements.value.find(
        u => u.achievementId === achievementId
      )?.unlockedAt

      // Then
      expect(firstUnlock?.getTime()).toBe(secondUnlock?.getTime())
    })

    it('should return early without processing duplicate unlock', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_4'
      achievements.unlockAchievement(achievementId)
      const initialNotifications = achievements.pendingNotifications.value.length

      // When
      achievements.unlockAchievement(achievementId)

      // Then - No new notifications should be added for duplicate
      expect(achievements.pendingNotifications.value.length).toBe(initialNotifications)
    })
  })

  /**
   * Test 3: Track unlock timestamp
   *
   * Given: An achievement unlocked
   * When: Checking unlock details
   * Then: Timestamp should be recorded accurately
   */
  describe('3. Track unlock timestamp', () => {
    it('should record unlock timestamp as Date object', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_5'

      // When
      achievements.unlockAchievement(achievementId)

      // Then
      const unlockedAchievement = achievements.unlockedAchievements.value.find(
        u => u.achievementId === achievementId
      )
      expect(unlockedAchievement?.unlockedAt).toBeInstanceOf(Date)
    })

    it('should record timestamp within reasonable time window', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'welcome'
      const beforeUnlock = new Date()

      // When
      achievements.unlockAchievement(achievementId)
      const afterUnlock = new Date()

      // Then
      const unlockedAchievement = achievements.unlockedAchievements.value.find(
        u => u.achievementId === achievementId
      )
      const timestamp = unlockedAchievement?.unlockedAt!.getTime()
      expect(timestamp).toBeGreaterThanOrEqual(beforeUnlock.getTime())
      expect(timestamp).toBeLessThanOrEqual(afterUnlock.getTime() + 100) // Add small buffer
    })

    it('should preserve timestamp after save/load cycle', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_2'
      achievements.unlockAchievement(achievementId)
      const originalTimestamp = achievements.unlockedAchievements.value.find(
        u => u.achievementId === achievementId
      )?.unlockedAt

      // When
      const achievements2 = useAchievements()

      // Then
      const loadedTimestamp = achievements2.unlockedAchievements.value.find(
        u => u.achievementId === achievementId
      )?.unlockedAt
      expect(loadedTimestamp?.getTime()).toBe(originalTimestamp?.getTime())
    })

    it('should maintain correct chronological order of unlocks', () => {
      // Given
      const achievements = useAchievements()
      const ids: AchievementId[] = ['welcome', 'level_2', 'level_3']

      // When
      ids.forEach(id => {
        achievements.unlockAchievement(id)
      })

      // Then
      const unlocks = achievements.unlockedAchievements.value
      for (let i = 1; i < unlocks.length; i++) {
        expect(unlocks[i].unlockedAt.getTime()).toBeGreaterThanOrEqual(
          unlocks[i - 1].unlockedAt.getTime()
        )
      }
    })
  })

  /**
   * Test 4: Update achievement progress (0-100%)
   *
   * Given: An achievement with a numeric condition
   * When: Getting progress at various values
   * Then: Progress should be calculated as 0-100%
   */
  describe('4. Update achievement progress (0-100%)', () => {
    it('should calculate 0% progress when current value is 0', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_5'

      // When
      const progress = achievements.getProgress(achievementId, 0)

      // Then
      expect(progress.percentage).toBe(0)
      expect(progress.currentValue).toBe(0)
    })

    it('should calculate 50% progress at halfway point', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_5'
      const currentValue = 2.5 // Halfway to level 5

      // When
      const progress = achievements.getProgress(achievementId, currentValue)

      // Then
      expect(progress.percentage).toBe(50)
    })

    it('should calculate 100% progress when target is met', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_5'
      const currentValue = 5 // Equal to target

      // When
      const progress = achievements.getProgress(achievementId, currentValue)

      // Then
      expect(progress.percentage).toBe(100)
      expect(progress.currentValue).toBe(currentValue)
    })

    it('should clamp progress to 100% when exceeding target', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_5'
      const currentValue = 10 // Double the target

      // When
      const progress = achievements.getProgress(achievementId, currentValue)

      // Then
      expect(progress.percentage).toBe(100)
      expect(progress.currentValue).toBe(currentValue)
    })

    it('should return valid progress object with all fields', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_3'

      // When
      const progress = achievements.getProgress(achievementId, 1)

      // Then
      expect(progress.achievementId).toBe(achievementId)
      expect(typeof progress.currentValue).toBe('number')
      expect(typeof progress.targetValue).toBe('number')
      expect(typeof progress.percentage).toBe('number')
    })

    it('should calculate correct progress percentages across range', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_10'
      const testValues = [0, 2.5, 5, 7.5, 10]
      const expectedPercentages = [0, 25, 50, 75, 100]

      // When & Then
      testValues.forEach((value, index) => {
        const progress = achievements.getProgress(achievementId, value)
        expect(progress.percentage).toBe(expectedPercentages[index])
      })
    })
  })

  /**
   * Test 5: Trigger achievement unlock at 100% progress
   *
   * Given: An achievement's condition is met (progress reaches 100%)
   * When: checkAchievements is called
   * Then: Achievement should be automatically unlocked
   *
   * EVENT-DRIVEN BEHAVIOR:
   * In real gameplay, stats reach threshold via accumulated events:
   * - Multiple 'lines:cleared' events → linesCleared stat increases
   * - When condition met → automatic unlock check → 'achievement:unlocked' emitted
   */
  describe('5. Trigger achievement unlock at 100% progress', () => {
    it('should unlock achievement when condition is met via checkAchievements', () => {
      // Given: Clean achievement state
      const achievements = useAchievements()
      const levelTarget = 2

      // When: Game state meets achievement condition
      // EVENT-DRIVEN: Simulates accumulated 'score:updated' events reaching level 2
      achievements.checkAchievements({ level: levelTarget })

      // Then: Achievement unlocked and 'achievement:unlocked' event emitted
      expect(achievements.isUnlocked('level_2')).toBe(true)
    })

    it('should unlock achievement with correct operator gte', () => {
      // Given
      const achievements = useAchievements()

      // When - Call 4 times for progressive unlocking (level_2, 3, 4, 5)
      for (let i = 0; i < 4; i++) {
        achievements.checkAchievements({ level: 5 })
      }

      // Then
      // Should unlock level_5 (gte 5)
      expect(achievements.isUnlocked('level_5')).toBe(true)
    })

    it('should unlock achievement when exceeding target value', () => {
      // Given
      const achievements = useAchievements()

      // When - Call multiple times for progressive unlocking (level_2 through level_10 = 9 calls)
      for (let i = 0; i < 9; i++) {
        achievements.checkAchievements({ level: 10 })
      }

      // Then
      // All level achievements up to 10 should be unlocked
      expect(achievements.isUnlocked('level_5')).toBe(true)
      expect(achievements.isUnlocked('level_10')).toBe(true)
    })

    it('should not unlock achievement when condition is not met', () => {
      // Given
      const achievements = useAchievements()

      // When
      achievements.checkAchievements({ level: 1 })

      // Then
      // level_5 requires level >= 5, so with level 1 it should not be unlocked
      expect(achievements.isUnlocked('level_10')).toBe(false)
    })

    it('should add notification when achievement is unlocked', () => {
      // Given
      const achievements = useAchievements()
      const initialNotifications = achievements.pendingNotifications.value.length

      // When
      achievements.checkAchievements({ level: 2 })

      // Then
      expect(achievements.pendingNotifications.value.length).toBeGreaterThan(
        initialNotifications
      )
    })

    it('should unlock multiple achievements when multiple conditions are met', () => {
      // Given
      const achievements = useAchievements()

      // When - Call twice for progressive unlocking (level_2, level_3)
      achievements.checkAchievements({ level: 3 })
      achievements.checkAchievements({ level: 3 })

      // Then
      expect(achievements.isUnlocked('level_3')).toBe(true)
    })
  })

  /**
   * Test 6: Check if achievement is unlocked
   *
   * Given: An achievement with locked/unlocked states
   * When: isUnlocked is called
   * Then: Should return accurate locked/unlocked status
   */
  describe('6. Check if achievement is unlocked', () => {
    it('should return false for locked achievement', () => {
      // Given
      const achievements = useAchievements()

      // When
      const isLocked = achievements.isUnlocked('level_5')

      // Then
      expect(isLocked).toBe(false)
    })

    it('should return true for unlocked achievement', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('level_5')

      // When
      const isUnlocked = achievements.isUnlocked('level_5')

      // Then
      expect(isUnlocked).toBe(true)
    })

    it('should distinguish between locked and unlocked achievements', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('level_2')

      // When & Then
      expect(achievements.isUnlocked('level_2')).toBe(true)
      expect(achievements.isUnlocked('level_5')).toBe(false)
    })

    it('should check status of multiple achievements', () => {
      // Given
      const achievements = useAchievements()
      const idsToUnlock: AchievementId[] = ['level_2', 'level_3', 'level_4']
      idsToUnlock.forEach(id => achievements.unlockAchievement(id))

      // When & Then
      expect(achievements.isUnlocked('level_2')).toBe(true)
      expect(achievements.isUnlocked('level_3')).toBe(true)
      expect(achievements.isUnlocked('level_4')).toBe(true)
      expect(achievements.isUnlocked('level_5')).toBe(false)
    })

    it('should return correct status after persistence', () => {
      // Given
      const achievements1 = useAchievements()
      achievements1.unlockAchievement('welcome')

      // When
      const achievements2 = useAchievements()

      // Then
      expect(achievements2.isUnlocked('welcome')).toBe(true)
    })
  })

  /**
   * Test 7: Get list of all unlocked achievements
   *
   * Given: Several unlocked achievements
   * When: getUnlockedAchievements is accessed
   * Then: Should return list of all unlocked achievements with full details
   */
  describe('7. Get list of all unlocked achievements', () => {
    it('should return empty list when no achievements are unlocked', () => {
      // Given
      const achievements = useAchievements()

      // When
      const unlockedList = achievements.getUnlockedAchievements.value

      // Then
      expect(unlockedList).toEqual([])
    })

    it('should return single achievement in list when one is unlocked', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('welcome')

      // When
      const unlockedList = achievements.getUnlockedAchievements.value

      // Then
      expect(unlockedList.length).toBe(1)
      expect(unlockedList[0].id).toBe('welcome')
    })

    it('should return all unlocked achievements in list', () => {
      // Given
      const achievements = useAchievements()
      const toUnlock: AchievementId[] = ['welcome', 'level_2', 'level_3']
      toUnlock.forEach(id => achievements.unlockAchievement(id))

      // When
      const unlockedList = achievements.getUnlockedAchievements.value

      // Then
      expect(unlockedList.length).toBe(3)
      const ids = unlockedList.map(a => a.id)
      toUnlock.forEach(id => expect(ids).toContain(id))
    })

    it('should include full achievement details in list', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('level_2')

      // When
      const unlockedList = achievements.getUnlockedAchievements.value
      const achievement = unlockedList[0]

      // Then
      expect(achievement.id).toBe('level_2')
      expect(achievement.name).toBeDefined()
      expect(achievement.description).toBeDefined()
      expect(achievement.icon).toBeDefined()
      expect(achievement.unlockedAt).toBeInstanceOf(Date)
    })

    it('should be reactive and update when achievement is unlocked', () => {
      // Given
      const achievements = useAchievements()
      expect(achievements.getUnlockedAchievements.value.length).toBe(0)

      // When
      achievements.unlockAchievement('welcome')

      // Then
      expect(achievements.getUnlockedAchievements.value.length).toBe(1)
    })
  })

  /**
   * Test 8: Get list of locked achievements
   *
   * Given: Various locked and unlocked achievements
   * When: getLockedAchievements is accessed
   * Then: Should return list of all locked (not yet unlocked) achievements
   */
  describe('8. Get list of locked achievements', () => {
    it('should return all achievements when none are unlocked', () => {
      // Given
      const achievements = useAchievements()

      // When
      const lockedList = achievements.getLockedAchievements.value

      // Then
      expect(lockedList.length).toBeGreaterThan(0)
      lockedList.forEach(achievement => {
        expect(achievements.isUnlocked(achievement.id)).toBe(false)
      })
    })

    it('should exclude unlocked achievement from locked list', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('welcome')

      // When
      const lockedList = achievements.getLockedAchievements.value

      // Then
      const lockedIds = lockedList.map(a => a.id)
      expect(lockedIds).not.toContain('welcome')
    })

    it('should return fewer locked achievements after unlocking some', () => {
      // Given
      const achievements = useAchievements()
      const initialLockedCount = achievements.getLockedAchievements.value.length

      // When
      achievements.unlockAchievement('welcome')
      achievements.unlockAchievement('level_2')
      const newLockedCount = achievements.getLockedAchievements.value.length

      // Then
      expect(newLockedCount).toBe(initialLockedCount - 2)
    })

    it('should be reactive and update when achievement is unlocked', () => {
      // Given
      const achievements = useAchievements()
      const initialLockedCount = achievements.getLockedAchievements.value.length

      // When
      achievements.unlockAchievement('level_3')

      // Then
      expect(achievements.getLockedAchievements.value.length).toBe(initialLockedCount - 1)
    })

    it('should return empty list when all achievements are unlocked', () => {
      // Given
      const achievements = useAchievements()
      const allAchievements = achievements.stats.value.totalAchievements

      // When - Unlock all achievements
      for (let i = 1; i <= allAchievements; i++) {
        const lockedList = achievements.getLockedAchievements.value
        if (lockedList.length > 0) {
          achievements.unlockAchievement(lockedList[0].id)
        }
      }

      // Then
      expect(achievements.getLockedAchievements.value.length).toBe(0)
    })
  })

  /**
   * Test 9: Calculate total completion percentage
   *
   * Given: Various unlocked achievements
   * When: Checking stats
   * Then: Completion percentage should be accurate (unlocked / total * 100)
   */
  describe('9. Calculate total completion percentage', () => {
    it('should return 0% when no achievements are unlocked', () => {
      // Given
      const achievements = useAchievements()

      // When
      const stats = achievements.stats.value

      // Then
      expect(stats.percentage).toBe(0)
    })

    it('should calculate completion percentage correctly', () => {
      // Given
      const achievements = useAchievements()
      const total = achievements.stats.value.totalAchievements
      achievements.unlockAchievement('welcome')

      // When
      const stats = achievements.stats.value

      // Then
      const expectedPercentage = Math.round((1 / total) * 100)
      expect(stats.percentage).toBe(expectedPercentage)
    })

    it('should return 100% when all achievements are unlocked', () => {
      // Given
      const achievements = useAchievements()

      // When - Unlock all
      for (let i = 0; i < achievements.stats.value.totalAchievements; i++) {
        const lockedList = achievements.getLockedAchievements.value
        if (lockedList.length > 0) {
          achievements.unlockAchievement(lockedList[0].id)
        }
      }
      const stats = achievements.stats.value

      // Then
      expect(stats.percentage).toBe(100)
    })

    it('should update percentage reactively', () => {
      // Given
      const achievements = useAchievements()
      const initialPercentage = achievements.stats.value.percentage

      // When
      achievements.unlockAchievement('welcome')
      const afterUnlockPercentage = achievements.stats.value.percentage

      // Then
      expect(afterUnlockPercentage).toBeGreaterThan(initialPercentage)
    })

    it('should match unlocked count ratio', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('welcome')
      achievements.unlockAchievement('level_2')
      achievements.unlockAchievement('level_3')

      // When
      const stats = achievements.stats.value

      // Then
      const expectedPercentage = Math.round((3 / stats.totalAchievements) * 100)
      expect(stats.percentage).toBe(expectedPercentage)
    })
  })

  /**
   * Test 10: Unlock multiple achievements in sequence
   *
   * Given: Sequential unlock operations
   * When: Multiple achievements are unlocked one after another
   * Then: All should be properly tracked and persisted
   */
  describe('10. Unlock multiple achievements in sequence', () => {
    it('should track all sequentially unlocked achievements', () => {
      // Given
      const achievements = useAchievements()
      const ids: AchievementId[] = ['welcome', 'level_2', 'level_3', 'level_4']

      // When
      ids.forEach(id => achievements.unlockAchievement(id))

      // Then
      expect(achievements.unlockedAchievements.value.length).toBe(4)
      ids.forEach(id => expect(achievements.isUnlocked(id)).toBe(true))
    })

    it('should preserve order in sequential unlocks', () => {
      // Given
      const achievements = useAchievements()
      const ids: AchievementId[] = ['welcome', 'level_2', 'level_3']

      // When
      ids.forEach(id => achievements.unlockAchievement(id))

      // Then
      const unlockedIds = achievements.unlockedAchievements.value.map(u => u.achievementId)
      ids.forEach((id, index) => {
        expect(unlockedIds[index]).toBe(id)
      })
    })

    it('should create separate notifications for each unlock', () => {
      // Given
      const achievements = useAchievements()
      const ids: AchievementId[] = ['welcome', 'level_2']

      // When
      ids.forEach(id => achievements.unlockAchievement(id))

      // Then
      expect(achievements.pendingNotifications.value.length).toBe(2)
    })

    it('should persist sequential unlocks across sessions', () => {
      // Given
      const achievements1 = useAchievements()
      const ids: AchievementId[] = ['welcome', 'level_2', 'level_3']
      ids.forEach(id => achievements1.unlockAchievement(id))

      // When
      const achievements2 = useAchievements()

      // Then
      ids.forEach(id => expect(achievements2.isUnlocked(id)).toBe(true))
    })

    it('should handle rapid sequential unlocks', () => {
      // Given
      const achievements = useAchievements()
      const ids: AchievementId[] = ['welcome', 'level_2', 'level_3', 'level_4', 'level_5']

      // When
      ids.forEach(id => achievements.unlockAchievement(id))

      // Then
      expect(achievements.unlockedAchievements.value.length).toBe(5)
      ids.forEach(id => expect(achievements.isUnlocked(id)).toBe(true))
    })
  })

  /**
   * Test 11: Handle invalid achievement IDs
   *
   * Given: Invalid or non-existent achievement IDs
   * When: Operations are performed with invalid IDs
   * Then: Should gracefully handle without errors
   */
  describe('11. Handle invalid achievement IDs', () => {
    it('should gracefully handle non-existent achievement ID in unlockAchievement', () => {
      // Given
      const achievements = useAchievements()
      const invalidId = 'non_existent_achievement' as AchievementId

      // When
      let errorThrown = false
      try {
        achievements.unlockAchievement(invalidId)
      } catch (error) {
        errorThrown = true
      }

      // Then
      expect(errorThrown).toBe(false)
      expect(achievements.isUnlocked(invalidId)).toBe(false)
    })

    it('should return false for isUnlocked with invalid ID', () => {
      // Given
      const achievements = useAchievements()

      // When
      const isUnlocked = achievements.isUnlocked('invalid_id' as AchievementId)

      // Then
      expect(isUnlocked).toBe(false)
    })

    it('should return safe defaults for getProgress with invalid ID', () => {
      // Given
      const achievements = useAchievements()

      // When
      const progress = achievements.getProgress('invalid_achievement' as AchievementId, 50)

      // Then
      expect(progress.achievementId).toBe('invalid_achievement')
      expect(progress.currentValue).toBe(0)
      expect(progress.targetValue).toBe(0)
      expect(progress.percentage).toBe(0)
    })

    it('should not add notification for invalid achievement unlock', () => {
      // Given
      const achievements = useAchievements()
      const initialNotifications = achievements.pendingNotifications.value.length

      // When
      achievements.unlockAchievement('invalid_id' as AchievementId)

      // Then
      expect(achievements.pendingNotifications.value.length).toBe(initialNotifications)
    })

    it('should not crash when checking achievements with incomplete stats', () => {
      // Given
      const achievements = useAchievements()

      // When
      let errorThrown = false
      try {
        achievements.checkAchievements({})
      } catch (error) {
        errorThrown = true
      }

      // Then
      expect(errorThrown).toBe(false)
    })
  })

  /**
   * Test 12: Verify achievement unlock notifications/events
   *
   * Given: Achievement unlock operations
   * When: getNextNotification is called
   * Then: Should return notifications in FIFO order
   */
  describe('12. Verify achievement unlock notifications/events', () => {
    it('should add notification when achievement is unlocked', () => {
      // Given
      const achievements = useAchievements()
      const initialCount = achievements.pendingNotifications.value.length

      // When
      achievements.unlockAchievement('welcome')

      // Then
      expect(achievements.pendingNotifications.value.length).toBe(initialCount + 1)
    })

    it('should return null when no notifications are pending', () => {
      // Given
      const achievements = useAchievements()

      // When
      const notification = achievements.getNextNotification()

      // Then
      expect(notification).toBeNull()
    })

    it('should return achievement details in notification', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('level_2')

      // When
      const notification = achievements.getNextNotification()

      // Then
      expect(notification).not.toBeNull()
      expect(notification?.id).toBe('level_2')
      expect(notification?.name).toBeDefined()
      expect(notification?.rarity).toBeDefined()
    })

    it('should return notifications in FIFO order', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('welcome')
      achievements.unlockAchievement('level_2')
      achievements.unlockAchievement('level_3')

      // When
      const notif1 = achievements.getNextNotification()
      const notif2 = achievements.getNextNotification()
      const notif3 = achievements.getNextNotification()

      // Then
      expect(notif1?.id).toBe('welcome')
      expect(notif2?.id).toBe('level_2')
      expect(notif3?.id).toBe('level_3')
    })

    it('should remove notification from queue after retrieval', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('welcome')

      // When
      const initialCount = achievements.pendingNotifications.value.length
      achievements.getNextNotification()
      const afterCount = achievements.pendingNotifications.value.length

      // Then
      expect(afterCount).toBe(initialCount - 1)
    })

    it('should clear all notifications with clearNotifications', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('welcome')
      achievements.unlockAchievement('level_2')

      // When
      achievements.clearNotifications()

      // Then
      expect(achievements.pendingNotifications.value.length).toBe(0)
    })

    it('should provide notification details with achievement metadata', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('level_5')

      // When
      const notification = achievements.getNextNotification()

      // Then
      expect(notification?.name).toBe('Steady Hand')
      expect(notification?.icon).toBe('✋')
      expect(notification?.rarity).toBe('common')
      expect(notification?.rewardMessage).toBeDefined()
    })

    it('should handle rapid unlock notification queue correctly', () => {
      // Given
      const achievements = useAchievements()

      // When
      for (let i = 0; i < 5; i++) {
        const lockedList = achievements.getLockedAchievements.value
        if (lockedList.length > 0) {
          achievements.unlockAchievement(lockedList[i].id)
        }
      }

      // Then
      let notificationCount = 0
      while (achievements.getNextNotification() !== null) {
        notificationCount++
      }
      expect(notificationCount).toBe(5)
      expect(achievements.pendingNotifications.value.length).toBe(0)
    })
  })

  /**
   * Integration Tests: Complex unlock scenarios
   */
  describe('Integration Tests: Complex unlock scenarios', () => {
    it('should handle complete achievement lifecycle', () => {
      // Given
      const achievements = useAchievements()
      const achievementId: AchievementId = 'level_5'

      // When - Progress through lifecycle
      expect(achievements.isUnlocked(achievementId)).toBe(false)

      const progress1 = achievements.getProgress(achievementId, 2)
      expect(progress1.percentage).toBe(40)

      // Check achievements to unlock level_5 - call 4 times for progressive unlocking
      for (let i = 0; i < 4; i++) {
        achievements.checkAchievements({ level: 5 })
      }
      expect(achievements.isUnlocked(achievementId)).toBe(true)

      // Get the notification from checkAchievements (may unlock multiple)
      let notification = achievements.getNextNotification()

      // Count how many notifications were generated (including level_5)
      while (notification && notification.id !== achievementId) {
        notification = achievements.getNextNotification()
      }

      // Then - Verify level_5 was unlocked
      expect(notification?.id).toBe(achievementId)
      expect(achievements.stats.value.unlockedCount).toBeGreaterThan(0)
    })

    it('should maintain consistency across operations', () => {
      // Given
      const achievements = useAchievements()

      // When
      const idsToUnlock: AchievementId[] = ['welcome', 'level_2', 'level_3']
      idsToUnlock.forEach(id => achievements.unlockAchievement(id))

      // Then - Check consistency
      const unlockedCount = achievements.stats.value.unlockedCount
      expect(unlockedCount).toBe(3)

      const unlockedList = achievements.getUnlockedAchievements.value
      expect(unlockedList.length).toBe(3)

      idsToUnlock.forEach(id => expect(achievements.isUnlocked(id)).toBe(true))

      const lockedList = achievements.getLockedAchievements.value
      idsToUnlock.forEach(id => {
        const isInLocked = lockedList.some(a => a.id === id)
        expect(isInLocked).toBe(false)
      })
    })

    it('should persist complete state across sessions', () => {
      // Given
      const achievements1 = useAchievements()
      const idsToUnlock: AchievementId[] = ['welcome', 'level_2']
      idsToUnlock.forEach(id => achievements1.unlockAchievement(id))
      const stats1 = achievements1.stats.value

      // When
      const achievements2 = useAchievements()
      const stats2 = achievements2.stats.value

      // Then
      expect(stats2.unlockedCount).toBe(stats1.unlockedCount)
      expect(stats2.percentage).toBe(stats1.percentage)
      idsToUnlock.forEach(id => expect(achievements2.isUnlocked(id)).toBe(true))
    })

    it('should reset all achievements properly', () => {
      // Given
      const achievements = useAchievements()
      achievements.unlockAchievement('welcome')
      achievements.unlockAchievement('level_2')
      expect(achievements.stats.value.unlockedCount).toBe(2)

      // When
      achievements.resetAchievements()

      // Then
      expect(achievements.stats.value.unlockedCount).toBe(0)
      expect(achievements.stats.value.percentage).toBe(0)
      expect(achievements.pendingNotifications.value.length).toBe(0)
      expect(achievements.isUnlocked('welcome')).toBe(false)
    })
  })
})
