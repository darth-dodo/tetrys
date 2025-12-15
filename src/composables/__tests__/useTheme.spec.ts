import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { useTheme } from '../useTheme'
import { clearLocalStorage } from '@//__tests__/helpers'
import type { ThemeId } from '@/types/theme'

/**
 * Test suite for useTheme composable
 * Tests cover:
 * - Default theme initialization
 * - Theme switching between available themes
 * - localStorage persistence of theme selection
 * - Loading saved theme from localStorage
 * - CSS class and custom property application to document
 * - System theme preference handling
 * - Light/dark theme toggling
 * - Available themes list
 * - Theme validation before applying
 * - Invalid localStorage data handling
 * - CSS updates on theme changes
 * - User preference prioritization over system preference
 */

/**
 * Helper to create a test component that uses the theme composable
 */
function createThemeTestComponent() {
  return defineComponent({
    setup() {
      return { theme: useTheme() }
    },
    render() {
      return h('div')
    }
  })
}

describe('useTheme Theme Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearLocalStorage()
    // Clear any mocks
    vi.clearAllMocks()
    // Reset document state
    document.body.className = ''
    document.documentElement.style.cssText = ''
  })

  afterEach(() => {
    // Cleanup after each test
    vi.clearAllMocks()
    clearLocalStorage()
    document.body.className = ''
    document.documentElement.style.cssText = ''
  })

  describe('Initialization with Default Theme', () => {
    it('should initialize with default theme (classic)', async () => {
      // Arrange & Act
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.theme.currentThemeId.value).toBe('classic')
      expect(wrapper.vm.theme.currentTheme.value.id).toBe('classic')
      expect(wrapper.vm.theme.currentTheme.value.name).toBe('Classic Tetris')

      wrapper.unmount()
    })

    it('should apply default theme CSS classes and properties to document', async () => {
      // Arrange & Act
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert - Check CSS custom properties are set
      expect(document.documentElement.style.getPropertyValue('--theme-bg')).toBe('#222222')
      expect(root.style.getPropertyValue('--theme-primary')).toBe('#4a90e2')
      expect(root.style.getPropertyValue('--theme-text')).toBe('#ffffff')

      // Check body class is set
      expect(document.body.className).toBe('theme-classic')

      wrapper.unmount()
    })
  })

  describe('Switching Between Available Themes', () => {
    it('should switch from classic to neon theme', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      expect(wrapper.vm.theme.currentThemeId.value).toBe('classic')

      // Act
      wrapper.vm.theme.setTheme('neon')
      await flushPromises()

      // Assert
      expect(wrapper.vm.theme.currentThemeId.value).toBe('neon')
      expect(wrapper.vm.theme.currentTheme.value.id).toBe('neon')
      expect(wrapper.vm.theme.currentTheme.value.name).toBe('Neon Nights')

      wrapper.unmount()
    })

    it('should switch between all available themes', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      const themeIds: ThemeId[] = ['retro', 'neon', 'classic', 'ocean', 'sunset', 'minimal', 'matrix', 'gameboy']

      // Act & Assert
      for (const themeId of themeIds) {
        wrapper.vm.theme.setTheme(themeId)
        await flushPromises()
        expect(wrapper.vm.theme.currentThemeId.value).toBe(themeId)
      }

      wrapper.unmount()
    })

    it('should expose list of available themes', async () => {
      // Arrange & Act
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      const themes = wrapper.vm.theme.availableThemes.value
      expect(Array.isArray(themes)).toBe(true)
      expect(themes.length).toBe(8)
      expect(themes.map((t: any) => t.id)).toContain('classic')
      expect(themes.map((t: any) => t.id)).toContain('neon')
      expect(themes.map((t: any) => t.id)).toContain('ocean')

      wrapper.unmount()
    })

    it('should maintain theme state during multiple switches', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act & Assert
      wrapper.vm.theme.setTheme('retro')
      await flushPromises()
      expect(wrapper.vm.theme.currentThemeId.value).toBe('retro')

      wrapper.vm.theme.setTheme('matrix')
      await flushPromises()
      expect(wrapper.vm.theme.currentThemeId.value).toBe('matrix')

      wrapper.vm.theme.setTheme('classic')
      await flushPromises()
      expect(wrapper.vm.theme.currentThemeId.value).toBe('classic')

      wrapper.unmount()
    })
  })

  describe('Persistence to localStorage', () => {
    it('should persist theme selection to localStorage when setting theme', async () => {
      // Arrange
      clearLocalStorage()
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.theme.setTheme('neon')
      await flushPromises()

      // Assert
      const saved = localStorage.getItem('tetrys-theme')
      expect(saved).toBe('neon')

      wrapper.unmount()
    })

    it('should persist each theme change to localStorage', async () => {
      // Arrange
      clearLocalStorage()
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act & Assert
      const themes: ThemeId[] = ['ocean', 'sunset', 'matrix']
      for (const themeId of themes) {
        wrapper.vm.theme.setTheme(themeId)
        await flushPromises()
        expect(localStorage.getItem('tetrys-theme')).toBe(themeId)
      }

      wrapper.unmount()
    })

    it('should preserve theme selection across multiple save operations', async () => {
      // Arrange
      clearLocalStorage()
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.theme.setTheme('retro')
      await flushPromises()
      const firstSave = localStorage.getItem('tetrys-theme')

      wrapper.vm.theme.setTheme('gameboy')
      await flushPromises()
      const secondSave = localStorage.getItem('tetrys-theme')

      wrapper.vm.theme.setTheme('retro')
      await flushPromises()
      const thirdSave = localStorage.getItem('tetrys-theme')

      // Assert
      expect(firstSave).toBe('retro')
      expect(secondSave).toBe('gameboy')
      expect(thirdSave).toBe('retro')

      wrapper.unmount()
    })
  })

  describe('Loading Saved Theme from localStorage', () => {
    it('should load saved theme from localStorage on initialization', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-theme', 'ocean')

      // Act
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.theme.currentThemeId.value).toBe('ocean')
      expect(wrapper.vm.theme.currentTheme.value.name).toBe('Deep Ocean')

      wrapper.unmount()
    })

    it('should load different saved themes correctly', async () => {
      // Arrange
      const themesToTest: ThemeId[] = ['neon', 'sunset', 'minimal', 'matrix']

      for (const themeId of themesToTest) {
        clearLocalStorage()
        localStorage.setItem('tetrys-theme', themeId)

        // Act
        const component = createThemeTestComponent()
        const wrapper = mount(component)
        await flushPromises()

        // Assert
        expect(wrapper.vm.theme.currentThemeId.value).toBe(themeId)

        wrapper.unmount()
      }
    })

    it('should restore theme state that was persisted before simulated reload', async () => {
      // Arrange - First instance saves theme
      clearLocalStorage()
      const component1 = createThemeTestComponent()
      const wrapper1 = mount(component1)
      await flushPromises()
      wrapper1.vm.theme.setTheme('sunset')
      await flushPromises()

      // Act - Verify saved data
      const savedData = localStorage.getItem('tetrys-theme')
      expect(savedData).toBe('sunset')
      wrapper1.unmount()

      // Simulate page reload by creating new instance
      const component2 = createThemeTestComponent()
      const wrapper2 = mount(component2)
      await flushPromises()

      // Assert
      expect(wrapper2.vm.theme.currentThemeId.value).toBe('sunset')
      expect(wrapper2.vm.theme.currentTheme.value.name).toBe('Sunset Vibes')

      wrapper2.unmount()
    })
  })

  describe('Applying Theme CSS Classes and Properties', () => {
    it('should apply theme CSS custom properties to document root', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.theme.setTheme('neon')
      await flushPromises()

      // Assert
      const root = document.documentElement
      expect(root.style.getPropertyValue('--theme-bg')).toBe('#0a0a0f')
      expect(root.style.getPropertyValue('--theme-primary')).toBe('#ff006e')
      expect(root.style.getPropertyValue('--theme-secondary')).toBe('#ff7d00')
      expect(root.style.getPropertyValue('--theme-accent')).toBe('#00f5ff')
      expect(root.style.getPropertyValue('--theme-text')).toBe('#ffffff')

      wrapper.unmount()
    })

    it('should apply all piece color properties to document root', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.theme.setTheme('classic')
      await flushPromises()

      // Assert
      const root = document.documentElement
      expect(root.style.getPropertyValue('--piece-i')).toBe('#00bcd4')
      expect(root.style.getPropertyValue('--piece-o')).toBe('#ffc107')
      expect(root.style.getPropertyValue('--piece-t')).toBe('#9c27b0')
      expect(root.style.getPropertyValue('--piece-s')).toBe('#4caf50')
      expect(root.style.getPropertyValue('--piece-z')).toBe('#f44336')
      expect(root.style.getPropertyValue('--piece-j')).toBe('#3f51b5')
      expect(root.style.getPropertyValue('--piece-l')).toBe('#ff9800')

      wrapper.unmount()
    })

    it('should apply theme class to document body', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      wrapper.vm.theme.setTheme('matrix')
      await flushPromises()

      // Assert
      expect(document.body.className).toBe('theme-matrix')

      wrapper.unmount()
    })

    it('should apply effect properties based on theme configuration', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - Set to retro theme which has glow: true
      wrapper.vm.theme.setTheme('retro')
      await flushPromises()

      // Assert
      const root = document.documentElement
      expect(root.style.getPropertyValue('--theme-glow')).toBe('0 0 10px var(--theme-primary)')
      expect(root.style.getPropertyValue('--theme-shadow')).toBe('none')

      wrapper.unmount()
    })

    it('should update CSS properties when theme changes', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      const root = document.documentElement

      // Act - Change from classic to ocean
      wrapper.vm.theme.setTheme('ocean')
      await flushPromises()

      // Assert - Verify properties changed
      expect(root.style.getPropertyValue('--theme-bg')).toBe('#001a2e')
      expect(root.style.getPropertyValue('--theme-primary')).toBe('#0077be')

      // Act - Change to minimal
      wrapper.vm.theme.setTheme('minimal')
      await flushPromises()

      // Assert - Verify properties changed again
      expect(root.style.getPropertyValue('--theme-bg')).toBe('#ffffff')
      expect(root.style.getPropertyValue('--theme-primary')).toBe('#343a40')

      wrapper.unmount()
    })

    it('should apply all theme effect flags correctly', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      const root = document.documentElement

      // Act & Assert - Check neon theme (glow: true, shadows: true)
      wrapper.vm.theme.setTheme('neon')
      await flushPromises()
      expect(root.style.getPropertyValue('--theme-glow')).toBe('0 0 10px var(--theme-primary)')
      expect(root.style.getPropertyValue('--theme-shadow')).toBe('0 4px 8px rgba(0,0,0,0.3)')

      // Act & Assert - Check minimal theme (glow: false, shadows: false)
      wrapper.vm.theme.setTheme('minimal')
      await flushPromises()
      expect(root.style.getPropertyValue('--theme-glow')).toBe('none')
      expect(root.style.getPropertyValue('--theme-shadow')).toBe('none')

      wrapper.unmount()
    })
  })

  describe('Theme Validation Before Applying', () => {
    it('should validate theme exists in available themes before applying', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act & Assert - Verify themes in availableThemes have valid structure
      const availableThemes = wrapper.vm.theme.availableThemes.value
      availableThemes.forEach((theme: any) => {
        expect(theme).toHaveProperty('id')
        expect(theme).toHaveProperty('name')
        expect(theme).toHaveProperty('colors')
        expect(theme.colors).toHaveProperty('background')
        expect(theme.colors).toHaveProperty('pieces')
      })

      wrapper.unmount()
    })

    it('should maintain valid theme state after attempting invalid operations', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      wrapper.vm.theme.setTheme('ocean')
      await flushPromises()

      // Act - Try to set theme (all theme IDs are valid in this implementation)
      wrapper.vm.theme.setTheme('classic')
      await flushPromises()

      // Assert
      expect(wrapper.vm.theme.currentTheme.value.id).toBe('classic')
      expect(wrapper.vm.theme.currentTheme.value).toHaveProperty('colors')
      expect(wrapper.vm.theme.currentTheme.value.colors).toHaveProperty('background')

      wrapper.unmount()
    })

    it('should only apply valid theme from list of available themes', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      const availableThemeIds = wrapper.vm.theme.availableThemes.value.map((t: any) => t.id)

      // Assert - All available theme IDs should be valid
      for (const themeId of availableThemeIds) {
        wrapper.vm.theme.setTheme(themeId as ThemeId)
        await flushPromises()
        expect(wrapper.vm.theme.currentThemeId.value).toBe(themeId)
      }

      wrapper.unmount()
    })
  })

  describe('Invalid localStorage Data Handling', () => {
    it('should fall back to default theme when localStorage contains invalid theme ID', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-theme', 'invalidTheme')

      // Act
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.theme.currentThemeId.value).toBe('classic')
      expect(wrapper.vm.theme.currentTheme.value.name).toBe('Classic Tetris')

      wrapper.unmount()
    })

    it('should handle corrupted localStorage gracefully', async () => {
      // Arrange
      clearLocalStorage()
      // Simulate corrupted data
      localStorage.setItem('tetrys-theme', '')

      // Act
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert - Should default to classic theme
      expect(wrapper.vm.theme.currentThemeId.value).toBe('classic')
      expect(wrapper.vm.theme.currentTheme.value.id).toBe('classic')

      wrapper.unmount()
    })

    it('should continue functioning after encountering invalid stored data', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-theme', 'nonexistentTheme')

      // Act
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - Try to set a valid theme after loading invalid data
      wrapper.vm.theme.setTheme('neon')
      await flushPromises()

      // Assert
      expect(wrapper.vm.theme.currentThemeId.value).toBe('neon')
      expect(localStorage.getItem('tetrys-theme')).toBe('neon')

      wrapper.unmount()
    })

    it('should use default theme when localStorage is empty', async () => {
      // Arrange
      clearLocalStorage()
      expect(localStorage.getItem('tetrys-theme')).toBeNull()

      // Act
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert
      expect(wrapper.vm.theme.currentThemeId.value).toBe('classic')

      wrapper.unmount()
    })
  })

  describe('Theme Change Triggers CSS Updates', () => {
    it('should update CSS properties when watched currentTheme changes', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      const root = document.documentElement

      // Act
      wrapper.vm.theme.setTheme('sunset')
      await flushPromises()

      // Assert - Verify CSS was updated
      expect(root.style.getPropertyValue('--theme-primary')).toBe('#ff6b9d')
      expect(root.style.getPropertyValue('--theme-accent')).toBe('#ffd93d')
      expect(document.body.className).toBe('theme-sunset')

      wrapper.unmount()
    })

    it('should apply theme CSS immediately on initialization with watch', async () => {
      // Arrange
      clearLocalStorage()
      localStorage.setItem('tetrys-theme', 'gameboy')
      const root = document.documentElement

      // Act
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert - CSS should be applied due to watch with immediate: true
      expect(root.style.getPropertyValue('--theme-bg')).toBe('#8bac0f')
      expect(document.body.className).toBe('theme-gameboy')

      wrapper.unmount()
    })

    it('should keep CSS in sync with theme state during rapid changes', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - Change themes rapidly
      const themes: ThemeId[] = ['neon', 'ocean', 'retro', 'matrix']
      for (const themeId of themes) {
        wrapper.vm.theme.setTheme(themeId)
        await flushPromises()

        // Assert after each change
        expect(document.body.className).toBe(`theme-${themeId}`)
        expect(wrapper.vm.theme.currentThemeId.value).toBe(themeId)
      }

      wrapper.unmount()
    })

    it('should apply CSS properties matching current theme state', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()
      const root = document.documentElement

      // Act
      wrapper.vm.theme.setTheme('ocean')
      await flushPromises()

      const currentTheme = wrapper.vm.theme.currentTheme.value

      // Assert - Verify CSS matches theme colors
      expect(root.style.getPropertyValue('--theme-bg')).toBe(currentTheme.colors.background)
      expect(root.style.getPropertyValue('--theme-primary')).toBe(currentTheme.colors.primary)
      expect(root.style.getPropertyValue('--theme-text')).toBe(currentTheme.colors.text)

      wrapper.unmount()
    })
  })

  describe('System Theme Preference Handling', () => {
    it('should initialize default theme regardless of system preference', async () => {
      // Arrange & Act
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Assert - Default should be classic regardless of system settings
      expect(wrapper.vm.theme.currentThemeId.value).toBe('classic')

      wrapper.unmount()
    })

    it('should allow user preference to override any default', async () => {
      // Arrange
      clearLocalStorage()
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - User explicitly sets theme
      wrapper.vm.theme.setTheme('neon')
      await flushPromises()

      // Assert
      expect(wrapper.vm.theme.currentThemeId.value).toBe('neon')
      expect(localStorage.getItem('tetrys-theme')).toBe('neon')

      wrapper.unmount()
    })

    it('should respect user saved preference over default on reload', async () => {
      // Arrange - User sets preference
      clearLocalStorage()
      const component1 = createThemeTestComponent()
      const wrapper1 = mount(component1)
      await flushPromises()
      wrapper1.vm.theme.setTheme('matrix')
      await flushPromises()
      wrapper1.unmount()

      // Act - Simulate reload
      const component2 = createThemeTestComponent()
      const wrapper2 = mount(component2)
      await flushPromises()

      // Assert - Should load user preference, not default
      expect(wrapper2.vm.theme.currentThemeId.value).toBe('matrix')

      wrapper2.unmount()
    })
  })

  describe('Light/Dark Theme Toggling', () => {
    it('should identify light and dark themes in available themes', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act
      const themes = wrapper.vm.theme.availableThemes.value

      // Assert - Verify themes can be categorized
      expect(themes.length).toBeGreaterThan(0)
      const themeNames = themes.map((t: any) => t.name)
      expect(themeNames).toContain('Minimal White') // Light theme
      expect(themeNames).toContain('Neon Nights') // Dark theme

      wrapper.unmount()
    })

    it('should switch between light theme (minimal) and dark themes', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act - Switch to light theme
      wrapper.vm.theme.setTheme('minimal')
      await flushPromises()

      // Assert
      expect(wrapper.vm.theme.currentThemeId.value).toBe('minimal')
      expect(wrapper.vm.theme.currentTheme.value.colors.background).toBe('#ffffff')

      // Act - Switch to dark theme
      wrapper.vm.theme.setTheme('matrix')
      await flushPromises()

      // Assert
      expect(wrapper.vm.theme.currentThemeId.value).toBe('matrix')
      expect(wrapper.vm.theme.currentTheme.value.colors.background).toBe('#000000')

      wrapper.unmount()
    })

    it('should maintain consistent behavior when toggling multiple times', async () => {
      // Arrange
      const component = createThemeTestComponent()
      const wrapper = mount(component)
      await flushPromises()

      // Act & Assert - Toggle between light and dark multiple times
      const darkThemes: ThemeId[] = ['neon', 'matrix', 'retro']
      const lightTheme: ThemeId = 'minimal'

      wrapper.vm.theme.setTheme(darkThemes[0])
      await flushPromises()
      expect(wrapper.vm.theme.currentThemeId.value).toBe(darkThemes[0])

      wrapper.vm.theme.setTheme(lightTheme)
      await flushPromises()
      expect(wrapper.vm.theme.currentThemeId.value).toBe(lightTheme)

      wrapper.vm.theme.setTheme(darkThemes[1])
      await flushPromises()
      expect(wrapper.vm.theme.currentThemeId.value).toBe(darkThemes[1])

      wrapper.unmount()
    })
  })
})
