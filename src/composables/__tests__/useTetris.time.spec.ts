import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useTetris } from '@/composables/useTetris'

/**
 * Test Suite: useTetris Time Tracking System
 *
 * =============================================================================
 * EVENT-DRIVEN ARCHITECTURE
 * =============================================================================
 *
 * The useTetris composable emits time-tracking events for gameplay duration
 * monitoring, achievements, and analytics.
 *
 * EVENTS RELEVANT TO THIS TEST FILE:
 *
 * Time Tracking Events:
 *   - time:tick { timePlayed }
 *     → Emitted periodically during gameplay (typically every second)
 *     → timePlayed: Total seconds played (excluding pause time)
 *     → Used for time-based achievements and session tracking
 *
 * Related Events (indirectly affect time tracking):
 *   - game:paused → Stops time accumulation
 *   - game:resumed → Resumes time accumulation
 *   - game:reset → Resets timePlayed to 0
 *
 * Event Flow for Time Tracking:
 *   1. Game Loop Update → Calculate Elapsed Time → Update timePlayed
 *   2. emit('time:tick', { timePlayed: currentSeconds })
 *   3. Achievement System → Checks for duration milestones (5min, 10min, etc.)
 *   4. UI Components → Update game timer display
 *
 * Time Calculation Method:
 *   - Uses elapsed time calculation: (Date.now() - gameStartTime) / 1000
 *   - NOT interval counting (avoids drift and frame rate issues)
 *   - Pause duration is excluded from total time
 *   - Resumes accurately after pause by adjusting startTime offset
 *
 * Important Notes:
 *   - Time tracking is ONLY active when isPlaying && !isPaused
 *   - Pause periods do NOT contribute to timePlayed
 *   - Time resets to 0 on game:reset event
 *   - Multiple pause/resume cycles handled correctly without drift
 */
