import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { useAchievements } from '../useAchievements'
import { clearLocalStorage } from '@/__tests__/helpers'

/**
 * Test suite for useAchievements saveError functionality
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
 * ERROR HANDLING MODEL:
 * - Save errors tracked via saveError ref (reactive)
 * - Errors occur during localStorage.setItem() calls
 * - Cleared on successful save operation
 * - Event-driven unlocks can trigger save errors
 *
 * TESTING NOTES FOR THIS FILE:
 * - These tests verify localStorage error handling and user notification
 * - Uses direct unlock calls to test save error scenarios
 * - Event-driven save errors tested in integration tests
 * - Relevant events: None directly (error handling testing only)
 *
 * Tests that users are notified when localStorage saves fail
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

describe('useAchievements Save Error Notification', () => {
  beforeEach(() => {
    clearLocalStorage()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    clearLocalStorage()
  })

  it('should expose saveError ref', async () => {
    // Given: Component with achievements composable
    clearLocalStorage()
    const component = createAchievementsTestComponent()
    const wrapper = mount(component)
    await flushPromises()

    // Then: saveError should be available
    expect(wrapper.vm.achievements).toHaveProperty('saveError')
    expect(wrapper.vm.achievements.saveError.value).toBeNull()

    wrapper.unmount()
  })

  it('should set saveError when localStorage.setItem fails', async () => {
    // Given: Mock localStorage to throw error
    const originalSetItem = localStorage.setItem
    localStorage.setItem = vi.fn(() => {
      const error = new Error('QuotaExceededError')
      error.name = 'QuotaExceededError'
      throw error
    })

    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // When: Attempting to unlock achievement
    const component = createAchievementsTestComponent()
    const wrapper = mount(component)
    await flushPromises()

    wrapper.vm.achievements.unlockAchievement('first_blood', {
      score: 100,
      level: 1,
      lines: 1
    })
    await flushPromises()

    // Then: saveError should be set
    expect(wrapper.vm.achievements.saveError.value).not.toBeNull()
    expect(wrapper.vm.achievements.saveError.value).toContain('Failed to save')

    consoleSpy.mockRestore()
    localStorage.setItem = originalSetItem
    wrapper.unmount()
  })

  it('should clear saveError on successful save', async () => {
    // Given: Mock localStorage to fail first, then succeed
    const originalSetItem = localStorage.setItem
    let shouldFail = true

    localStorage.setItem = vi.fn((key: string, value: string) => {
      if (shouldFail && key === 'tetris_achievements') {
        throw new Error('Storage full')
      }
      originalSetItem(key, value)
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // When: First save fails
    const component = createAchievementsTestComponent()
    const wrapper = mount(component)
    await flushPromises()

    wrapper.vm.achievements.unlockAchievement('first_blood', {
      score: 100,
      level: 1,
      lines: 1
    })
    await flushPromises()

    expect(wrapper.vm.achievements.saveError.value).not.toBeNull()

    // When: Second save succeeds
    shouldFail = false
    wrapper.vm.achievements.unlockAchievement('tetris_novice', {
      score: 500,
      level: 2,
      lines: 4
    })
    await flushPromises()

    // Then: saveError should be cleared
    expect(wrapper.vm.achievements.saveError.value).toBeNull()

    consoleSpy.mockRestore()
    localStorage.setItem = originalSetItem
    wrapper.unmount()
  })

  it('should provide meaningful error message', async () => {
    // Given: Mock localStorage to throw specific error
    const originalSetItem = localStorage.setItem
    const testError = new Error('Custom test error message')
    localStorage.setItem = vi.fn(() => {
      throw testError
    })

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    // When: Attempting to save
    const component = createAchievementsTestComponent()
    const wrapper = mount(component)
    await flushPromises()

    wrapper.vm.achievements.unlockAchievement('first_blood', {
      score: 100,
      level: 1,
      lines: 1
    })
    await flushPromises()

    // Then: Error message should include the error
    expect(wrapper.vm.achievements.saveError.value).toContain('Custom test error message')

    consoleSpy.mockRestore()
    localStorage.setItem = originalSetItem
    wrapper.unmount()
  })
})
