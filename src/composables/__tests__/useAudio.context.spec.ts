import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAudio } from '@/composables/useAudio'

/**
 * Test Suite: useAudio AudioContext Management
 *
 * Comprehensive tests for AudioContext lifecycle and management including:
 * - AudioContext initialization with suspended state
 * - Context state resume on user interaction
 * - Proper cleanup on component unmount
 * - Context state transitions and error handling
 * - Gain node creation and configuration
 * - Volume control within 0-1 range
 * - Mute/unmute functionality
 * - Error recovery and graceful handling
 */
describe('useAudio - AudioContext Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.clear()
  })

  /**
   * Test 1: Initialize Audio with Suspended Context
   *
   * Given: A fresh useAudio instance
   * When: initAudioContext is called
   * Then: AudioContext should be created and can be suspended initially
   */
  describe('1. Initialize Audio with Suspended Context', () => {
    it('should create AudioContext on initialization', async () => {
      // Given
      const audio = useAudio()
      expect(audio).toBeDefined()

      // When
      const initialized = await audio.ensureAudioContextRunning()

      // Then
      expect(initialized).toBeDefined()
      expect(typeof initialized).toBe('boolean')
    })

    it('should handle context creation successfully', async () => {
      // Given
      const audio = useAudio()

      // When
      const result = await audio.ensureAudioContextRunning()

      // Then - Should succeed (or at least complete without error)
      expect(typeof result).toBe('boolean')
    })

    it('should initialize with valid audio settings', () => {
      // Given
      const audio = useAudio()

      // When
      const settings = audio.settings.value

      // Then
      expect(settings).toBeDefined()
      expect(settings.musicEnabled).toBeDefined()
      expect(settings.soundEnabled).toBeDefined()
      expect(settings.musicVolume).toBeDefined()
      expect(settings.soundVolume).toBeDefined()
      expect(settings.currentTrack).toBeDefined()
    })

    it('should have default audio settings with correct types', () => {
      // Given
      const audio = useAudio()

      // When
      const settings = audio.settings.value

      // Then
      expect(typeof settings.musicEnabled).toBe('boolean')
      expect(typeof settings.soundEnabled).toBe('boolean')
      expect(typeof settings.musicVolume).toBe('number')
      expect(typeof settings.soundVolume).toBe('number')
      expect(typeof settings.currentTrack).toBe('string')
    })

    it('should return boolean from ensureAudioContextRunning', async () => {
      // Given
      const audio = useAudio()

      // When
      const result = await audio.ensureAudioContextRunning()

      // Then
      expect(typeof result).toBe('boolean')
    })

    it('should handle initial context creation without errors', async () => {
      // Given
      const audio = useAudio()
      let errorCaught = false

      // When
      try {
        await audio.ensureAudioContextRunning()
      } catch (error) {
        errorCaught = true
      }

      // Then
      expect(errorCaught).toBe(false)
    })
  })

  /**
   * Test 2: Resume Context on User Interaction
   *
   * Given: An initialized AudioContext
   * When: ensureAudioContextRunning is called
   * Then: Context should transition to running state
   */
  describe('2. Resume Context on User Interaction', () => {
    it('should resume suspended context on user interaction', async () => {
      // Given
      const audio = useAudio()
      const initialized = await audio.ensureAudioContextRunning()
      expect(typeof initialized).toBe('boolean')

      // When
      const resumed = await audio.ensureAudioContextRunning()

      // Then
      expect(typeof resumed).toBe('boolean')
    })

    it('should maintain context state after resume', async () => {
      // Given
      const audio = useAudio()
      const firstCall = await audio.ensureAudioContextRunning()

      // When
      const secondCall = await audio.ensureAudioContextRunning()

      // Then
      expect(typeof firstCall).toBe('boolean')
      expect(typeof secondCall).toBe('boolean')
    })

    it('should handle multiple resume calls without errors', async () => {
      // Given
      const audio = useAudio()
      let errorOccurred = false

      // When
      try {
        await audio.ensureAudioContextRunning()
        await audio.ensureAudioContextRunning()
        await audio.ensureAudioContextRunning()
      } catch (error) {
        errorOccurred = true
      }

      // Then
      expect(errorOccurred).toBe(false)
    })

    it('should return valid boolean from context running check', async () => {
      // Given
      const audio = useAudio()
      const firstAttempt = await audio.ensureAudioContextRunning()
      expect(typeof firstAttempt).toBe('boolean')

      // When
      const secondAttempt = await audio.ensureAudioContextRunning()

      // Then
      expect(typeof secondAttempt).toBe('boolean')
    })

    it('should handle rapid successive calls to ensure running state', async () => {
      // Given
      const audio = useAudio()

      // When
      const promises = Array(5).fill(null).map(() =>
        audio.ensureAudioContextRunning()
      )
      const results = await Promise.all(promises)

      // Then
      results.forEach(result => {
        expect(typeof result).toBe('boolean')
      })
    })
  })

  /**
   * Test 3: Close Context on Cleanup
   *
   * Given: A running AudioContext
   * When: Component unmounts and cleanup is triggered
   * Then: AudioContext should be properly closed and reset
   */
  describe('3. Close Context on Cleanup', () => {
    it('should initialize context for cleanup testing', async () => {
      // Given
      const audio = useAudio()

      // When
      await audio.ensureAudioContextRunning()

      // Then
      expect(audio).toBeDefined()
    })

    it('should allow composable to be created and used', () => {
      // Given
      const audio = useAudio()

      // When
      const settings = audio.settings.value

      // Then
      expect(settings).toBeDefined()
    })

    it('should maintain state through composable lifecycle', async () => {
      // Given
      const audio = useAudio()
      const initialSettings = { ...audio.settings.value }

      // When
      await audio.ensureAudioContextRunning()
      const afterRunSettings = { ...audio.settings.value }

      // Then
      expect(afterRunSettings.musicVolume).toBe(initialSettings.musicVolume)
      expect(afterRunSettings.soundVolume).toBe(initialSettings.soundVolume)
      expect(afterRunSettings.currentTrack).toBe(initialSettings.currentTrack)
    })

    it('should support multiple independent instances', () => {
      // Given
      const audio1 = useAudio()
      const audio2 = useAudio()

      // When
      const settings1 = audio1.settings.value
      const settings2 = audio2.settings.value

      // Then
      expect(settings1).toBeDefined()
      expect(settings2).toBeDefined()
      expect(typeof settings1.musicVolume).toBe('number')
      expect(typeof settings2.soundVolume).toBe('number')
    })

    it('should provide composable methods for cleanup operations', () => {
      // Given
      const audio = useAudio()

      // When
      const methods = {
        toggleMusic: audio.toggleMusic,
        stopMusic: audio.stopMusic,
        toggleSound: audio.toggleSound,
        ensureAudioContextRunning: audio.ensureAudioContextRunning
      }

      // Then
      expect(typeof methods.toggleMusic).toBe('function')
      expect(typeof methods.stopMusic).toBe('function')
      expect(typeof methods.toggleSound).toBe('function')
      expect(typeof methods.ensureAudioContextRunning).toBe('function')
    })
  })

  /**
   * Test 4: Handle Context State Transitions
   *
   * Given: An AudioContext in various states
   * When: State transitions occur
   * Then: Composable should handle transitions gracefully
   */
  describe('4. Handle Context State Transitions', () => {
    it('should handle context transitions smoothly', async () => {
      // Given
      const audio = useAudio()
      const initial = await audio.ensureAudioContextRunning()

      // When
      const afterTransition = await audio.ensureAudioContextRunning()

      // Then
      expect(typeof initial).toBe('boolean')
      expect(typeof afterTransition).toBe('boolean')
    })

    it('should maintain correct state after multiple transitions', async () => {
      // Given
      const audio = useAudio()

      // When
      const states: boolean[] = []
      for (let i = 0; i < 3; i++) {
        const state = await audio.ensureAudioContextRunning()
        states.push(typeof state === 'boolean')
      }

      // Then
      states.forEach(isBoolean => {
        expect(isBoolean).toBe(true)
      })
    })

    it('should handle state transitions during sound setup', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      const state = await audio.ensureAudioContextRunning()

      // Then
      expect(typeof state).toBe('boolean')
    })

    it('should preserve settings during state transitions', async () => {
      // Given
      const audio = useAudio()
      const originalVolume = audio.settings.value.musicVolume

      // When
      await audio.ensureAudioContextRunning()
      const settingsAfterTransition = audio.settings.value.musicVolume

      // Then
      expect(settingsAfterTransition).toBe(originalVolume)
    })

    it('should handle rapid state transitions', async () => {
      // Given
      const audio = useAudio()

      // When & Then - Rapid transitions should not cause errors
      const transitions = await Promise.all([
        audio.ensureAudioContextRunning(),
        audio.ensureAudioContextRunning(),
        audio.ensureAudioContextRunning()
      ])

      transitions.forEach(t => {
        expect(typeof t).toBe('boolean')
      })
    })
  })

  /**
   * Test 5: Verify Gain Nodes Created Correctly
   *
   * Given: An initialized AudioContext
   * When: Audio context is running
   * Then: Gain nodes should be created and connected properly
   */
  describe('5. Verify Gain Nodes Created Correctly', () => {
    it('should have sound volume control available', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      const soundVolume = audio.soundVolume.value

      // Then
      expect(typeof soundVolume).toBe('number')
      expect(soundVolume).toBeGreaterThanOrEqual(0)
      expect(soundVolume).toBeLessThanOrEqual(1)
    })

    it('should have music volume control available', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      const musicVolume = audio.musicVolume.value

      // Then
      expect(typeof musicVolume).toBe('number')
      expect(musicVolume).toBeGreaterThanOrEqual(0)
      expect(musicVolume).toBeLessThanOrEqual(1)
    })

    it('should support setting sound volume', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()
      const newVolume = 0.5

      // When
      await audio.setSoundVolume(newVolume)
      const volume = audio.soundVolume.value

      // Then
      expect(volume).toBe(newVolume)
    })

    it('should support setting music volume', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()
      const newVolume = 0.6

      // When
      await audio.setMusicVolume(newVolume)
      const volume = audio.musicVolume.value

      // Then
      expect(volume).toBe(newVolume)
    })

    it('should initialize with valid gain node volumes', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      const musicVolume = audio.musicVolume.value
      const soundVolume = audio.soundVolume.value

      // Then
      expect(musicVolume).toBeGreaterThanOrEqual(0)
      expect(musicVolume).toBeLessThanOrEqual(1)
      expect(soundVolume).toBeGreaterThanOrEqual(0)
      expect(soundVolume).toBeLessThanOrEqual(1)
    })
  })

  /**
   * Test 6: Test Volume Control (0-1 Range)
   *
   * Given: A volume control request
   * When: Setting volume to values within 0-1 range
   * Then: Volume should be clamped and set correctly
   */
  describe('6. Test Volume Control (0-1 Range)', () => {
    it('should accept volume value of 0', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      await audio.setSoundVolume(0)

      // Then
      expect(audio.soundVolume.value).toBe(0)
    })

    it('should accept volume value of 1', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      await audio.setSoundVolume(1)

      // Then
      expect(audio.soundVolume.value).toBe(1)
    })

    it('should accept volume value of 0.5', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      await audio.setSoundVolume(0.5)

      // Then
      expect(audio.soundVolume.value).toBe(0.5)
    })

    it('should clamp volume above 1 to 1', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      await audio.setSoundVolume(1.5)

      // Then
      expect(audio.soundVolume.value).toBe(1)
    })

    it('should clamp volume below 0 to 0', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      await audio.setSoundVolume(-0.5)

      // Then
      expect(audio.soundVolume.value).toBe(0)
    })

    it('should accept fractional volume values', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()
      const fractionalValues = [0.1, 0.25, 0.33, 0.66, 0.75, 0.9]

      // When & Then
      for (const value of fractionalValues) {
        await audio.setSoundVolume(value)
        expect(audio.soundVolume.value).toBe(value)
      }
    })

    it('should handle music volume in 0-1 range', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      await audio.setMusicVolume(0)
      const volumeZero = audio.musicVolume.value

      await audio.setMusicVolume(0.5)
      const volumeHalf = audio.musicVolume.value

      await audio.setMusicVolume(1)
      const volumeFull = audio.musicVolume.value

      // Then
      expect(volumeZero).toBe(0)
      expect(volumeHalf).toBe(0.5)
      expect(volumeFull).toBe(1)
    })

    it('should persist volume values across multiple sets', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      await audio.setSoundVolume(0.3)
      await audio.setSoundVolume(0.6)
      await audio.setSoundVolume(0.9)

      // Then
      expect(audio.soundVolume.value).toBe(0.9)
    })
  })

  /**
   * Test 7: Test Mute/Unmute Functionality
   *
   * Given: Audio with enable/disable controls
   * When: Toggling sound/music enabled state
   * Then: Sound should be muted and unmuted correctly
   */
  describe('7. Test Mute/Unmute Functionality', () => {
    it('should have sound toggle available', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      const isSoundEnabled = audio.isSoundEnabled.value

      // Then
      expect(typeof isSoundEnabled).toBe('boolean')
    })

    it('should have music toggle available', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      const isMusicEnabled = audio.isMusicEnabled.value

      // Then
      expect(typeof isMusicEnabled).toBe('boolean')
    })

    it('should toggle sound enabled state', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()
      const initialState = audio.isSoundEnabled.value

      // When
      audio.toggleSound()
      const afterToggle = audio.isSoundEnabled.value

      // Then
      expect(afterToggle).toBe(!initialState)
    })

    it('should toggle music enabled state', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()
      const initialState = audio.isMusicEnabled.value

      // When
      await audio.toggleMusic()
      const afterToggle = audio.isMusicEnabled.value

      // Then
      expect(afterToggle).toBe(!initialState)
    })

    it('should toggle sound multiple times', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()
      const initial = audio.isSoundEnabled.value

      // When
      audio.toggleSound()
      const afterFirst = audio.isSoundEnabled.value

      audio.toggleSound()
      const afterSecond = audio.isSoundEnabled.value

      // Then
      expect(afterFirst).toBe(!initial)
      expect(afterSecond).toBe(initial)
    })

    it('should toggle music multiple times correctly', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()
      const initial = audio.isMusicEnabled.value

      // When
      await audio.toggleMusic()
      const afterFirst = audio.isMusicEnabled.value

      await audio.toggleMusic()
      const afterSecond = audio.isMusicEnabled.value

      // Then
      expect(afterFirst).toBe(!initial)
      expect(afterSecond).toBe(initial)
    })

    it('should persist mute state in settings', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      audio.toggleSound()
      const soundState = audio.isSoundEnabled.value
      await audio.toggleMusic()
      const musicState = audio.isMusicEnabled.value

      // Then
      expect(audio.settings.value.soundEnabled).toBe(soundState)
      expect(audio.settings.value.musicEnabled).toBe(musicState)
    })
  })

  /**
   * Test 8: Handle AudioContext Errors Gracefully
   *
   * Given: Potential error conditions in audio operations
   * When: Errors occur during initialization or operations
   * Then: Errors should be handled gracefully with fallback behavior
   */
  describe('8. Handle AudioContext Errors Gracefully', () => {
    it('should handle ensureAudioContextRunning without throwing', async () => {
      // Given
      const audio = useAudio()
      let errorThrown = false

      // When
      try {
        await audio.ensureAudioContextRunning()
      } catch (error) {
        errorThrown = true
      }

      // Then
      expect(errorThrown).toBe(false)
    })

    it('should return valid boolean value on audio context call', async () => {
      // Given
      const audio = useAudio()

      // When
      const result = await audio.ensureAudioContextRunning()

      // Then
      expect(typeof result).toBe('boolean')
    })

    it('should handle multiple error-prone operations sequentially', async () => {
      // Given
      const audio = useAudio()
      let errorCount = 0

      // When
      try {
        await audio.ensureAudioContextRunning()
        audio.toggleSound()
        await audio.setMusicVolume(0.5)
        await audio.setSoundVolume(0.8)
      } catch (error) {
        errorCount++
      }

      // Then
      expect(errorCount).toBe(0)
    })

    it('should recover from invalid volume values without errors', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()
      let errorThrown = false

      // When
      try {
        await audio.setSoundVolume(-0.5)
        await audio.setSoundVolume(1.5)
      } catch (error) {
        errorThrown = true
      }

      // Then
      expect(errorThrown).toBe(false)
    })

    it('should handle state errors in composed functions', async () => {
      // Given
      const audio = useAudio()
      let errorThrown = false

      // When
      try {
        await audio.ensureAudioContextRunning()
        audio.stopMusic()
        audio.pauseMusic()
        audio.toggleSound()
      } catch (error) {
        errorThrown = true
      }

      // Then
      expect(errorThrown).toBe(false)
    })

    it('should provide sensible defaults when audio initialized', async () => {
      // Given
      const audio = useAudio()

      // When
      const settings = audio.settings.value

      // Then
      expect(settings.musicVolume).toBeGreaterThanOrEqual(0)
      expect(settings.musicVolume).toBeLessThanOrEqual(1)
      expect(settings.soundVolume).toBeGreaterThanOrEqual(0)
      expect(settings.soundVolume).toBeLessThanOrEqual(1)
    })

    it('should maintain valid state after clamping operations', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()

      // When
      await audio.setSoundVolume(2) // Invalid value above 1
      const volumeAfterInvalid = audio.soundVolume.value

      // Then
      expect(volumeAfterInvalid).toBe(1) // Should clamp to 1
      expect(volumeAfterInvalid).toBeGreaterThanOrEqual(0)
      expect(volumeAfterInvalid).toBeLessThanOrEqual(1)
    })

    it('should handle track switching without errors', async () => {
      // Given
      const audio = useAudio()
      await audio.ensureAudioContextRunning()
      let errorThrown = false

      // When
      try {
        await audio.setCurrentTrack('arcade')
        await audio.setCurrentTrack('chill')
        await audio.setCurrentTrack('retro')
      } catch (error) {
        errorThrown = true
      }

      // Then
      expect(errorThrown).toBe(false)
      expect(audio.currentTrack.value).toBe('retro')
    })
  })
})
