export type AchievementId =
  | 'audio_enthusiast'
  | 'centurion'
  | 'combo_10'
  | 'combo_2'
  | 'combo_3'
  | 'combo_4'
  | 'combo_6'
  | 'combo_7'
  | 'combo_8'
  | 'combo_king'
  | 'comeback_kid'
  | 'dedicated'
  | 'early_bird'
  | 'fifteen_lines'
  | 'fifty_lines'
  | 'first_blood'
  | 'five_lines'
  | 'forty_lines'
  | 'level_10'
  | 'level_11'
  | 'level_12'
  | 'level_13'
  | 'level_14'
  | 'level_15'
  | 'level_16'
  | 'level_17'
  | 'level_18'
  | 'level_19'
  | 'level_2'
  | 'level_20'
  | 'level_3'
  | 'level_4'
  | 'level_5'
  | 'level_6'
  | 'level_7'
  | 'level_8'
  | 'level_9'
  | 'level_ten'
  | 'level_twenty'
  | 'line_150'
  | 'line_clearer'
  | 'line_destroyer'
  | 'marathon_runner'
  | 'night_owl'
  | 'obsessed'
  | 'perfect_start'
  | 'persistent'
  | 'practice_makes_perfect'
  | 'quick_fingers'
  | 'score_100'
  | 'score_1000'
  | 'score_10000'
  | 'score_2500'
  | 'score_25000'
  | 'score_500'
  | 'score_5000'
  | 'score_50000'
  | 'score_75000'
  | 'seventy_five_lines'
  | 'speed_demon'
  | 'speed_lover'
  | 'ten_lines'
  | 'tetris_15'
  | 'tetris_2'
  | 'tetris_3'
  | 'tetris_5'
  | 'tetris_7'
  | 'tetris_master'
  | 'tetris_novice'
  | 'theme_explorer'
  | 'thirty_lines'
  | 'twenty_lines'
  | 'unstoppable'
  | 'weekend_warrior'
  | 'welcome'
  | 'zen_master'

export type AchievementCategory = 'gameplay' | 'scoring' | 'progression' | 'skill' | 'special'

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
