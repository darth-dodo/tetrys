import { ref, watch } from 'vue'

const VIBRATION_KEY = 'tetris-vibration-enabled'

// Global state for vibration settings
const isVibrationEnabled = ref(true)

// Initialize from localStorage
const initializeVibration = () => {
  try {
    const stored = localStorage.getItem(VIBRATION_KEY)
    if (stored !== null) {
      isVibrationEnabled.value = JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load vibration setting:', error)
  }
}

// Save to localStorage when changed
watch(isVibrationEnabled, (newValue) => {
  try {
    localStorage.setItem(VIBRATION_KEY, JSON.stringify(newValue))
  } catch (error) {
    console.warn('Failed to save vibration setting:', error)
  }
})

// Enhanced vibration patterns for different actions
const vibratePattern = (action: string) => {
  // Check if vibration is enabled and available
  if (!isVibrationEnabled.value || !('vibrate' in navigator)) return
  
  switch (action) {
    case 'left':
    case 'right':
      navigator.vibrate(8) // Short pulse for movement
      break
    case 'down':
      navigator.vibrate(12) // Slightly longer for down movement
      break
    case 'rotate':
      navigator.vibrate([8, 20, 8]) // Double pulse for rotation
      break
    case 'drop':
      navigator.vibrate([15, 30, 15, 30, 15]) // Strong pattern for drop
      break
    case 'pause':
      navigator.vibrate([25, 50, 25]) // Distinctive pause pattern
      break
    case 'reset':
      navigator.vibrate([10, 30, 10, 30, 10, 30, 10]) // Alert pattern for reset
      break
    case 'resume':
      navigator.vibrate([8, 20, 8]) // Double pulse for resume
      break
    case 'tap':
      navigator.vibrate([8, 20, 8]) // Double pulse for tap/rotate
      break
    case 'hard-drop':
      navigator.vibrate([15, 30, 15, 30, 15]) // Strong pattern for hard drop
      break
    case 'movement':
      navigator.vibrate(10) // Single pulse for movement
      break
    default:
      navigator.vibrate(10) // Default light vibration
  }
}

// Simple vibration function for custom patterns
const vibrate = (pattern: number | number[]) => {
  if (!isVibrationEnabled.value || !('vibrate' in navigator)) return
  navigator.vibrate(pattern)
}

export const useVibration = () => {
  // Initialize on first use
  if (typeof window !== 'undefined') {
    initializeVibration()
  }

  const toggleVibration = () => {
    isVibrationEnabled.value = !isVibrationEnabled.value
  }

  const setVibration = (enabled: boolean) => {
    isVibrationEnabled.value = enabled
  }

  return {
    isVibrationEnabled,
    toggleVibration,
    setVibration,
    vibratePattern,
    vibrate,
    isVibrationSupported: 'vibrate' in navigator
  }
}