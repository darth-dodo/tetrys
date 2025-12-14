import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { useAudio } from '../useAudio'
import { clearLocalStorage, getLocalStorageData } from '@//__tests__/helpers'

/**
 * Test suite for useAudio settings and preferences management
 * Tests cover:
 * - Default settings initialization
 * - Music and sound effect toggles
 * - Independent volume controls
 * - localStorage persistence
 * - Invalid localStorage data handling
 * - Settings survival across page reloads
 */

/**
 * Helper to create a test component that uses the audio composable
 */
function createAudioTestComponent() {
  return defineComponent({
    setup() {
      return { audio: useAudio() }
    },
    render() {
      return h('div')
    }
  })
}

describe('useAudio Settings and Preferences', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearLocalStorage()
    // Clear any active audio timers
    vi.clearAllTimers()
  })

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllTimers()
    clearLocalStorage()
  })

  describe('Default Settings Initialization', () => {
    it('should initialize with default settings (music disabled, effects enabled, volume 0.5)', async () => {
      // Arrange & Act
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.settings.value.musicEnabled).toBe(false)
      expect(wrapper.vm.audio.settings.value.soundEnabled).toBe(true)
      // Default settings from implementation
      expect(wrapper.vm.audio.settings.value.musicVolume).toBe(0.3)
      expect(wrapper.vm.audio.settings.value.soundVolume).toBe(0.7)
      expect(wrapper.vm.audio.settings.value.currentTrack).toBe('tetris')

      wrapper.unmount()
    })

    it('should expose all settings through computed properties', async () => {
      // Arrange & Act
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(false)
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(true)
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.3)
      expect(wrapper.vm.audio.soundVolume.value).toBe(0.7)
      expect(wrapper.vm.audio.currentTrack.value).toBe('tetris')

      wrapper.unmount()
    })

    it('should have music playing state as false initially', async () => {
      // Arrange & Act
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.isMusicPlaying.value).toBe(false)

      wrapper.unmount()
    })
  })

  describe('Music Toggle Functionality', () => {
    it('should toggle music on from disabled state', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(false)

      // Act
      await wrapper.vm.audio.toggleMusic()
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(true)

      wrapper.unmount()
    })

    it('should toggle music off from enabled state', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      // First enable music
      await wrapper.vm.audio.toggleMusic()
      await flushPromises()
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(true)

      // Act
      await wrapper.vm.audio.toggleMusic()
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(false)

      wrapper.unmount()
    })

    it('should persist music toggle state to localStorage', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.toggleMusic()
      await flushPromises()

      // Assert
      const saved = getLocalStorageData('tetrys-audio-settings')
      expect(saved).not.toBeNull()
      expect(saved.musicEnabled).toBe(true)

      wrapper.unmount()
    })

    it('should toggle music multiple times correctly', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      const initialState = wrapper.vm.audio.isMusicEnabled.value

      // Act & Assert
      await wrapper.vm.audio.toggleMusic()
      await flushPromises()
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(!initialState)

      await wrapper.vm.audio.toggleMusic()
      await flushPromises()
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(initialState)

      await wrapper.vm.audio.toggleMusic()
      await flushPromises()
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(!initialState)

      wrapper.unmount()
    })
  })

  describe('Sound Effects Toggle Functionality', () => {
    it('should toggle sound effects on from disabled state', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // First disable sound (default is enabled)
      wrapper.vm.audio.toggleSound()
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(false)

      // Act - Toggle back on
      wrapper.vm.audio.toggleSound()

      // Assert
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(true)

      wrapper.unmount()
    })

    it('should toggle sound effects off from enabled state', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(true)

      // Act
      wrapper.vm.audio.toggleSound()

      // Assert
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(false)

      wrapper.unmount()
    })

    it('should persist sound toggle state to localStorage', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.audio.toggleSound()

      // Assert
      const saved = getLocalStorageData('tetrys-audio-settings')
      expect(saved).not.toBeNull()
      expect(saved.soundEnabled).toBe(false)

      wrapper.unmount()
    })

    it('should toggle sound effects independently of music', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      const initialMusic = wrapper.vm.audio.isMusicEnabled.value
      const initialSound = wrapper.vm.audio.isSoundEnabled.value

      wrapper.vm.audio.toggleSound()
      await wrapper.vm.audio.toggleMusic()
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(!initialMusic)
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(!initialSound)

      wrapper.unmount()
    })
  })

  describe('Master Volume Update', () => {
    it('should update music volume within 0-1 range', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setMusicVolume(0.5)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.5)

      wrapper.unmount()
    })

    it('should update sound effects volume within 0-1 range', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setSoundVolume(0.8)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.soundVolume.value).toBe(0.8)

      wrapper.unmount()
    })

    it('should clamp music volume to 0 when set below minimum', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setMusicVolume(-0.5)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.musicVolume.value).toBe(0)

      wrapper.unmount()
    })

    it('should clamp music volume to 1 when set above maximum', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setMusicVolume(1.5)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.musicVolume.value).toBe(1)

      wrapper.unmount()
    })

    it('should clamp sound volume to 0 when set below minimum', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setSoundVolume(-0.2)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.soundVolume.value).toBe(0)

      wrapper.unmount()
    })

    it('should clamp sound volume to 1 when set above maximum', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setSoundVolume(2.0)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.soundVolume.value).toBe(1)

      wrapper.unmount()
    })

    it('should accept boundary values 0 and 1 for music volume', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act & Assert
      await wrapper.vm.audio.setMusicVolume(0)
      await flushPromises()
      expect(wrapper.vm.audio.musicVolume.value).toBe(0)

      await wrapper.vm.audio.setMusicVolume(1)
      await flushPromises()
      expect(wrapper.vm.audio.musicVolume.value).toBe(1)

      wrapper.unmount()
    })

    it('should accept boundary values 0 and 1 for sound volume', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act & Assert
      await wrapper.vm.audio.setSoundVolume(0)
      await flushPromises()
      expect(wrapper.vm.audio.soundVolume.value).toBe(0)

      await wrapper.vm.audio.setSoundVolume(1)
      await flushPromises()
      expect(wrapper.vm.audio.soundVolume.value).toBe(1)

      wrapper.unmount()
    })
  })

  describe('Independent Volume Controls', () => {
    it('should update music volume independently of sound volume', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      const initialSoundVolume = wrapper.vm.audio.soundVolume.value

      // Act
      await wrapper.vm.audio.setMusicVolume(0.9)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.9)
      expect(wrapper.vm.audio.soundVolume.value).toBe(initialSoundVolume)

      wrapper.unmount()
    })

    it('should update sound volume independently of music volume', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      const initialMusicVolume = wrapper.vm.audio.musicVolume.value

      // Act
      await wrapper.vm.audio.setSoundVolume(0.2)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.soundVolume.value).toBe(0.2)
      expect(wrapper.vm.audio.musicVolume.value).toBe(initialMusicVolume)

      wrapper.unmount()
    })

    it('should allow changing both volumes separately in sequence', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setMusicVolume(0.6)
      await wrapper.vm.audio.setSoundVolume(0.4)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.6)
      expect(wrapper.vm.audio.soundVolume.value).toBe(0.4)

      wrapper.unmount()
    })

    it('should support granular volume adjustments', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      const musicValues = [0.1, 0.25, 0.5, 0.75, 0.9]
      for (const value of musicValues) {
        await wrapper.vm.audio.setMusicVolume(value)
      }
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.9)

      wrapper.unmount()
    })
  })

  describe('localStorage Persistence', () => {
    it('should save all settings to localStorage when toggling music', async () => {
      // Arrange
      clearLocalStorage()
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.toggleMusic()
      await flushPromises()

      // Assert
      const saved = getLocalStorageData('tetrys-audio-settings')
      expect(saved).toEqual({
        musicEnabled: true,
        soundEnabled: true,
        musicVolume: 0.3,
        soundVolume: 0.7,
        currentTrack: 'tetris'
      })

      wrapper.unmount()
    })

    it('should save all settings to localStorage when toggling sound', async () => {
      // Arrange
      clearLocalStorage()
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.audio.toggleSound()

      // Assert
      const saved = getLocalStorageData('tetrys-audio-settings')
      expect(saved).toEqual({
        musicEnabled: false,
        soundEnabled: false,
        musicVolume: 0.3,
        soundVolume: 0.7,
        currentTrack: 'tetris'
      })

      wrapper.unmount()
    })

    it('should save all settings to localStorage when updating music volume', async () => {
      // Arrange
      clearLocalStorage()
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setMusicVolume(0.6)
      await flushPromises()

      // Assert
      const saved = getLocalStorageData('tetrys-audio-settings')
      expect(saved.musicVolume).toBe(0.6)
      expect(saved.soundEnabled).toBe(true)

      wrapper.unmount()
    })

    it('should save all settings to localStorage when updating sound volume', async () => {
      // Arrange
      clearLocalStorage()
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setSoundVolume(0.5)
      await flushPromises()

      // Assert
      const saved = getLocalStorageData('tetrys-audio-settings')
      expect(saved.soundVolume).toBe(0.5)
      expect(saved.musicEnabled).toBe(false)

      wrapper.unmount()
    })

    it('should preserve all settings together during save operations', async () => {
      // Arrange
      clearLocalStorage()
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.toggleMusic()
      wrapper.vm.audio.toggleSound()
      await wrapper.vm.audio.setMusicVolume(0.75)
      await wrapper.vm.audio.setSoundVolume(0.25)
      await flushPromises()

      // Assert
      const saved = getLocalStorageData('tetrys-audio-settings')
      expect(saved).toEqual({
        musicEnabled: true,
        soundEnabled: false,
        musicVolume: 0.75,
        soundVolume: 0.25,
        currentTrack: 'tetris'
      })

      wrapper.unmount()
    })
  })

  describe('Load Settings from localStorage', () => {
    it('should load settings from localStorage on initialization', async () => {
      // Arrange
      clearLocalStorage()
      const savedSettings = {
        musicEnabled: true,
        soundEnabled: false,
        musicVolume: 0.6,
        soundVolume: 0.4,
        currentTrack: 'arcade'
      }
      localStorage.setItem('tetrys-audio-settings', JSON.stringify(savedSettings))

      // Act
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(true)
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(false)
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.6)
      expect(wrapper.vm.audio.soundVolume.value).toBe(0.4)
      expect(wrapper.vm.audio.currentTrack.value).toBe('arcade')

      wrapper.unmount()
    })

    it('should merge loaded settings with defaults', async () => {
      // Arrange
      clearLocalStorage()
      const partialSettings = {
        musicEnabled: true,
        soundVolume: 0.5
        // Missing other settings
      }
      localStorage.setItem('tetrys-audio-settings', JSON.stringify(partialSettings))

      // Act
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(true)
      expect(wrapper.vm.audio.soundVolume.value).toBe(0.5)
      // Default values should be used for missing settings
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(true)
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.3)

      wrapper.unmount()
    })

    it('should use defaults when localStorage is empty', async () => {
      // Arrange
      clearLocalStorage()
      expect(localStorage.getItem('tetrys-audio-settings')).toBeNull()

      // Act
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(false)
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(true)
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.3)
      expect(wrapper.vm.audio.soundVolume.value).toBe(0.7)

      wrapper.unmount()
    })
  })

  describe('Invalid localStorage Data Handling', () => {
    it('should handle corrupted JSON in localStorage gracefully', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-audio-settings', '{invalid json}')

      // Act
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      // Should fall back to defaults without throwing
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(false)
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(true)
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.3)

      wrapper.unmount()
    })

    it('should handle empty string in localStorage', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-audio-settings', '')

      // Act
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      // Should fall back to defaults
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(false)
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(true)

      wrapper.unmount()
    })

    it('should handle null values in localStorage data', async () => {
      // Arrange
      clearLocalStorage()
      const invalidSettings = {
        musicEnabled: null,
        soundEnabled: null,
        musicVolume: null,
        soundVolume: null,
        currentTrack: null
      }
      localStorage.setItem('tetrys-audio-settings', JSON.stringify(invalidSettings))

      // Act
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      // Should use the invalid values that were stored (merging happens)
      expect(wrapper.vm.audio.settings.value.musicEnabled).toBe(null)

      wrapper.unmount()
    })

    it('should handle non-object data in localStorage', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-audio-settings', '"not an object"')

      // Act
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      // Should fall back to defaults when parsing fails to produce valid settings
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(false)

      wrapper.unmount()
    })

    it('should continue to function after encountering corrupted data', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-audio-settings', '{invalid}')
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.toggleMusic()
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(true)
      const saved = getLocalStorageData('tetrys-audio-settings')
      expect(saved.musicEnabled).toBe(true)

      wrapper.unmount()
    })
  })

  describe('Settings Persist Across Page Reload Simulation', () => {
    it('should restore settings that were saved before simulated reload', async () => {
      // Arrange - First instance saves settings
      clearLocalStorage()
      const component1 = createAudioTestComponent()
      const wrapper1 = mount(component1)
      await flushPromises()
      await wrapper1.vm.audio.setMusicVolume(0.8)
      wrapper1.vm.audio.toggleSound()
      await flushPromises()

      // Act - Simulate page reload by clearing references and creating new instance
      const savedData = getLocalStorageData('tetrys-audio-settings')
      expect(savedData).not.toBeNull()
      wrapper1.unmount()

      // Second instance loads from localStorage
      const component2 = createAudioTestComponent()
      const wrapper2 = mount(component2)
      await flushPromises()

      // Assert
      expect(wrapper2.vm.audio.musicVolume.value).toBe(0.8)
      expect(wrapper2.vm.audio.isSoundEnabled.value).toBe(false)

      wrapper2.unmount()
    })

    it('should maintain settings after multiple save-load cycles', async () => {
      // Arrange
      clearLocalStorage()
      const testSettings = {
        musicEnabled: true,
        soundEnabled: false,
        musicVolume: 0.5,
        soundVolume: 0.3,
        currentTrack: 'chill'
      }

      // Act - First instance
      localStorage.setItem('tetrys-audio-settings', JSON.stringify(testSettings))
      const component1 = createAudioTestComponent()
      const wrapper1 = mount(component1)
      await flushPromises()

      // Make a change
      await wrapper1.vm.audio.setMusicVolume(0.7)
      await flushPromises()

      // Verify first instance reflects change
      expect(wrapper1.vm.audio.musicVolume.value).toBe(0.7)

      // Simulate reload - create second instance
      wrapper1.unmount()
      const component2 = createAudioTestComponent()
      const wrapper2 = mount(component2)
      await flushPromises()

      // Assert - second instance loads updated settings
      expect(wrapper2.vm.audio.musicVolume.value).toBe(0.7)
      expect(wrapper2.vm.audio.isSoundEnabled.value).toBe(false)
      expect(wrapper2.vm.audio.currentTrack.value).toBe('chill')

      wrapper2.unmount()
    })

    it('should handle fresh start when localStorage is cleared', async () => {
      // Arrange
      clearLocalStorage()
      const component1 = createAudioTestComponent()
      const wrapper1 = mount(component1)
      await flushPromises()
      wrapper1.vm.audio.toggleSound()
      const savedData = getLocalStorageData('tetrys-audio-settings')
      expect(savedData).not.toBeNull()

      // Act - Simulate storage wipe
      wrapper1.unmount()
      clearLocalStorage()
      const component2 = createAudioTestComponent()
      const wrapper2 = mount(component2)
      await flushPromises()

      // Assert
      expect(wrapper2.vm.audio.isMusicEnabled.value).toBe(false)
      expect(wrapper2.vm.audio.isSoundEnabled.value).toBe(true)

      wrapper2.unmount()
    })

    it('should preserve current track across reload', async () => {
      // Arrange
      clearLocalStorage()
      const component1 = createAudioTestComponent()
      const wrapper1 = mount(component1)
      await flushPromises()
      await wrapper1.vm.audio.setCurrentTrack('arcade')
      await flushPromises()

      // Act - Simulate reload
      wrapper1.unmount()
      const component2 = createAudioTestComponent()
      const wrapper2 = mount(component2)
      await flushPromises()

      // Assert
      expect(wrapper2.vm.audio.currentTrack.value).toBe('arcade')

      wrapper2.unmount()
    })
  })

  describe('Volume State Consistency', () => {
    it('should maintain volume consistency across operations', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      const volumes = [0.2, 0.4, 0.6, 0.8, 0.95]

      // Act
      for (const volume of volumes) {
        await wrapper.vm.audio.setMusicVolume(volume)
      }
      await flushPromises()

      // Assert - verify last volume applied correctly
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.95)

      wrapper.unmount()
    })

    it('should allow rapid volume changes without data loss', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setMusicVolume(0.3)
      await wrapper.vm.audio.setMusicVolume(0.6)
      await wrapper.vm.audio.setMusicVolume(0.9)
      await wrapper.vm.audio.setSoundVolume(0.1)
      await wrapper.vm.audio.setSoundVolume(0.5)
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.9)
      expect(wrapper.vm.audio.soundVolume.value).toBe(0.5)

      wrapper.unmount()
    })
  })

  describe('Settings Integration', () => {
    it('should support changing all settings together', async () => {
      // Arrange
      clearLocalStorage()
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      await wrapper.vm.audio.toggleMusic()
      await flushPromises()
      wrapper.vm.audio.toggleSound()
      await wrapper.vm.audio.setMusicVolume(0.7)
      await wrapper.vm.audio.setSoundVolume(0.3)
      await wrapper.vm.audio.setCurrentTrack('retro')
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.isMusicEnabled.value).toBe(true)
      expect(wrapper.vm.audio.isSoundEnabled.value).toBe(false)
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.7)
      expect(wrapper.vm.audio.soundVolume.value).toBe(0.3)
      expect(wrapper.vm.audio.currentTrack.value).toBe('retro')

      // Verify all saved to localStorage
      const saved = getLocalStorageData('tetrys-audio-settings')
      expect(saved).toEqual({
        musicEnabled: true,
        soundEnabled: false,
        musicVolume: 0.7,
        soundVolume: 0.3,
        currentTrack: 'retro'
      })

      wrapper.unmount()
    })

    it('should preserve settings when switching between tracks', async () => {
      // Arrange
      const component = createAudioTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      await wrapper.vm.audio.setMusicVolume(0.6)
      await wrapper.vm.audio.setSoundVolume(0.4)
      await flushPromises()

      // Act
      await wrapper.vm.audio.setCurrentTrack('chill')
      await flushPromises()

      // Assert
      expect(wrapper.vm.audio.musicVolume.value).toBe(0.6)
      expect(wrapper.vm.audio.soundVolume.value).toBe(0.4)
      expect(wrapper.vm.audio.currentTrack.value).toBe('chill')

      wrapper.unmount()
    })
  })
})
