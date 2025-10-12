export type AchievementId = 
  | 'first_blood'
  | 'tetris_novice'
  | 'tetris_master'
  | 'speed_demon'
  | 'marathon_runner'
  | 'combo_king'
  | 'perfect_start'
  | 'centurion'
  | 'level_ten'
  | 'level_twenty'
  | 'quick_fingers'
  | 'line_clearer'
  | 'unstoppable'

export type AchievementCategory = 'gameplay' | 'scoring' | 'progression' | 'skill'

export interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string
  category: AchievementCategory
  condition: {
    type: 'lines' | 'score' | 'level' | 'tetris_count' | 'combo' | 'games_played' | 'time_played'
    value: number
    operator: 'gte' | 'lte' | 'eq'
  }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  rewardMessage?: string
}

export interface UnlockedAchievement {
  achievementId: AchievementId
  unlockedAt: Date
  gameStats?: {
    score: number
    level: number
    lines: number
  }
}

export interface AchievementProgress {
  achievementId: AchievementId
  currentValue: number
  targetValue: number
  percentage: number
}

export interface AchievementStats {
  totalAchievements: number
  unlockedCount: number
  percentage: number
  recentUnlocks: UnlockedAchievement[]
}
