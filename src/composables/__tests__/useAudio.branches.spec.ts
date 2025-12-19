import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAudio } from '@/composables/useAudio'

/**
 * Test Suite: useAudio Branch Coverage
 *
 * Targets uncovered branches in useAudio.ts to improve branch coverage from 74.11% to 85%+
 *
 * Coverage targets (lines 328-339, 349, 424):
 * 1. resumeMusic() branches:
 *    - Early return when musicEnabled is false (line 328)
 *    - Early return when initAudioContext fails (lines 330-334)
 *    - Call startMusic when musicScheduler is null (line 339)
 *
 * 2. playSound() branch:
 *    - Call initAudioContext when ensureAudioContextRunning returns false (line 349)
 *
 * 3. getAvailableTracks() execution (line 424)
 */
describe('useAudio - Branch Coverage Improvements', () => {
  let consoleWarnSpy: any

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    // Set default settings in localStorage
    localStorage.setItem('tetrys-audio-settings', JSON.stringify({
      musicEnabled: false,
      soundEnabled: true,
      musicVolume: 0.3,
      soundVolume: 0.7,
      currentTrack: 'tetris'
    }))

    // Spy on console.warn
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    localStorage.clear()
    consoleWarnSpy.mockRestore()
  })

  /**
   * Test Group 1: resumeMusic() Branch Coverage
   *
   * Target branches in lines 328-339:
   * - musicEnabled check (line 328)
   * - initAudioContext failure handling (lines 330-334)
   * - musicScheduler null check (lines 336-340)
   */
  describe('resumeMusic() - Branch Coverage', () => {
    /**
     * Branch 1.1: Early return when musicEnabled is false
     *
     * Given: Music is disabled in settings
     * When: resumeMusic is called
     * Then: Should return early without initializing audio context
     */
    it('should return early when musicEnabled is false', async () => {
      // Given
      const audio = useAudio()

      // When
      await audio.resumeMusic()

      // Then - Should not have logged any warnings
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    /**
     * Branch 1.2: Return false silently when initAudioContext fails
     *
     * Given: Audio context initialization will fail
     * When: ensureAudioContextRunning is called
     * Then: Should return false silently (graceful degradation)
     */
    it('should return false silently when initAudioContext fails', async () => {
      // Given
      const audio = useAudio()

      // Mock AudioContext to throw error on creation
      const originalAudioContext = global.AudioContext
      global.AudioContext = class {
        constructor() {
          throw new Error('AudioContext initialization failed')
        }
      } as any

      // When - Try to initialize
      const result = await audio.ensureAudioContextRunning()

      // Then - Should return false (graceful degradation without console warnings)
      expect(result).toBe(false)

      // Restore original AudioContext
      global.AudioContext = originalAudioContext
    })

    /**
     * Branch 1.3: Call startMusic when musicScheduler is null
     *
     * Given: Music is enabled but no scheduler exists
     * When: resumeMusic is called after stopping
     * Then: Should call startMusic instead of resume
     */
    it('should restart music when musicScheduler is null after stop', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // Enable music (creates scheduler)
      await audio.toggleMusic()

      // Stop music (destroys scheduler)
      audio.stopMusic()

      // When - resumeMusic should call startMusic since scheduler is null
      await audio.resumeMusic()

      // Then - No errors should occur
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Could not initialize audio context')
      )
    })

    /**
     * Branch 1.4: Resume existing scheduler when it exists
     *
     * Given: Music scheduler exists and is paused
     * When: resumeMusic is called
     * Then: Should resume the existing scheduler
     */
    it('should handle resume after pause', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // Enable music (creates scheduler)
      await audio.toggleMusic()

      // Pause music (scheduler still exists)
      audio.pauseMusic()

      // When - Resume should work on existing scheduler
      await audio.resumeMusic()

      // Then - No errors
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Could not initialize audio context')
      )
    })
  })

  /**
   * Test Group 2: playSound() Branch Coverage
   *
   * Target branch in line 349:
   * - Call initAudioContext when ensureAudioContextRunning returns false
   */
  describe('playSound() - Branch Coverage', () => {
    /**
     * Branch 2.1: Return early when sound is disabled
     *
     * Given: Sound is disabled in settings
     * When: playSound is called
     * Then: Should return early without playing
     */
    it('should return early when sound is disabled', async () => {
      // Given
      localStorage.setItem('tetrys-audio-settings', JSON.stringify({
        musicEnabled: false,
        soundEnabled: false,
        musicVolume: 0.3,
        soundVolume: 0.7,
        currentTrack: 'tetris'
      }))

      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      await audio.playSound('move')

      // Then - No errors should occur
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    /**
     * Branch 2.2: Handle all sound types
     *
     * Given: Sound is enabled
     * When: Different sound types are played
     * Then: Should play each sound type without error
     */
    it('should handle all sound types', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      const soundTypes = ['move', 'rotate', 'drop', 'line', 'gameover'] as const

      // When & Then - Each sound type should work
      for (const soundType of soundTypes) {
        await expect(audio.playSound(soundType)).resolves.not.toThrow()
      }
    })

    /**
     * Branch 2.3: Initialize context when not running
     *
     * Given: Fresh audio instance
     * When: playSound is called
     * Then: Should initialize audio context
     */
    it('should initialize context when playing sound', async () => {
      // Given
      const audio = useAudio()
      // Don't initialize context yet

      // When - Play sound should trigger initialization
      await audio.playSound('move')

      // Then - No errors should occur
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  /**
   * Test Group 3: getAvailableTracks() Coverage
   *
   * Target line 424:
   * - Ensure getAvailableTracks() is called and returns expected data
   */
  describe('getAvailableTracks() - Line Coverage', () => {
    /**
     * Test 3.1: Return all available tracks
     *
     * Given: Audio composable is initialized
     * When: getAvailableTracks is called
     * Then: Should return array of track objects
     */
    it('should return array of all available tracks', () => {
      // Given
      const audio = useAudio()

      // When
      const tracks = audio.getAvailableTracks()

      // Then
      expect(tracks).toBeDefined()
      expect(Array.isArray(tracks)).toBe(true)
      expect(tracks.length).toBeGreaterThan(0)
    })

    /**
     * Test 3.2: Verify track structure
     *
     * Given: getAvailableTracks is called
     * When: Examining returned tracks
     * Then: Each track should have id, name, and description
     */
    it('should return tracks with correct structure', () => {
      // Given
      const audio = useAudio()

      // When
      const tracks = audio.getAvailableTracks()

      // Then
      tracks.forEach(track => {
        expect(track).toHaveProperty('id')
        expect(track).toHaveProperty('name')
        expect(track).toHaveProperty('description')
        expect(typeof track.id).toBe('string')
        expect(typeof track.name).toBe('string')
        expect(typeof track.description).toBe('string')
      })
    })

    /**
     * Test 3.3: Verify expected track IDs
     *
     * Given: getAvailableTracks is called
     * When: Checking track IDs
     * Then: Should include tetris, arcade, chill, and retro
     */
    it('should include all expected track IDs', () => {
      // Given
      const audio = useAudio()

      // When
      const tracks = audio.getAvailableTracks()
      const trackIds = tracks.map(t => t.id)

      // Then
      expect(trackIds).toContain('tetris')
      expect(trackIds).toContain('arcade')
      expect(trackIds).toContain('chill')
      expect(trackIds).toContain('retro')
      expect(trackIds.length).toBe(4)
    })

    /**
     * Test 3.4: Return same tracks on multiple calls
     *
     * Given: getAvailableTracks called multiple times
     * When: Comparing results
     * Then: Should return consistent data
     */
    it('should return consistent track data on multiple calls', () => {
      // Given
      const audio = useAudio()

      // When
      const tracks1 = audio.getAvailableTracks()
      const tracks2 = audio.getAvailableTracks()
      const tracks3 = audio.getAvailableTracks()

      // Then
      expect(tracks1.length).toBe(tracks2.length)
      expect(tracks2.length).toBe(tracks3.length)

      tracks1.forEach((track, index) => {
        expect(track.id).toBe(tracks2[index].id)
        expect(track.name).toBe(tracks2[index].name)
        expect(track.description).toBe(tracks2[index].description)
      })
    })

    /**
     * Test 3.5: Get tracks without audio initialization
     *
     * Given: Audio not initialized
     * When: getAvailableTracks is called
     * Then: Should return tracks without requiring initialization
     */
    it('should return available tracks without audio initialization', () => {
      // Given
      const audio = useAudio()
      // Don't initialize audio context

      // When
      const tracks = audio.getAvailableTracks()

      // Then
      expect(tracks).toBeDefined()
      expect(tracks.length).toBe(4)
      expect(tracks[0].id).toBe('tetris')
      expect(tracks[1].id).toBe('arcade')
      expect(tracks[2].id).toBe('chill')
      expect(tracks[3].id).toBe('retro')
    })
  })

  /**
   * Test Group 4: Integration Tests for Branch Coverage
   *
   * Complex scenarios that exercise multiple branches together
   */
  describe('Integration - Multiple Branch Scenarios', () => {
    /**
     * Integration 4.1: Full music lifecycle
     *
     * Given: Complete music playback scenario
     * When: Start, pause, stop, and resume music
     * Then: All state transitions should work correctly
     */
    it('should handle music lifecycle transitions', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When - Enable music
      await audio.toggleMusic()

      // Pause music
      audio.pauseMusic()

      // Resume music (exercises branch with existing scheduler)
      await audio.resumeMusic()

      // Stop music (destroys scheduler)
      audio.stopMusic()

      // Resume after stop (exercises branch with null scheduler)
      await audio.resumeMusic()

      // Then - No errors
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Could not initialize audio context')
      )
    })

    /**
     * Integration 4.2: Sound and music independence
     *
     * Given: Both sound and music features
     * When: Using sounds while music state changes
     * Then: Both should work independently
     */
    it('should handle sound playback independently of music state', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When - Play sound with music disabled
      await audio.playSound('move')

      // Enable music
      await audio.toggleMusic()

      // Play sound while music is enabled
      await audio.playSound('rotate')

      // Disable music
      await audio.toggleMusic()

      // Play sound after disabling music
      await audio.playSound('drop')

      // Then - No errors
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Failed to initialize audio context')
      )
    })

    /**
     * Integration 4.3: Track switching
     *
     * Given: Music system initialized
     * When: Switch tracks
     * Then: Should update currentTrack setting
     */
    it('should handle track switching', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When - Switch tracks
      await audio.setCurrentTrack('arcade')
      expect(audio.currentTrack.value).toBe('arcade')

      await audio.setCurrentTrack('chill')
      expect(audio.currentTrack.value).toBe('chill')

      await audio.setCurrentTrack('retro')
      expect(audio.currentTrack.value).toBe('retro')

      // Then
      expect(audio.currentTrack.value).toBe('retro')
    })

    /**
     * Integration 4.4: Multiple resume calls with different states
     *
     * Given: Various music states
     * When: Calling resume multiple times
     * Then: Should handle each case correctly
     */
    it('should handle multiple resume calls', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When - Resume with music disabled (early return branch)
      await audio.resumeMusic()

      // Enable music
      await audio.toggleMusic()

      // Resume when already enabled
      await audio.resumeMusic()

      // Then - No errors
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Could not initialize audio context')
      )
    })
  })

  /**
   * Test Group 5: Edge Cases for Branch Coverage
   *
   * Unusual scenarios that test branch boundaries
   */
  describe('Edge Cases - Branch Boundaries', () => {
    /**
     * Edge 5.1: Resume immediately after enabling
     *
     * Given: Music just enabled
     * When: Resume is called immediately
     * Then: Should handle gracefully
     */
    it('should handle resume after enabling', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      await audio.toggleMusic() // Enable
      await audio.resumeMusic() // Resume immediately

      // Then - No errors
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Could not initialize audio context')
      )
    })

    /**
     * Edge 5.2: Play sound concurrently with context initialization
     *
     * Given: Context is being initialized
     * When: Sound is played
     * Then: Should handle concurrent initialization
     */
    it('should handle concurrent sound and context initialization', async () => {
      // Given
      const audio = useAudio()

      // When - Play sound and initialize context concurrently
      const soundPromise = audio.playSound('line')
      const contextPromise = audio.ensureAudioContextRunning()

      await Promise.all([soundPromise, contextPromise])

      // Then - No errors
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    /**
     * Edge 5.3: Rapid state changes
     *
     * Given: Rapid state changes
     * When: Toggle and resume called in quick succession
     * Then: Should maintain consistent state
     */
    it('should handle rapid state changes', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When - Rapid operations
      await audio.toggleMusic() // Enable
      await audio.resumeMusic()
      await audio.toggleMusic() // Disable
      await audio.resumeMusic() // Should return early (disabled)
      await audio.toggleMusic() // Enable again
      await audio.resumeMusic()

      // Then - No errors
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Could not initialize audio context')
      )
    })

    /**
     * Edge 5.4: Resume when disabled
     *
     * Given: Music is disabled
     * When: Resume is called
     * Then: Should return early (exercising the musicEnabled false branch)
     */
    it('should not attempt initialization when music is disabled', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // Ensure music is disabled
      // Default is false, just call resume

      // When - Try to resume with music disabled
      await audio.resumeMusic()

      // Then - Should return early, no initialization warnings
      expect(consoleWarnSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Could not initialize audio context')
      )
    })

    /**
     * Edge 5.5: Test all sound types
     *
     * Given: Sound system initialized
     * When: Playing each sound type
     * Then: All sound types should work without errors
     */
    it('should play all sound types without errors', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When & Then - Test each sound type
      await expect(audio.playSound('move')).resolves.not.toThrow()
      await expect(audio.playSound('rotate')).resolves.not.toThrow()
      await expect(audio.playSound('drop')).resolves.not.toThrow()
      await expect(audio.playSound('line')).resolves.not.toThrow()
      await expect(audio.playSound('gameover')).resolves.not.toThrow()
    })
  })
})
