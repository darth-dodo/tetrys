import { ref, computed } from 'vue'
import { ACHIEVEMENTS } from '../data/achievements'
import type { 
  AchievementId, 
  UnlockedAchievement, 
  AchievementProgress,
  AchievementStats,
  Achievement 
} from '../types/achievements'

const STORAGE_KEY = 'tetris_achievements'
const STATS_KEY = 'tetris_achievement_stats'

// Reactive state
const unlockedAchievements = ref<UnlockedAchievement[]>([])
const sessionStats = ref({
  linesCleared: 0,
  tetrisCount: 0,
  maxCombo: 0,
  gamesPlayed: 0,
  totalLinesCleared: 0,
  timePlayed: 0
})

// Pending notifications queue
const pendingNotifications = ref<Achievement[]>([])

// Track if achievements have been initialized
let isInitialized = false

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

      const storedStats = localStorage.getItem(STATS_KEY)
      if (storedStats) {
        // Reset to defaults first, then merge with loaded stats
        const defaultStats = {
          linesCleared: 0,
          tetrisCount: 0,
          maxCombo: 0,
          gamesPlayed: 0,
          totalLinesCleared: 0,
          timePlayed: 0
        }
        sessionStats.value = { ...defaultStats, ...JSON.parse(storedStats) }
      } else {
        // Reset to defaults when no stats in localStorage
        sessionStats.value = {
          linesCleared: 0,
          tetrisCount: 0,
          maxCombo: 0,
          gamesPlayed: 0,
          totalLinesCleared: 0,
          timePlayed: 0
        }
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

  // Save achievements to localStorage
  const saveAchievements = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(unlockedAchievements.value))
      localStorage.setItem(STATS_KEY, JSON.stringify(sessionStats.value))
    } catch (error) {
      console.error('Failed to save achievements:', error)
    }
  }

  // Check if achievement is unlocked
  const isUnlocked = (achievementId: AchievementId): boolean => {
    return unlockedAchievements.value.some(unlock => unlock.achievementId === achievementId)
  }

  // Unlock an achievement
  const unlockAchievement = (
    achievementId: AchievementId,
    gameStats?: { score: number; level: number; lines: number }
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
    pendingNotifications.value.push(achievement)
    saveAchievements()
  }

  // Check achievement conditions
  const checkAchievements = (stats: {
    score?: number
    level?: number
    lines?: number
    tetrisCount?: number
    combo?: number
    timePlayed?: number
  }) => {
    ACHIEVEMENTS.forEach(achievement => {
      if (isUnlocked(achievement.id)) return

      const { condition } = achievement
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

      if (currentValue === undefined) return

      let conditionMet = false
      switch (condition.operator) {
        case 'gte':
          conditionMet = currentValue >= condition.value
          break
        case 'lte':
          conditionMet = currentValue <= condition.value
          break
        case 'eq':
          conditionMet = currentValue === condition.value
          break
      }

      if (conditionMet) {
        unlockAchievement(achievement.id, {
          score: stats.score || 0,
          level: stats.level || 0,
          lines: stats.lines || 0
        })
      }
    })
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

    pendingNotifications.value.push(devAchievement)
    console.log(`🎮 Dev Achievement Triggered (${rarity}):`, devAchievement)
  }

  // Always load achievements (allows tests to reload), but only mark as initialized on first call
  if (!isInitialized) {
    isInitialized = true
  }
  loadAchievements()

  return {
    // State
    unlockedAchievements: computed(() => unlockedAchievements.value),
    stats,
    sessionStats: computed(() => sessionStats.value),
    pendingNotifications: computed(() => pendingNotifications.value),

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

    // Dev Tools
    triggerDevAchievement
  }
}
