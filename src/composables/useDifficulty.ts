import { ref, computed } from 'vue'
import type { DifficultyLevel, DifficultyConfig } from '@/types/difficulty'
import {
  DIFFICULTY_CONFIGS,
  DIFFICULTY_STORAGE_KEY,
  DEFAULT_DIFFICULTY,
  isValidDifficulty
} from '@/types/difficulty'

// Shared state across all instances (singleton pattern)
const currentDifficulty = ref<DifficultyLevel>(DEFAULT_DIFFICULTY)
let isInitialized = false

export function useDifficulty() {
  // Get current difficulty config
  const difficultyConfig = computed<DifficultyConfig>(() => {
    return DIFFICULTY_CONFIGS[currentDifficulty.value]
  })

  // Individual computed properties for convenience
  const speedMultiplier = computed(() => difficultyConfig.value.speedMultiplier)
  const linesPerLevel = computed(() => difficultyConfig.value.linesPerLevel)
  const scoreMultiplier = computed(() => difficultyConfig.value.scoreMultiplier)
  const pieceWeights = computed(() => difficultyConfig.value.pieceWeights)

  // Save difficulty setting to localStorage
  const saveDifficulty = () => {
    try {
      localStorage.setItem(DIFFICULTY_STORAGE_KEY, currentDifficulty.value)
    } catch (error) {
      console.warn('Failed to save difficulty setting:', error)
    }
  }

  // Load difficulty setting from localStorage
  const loadDifficulty = () => {
    if (isInitialized) return

    try {
      const saved = localStorage.getItem(DIFFICULTY_STORAGE_KEY)

      if (saved && isValidDifficulty(saved)) {
        currentDifficulty.value = saved
      } else {
        currentDifficulty.value = DEFAULT_DIFFICULTY
      }
    } catch (error) {
      console.warn('Failed to load difficulty setting:', error)
      currentDifficulty.value = DEFAULT_DIFFICULTY
    }

    isInitialized = true
  }

  // Set difficulty
  const setDifficulty = (difficulty: DifficultyLevel) => {
    if (isValidDifficulty(difficulty)) {
      currentDifficulty.value = difficulty
      saveDifficulty()
    }
  }

  // All available difficulty configs (for UI)
  const availableDifficulties = computed(() => Object.values(DIFFICULTY_CONFIGS))

  // Initialize on first use
  loadDifficulty()

  return {
    // Current state
    currentDifficulty: computed(() => currentDifficulty.value),
    difficultyConfig,

    // Individual settings (for direct use in game logic)
    speedMultiplier,
    linesPerLevel,
    scoreMultiplier,
    pieceWeights,

    // Actions
    setDifficulty,
    loadDifficulty,

    // UI helpers
    availableDifficulties
  }
}