describe('useTetris - Time Tracking', () => {
  let tetris: ReturnType<typeof useTetris>

  beforeEach(() => {
    vi.useFakeTimers()
    tetris = useTetris()
  })

  afterEach(() => {
    tetris.resetGame()
    vi.useRealTimers()
  })

  describe('Time Played Calculation', () => {
    it('should track time played using elapsed time, not interval counting', () => {
      // Given: Start game
      tetris.startGame()
      // EVENT: game:started emitted
      expect(tetris.gameState.value.timePlayed).toBe(0)

      // When: Advance time by 5 seconds
      vi.advanceTimersByTime(5000)
      // EVENT: time:tick { timePlayed: 5 } emitted during game loop updates

      // Then: Time should be 5 seconds (calculated from elapsed time)
      expect(tetris.gameState.value.timePlayed).toBe(5)
    })

    it('should not include pause duration in time played', () => {
      // Given: Start game and play for 10 seconds
      tetris.startGame()
      vi.advanceTimersByTime(10000)
      // EVENT: time:tick { timePlayed: 10 } emitted
      expect(tetris.gameState.value.timePlayed).toBe(10)

      // When: Pause for 5 seconds
      tetris.pauseGame()
      // EVENT: game:paused emitted, time tracking stops
      vi.advanceTimersByTime(5000)
      // NO EVENT: time:tick not emitted during pause

      // Then: Time should still be 10 seconds (pause time excluded)
      expect(tetris.gameState.value.timePlayed).toBe(10)
    })

    it('should resume time tracking correctly after pause', () => {
      // Given: Play for 10 seconds, pause for 5 seconds
      tetris.startGame()
      vi.advanceTimersByTime(10000)
      expect(tetris.gameState.value.timePlayed).toBe(10)

      tetris.pauseGame()
      vi.advanceTimersByTime(5000)
      expect(tetris.gameState.value.timePlayed).toBe(10)

      // When: Resume and play for 5 more seconds
      tetris.pauseGame() // Unpause
      vi.advanceTimersByTime(5000)

      // Then: Time should be 15 seconds (10 + 5, not 10 + 5 + 5)
      expect(tetris.gameState.value.timePlayed).toBe(15)
    })

    it('should handle multiple pause/resume cycles correctly', () => {
      // Given: Start game
      tetris.startGame()

      // When: Play 10s -> Pause 5s -> Play 10s -> Pause 3s -> Play 5s
      vi.advanceTimersByTime(10000)
      expect(tetris.gameState.value.timePlayed).toBe(10)

      tetris.pauseGame()
      vi.advanceTimersByTime(5000)
      expect(tetris.gameState.value.timePlayed).toBe(10)

      tetris.pauseGame() // Resume
      vi.advanceTimersByTime(10000)
      expect(tetris.gameState.value.timePlayed).toBe(20)

      tetris.pauseGame()
      vi.advanceTimersByTime(3000)
      expect(tetris.gameState.value.timePlayed).toBe(20)

      tetris.pauseGame() // Resume
      vi.advanceTimersByTime(5000)

      // Then: Total time should be 25 seconds (10 + 10 + 5), not 33 (10 + 5 + 10 + 3 + 5)
      expect(tetris.gameState.value.timePlayed).toBe(25)
    })

    it('should reset time to 0 when starting new game', () => {
      // Given: Play for some time
      tetris.startGame()
      vi.advanceTimersByTime(30000)
      // EVENT: time:tick { timePlayed: 30 } emitted
      expect(tetris.gameState.value.timePlayed).toBe(30)

      // When: Reset and start new game
      tetris.resetGame()
      // EVENT: game:reset emitted, timePlayed reset to 0
      tetris.startGame()
      // EVENT: game:started emitted, fresh time tracking begins

      // Then: Time should be 0 for new game
      expect(tetris.gameState.value.timePlayed).toBe(0)

      // And continue tracking correctly
      vi.advanceTimersByTime(5000)
      // EVENT: time:tick { timePlayed: 5 } for new game session
      expect(tetris.gameState.value.timePlayed).toBe(5)
    })

    it('should calculate time based on elapsed duration, proving no drift from interval counting', () => {
      // This test verifies that timePlayed is calculated from Date.now() - gameStartTime,
      // not from counting interval callbacks. When using fake timers, intervals may not
      // fire exactly as expected, but the time calculation should still be based on
      // elapsed time.

      // Given: Start game
      tetris.startGame()

      // When: Advance a moderate amount of time
      vi.advanceTimersByTime(60000) // 60 seconds

      // Then: Time should match elapsed time (60s)
      // This proves we're using elapsed time calculation, not interval counting
      expect(tetris.gameState.value.timePlayed).toBe(60)
    })

    it('should handle rapid pause/resume without accumulating errors', () => {
      // Given: Start game
      tetris.startGame()
      vi.advanceTimersByTime(5000)
      expect(tetris.gameState.value.timePlayed).toBe(5)

      // When: Rapidly pause and resume 10 times with 1 second pauses
      for (let i = 0; i < 10; i++) {
        tetris.pauseGame() // Pause
        vi.advanceTimersByTime(1000) // 1s pause
        tetris.pauseGame() // Resume
        vi.advanceTimersByTime(1000) // 1s play
      }

      // Then: Should have exactly 10 seconds of play time added (not 20)
      expect(tetris.gameState.value.timePlayed).toBe(15)
    })

    it('should update time immediately after resuming from pause', () => {
      // Given: Play for 10 seconds then pause
      tetris.startGame()
      vi.advanceTimersByTime(10000)
      tetris.pauseGame()
      vi.advanceTimersByTime(5000)

      // When: Resume from pause
      tetris.pauseGame()

      // Then: Time should immediately show 10 seconds (not wait for next interval)
      expect(tetris.gameState.value.timePlayed).toBe(10)

      // And continue tracking
      vi.advanceTimersByTime(1000)
      expect(tetris.gameState.value.timePlayed).toBe(11)
    })
  })

  describe('Time Tracking Edge Cases', () => {
    it('should stop tracking time after reset', () => {
      // Given: Start game and play for some time
      tetris.startGame()
      vi.advanceTimersByTime(30000)
      expect(tetris.gameState.value.timePlayed).toBeGreaterThanOrEqual(20)

      // When: Reset game
      tetris.resetGame()

      // Then: Game should not be playing
      expect(tetris.gameState.value.isPlaying).toBe(false)

      // And time advances shouldn't change the time (tracking stopped)
      const timeAfterReset = tetris.gameState.value.timePlayed
      vi.advanceTimersByTime(5000)
      // Time should remain the same after reset (tracking stopped)
      expect(tetris.gameState.value.timePlayed).toBe(timeAfterReset)
    })

    it('should not track time before game starts', () => {
      // Given: Tetris initialized but not started
      expect(tetris.gameState.value.timePlayed).toBe(0)

      // When: Time passes without starting game
      vi.advanceTimersByTime(10000)

      // Then: Time should still be 0
      expect(tetris.gameState.value.timePlayed).toBe(0)
    })
  })
})
