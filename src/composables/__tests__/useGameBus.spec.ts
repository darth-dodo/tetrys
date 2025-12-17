import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useGameBus, gameBus } from '@/composables/useGameBus'
import { useAchievements } from '@/composables/useAchievements'
import type { GameBusEvents } from '@/types/events'

/**
 * Test Suite: useGameBus Event-Driven Game System
 *
 * Comprehensive BDD-style tests for the event-driven game system including:
 * - Event bus singleton pattern and basic operations
 * - Game lifecycle events (started, paused, over, reset)
 * - Game state events (lines cleared, level up, combo updates, score updates)
 * - Achievement integration via event-driven architecture
 * - Multiple subscribers and event propagation
 * - Cleanup and memory management
 */
describe('useGameBus - Event-Driven Game System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear all event listeners before each test
    gameBus.all.clear()
    // Reset localStorage for achievement tests
    localStorage.clear()
  })

  afterEach(() => {
    // Clean up all listeners after each test
    gameBus.all.clear()
    localStorage.clear()
  })

  /**
   * Test Suite 1: Event Bus Basics
   *
   * Tests core event bus functionality including:
   * - Singleton pattern ensures same instance across multiple calls
   * - Basic emit and receive operations
   * - Multiple subscribers to same event
   * - Unsubscribe functionality
   * - Event payload integrity
   */
  describe('1. Event Bus Basics', () => {
    describe('Singleton Pattern', () => {
      it('should return the same bus instance across multiple calls', () => {
        // Given: Multiple calls to useGameBus
        const bus1 = useGameBus()
        const bus2 = useGameBus()
        const bus3 = useGameBus()

        // Then: All references should point to the same instance
        expect(bus1).toBe(bus2)
        expect(bus2).toBe(bus3)
        expect(bus1).toBe(gameBus)
      })

      it('should maintain state across different composable instances', () => {
        // Given: Two bus instances
        const bus1 = useGameBus()
        const bus2 = useGameBus()

        // When: Register listener on bus1
        const mockHandler = vi.fn()
        bus1.on('game:started', mockHandler)

        // Then: Emit from bus2 should trigger listener registered on bus1
        bus2.emit('game:started', { timestamp: Date.now() })
        expect(mockHandler).toHaveBeenCalledTimes(1)
      })
    })

    describe('Basic Emit and Receive', () => {
      it('should emit and receive events with correct payload', () => {
        // Given: Event bus and listener
        const bus = useGameBus()
        const mockHandler = vi.fn()
        const payload = { timestamp: 123456789 }

        // When: Register listener and emit event
        bus.on('game:started', mockHandler)
        bus.emit('game:started', payload)

        // Then: Handler should be called with exact payload
        expect(mockHandler).toHaveBeenCalledTimes(1)
        expect(mockHandler).toHaveBeenCalledWith(payload)
      })

      it('should handle multiple different event types independently', () => {
        // Given: Bus with multiple listeners for different events
        const bus = useGameBus()
        const startHandler = vi.fn()
        const scoreHandler = vi.fn()
        const levelHandler = vi.fn()

        bus.on('game:started', startHandler)
        bus.on('score:updated', scoreHandler)
        bus.on('level:up', levelHandler)

        // When: Emit different events
        bus.emit('game:started', { timestamp: 100 })
        bus.emit('score:updated', { score: 500, delta: 100, level: 1 })
        bus.emit('level:up', { level: 2, previousLevel: 1 })

        // Then: Each handler called once with correct payload
        expect(startHandler).toHaveBeenCalledTimes(1)
        expect(startHandler).toHaveBeenCalledWith({ timestamp: 100 })
        expect(scoreHandler).toHaveBeenCalledTimes(1)
        expect(scoreHandler).toHaveBeenCalledWith({ score: 500, delta: 100, level: 1 })
        expect(levelHandler).toHaveBeenCalledTimes(1)
        expect(levelHandler).toHaveBeenCalledWith({ level: 2, previousLevel: 1 })
      })

      it('should not trigger handler if wrong event is emitted', () => {
        // Given: Listener for game:started
        const bus = useGameBus()
        const startHandler = vi.fn()

        bus.on('game:started', startHandler)

        // When: Emit different event
        bus.emit('game:over', {
          score: 1000,
          level: 5,
          lines: 25,
          tetrisCount: 3,
          timePlayed: 120000
        })

        // Then: Handler should not be called
        expect(startHandler).not.toHaveBeenCalled()
      })
    })

    describe('Multiple Subscribers', () => {
      it('should notify all subscribers when event is emitted', () => {
        // Given: Multiple subscribers to same event
        const bus = useGameBus()
        const handler1 = vi.fn()
        const handler2 = vi.fn()
        const handler3 = vi.fn()

        bus.on('game:started', handler1)
        bus.on('game:started', handler2)
        bus.on('game:started', handler3)

        // When: Emit event once
        const payload = { timestamp: 999 }
        bus.emit('game:started', payload)

        // Then: All handlers should be called with same payload
        expect(handler1).toHaveBeenCalledTimes(1)
        expect(handler2).toHaveBeenCalledTimes(1)
        expect(handler3).toHaveBeenCalledTimes(1)
        expect(handler1).toHaveBeenCalledWith(payload)
        expect(handler2).toHaveBeenCalledWith(payload)
        expect(handler3).toHaveBeenCalledWith(payload)
      })

      it('should maintain independent subscriber lists for different events', () => {
        // Given: Different subscribers for different events
        const bus = useGameBus()
        const startHandler1 = vi.fn()
        const startHandler2 = vi.fn()
        const scoreHandler1 = vi.fn()
        const scoreHandler2 = vi.fn()

        bus.on('game:started', startHandler1)
        bus.on('game:started', startHandler2)
        bus.on('score:updated', scoreHandler1)
        bus.on('score:updated', scoreHandler2)

        // When: Emit game:started
        bus.emit('game:started', { timestamp: 1000 })

        // Then: Only game:started handlers should be called
        expect(startHandler1).toHaveBeenCalledTimes(1)
        expect(startHandler2).toHaveBeenCalledTimes(1)
        expect(scoreHandler1).not.toHaveBeenCalled()
        expect(scoreHandler2).not.toHaveBeenCalled()
      })
    })

    describe('Unsubscribe Functionality', () => {
      it('should stop receiving events after unsubscribing', () => {
        // Given: Subscribed listener
        const bus = useGameBus()
        const handler = vi.fn()

        bus.on('game:started', handler)

        // When: Emit, then unsubscribe, then emit again
        bus.emit('game:started', { timestamp: 1 })
        bus.off('game:started', handler)
        bus.emit('game:started', { timestamp: 2 })

        // Then: Handler called only once (before unsubscribe)
        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith({ timestamp: 1 })
      })

      it('should only unsubscribe specific handler, not affect others', () => {
        // Given: Multiple subscribers
        const bus = useGameBus()
        const handler1 = vi.fn()
        const handler2 = vi.fn()
        const handler3 = vi.fn()

        bus.on('game:started', handler1)
        bus.on('game:started', handler2)
        bus.on('game:started', handler3)

        // When: Unsubscribe only handler2
        bus.off('game:started', handler2)
        bus.emit('game:started', { timestamp: 100 })

        // Then: handler1 and handler3 still called, handler2 not called
        expect(handler1).toHaveBeenCalledTimes(1)
        expect(handler2).not.toHaveBeenCalled()
        expect(handler3).toHaveBeenCalledTimes(1)
      })

      it('should handle unsubscribe of non-existent handler gracefully', () => {
        // Given: Bus with one handler
        const bus = useGameBus()
        const handler1 = vi.fn()
        const handler2 = vi.fn()

        bus.on('game:started', handler1)

        // When: Try to unsubscribe handler that was never subscribed
        expect(() => {
          bus.off('game:started', handler2)
        }).not.toThrow()

        // Then: Original handler still works
        bus.emit('game:started', { timestamp: 100 })
        expect(handler1).toHaveBeenCalledTimes(1)
      })
    })
  })

  /**
   * Test Suite 2: Game Event Emissions
   *
   * Tests all game-related events emitted during gameplay:
   * - Game lifecycle: started, paused, over, reset
   * - Game state changes: lines cleared, level up, combo updates, score updates
   * - Time tracking events
   * - Event payload structure and data integrity
   */
  describe('2. Game Event Emissions', () => {
    describe('Game Lifecycle Events', () => {
      it('should emit game:started with timestamp', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('game:started', handler)

        // When: Game starts
        const startTime = Date.now()
        bus.emit('game:started', { timestamp: startTime })

        // Then: Event emitted with correct structure
        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith({
          timestamp: expect.any(Number)
        })
        expect(handler.mock.calls[0][0].timestamp).toBe(startTime)
      })

      it('should emit game:paused with pause state and time played', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('game:paused', handler)

        // When: Game is paused
        bus.emit('game:paused', { isPaused: true, timePlayed: 5000 })

        // Then: Event contains pause state and time
        expect(handler).toHaveBeenCalledWith({
          isPaused: true,
          timePlayed: 5000
        })

        // When: Game is unpaused
        bus.emit('game:paused', { isPaused: false, timePlayed: 5000 })

        // Then: Event reflects unpause state
        expect(handler).toHaveBeenCalledTimes(2)
        expect(handler.mock.calls[1][0]).toEqual({
          isPaused: false,
          timePlayed: 5000
        })
      })

      it('should emit game:over with complete game statistics', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('game:over', handler)

        // When: Game ends
        const gameStats = {
          score: 12500,
          level: 8,
          lines: 42,
          tetrisCount: 5,
          timePlayed: 300000
        }
        bus.emit('game:over', gameStats)

        // Then: Event contains all game statistics
        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler).toHaveBeenCalledWith(gameStats)
        expect(handler.mock.calls[0][0]).toMatchObject({
          score: expect.any(Number),
          level: expect.any(Number),
          lines: expect.any(Number),
          tetrisCount: expect.any(Number),
          timePlayed: expect.any(Number)
        })
      })

      it('should emit game:reset with timestamp', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('game:reset', handler)

        // When: Game is reset
        const resetTime = Date.now()
        bus.emit('game:reset', { timestamp: resetTime })

        // Then: Event contains timestamp
        expect(handler).toHaveBeenCalledWith({
          timestamp: resetTime
        })
      })
    })

    describe('Line Clearing Events', () => {
      it('should emit lines:cleared with single line clear details', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('lines:cleared', handler)

        // When: Single line is cleared
        bus.emit('lines:cleared', {
          count: 1,
          isTetris: false,
          newTotal: 1,
          newLevel: 1
        })

        // Then: Event contains line clear details
        expect(handler).toHaveBeenCalledWith({
          count: 1,
          isTetris: false,
          newTotal: 1,
          newLevel: 1
        })
      })

      it('should emit lines:cleared with Tetris flag for 4 lines', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('lines:cleared', handler)

        // When: 4 lines cleared (Tetris)
        bus.emit('lines:cleared', {
          count: 4,
          isTetris: true,
          newTotal: 24,
          newLevel: 3
        })

        // Then: Event marked as Tetris
        expect(handler).toHaveBeenCalledWith({
          count: 4,
          isTetris: true,
          newTotal: 24,
          newLevel: 3
        })
        expect(handler.mock.calls[0][0].isTetris).toBe(true)
      })

      it('should emit lines:cleared with updated totals', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('lines:cleared', handler)

        // When: Multiple line clear events
        bus.emit('lines:cleared', { count: 2, isTetris: false, newTotal: 2, newLevel: 1 })
        bus.emit('lines:cleared', { count: 3, isTetris: false, newTotal: 5, newLevel: 1 })
        bus.emit('lines:cleared', { count: 4, isTetris: true, newTotal: 9, newLevel: 1 })

        // Then: newTotal increases across events
        expect(handler).toHaveBeenCalledTimes(3)
        expect(handler.mock.calls[0][0].newTotal).toBe(2)
        expect(handler.mock.calls[1][0].newTotal).toBe(5)
        expect(handler.mock.calls[2][0].newTotal).toBe(9)
      })
    })

    describe('Level Up Events', () => {
      it('should emit level:up with new and previous level', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('level:up', handler)

        // When: Player advances to level 2
        bus.emit('level:up', { level: 2, previousLevel: 1 })

        // Then: Event contains level progression
        expect(handler).toHaveBeenCalledWith({
          level: 2,
          previousLevel: 1
        })
      })

      it('should emit level:up events for progressive level increases', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('level:up', handler)

        // When: Multiple level ups
        bus.emit('level:up', { level: 2, previousLevel: 1 })
        bus.emit('level:up', { level: 3, previousLevel: 2 })
        bus.emit('level:up', { level: 4, previousLevel: 3 })

        // Then: All level transitions captured
        expect(handler).toHaveBeenCalledTimes(3)
        expect(handler.mock.calls[0][0]).toEqual({ level: 2, previousLevel: 1 })
        expect(handler.mock.calls[1][0]).toEqual({ level: 3, previousLevel: 2 })
        expect(handler.mock.calls[2][0]).toEqual({ level: 4, previousLevel: 3 })
      })
    })

    describe('Combo Update Events', () => {
      it('should emit combo:updated when combo increases', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('combo:updated', handler)

        // When: Combo increases to 2
        bus.emit('combo:updated', { combo: 2, isReset: false })

        // Then: Event shows combo increase
        expect(handler).toHaveBeenCalledWith({
          combo: 2,
          isReset: false
        })
      })

      it('should emit combo:updated with isReset flag when combo breaks', () => {
        // Given: Bus and listener tracking combo
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('combo:updated', handler)

        // When: Combo builds up then resets
        bus.emit('combo:updated', { combo: 3, isReset: false })
        bus.emit('combo:updated', { combo: 4, isReset: false })
        bus.emit('combo:updated', { combo: 0, isReset: true })

        // Then: Reset event flagged correctly
        expect(handler).toHaveBeenCalledTimes(3)
        expect(handler.mock.calls[2][0]).toEqual({
          combo: 0,
          isReset: true
        })
        expect(handler.mock.calls[2][0].isReset).toBe(true)
      })

      it('should track combo progression through multiple events', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('combo:updated', handler)

        // When: Combo chain builds
        const comboChain = [1, 2, 3, 4, 5]
        comboChain.forEach(combo => {
          bus.emit('combo:updated', { combo, isReset: false })
        })

        // Then: All combo values tracked
        expect(handler).toHaveBeenCalledTimes(5)
        comboChain.forEach((combo, index) => {
          expect(handler.mock.calls[index][0].combo).toBe(combo)
          expect(handler.mock.calls[index][0].isReset).toBe(false)
        })
      })
    })

    describe('Score Update Events', () => {
      it('should emit score:updated with score, delta, and level', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('score:updated', handler)

        // When: Score increases
        bus.emit('score:updated', {
          score: 100,
          delta: 100,
          level: 1
        })

        // Then: Event contains score details
        expect(handler).toHaveBeenCalledWith({
          score: 100,
          delta: 100,
          level: 1
        })
      })

      it('should emit score:updated with increasing deltas for better plays', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('score:updated', handler)

        // When: Various score increases (single, double, triple, tetris)
        bus.emit('score:updated', { score: 100, delta: 100, level: 1 })
        bus.emit('score:updated', { score: 400, delta: 300, level: 1 })
        bus.emit('score:updated', { score: 900, delta: 500, level: 1 })
        bus.emit('score:updated', { score: 1700, delta: 800, level: 1 })

        // Then: Deltas increase for better plays
        expect(handler).toHaveBeenCalledTimes(4)
        expect(handler.mock.calls[0][0].delta).toBe(100)
        expect(handler.mock.calls[1][0].delta).toBe(300)
        expect(handler.mock.calls[2][0].delta).toBe(500)
        expect(handler.mock.calls[3][0].delta).toBe(800)
      })

      it('should emit score:updated with cumulative score', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('score:updated', handler)

        // When: Multiple score events
        let cumulativeScore = 0
        const deltas = [100, 200, 150, 300]

        deltas.forEach(delta => {
          cumulativeScore += delta
          bus.emit('score:updated', {
            score: cumulativeScore,
            delta,
            level: 1
          })
        })

        // Then: Score accumulates correctly
        expect(handler).toHaveBeenCalledTimes(4)
        expect(handler.mock.calls[0][0].score).toBe(100)
        expect(handler.mock.calls[1][0].score).toBe(300)
        expect(handler.mock.calls[2][0].score).toBe(450)
        expect(handler.mock.calls[3][0].score).toBe(750)
      })
    })

    describe('Time Tick Events', () => {
      it('should emit time:tick with elapsed time', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('time:tick', handler)

        // When: Time updates
        bus.emit('time:tick', { timePlayed: 1000 })

        // Then: Event contains time played
        expect(handler).toHaveBeenCalledWith({
          timePlayed: 1000
        })
      })

      it('should emit time:tick with increasing time values', () => {
        // Given: Bus and listener
        const bus = useGameBus()
        const handler = vi.fn()
        bus.on('time:tick', handler)

        // When: Multiple time updates (every second)
        for (let i = 1; i <= 5; i++) {
          bus.emit('time:tick', { timePlayed: i * 1000 })
        }

        // Then: Time increases progressively
        expect(handler).toHaveBeenCalledTimes(5)
        for (let i = 0; i < 5; i++) {
          expect(handler.mock.calls[i][0].timePlayed).toBe((i + 1) * 1000)
        }
      })
    })
  })

  /**
   * Test Suite 3: Achievement Integration
   *
   * Tests integration between game events and achievement system:
   * - Achievement system listens to game bus events
   * - Event-driven achievement unlocking
   * - Achievement notification queue management
   * - Proper integration between bus and achievement composables
   */
  describe('3. Achievement Integration', () => {
    describe('Event-Driven Achievement System', () => {
      it('should initialize achievement system without errors', () => {
        // Given/When: Create achievement system
        const achievements = useAchievements()

        // Then: System initializes successfully
        expect(achievements).toBeDefined()
        expect(achievements.stats).toBeDefined()
        expect(achievements.pendingNotifications).toBeDefined()
      })

      it('should track achievement statistics', () => {
        // Given: Achievement system
        const achievements = useAchievements()

        // Then: Stats are available
        const stats = achievements.stats.value
        expect(stats.totalAchievements).toBeGreaterThan(0)
        expect(stats.unlockedCount).toBeGreaterThanOrEqual(0)
        expect(stats.percentage).toBeGreaterThanOrEqual(0)
        expect(stats.percentage).toBeLessThanOrEqual(100)
      })

      it('should provide achievement notification queue', () => {
        // Given: Achievement system
        const achievements = useAchievements()

        // Then: Notification queue is accessible
        expect(achievements.pendingNotifications.value).toBeDefined()
        expect(Array.isArray(achievements.pendingNotifications.value)).toBe(true)
      })

      it('should allow clearing notification queue', () => {
        // Given: Achievement system
        const achievements = useAchievements()

        // When: Clear notifications
        achievements.clearNotifications()

        // Then: Queue is empty
        expect(achievements.pendingNotifications.value.length).toBe(0)
      })

      it('should return null when no notifications pending', () => {
        // Given: Achievement system with no notifications
        const achievements = useAchievements()
        achievements.clearNotifications()

        // When: Try to get notification
        const notification = achievements.getNextNotification()

        // Then: Null returned
        expect(notification).toBeNull()
      })
    })

    describe('Game Bus and Achievement Integration', () => {
      it('should allow setting up listeners for game events', () => {
        // Given: Game bus and achievement system
        const bus = useGameBus()
        const achievements = useAchievements()

        // When: Setup listener for score updates
        const handler = vi.fn()
        bus.on('score:updated', handler)

        // And: Emit score event
        bus.emit('score:updated', { score: 100, delta: 100, level: 1 })

        // Then: Handler called (proving bus works with achievement integration)
        expect(handler).toHaveBeenCalledTimes(1)
      })

      it('should allow setting up listeners for line clear events', () => {
        // Given: Game bus and achievement system
        const bus = useGameBus()
        const achievements = useAchievements()

        // When: Setup listener for lines cleared
        const handler = vi.fn()
        bus.on('lines:cleared', handler)

        // And: Emit lines cleared event
        bus.emit('lines:cleared', {
          count: 4,
          isTetris: true,
          newTotal: 4,
          newLevel: 1
        })

        // Then: Handler called
        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler.mock.calls[0][0].isTetris).toBe(true)
      })

      it('should allow setting up listeners for combo events', () => {
        // Given: Game bus and achievement system
        const bus = useGameBus()
        const achievements = useAchievements()

        // When: Setup listener for combo updates
        const handler = vi.fn()
        bus.on('combo:updated', handler)

        // And: Emit combo events
        bus.emit('combo:updated', { combo: 2, isReset: false })
        bus.emit('combo:updated', { combo: 3, isReset: false })

        // Then: Handlers called for all events
        expect(handler).toHaveBeenCalledTimes(2)
      })

      it('should handle game:started event with achievement system active', () => {
        // Given: Game bus and achievement system
        const bus = useGameBus()
        const achievements = useAchievements()

        // When: Game starts
        const handler = vi.fn()
        bus.on('game:started', handler)
        bus.emit('game:started', { timestamp: Date.now() })

        // Then: Event properly emitted
        expect(handler).toHaveBeenCalledTimes(1)
      })

      it('should handle game:over event with full game statistics', () => {
        // Given: Game bus and achievement system
        const bus = useGameBus()
        const achievements = useAchievements()

        // When: Setup listener for game over
        const handler = vi.fn()
        bus.on('game:over', handler)

        // And: Game ends with statistics
        const gameStats = {
          score: 500,
          level: 3,
          lines: 15,
          tetrisCount: 2,
          timePlayed: 120000
        }
        bus.emit('game:over', gameStats)

        // Then: Event emitted with all stats
        expect(handler).toHaveBeenCalledTimes(1)
        expect(handler.mock.calls[0][0]).toEqual(gameStats)
      })
    })

    describe('Achievement Notification Flow', () => {
      it('should support dev achievement triggering for testing', () => {
        // Given: Achievement system
        const achievements = useAchievements()
        achievements.clearNotifications()

        // When: Trigger dev achievement
        achievements.triggerDevAchievement('legendary')

        // Then: Notification added to queue
        expect(achievements.pendingNotifications.value.length).toBeGreaterThan(0)
      })

      it('should retrieve notifications from queue in order', () => {
        // Given: Achievement system with multiple notifications
        const achievements = useAchievements()
        achievements.clearNotifications()

        // When: Trigger multiple dev achievements
        achievements.triggerDevAchievement('common')
        achievements.triggerDevAchievement('rare')
        achievements.triggerDevAchievement('epic')

        // Then: Can retrieve them in order
        const first = achievements.getNextNotification()
        const second = achievements.getNextNotification()
        const third = achievements.getNextNotification()

        expect(first).not.toBeNull()
        expect(second).not.toBeNull()
        expect(third).not.toBeNull()
        expect(first?.rarity).toBe('common')
        expect(second?.rarity).toBe('rare')
        expect(third?.rarity).toBe('epic')
      })

      it('should handle clearing notification queue', () => {
        // Given: Achievement system with notifications
        const achievements = useAchievements()
        achievements.triggerDevAchievement('common')
        achievements.triggerDevAchievement('rare')

        expect(achievements.pendingNotifications.value.length).toBe(2)

        // When: Clear notifications
        achievements.clearNotifications()

        // Then: Queue is empty
        expect(achievements.pendingNotifications.value.length).toBe(0)
      })
    })

    describe('Event Bus Cleanup and Memory Management', () => {
      it('should properly clean up event listeners', () => {
        // Given: Bus with multiple listeners
        const bus = useGameBus()
        const handler1 = vi.fn()
        const handler2 = vi.fn()
        const handler3 = vi.fn()

        bus.on('game:started', handler1)
        bus.on('score:updated', handler2)
        bus.on('lines:cleared', handler3)

        // When: Remove all listeners
        bus.off('game:started', handler1)
        bus.off('score:updated', handler2)
        bus.off('lines:cleared', handler3)

        // And: Emit events
        bus.emit('game:started', { timestamp: 100 })
        bus.emit('score:updated', { score: 100, delta: 100, level: 1 })
        bus.emit('lines:cleared', { count: 1, isTetris: false, newTotal: 1, newLevel: 1 })

        // Then: No handlers called
        expect(handler1).not.toHaveBeenCalled()
        expect(handler2).not.toHaveBeenCalled()
        expect(handler3).not.toHaveBeenCalled()
      })

      it('should clear all event listeners from bus', () => {
        // Given: Bus with listeners
        const bus = useGameBus()
        const handler = vi.fn()

        bus.on('game:started', handler)
        bus.on('score:updated', handler)
        bus.on('lines:cleared', handler)

        // When: Clear all listeners
        bus.all.clear()

        // And: Emit events
        bus.emit('game:started', { timestamp: 100 })
        bus.emit('score:updated', { score: 100, delta: 100, level: 1 })
        bus.emit('lines:cleared', { count: 1, isTetris: false, newTotal: 1, newLevel: 1 })

        // Then: No handlers called
        expect(handler).not.toHaveBeenCalled()
      })

      it('should handle achievement system reset', () => {
        // Given: Achievement system with unlocked achievements
        const achievements = useAchievements()
        achievements.triggerDevAchievement('common')

        expect(achievements.pendingNotifications.value.length).toBeGreaterThan(0)

        // When: Reset achievements
        achievements.resetAchievements()

        // Then: System resets to default state
        expect(achievements.unlockedAchievements.value.length).toBe(0)
        expect(achievements.stats.value.unlockedCount).toBe(0)
      })
    })
  })
})
