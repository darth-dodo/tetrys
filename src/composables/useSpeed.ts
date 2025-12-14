import { ref, computed, onMounted } from 'vue'

const SPEED_STORAGE_KEY = 'tetrys-speed-setting'
const DEFAULT_SPEED = 1

// Speed multiplier (shared across all instances)
const speedMultiplier = ref(DEFAULT_SPEED)

export function useSpeed() {
  // Save speed setting to localStorage
  const saveSpeed = () => {
    localStorage.setItem(SPEED_STORAGE_KEY, speedMultiplier.value.toString())
  }
  
  // Load speed setting from localStorage
  const loadSpeed = () => {
    const saved = localStorage.getItem(SPEED_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = parseFloat(saved)
        if (!isNaN(parsed) && parsed >= 0.5 && parsed <= 3) {
          speedMultiplier.value = parsed
        } else {
          // Invalid range - reset to default
          speedMultiplier.value = DEFAULT_SPEED
        }
      } catch (e) {
        speedMultiplier.value = DEFAULT_SPEED
      }
    } else {
      // No saved data - reset to default
      speedMultiplier.value = DEFAULT_SPEED
    }
  }
  
  // Set speed multiplier
  const setSpeed = (speed: number) => {
    speedMultiplier.value = Math.max(0.5, Math.min(3, speed))
    saveSpeed()
  }
  
  // Load settings on mount
  onMounted(() => {
    loadSpeed()
  })
  
  return {
    speedMultiplier: computed(() => speedMultiplier.value),
    setSpeed,
    loadSpeed
  }
}