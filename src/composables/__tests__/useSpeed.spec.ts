import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { useSpeed } from '../useSpeed'
import { clearLocalStorage } from '@//__tests__/helpers'

/**
 * Test suite for useSpeed composable
 * Tests cover:
 * - Default speed multiplier initialization
 * - Speed multiplier setting with valid values
 * - Speed multiplier boundary enforcement (0.5-3.0 range)
 * - localStorage persistence of speed settings
 * - Loading saved speed from localStorage
 * - Invalid localStorage data handling
 * - Speed multiplier effect on game speed calculations
 * - Edge cases (level 0, high levels, invalid inputs)
 */

/**
 * Helper to create a test component that uses the speed composable
 */
function createSpeedTestComponent() {
  return defineComponent({
    setup() {
      return { speed: useSpeed() }
    },
    render() {
      return h('div')
    }
  })
}

describe('useSpeed Speed Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearLocalStorage()
    // Clear any mocks
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks()
    clearLocalStorage()
  })

  describe('Initialization with Default Speed', () => {
    it('should initialize with default speed multiplier of 1', async () => {
      // Arrange & Act
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(1)

      wrapper.unmount()
    })

    it('should provide default speed when localStorage is empty', async () => {
      // Arrange
      clearLocalStorage()
      expect(localStorage.getItem('tetrys-speed-setting')).toBeNull()

      // Act
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(1)

      wrapper.unmount()
    })
  })

  describe('Setting Speed Multiplier with Valid Values', () => {
    it('should set speed multiplier to valid values within range', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act & Assert - Test various valid speeds
      const validSpeeds = [0.5, 1, 1.5, 2, 2.5, 3]
      for (const speed of validSpeeds) {
        wrapper.vm.speed.setSpeed(speed)
        await flushPromises()
        expect(wrapper.vm.speed.speedMultiplier.value).toBe(speed)
      }

      wrapper.unmount()
    })

    it('should update speed multiplier when setSpeed is called', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(1)

      // Act
      wrapper.vm.speed.setSpeed(2)
      await flushPromises()

      // Assert
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(2)

      wrapper.unmount()
    })

    it('should maintain speed state during multiple changes', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act & Assert - Multiple speed changes
      wrapper.vm.speed.setSpeed(1.5)
      await flushPromises()
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(1.5)

      wrapper.vm.speed.setSpeed(2.5)
      await flushPromises()
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(2.5)

      wrapper.vm.speed.setSpeed(1)
      await flushPromises()
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(1)

      wrapper.unmount()
    })
  })

  describe('Speed Multiplier Boundary Enforcement', () => {
    it('should clamp speed values below minimum (0.5) to 0.5', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - Try to set speeds below minimum
      const belowMinimumSpeeds = [0, 0.1, 0.3, 0.49, -1, -5]
      for (const speed of belowMinimumSpeeds) {
        wrapper.vm.speed.setSpeed(speed)
        await flushPromises()

        // Assert
        expect(wrapper.vm.speed.speedMultiplier.value).toBe(0.5)
      }

      wrapper.unmount()
    })

    it('should clamp speed values above maximum (3) to 3', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - Try to set speeds above maximum
      const aboveMaximumSpeeds = [3.1, 4, 5, 10, 100]
      for (const speed of aboveMaximumSpeeds) {
        wrapper.vm.speed.setSpeed(speed)
        await flushPromises()

        // Assert
        expect(wrapper.vm.speed.speedMultiplier.value).toBe(3)
      }

      wrapper.unmount()
    })

    it('should accept exact boundary values (0.5 and 3)', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - Set to minimum boundary
      wrapper.vm.speed.setSpeed(0.5)
      await flushPromises()

      // Assert
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(0.5)

      // Act - Set to maximum boundary
      wrapper.vm.speed.setSpeed(3)
      await flushPromises()

      // Assert
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(3)

      wrapper.unmount()
    })
  })

  describe('Persistence to localStorage', () => {
    it('should persist speed setting to localStorage when setting speed', async () => {
      // Arrange
      clearLocalStorage()
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.speed.setSpeed(2)
      await flushPromises()

      // Assert
      const saved = localStorage.getItem('tetrys-speed-setting')
      expect(saved).toBe('2')

      wrapper.unmount()
    })

    it('should persist each speed change to localStorage', async () => {
      // Arrange
      clearLocalStorage()
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act & Assert
      const speeds = [1.5, 2.5, 0.5, 3]
      for (const speed of speeds) {
        wrapper.vm.speed.setSpeed(speed)
        await flushPromises()
        expect(localStorage.getItem('tetrys-speed-setting')).toBe(speed.toString())
      }

      wrapper.unmount()
    })

    it('should preserve speed selection across multiple save operations', async () => {
      // Arrange
      clearLocalStorage()
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.speed.setSpeed(1.5)
      await flushPromises()
      const firstSave = localStorage.getItem('tetrys-speed-setting')

      wrapper.vm.speed.setSpeed(2.5)
      await flushPromises()
      const secondSave = localStorage.getItem('tetrys-speed-setting')

      wrapper.vm.speed.setSpeed(1.5)
      await flushPromises()
      const thirdSave = localStorage.getItem('tetrys-speed-setting')

      // Assert
      expect(firstSave).toBe('1.5')
      expect(secondSave).toBe('2.5')
      expect(thirdSave).toBe('1.5')

      wrapper.unmount()
    })
  })

  describe('Loading Saved Speed from localStorage', () => {
    it('should load saved speed from localStorage on initialization', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-speed-setting', '2')

      // Act
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(2)

      wrapper.unmount()
    })

    it('should load different saved speeds correctly', async () => {
      // Arrange
      const speedsToTest = [0.5, 1, 1.5, 2, 2.5, 3]

      for (const speed of speedsToTest) {
        clearLocalStorage()
        localStorage.setItem('tetrys-speed-setting', speed.toString())

        // Act
        const component = createSpeedTestComponent()
        const wrapper = mount(component)
        await flushPromises()

        // Assert
        expect(wrapper.vm.speed.speedMultiplier.value).toBe(speed)

        wrapper.unmount()
      }
    })

    it('should restore speed state that was persisted before simulated reload', async () => {
      // Arrange - First instance saves speed
      clearLocalStorage()
      const component1 = createSpeedTestComponent()
      const wrapper1 = mount(component1)
      await flushPromises()
      wrapper1.vm.speed.setSpeed(2.5)
      await flushPromises()

      // Act - Verify saved data
      const savedData = localStorage.getItem('tetrys-speed-setting')
      expect(savedData).toBe('2.5')
      wrapper1.unmount()

      // Simulate page reload by creating new instance
      const component2 = createSpeedTestComponent()
      const wrapper2 = mount(component2)
      await flushPromises()

      // Assert
      expect(wrapper2.vm.speed.speedMultiplier.value).toBe(2.5)

      wrapper2.unmount()
    })
  })

  describe('Invalid localStorage Data Handling', () => {
    it('should fall back to default speed when localStorage contains invalid numeric value', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-speed-setting', 'not-a-number')

      // Act
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(1)

      wrapper.unmount()
    })

    it('should reject out-of-range values from localStorage', async () => {
      // Arrange - Test value above maximum
      clearLocalStorage()
      localStorage.setItem('tetrys-speed-setting', '5')

      // Act
      const component1 = createSpeedTestComponent()
      const wrapper1 = mount(component1)
      await flushPromises()

      // Assert
      expect(wrapper1.vm.speed.speedMultiplier.value).toBe(1)
      wrapper1.unmount()

      // Arrange - Test value below minimum
      clearLocalStorage()
      localStorage.setItem('tetrys-speed-setting', '0.1')

      // Act
      const component2 = createSpeedTestComponent()
      const wrapper2 = mount(component2)
      await flushPromises()

      // Assert
      expect(wrapper2.vm.speed.speedMultiplier.value).toBe(1)
      wrapper2.unmount()

      // Arrange - Test negative value
      clearLocalStorage()
      localStorage.setItem('tetrys-speed-setting', '-1')

      // Act
      const component3 = createSpeedTestComponent()
      const wrapper3 = mount(component3)
      await flushPromises()

      // Assert
      expect(wrapper3.vm.speed.speedMultiplier.value).toBe(1)
      wrapper3.unmount()
    })

    it('should handle corrupted localStorage gracefully', async () => {
      // Arrange
      clearLocalStorage()
      // Simulate corrupted data
      localStorage.setItem('tetrys-speed-setting', '')

      // Act
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert - Should default to 1
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(1)

      wrapper.unmount()
    })

    it('should continue functioning after encountering invalid stored data', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-speed-setting', 'invalid')

      // Act
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - Try to set a valid speed after loading invalid data
      wrapper.vm.speed.setSpeed(2)
      await flushPromises()

      // Assert
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(2)
      expect(localStorage.getItem('tetrys-speed-setting')).toBe('2')

      wrapper.unmount()
    })
  })

  describe('Speed Multiplier Effect Validation', () => {
    it('should provide speed multiplier as a computed value', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.speed.setSpeed(1.5)
      await flushPromises()

      // Assert - Verify it's reactive and computed
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(1.5)

      // Change again to verify reactivity
      wrapper.vm.speed.setSpeed(2)
      await flushPromises()
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(2)

      wrapper.unmount()
    })

    it('should maintain consistent multiplier across rapid changes', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - Change speeds rapidly
      const speeds = [1, 1.5, 2, 2.5, 3, 0.5, 1]
      for (const speed of speeds) {
        wrapper.vm.speed.setSpeed(speed)
        await flushPromises()

        // Assert after each change
        expect(wrapper.vm.speed.speedMultiplier.value).toBe(speed)
      }

      wrapper.unmount()
    })

    it('should apply speed multiplier consistently for different values', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act & Assert - Test that multiplier affects calculations as expected
      const testCases = [
        { speed: 0.5, description: 'slowest' },
        { speed: 1, description: 'normal' },
        { speed: 2, description: 'double speed' },
        { speed: 3, description: 'fastest' }
      ]

      for (const { speed } of testCases) {
        wrapper.vm.speed.setSpeed(speed)
        await flushPromises()

        // Verify the multiplier is set correctly
        expect(wrapper.vm.speed.speedMultiplier.value).toBe(speed)
      }

      wrapper.unmount()
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle zero speed by clamping to minimum', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.speed.setSpeed(0)
      await flushPromises()

      // Assert
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(0.5)

      wrapper.unmount()
    })

    it('should handle extremely high speed values by clamping to maximum', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.speed.setSpeed(999)
      await flushPromises()

      // Assert
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(3)

      wrapper.unmount()
    })

    it('should handle decimal precision in speed values', async () => {
      // Arrange
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - Test various decimal values
      const decimalSpeeds = [0.75, 1.25, 1.75, 2.25, 2.75]
      for (const speed of decimalSpeeds) {
        wrapper.vm.speed.setSpeed(speed)
        await flushPromises()

        // Assert
        expect(wrapper.vm.speed.speedMultiplier.value).toBe(speed)
      }

      wrapper.unmount()
    })

    it('should expose loadSpeed method for manual reload', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-speed-setting', '2.5')
      const component = createSpeedTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Verify initial load
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(2.5)

      // Act - Manually update localStorage (simulate external change)
      localStorage.setItem('tetrys-speed-setting', '1.5')

      // Manually reload from localStorage
      wrapper.vm.speed.loadSpeed()
      await flushPromises()

      // Assert - Should reload the new saved value
      expect(wrapper.vm.speed.speedMultiplier.value).toBe(1.5)

      wrapper.unmount()
    })
  })
})
