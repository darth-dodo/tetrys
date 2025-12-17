import { ref, computed, watch, onMounted, getCurrentInstance } from 'vue'
import type { Theme, ThemeId } from '@/types/theme'
import { themes } from '@/types/theme'

const THEME_STORAGE_KEY = 'tetrys-theme'

const currentThemeId = ref<ThemeId>('classic')

export function useTheme() {
  const currentTheme = computed<Theme>(() => themes[currentThemeId.value])
  
  const availableThemes = computed(() => Object.values(themes))
  
  const setTheme = (themeId: ThemeId) => {
    currentThemeId.value = themeId
    applyThemeToDocument(themes[themeId])
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
  }
  
  const applyThemeToDocument = (theme: Theme) => {
    const root = document.documentElement
    
    // Apply CSS custom properties
    root.style.setProperty('--theme-bg', theme.colors.background)
    root.style.setProperty('--theme-surface', theme.colors.surface)
    root.style.setProperty('--theme-primary', theme.colors.primary)
    root.style.setProperty('--theme-secondary', theme.colors.secondary)
    root.style.setProperty('--theme-accent', theme.colors.accent)
    root.style.setProperty('--theme-text', theme.colors.text)
    root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary)
    root.style.setProperty('--theme-border', theme.colors.border)
    
    // Apply piece colors
    Object.entries(theme.colors.pieces).forEach(([piece, color]) => {
      root.style.setProperty(`--piece-${piece.toLowerCase()}`, color)
    })
    
    // Apply effects
    root.style.setProperty('--theme-glow', theme.effects?.glow ? '0 0 10px var(--theme-primary)' : 'none')
    root.style.setProperty('--theme-shadow', theme.effects?.shadows ? '0 4px 8px rgba(0,0,0,0.3)' : 'none')
    
    // Add theme class to body
    document.body.className = `theme-${theme.id}`
  }
  
  const loadSavedTheme = () => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved && themes[saved as ThemeId]) {
      setTheme(saved as ThemeId)
    } else {
      setTheme('classic')
    }
  }
  
  // Watch for theme changes
  watch(currentTheme, (newTheme) => {
    applyThemeToDocument(newTheme)
  }, { immediate: true })
  
  // Load saved theme on mount - only register if in component context
  if (getCurrentInstance()) {
    onMounted(() => {
      loadSavedTheme()
    })
  }
  
  return {
    currentTheme,
    currentThemeId: computed(() => currentThemeId.value),
    availableThemes,
    setTheme
  }
}