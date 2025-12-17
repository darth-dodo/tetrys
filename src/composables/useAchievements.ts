import { ref, computed } from 'vue'
import { ACHIEVEMENTS } from '../data/achievements'
import { useGameBus } from './useGameBus'
import type {
  AchievementId,
  UnlockedAchievement,
  AchievementProgress,
  AchievementStats,
  Achievement,
  GameStats
} from '../types/achievements'

const STORAGE_KEY = 'tetris_achievements'
const MAX_PENDING_NOTIFICATIONS = 50

// Module-level event tracking state
let eventDrivenStats = {
  score: 0,
  level: 1,
  lines: 0,
  tetrisCount: 0,
  combo: 0,
  timePlayed: 0
}
let eventSubscriptionsInitialized = false

// Reactive state
const unlockedAchievements = ref<UnlockedAchievement[]>([])

// Pending notifications queue
const pendingNotifications = ref<Achievement[]>([])

// Check if achievement is unlocked (module-level for event subscriptions)
const isUnlocked = (achievementId: AchievementId): boolean => {
  return unlockedAchievements.value.some(unlock => unlock.achievementId === achievementId)
}

// Define progressive achievement dependencies (pure function)
const getRequiredPredecessor = (achievementId: AchievementId): AchievementId | null => {
  const progressionMap: Partial<Record<AchievementId, AchievementId>> = {
    // Level progression
    'level_3': 'level_2',
    'level_4': 'level_3',
    'level_5': 'level_4',
    'level_6': 'level_5',
    'level_7': 'level_6',
    'level_8': 'level_7',
    'level_9': 'level_8',
    'level_10': 'level_9',
    'level_11': 'level_10',
    'level_12': 'level_11',
    'level_13': 'level_12',
    'level_14': 'level_13',
    'level_15': 'level_14',
    'level_16': 'level_15',
    'level_17': 'level_16',
    'level_18': 'level_17',
    'level_19': 'level_18',
    'level_20': 'level_19',
    // Score progression
    'score_500': 'score_100',
    'score_1000': 'score_500',
    'score_2500': 'score_1000',
    'score_5000': 'score_2500',
    'score_10000': 'score_5000',
    'score_25000': 'score_10000',
    'score_50000': 'score_25000',
    'score_75000': 'score_50000',
    // Line progression
    'fifteen_lines': 'five_lines',
    'forty_lines': 'fifteen_lines',
    'fifty_lines': 'forty_lines',
    'line_150': 'fifty_lines',
    // Combo progression
    'combo_3': 'combo_2',
    'combo_4': 'combo_3',
    'combo_king': 'combo_4',
    'combo_6': 'combo_king',
    'combo_7': 'combo_6',
    'combo_8': 'combo_7',
    'combo_10': 'combo_8'
  }

  return progressionMap[achievementId] || null
}

// Helper function to evaluate a single condition (pure function)
const evaluateCondition = (
  condition: { type: string; value: number; operator: string },
  stats: {
    score?: number
    level?: number
    lines?: number
    tetrisCount?: number
    combo?: number
    timePlayed?: number
  }
): boolean => {
  let currentValue: number | undefined

  switch (condition.type) {
    case 'lines':
      currentValue = stats.lines
      break
    case 'score':
      currentValue = stats.score
      break
    case 'level':
      currentValue = stats.level
      break
    case 'tetris_count':
      currentValue = stats.tetrisCount
      break
    case 'combo':
      currentValue = stats.combo
      break
    case 'time_played':
      currentValue = stats.timePlayed
      break
  }

  if (currentValue === undefined) return false

  switch (condition.operator) {
    case 'gte':
      return currentValue >= condition.value
    case 'lte':
      return currentValue <= condition.value
    case 'eq':
      return currentValue === condition.value
    default:
      return false
  }
}

// Save error tracking (module-level for unlockAchievement)
const saveError = ref<string | null>(null)

