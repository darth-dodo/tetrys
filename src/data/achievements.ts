import type { Achievement } from '../types/achievements'

export const ACHIEVEMENTS: Achievement[] = [
  // Gameplay Category
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Clear your first line',
    icon: '🎯',
    category: 'gameplay',
    condition: {
      type: 'lines',
      value: 1,
      operator: 'gte'
    },
    rarity: 'common',
    rewardMessage: 'You\'ve cleared your first line! Keep going!'
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Clear 100 lines in a single game',
    icon: '💯',
    category: 'gameplay',
    condition: {
      type: 'lines',
      value: 100,
      operator: 'gte'
    },
    rarity: 'rare',
    rewardMessage: 'Century cleared! Your stacking skills are impressive!'
  },
  {
    id: 'marathon_runner',
    name: 'Marathon Runner',
    description: 'Clear 200 lines in a single game',
    icon: '🏃',
    category: 'gameplay',
    condition: {
      type: 'lines',
      value: 200,
      operator: 'gte'
    },
    rarity: 'epic',
    rewardMessage: 'Marathon complete! You\'re a true endurance master!'
  },

  // Scoring Category
  {
    id: 'tetris_novice',
    name: 'Tetris Novice',
    description: 'Clear 4 lines at once (Tetris) for the first time',
    icon: '⭐',
    category: 'scoring',
    condition: {
      type: 'tetris_count',
      value: 1,
      operator: 'gte'
    },
    rarity: 'common',
    rewardMessage: 'Your first Tetris! The most satisfying move in the game!'
  },
  {
    id: 'tetris_master',
    name: 'Tetris Master',
    description: 'Clear 10 Tetris (4-line clears) in a single game',
    icon: '🏆',
    category: 'scoring',
    condition: {
      type: 'tetris_count',
      value: 10,
      operator: 'gte'
    },
    rarity: 'epic',
    rewardMessage: 'Tetris Master achieved! You\'ve mastered the art of 4-line clears!'
  },
  {
    id: 'combo_king',
    name: 'Combo King',
    description: 'Achieve a 5x combo streak',
    icon: '🔥',
    category: 'scoring',
    condition: {
      type: 'combo',
      value: 5,
      operator: 'gte'
    },
    rarity: 'rare',
    rewardMessage: 'Combo King crowned! Your timing is impeccable!'
  },

  // Progression Category
  {
    id: 'level_ten',
    name: 'Speed Apprentice',
    description: 'Reach level 10',
    icon: '⚡',
    category: 'progression',
    condition: {
      type: 'level',
      value: 10,
      operator: 'gte'
    },
    rarity: 'common',
    rewardMessage: 'Level 10 reached! The speed is picking up!'
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Reach level 15',
    icon: '👹',
    category: 'progression',
    condition: {
      type: 'level',
      value: 15,
      operator: 'gte'
    },
    rarity: 'rare',
    rewardMessage: 'Speed Demon unlocked! Few can keep up at this pace!'
  },
  {
    id: 'level_twenty',
    name: 'Velocity Master',
    description: 'Reach level 20',
    icon: '🚀',
    category: 'progression',
    condition: {
      type: 'level',
      value: 20,
      operator: 'gte'
    },
    rarity: 'legendary',
    rewardMessage: 'Level 20! You\'ve entered legendary territory!'
  },

  // Skill Category
  {
    id: 'perfect_start',
    name: 'Perfect Start',
    description: 'Clear 10 lines without any gaps',
    icon: '✨',
    category: 'skill',
    condition: {
      type: 'lines',
      value: 10,
      operator: 'gte'
    },
    rarity: 'rare',
    rewardMessage: 'Perfect execution! Your stacking is flawless!'
  },
  {
    id: 'quick_fingers',
    name: 'Quick Fingers',
    description: 'Clear 50 lines in under 3 minutes',
    icon: '⌚',
    category: 'skill',
    condition: {
      type: 'time_played',
      value: 180,
      operator: 'lte'
    },
    rarity: 'epic',
    rewardMessage: 'Lightning fast! Your speed is extraordinary!'
  },
  {
    id: 'line_clearer',
    name: 'Line Clearer',
    description: 'Clear 500 total lines across all games',
    icon: '📊',
    category: 'skill',
    condition: {
      type: 'lines',
      value: 500,
      operator: 'gte'
    },
    rarity: 'rare',
    rewardMessage: 'Half a thousand lines cleared! You\'re becoming a legend!'
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Score 100,000 points in a single game',
    icon: '💎',
    category: 'skill',
    condition: {
      type: 'score',
      value: 100000,
      operator: 'gte'
    },
    rarity: 'legendary',
    rewardMessage: 'Unstoppable force! This score will be remembered!'
  }
]

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENTS.find(achievement => achievement.id === id)
}

export const getAchievementsByCategory = (category: string): Achievement[] => {
  return ACHIEVEMENTS.filter(achievement => achievement.category === category)
}

export const getAchievementsByRarity = (rarity: string): Achievement[] => {
  return ACHIEVEMENTS.filter(achievement => achievement.rarity === rarity)
}
