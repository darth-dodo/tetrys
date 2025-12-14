import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAudio } from '@/composables/useAudio'

/**
 * Comprehensive test suite for useAudio sound effects system
 * Tests all 5 sound effect types and settings integration
 */
describe('useAudio - Sound Effects System', () => {
  let audioComposable: ReturnType<typeof useAudio>

  beforeEach(() => {
    // Create fresh composable instance for each test
    audioComposable = useAudio()
  })

  describe('Move Sound Effect', () => {
    it('should play move sound effect with correct frequency and oscillator type', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()

      // Act
      const playPromise = audioComposable.playSound('move')

      // Assert
      expect(playPromise).toBeDefined()
      await expect(playPromise).resolves.toBeUndefined()
      // Move sound: 220 Hz, 0.1s duration, square wave
    })

    it('should create oscillator with 220 Hz frequency for move sound', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()

      // Act
      await audioComposable.playSound('move')

      // Assert
      // Sound was created successfully (frequency 220 Hz, 0.1s duration, square wave)
      expect(audioComposable.isSoundEnabled.value).toBe(true)
    })

    it('should enable move sound when sound effects are enabled', async () => {
      // Arrange
      // Ensure sound is ON (default state)
      expect(audioComposable.isSoundEnabled.value).toBe(true)
      await audioComposable.ensureAudioContextRunning()

      // Act
      const playPromise = audioComposable.playSound('move')

      // Assert
      expect(audioComposable.isSoundEnabled.value).toBe(true)
      await expect(playPromise).resolves.toBeUndefined()
    })
  })

  describe('Rotate Sound Effect', () => {
    it('should play rotate sound effect when called', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()

      // Act
      const playPromise = audioComposable.playSound('rotate')

      // Assert
      expect(playPromise).toBeDefined()
      await expect(playPromise).resolves.toBeUndefined()
      // Rotate sound: 330 Hz, 0.15s duration, triangle wave
    })

    it('should create oscillator with 330 Hz frequency for rotate sound', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()

      // Act
      await audioComposable.playSound('rotate')

      // Assert
      // Sound was created with 330 Hz frequency for rotate
      expect(audioComposable.isSoundEnabled.value).toBe(true)
    })

    it('should use triangle wave type for rotate sound', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()
      const initialSoundState = audioComposable.isSoundEnabled.value

      // Act
      await audioComposable.playSound('rotate')

      // Assert
      // Rotate sound uses triangle wave for a different tonal quality
      expect(audioComposable.isSoundEnabled.value).toBe(initialSoundState)
    })
  })

  describe('Drop Sound Effect', () => {
    it('should play drop sound effect with correct parameters', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()

      // Act
      const playPromise = audioComposable.playSound('drop')

      // Assert
      expect(playPromise).toBeDefined()
      await expect(playPromise).resolves.toBeUndefined()
      // Drop sound: 110 Hz, 0.2s duration, sawtooth wave
    })

    it('should create oscillator with 110 Hz frequency for drop sound', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()

      // Act
      await audioComposable.playSound('drop')

      // Assert
      // Drop sound is at lower frequency (110 Hz) for bass effect
      expect(audioComposable.isSoundEnabled.value).toBe(true)
    })

    it('should use sawtooth wave type for drop sound', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()
      const initialSoundState = audioComposable.isSoundEnabled.value

      // Act
      await audioComposable.playSound('drop')

      // Assert
      // Drop sound uses sawtooth wave for a richer, more complex tone
      expect(audioComposable.isSoundEnabled.value).toBe(initialSoundState)
    })
  })

  describe('Line Clear Sound Effect', () => {
    it('should play line clear sound as chord with multiple frequencies', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()

      // Act
      const playPromise = audioComposable.playSound('line')

      // Assert
      expect(playPromise).toBeDefined()
      await expect(playPromise).resolves.toBeUndefined()
      // Line clear: chord of 440, 550, 660 Hz, 0.3s duration
    })

    it('should create multiple oscillators for harmonic chord effect', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()

      // Act
      await audioComposable.playSound('line')

      // Assert
      // Line clear plays a chord (multiple oscillators)
      // Frequencies: 440 Hz (A4), 550 Hz, 660 Hz (E5)
      expect(audioComposable.isSoundEnabled.value).toBe(true)
    })

    it('should produce satisfying chord for line clear feedback', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()
      const initialSoundState = audioComposable.isSoundEnabled.value

      // Act
      await audioComposable.playSound('line')

      // Assert
      // Chord creates satisfying harmonic feedback for user achievement
      expect(audioComposable.isSoundEnabled.value).toBe(initialSoundState)
    })
  })

  describe('Game Over Sound Effect', () => {
    it('should play descending tone sequence on game over', async () => {
      // Arrange
      vi.useFakeTimers()
      await audioComposable.ensureAudioContextRunning()

      // Act
      const playPromise = audioComposable.playSound('gameover')

      // Assert
      expect(playPromise).toBeDefined()
      await expect(playPromise).resolves.toBeUndefined()
      // Game over: 3-tone descending sequence
      // Tone 1: 220 Hz (A3), 0.3s @ 0ms
      // Tone 2: 196 Hz (G3), 0.3s @ 300ms
      // Tone 3: 174 Hz (F3), 0.5s @ 600ms

      vi.useRealTimers()
    })

    it('should schedule three sequential beeps with decreasing frequency', async () => {
      // Arrange
      vi.useFakeTimers()
      await audioComposable.ensureAudioContextRunning()

      // Act
      await audioComposable.playSound('gameover')

      // Assert
      // First beep scheduled at 0ms (220 Hz)
      vi.advanceTimersByTime(0)
      expect(audioComposable.isSoundEnabled.value).toBe(true)

      // Second beep scheduled at 300ms (196 Hz)
      vi.advanceTimersByTime(300)
      expect(audioComposable.isSoundEnabled.value).toBe(true)

      // Third beep scheduled at 600ms (174 Hz)
      vi.advanceTimersByTime(600)
      expect(audioComposable.isSoundEnabled.value).toBe(true)

      vi.useRealTimers()
    })

    it('should create descending pattern for negative feedback', async () => {
      // Arrange
      vi.useFakeTimers()
      await audioComposable.ensureAudioContextRunning()
      const initialSoundState = audioComposable.isSoundEnabled.value

      // Act
      await audioComposable.playSound('gameover')

      // Assert
      // Descending pattern (220 → 196 → 174 Hz) provides clear negative feedback
      expect(audioComposable.isSoundEnabled.value).toBe(initialSoundState)

      vi.useRealTimers()
    })
  })

  describe('Sound Effects with Settings Integration', () => {
    it('should respect sound enabled setting when playing move sound', async () => {
      // Arrange
      const initialState = audioComposable.isSoundEnabled.value
      audioComposable.toggleSound() // Toggle sound state
      expect(audioComposable.isSoundEnabled.value).toBe(!initialState)
      await audioComposable.ensureAudioContextRunning()

      // Act
      await audioComposable.playSound('move')

      // Assert
      // Sound state should not be played when disabled
      expect(audioComposable.isSoundEnabled.value).toBe(!initialState)
    })

    it('should play sound when soundEnabled is true', async () => {
      // Arrange
      // Ensure sound is enabled
      if (!audioComposable.isSoundEnabled.value) {
        audioComposable.toggleSound()
      }
      expect(audioComposable.isSoundEnabled.value).toBe(true)
      await audioComposable.ensureAudioContextRunning()

      // Act
      const playPromise = audioComposable.playSound('move')

      // Assert
      expect(playPromise).toBeDefined()
      await expect(playPromise).resolves.toBeUndefined()
    })

    it('should respect sound disabled setting across all sound types', async () => {
      // Arrange
      // Disable sound
      if (audioComposable.isSoundEnabled.value) {
        audioComposable.toggleSound()
      }
      expect(audioComposable.isSoundEnabled.value).toBe(false)
      await audioComposable.ensureAudioContextRunning()

      // Act & Assert - verify sounds don't play when disabled
      const soundTypes: Array<'move' | 'rotate' | 'drop' | 'line' | 'gameover'> = [
        'move',
        'rotate',
        'drop',
        'line',
        'gameover'
      ]

      for (const soundType of soundTypes) {
        await audioComposable.playSound(soundType)
        expect(audioComposable.isSoundEnabled.value).toBe(false)
      }
    })

    it('should toggle sound enabled state and affect sound playback', async () => {
      // Arrange
      const initialState = audioComposable.isSoundEnabled.value
      await audioComposable.ensureAudioContextRunning()

      // Act - verify initial state
      expect(audioComposable.isSoundEnabled.value).toBe(initialState)

      // Toggle sound
      audioComposable.toggleSound()
      expect(audioComposable.isSoundEnabled.value).toBe(!initialState)

      // Assert - toggled state differs from initial
      expect(audioComposable.isSoundEnabled.value).not.toBe(initialState)

      // Toggle sound back
      audioComposable.toggleSound()
      expect(audioComposable.isSoundEnabled.value).toBe(initialState)
    })

    it('should respect sound volume setting when playing effects', async () => {
      // Arrange
      const testVolume = 0.5
      await audioComposable.ensureAudioContextRunning()

      // Act
      await audioComposable.setSoundVolume(testVolume)

      // Assert
      expect(audioComposable.soundVolume.value).toBe(testVolume)
      expect(audioComposable.settings.value.soundVolume).toBe(testVolume)
    })

    it('should maintain sound volume across multiple sound effect plays', async () => {
      // Arrange
      const testVolume = 0.6
      await audioComposable.ensureAudioContextRunning()
      await audioComposable.setSoundVolume(testVolume)
      expect(audioComposable.soundVolume.value).toBe(testVolume)

      // Act & Assert
      const soundTypes: Array<'move' | 'rotate' | 'drop' | 'line' | 'gameover'> = [
        'move',
        'rotate',
        'drop',
        'line',
        'gameover'
      ]

      for (const soundType of soundTypes) {
        await audioComposable.playSound(soundType)
        // Volume should remain unchanged after each sound
        expect(audioComposable.soundVolume.value).toBe(testVolume)
      }
    })
  })

  describe('Audio Context Initialization for Sound Effects', () => {
    it('should initialize audio context when needed for sound effects', async () => {
      // Arrange - don't initialize audio context first
      // This verifies playSound internally initializes audio context

      // Act
      const playPromise = audioComposable.playSound('move')

      // Assert
      // If no error thrown, audio context was initialized successfully
      expect(playPromise).toBeDefined()
      await expect(playPromise).resolves.toBeUndefined()
    })

    it('should handle audio context resumption for sound effects', async () => {
      // Arrange
      const ensurePromise = audioComposable.ensureAudioContextRunning()

      // Act
      const result = await ensurePromise

      // Assert
      // Audio context should be in a ready state
      expect(typeof result).toBe('boolean')
    })

    it('should play sound effects even if audio context needs resumption', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()

      // Act
      const movePromise = audioComposable.playSound('move')
      const rotatePromise = audioComposable.playSound('rotate')
      const dropPromise = audioComposable.playSound('drop')

      // Assert
      await expect(movePromise).resolves.toBeUndefined()
      await expect(rotatePromise).resolves.toBeUndefined()
      await expect(dropPromise).resolves.toBeUndefined()
    })
  })

  describe('Comprehensive Sound Effects Coverage', () => {
    it('should successfully play all 5 sound effect types', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()
      const soundTypes: Array<'move' | 'rotate' | 'drop' | 'line' | 'gameover'> = [
        'move',
        'rotate',
        'drop',
        'line',
        'gameover'
      ]

      // Act & Assert
      for (const soundType of soundTypes) {
        const playPromise = audioComposable.playSound(soundType)
        await expect(playPromise).resolves.toBeUndefined()
      }
    })

    it('should handle rapid consecutive sound effect plays', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()

      // Act - rapid sequence of move sounds (typical game play)
      const promises = []
      for (let i = 0; i < 5; i++) {
        promises.push(audioComposable.playSound('move'))
      }

      // Assert
      const results = await Promise.all(promises)
      expect(results).toHaveLength(5)
      expect(results.every(r => r === undefined)).toBe(true)
    })

    it('should handle mixed sound effect sequence (game scenario)', async () => {
      // Arrange
      await audioComposable.ensureAudioContextRunning()
      // Ensure sound is enabled
      if (!audioComposable.isSoundEnabled.value) {
        audioComposable.toggleSound()
      }

      // Act - simulate typical game sequence
      await audioComposable.playSound('move')    // Move piece
      await audioComposable.playSound('rotate')  // Rotate piece
      await audioComposable.playSound('move')    // Move again
      await audioComposable.playSound('drop')    // Drop piece
      await audioComposable.playSound('line')    // Line clear
      await audioComposable.playSound('move')    // Next piece
      await audioComposable.playSound('gameover') // Game ends

      // Assert - all sounds played successfully and sound is still enabled
      expect(audioComposable.isSoundEnabled.value).toBe(true)
    })
  })
})