// Save achievements to localStorage with atomic rollback (module-level for unlockAchievement)
const saveAchievements = () => {
  const backup = localStorage.getItem(STORAGE_KEY)

  try {
    const achievementsJson = JSON.stringify(unlockedAchievements.value)
    localStorage.setItem(STORAGE_KEY, achievementsJson)
    saveError.value = null
  } catch (error) {
    console.error('Failed to save achievements, rolling back:', error)

    try {
      if (backup !== null) {
        localStorage.setItem(STORAGE_KEY, backup)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (rollbackError) {
      console.error('Failed to rollback, localStorage may be corrupted:', rollbackError)
    }

    saveError.value = error instanceof Error
      ? `Failed to save: ${error.message}`
      : 'Failed to save achievements. Your progress may not be saved.'
  }
}

// Unlock an achievement (module-level for event subscriptions)
const unlockAchievement = (
  achievementId: AchievementId,
  gameStats?: GameStats
) => {
  if (isUnlocked(achievementId)) return

  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
  if (!achievement) return

  const unlock: UnlockedAchievement = {
    achievementId,
    unlockedAt: new Date(),
    gameStats
  }

  unlockedAchievements.value.push(unlock)

  // Add to notification queue if there's space
  const MAX_PENDING_NOTIFICATIONS = 50
  if (pendingNotifications.value.length < MAX_PENDING_NOTIFICATIONS) {
    pendingNotifications.value.push(achievement)
  } else {
    console.warn(`Notification queue full (${MAX_PENDING_NOTIFICATIONS}), skipping notification for: ${achievement.name}`)
  }

  // Emit achievement unlocked event
  const bus = useGameBus()
  bus.emit('achievement:unlocked', {
    id: achievement.id,
    rarity: achievement.rarity,
    timestamp: unlock.unlockedAt.getTime()
  })

  // Persist to localStorage
  saveAchievements()
}

// Session statistics tracking (RESERVED FOR FUTURE USE)
// NOTE: This feature is currently not connected to gameplay. The sessionStats ref exists
// and updateSessionStats() is exported for potential future statistics UI, but:
// - updateSessionStats() is never called during actual gameplay (only in tests)
// - Stats are NOT persisted to localStorage (would be meaningless without updates)
// - Tests use this API to verify the function works correctly
// This is intentional scaffolding for future enhancement - not a bug.
const sessionStats = ref({
  linesCleared: 0,
  tetrisCount: 0,
  maxCombo: 0,
  gamesPlayed: 0,
  totalLinesCleared: 0,
  timePlayed: 0
})

// Track if achievements have been initialized
let isInitialized = false

// Setup event subscriptions for reactive achievement unlocking
const setupEventSubscriptions = () => {
  if (eventSubscriptionsInitialized) return
  eventSubscriptionsInitialized = true

  const bus = useGameBus()

  // Reset stats when game starts
  bus.on('game:started', () => {
    eventDrivenStats = {
      score: 0,
      level: 1,
      lines: 0,
      tetrisCount: 0,
      combo: 0,
      timePlayed: 0
    }
  })

  // Helper to check achievements with progressive unlocking
  const checkWithCurrentStats = () => {
    const MAX_CHECKS = 25
    let checksPerformed = 0

    // Progressive unlock loop - allows cascade achievements
    while (checksPerformed < MAX_CHECKS) {
      const previousUnlockedCount = unlockedAchievements.value.length

      // Use the public checkAchievements method with current stats
      checkAchievementsInternal(eventDrivenStats)

      // If no new achievements unlocked, we're done
      if (unlockedAchievements.value.length === previousUnlockedCount) {
        break
      }

      checksPerformed++
    }

    if (checksPerformed >= MAX_CHECKS) {
      console.warn('⚠️ Achievement check limit reached. Some achievements may not have unlocked.')
    }
  }

  // Subscribe to game events
  bus.on('lines:cleared', (data: { count: number; isTetris?: boolean }) => {
    eventDrivenStats.lines += data.count
    if (data.isTetris) {
      eventDrivenStats.tetrisCount++
    }
    checkWithCurrentStats()
  })

  bus.on('score:updated', (data: { score: number }) => {
    eventDrivenStats.score = data.score
    checkWithCurrentStats()
  })

  bus.on('combo:updated', (data: { combo: number }) => {
    eventDrivenStats.combo = data.combo
    checkWithCurrentStats()
  })

  bus.on('time:tick', (data: { timePlayed: number }) => {
    eventDrivenStats.timePlayed = data.timePlayed
    checkWithCurrentStats()
  })
}

// Internal function that performs the actual checking logic
const checkAchievementsInternal = (stats: {
  score?: number
  level?: number
  lines?: number
  tetrisCount?: number
  combo?: number
  timePlayed?: number
}) => {
  // Sanitize all input values to prevent negative values causing incorrect unlocks
  // Only sanitize values that are actually provided (preserve undefined)
  const sanitizedStats = {
    score: stats.score !== undefined ? Math.max(0, stats.score) : undefined,
    level: stats.level !== undefined ? Math.max(0, stats.level) : undefined,
    lines: stats.lines !== undefined ? Math.max(0, stats.lines) : undefined,
    tetrisCount: stats.tetrisCount !== undefined ? Math.max(0, stats.tetrisCount) : undefined,
    combo: stats.combo !== undefined ? Math.max(0, stats.combo) : undefined,
    timePlayed: stats.timePlayed !== undefined ? Math.max(0, stats.timePlayed) : undefined
  }

  // Debug warning if any value was negative (helps catch bugs)
  if (import.meta.env.DEV) {
    const negativeValues = []
    if (stats.score !== undefined && stats.score < 0) negativeValues.push(`score: ${stats.score}`)
    if (stats.level !== undefined && stats.level < 0) negativeValues.push(`level: ${stats.level}`)
    if (stats.lines !== undefined && stats.lines < 0) negativeValues.push(`lines: ${stats.lines}`)
    if (stats.tetrisCount !== undefined && stats.tetrisCount < 0) negativeValues.push(`tetrisCount: ${stats.tetrisCount}`)
    if (stats.combo !== undefined && stats.combo < 0) negativeValues.push(`combo: ${stats.combo}`)
    if (stats.timePlayed !== undefined && stats.timePlayed < 0) negativeValues.push(`timePlayed: ${stats.timePlayed}`)

    if (negativeValues.length > 0) {
      console.warn('⚠️ Achievement check received negative values:', negativeValues.join(', '))
    }
  }

  // Snapshot currently unlocked achievements to prevent cascade unlocking within same call
  const unlockedSnapshot = new Set(unlockedAchievements.value.map(u => u.achievementId))

  ACHIEVEMENTS.forEach(achievement => {
    if (isUnlocked(achievement.id)) return

    // Check if prerequisite achievement is required and unlocked
    // Use snapshot to prevent checking achievements unlocked during this same call
    const prerequisite = getRequiredPredecessor(achievement.id)
    if (prerequisite && !unlockedSnapshot.has(prerequisite)) {
      return // Cannot unlock this achievement until prerequisite is unlocked
    }

    // Check primary condition with sanitized stats
    const primaryConditionMet = evaluateCondition(achievement.condition, sanitizedStats)
    if (!primaryConditionMet) return

    // Check additional conditions (all must be met) with sanitized stats
    if (achievement.additionalConditions && achievement.additionalConditions.length > 0) {
      const allAdditionalConditionsMet = achievement.additionalConditions.every(
        additionalCondition => evaluateCondition(additionalCondition, sanitizedStats)
      )
      if (!allAdditionalConditionsMet) return
    }

    // All conditions met - unlock achievement with sanitized stats
    unlockAchievement(achievement.id, {
      score: sanitizedStats.score ?? 0,
      level: sanitizedStats.level ?? 0,
      lines: sanitizedStats.lines ?? 0,
      tetrisCount: sanitizedStats.tetrisCount,
      combo: sanitizedStats.combo,
      timePlayed: sanitizedStats.timePlayed
    })
  })
}

export function useAchievements() {
  // Load achievements from localStorage
  const loadAchievements = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        unlockedAchievements.value = parsed.map((unlock: any) => ({
          ...unlock,
          unlockedAt: new Date(unlock.unlockedAt)
        }))
      } else {
        // Reset to empty when no data in localStorage
        unlockedAchievements.value = []
      }

      // Only clear pending notifications on first initialization
      // This prevents clearing notifications when useAchievements() is called multiple times
      if (!isInitialized) {
        pendingNotifications.value = []
      }

      // sessionStats is always reset to defaults (not persisted - see comment above)
      sessionStats.value = {
        linesCleared: 0,
        tetrisCount: 0,
        maxCombo: 0,
        gamesPlayed: 0,
        totalLinesCleared: 0,
        timePlayed: 0
      }
    } catch (error) {
      console.error('Failed to load achievements:', error)
      // Reset to defaults on error
      unlockedAchievements.value = []
      pendingNotifications.value = []
      sessionStats.value = {
        linesCleared: 0,
        tetrisCount: 0,
        maxCombo: 0,
        gamesPlayed: 0,
        totalLinesCleared: 0,
        timePlayed: 0
      }
    }
  }

  // Check achievement conditions (public API for backward compatibility)
  // Note: Uses module-level isUnlocked, unlockAchievement, evaluateCondition, getRequiredPredecessor
  const checkAchievements = (stats: {
    score?: number
    level?: number
    lines?: number
    tetrisCount?: number
    combo?: number
    timePlayed?: number
  }) => {
    // Delegate to internal implementation
    checkAchievementsInternal(stats)
  }

  // Get next notification from queue
  const getNextNotification = (): Achievement | null => {
    return pendingNotifications.value.shift() || null
  }

  // Clear all notifications
  const clearNotifications = () => {
    pendingNotifications.value = []
  }

  // Get achievement progress
  const getProgress = (achievementId: AchievementId, currentValue: number): AchievementProgress => {
    const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
    if (!achievement) {
      return {
        achievementId,
        currentValue: 0,
        targetValue: 0,
        percentage: 0
      }
    }

    const targetValue = achievement.condition.value
    const percentage = Math.min((currentValue / targetValue) * 100, 100)

    return {
      achievementId,
      currentValue,
      targetValue,
      percentage: Math.round(percentage)
    }
  }

  // Get achievement statistics
  const stats = computed<AchievementStats>(() => {
    const totalAchievements = ACHIEVEMENTS.length
    const unlockedCount = unlockedAchievements.value.length
    const percentage = Math.round((unlockedCount / totalAchievements) * 100)
    const recentUnlocks = [...unlockedAchievements.value]
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
      .slice(0, 5)

    return {
      totalAchievements,
      unlockedCount,
      percentage,
      recentUnlocks
    }
  })

  // Get all unlocked achievements
  const getUnlockedAchievements = computed(() => {
    return unlockedAchievements.value.map(unlock => {
      const achievement = ACHIEVEMENTS.find(a => a.id === unlock.achievementId)
      return achievement ? { ...achievement, ...unlock } : null
    }).filter(Boolean)
  })

  // Get locked achievements
  const getLockedAchievements = computed(() => {
    return ACHIEVEMENTS.filter(achievement => !isUnlocked(achievement.id))
  })

  // Update session stats
  const updateSessionStats = (update: Partial<typeof sessionStats.value>) => {
    sessionStats.value = { ...sessionStats.value, ...update }
    saveAchievements()
  }

  // Reset all achievements (for testing)
  const resetAchievements = () => {
    unlockedAchievements.value = []
    sessionStats.value = {
      linesCleared: 0,
      tetrisCount: 0,
      maxCombo: 0,
      gamesPlayed: 0,
      totalLinesCleared: 0,
      timePlayed: 0
    }
    pendingNotifications.value = []
    isInitialized = false // Reset initialization flag for tests
    saveAchievements()
  }

  // Clear save error (for UI dismissal)
  const clearSaveError = () => {
    saveError.value = null
  }

  // DEV: Trigger placeholder achievement (for testing UI)
  const triggerDevAchievement = (rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'legendary') => {
    const devAchievement: Achievement = {
      id: `dev_test_${Date.now()}` as AchievementId,
      name: rarity === 'legendary' ? '🎉 Dev Achievement!' :
            rarity === 'epic' ? '⚡ Epic Test!' :
            rarity === 'rare' ? '💎 Rare Test!' : '✨ Common Test!',
      description: `This is a ${rarity} placeholder achievement for development testing`,
      icon: rarity === 'legendary' ? '🏆' :
            rarity === 'epic' ? '🌟' :
            rarity === 'rare' ? '💫' : '⭐',
      category: 'gameplay',
      condition: {
        type: 'lines',
        value: 1,
        operator: 'gte'
      },
      rarity,
      rewardMessage: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} achievement triggered for dev testing!`
    }

    // Add to notification queue if there's space
    if (pendingNotifications.value.length < MAX_PENDING_NOTIFICATIONS) {
      pendingNotifications.value.push(devAchievement)
      console.log(`🎮 Dev Achievement Triggered (${rarity}):`, devAchievement)
    } else {
      console.warn(`Notification queue full (${MAX_PENDING_NOTIFICATIONS}), skipping dev achievement`)
    }
  }

  // Always load achievements (allows tests to reload), but only mark as initialized on first call
  if (!isInitialized) {
    isInitialized = true
  }
  loadAchievements()

  // Setup event subscriptions for reactive achievement tracking
  setupEventSubscriptions()

  return {
    // State
    unlockedAchievements: computed(() => unlockedAchievements.value),
    stats,
    sessionStats: computed(() => sessionStats.value),
    pendingNotifications: computed(() => pendingNotifications.value),
    saveError: computed(() => saveError.value),

    // Computed
    getUnlockedAchievements,
    getLockedAchievements,

    // Methods
    isUnlocked,
    unlockAchievement,
    checkAchievements,
    getProgress,
    getNextNotification,
    clearNotifications,
    updateSessionStats,
    resetAchievements,
    clearSaveError,

    // Dev Tools
    triggerDevAchievement
  }
}
