import type { Achievement } from '../types/achievements'

export const ACHIEVEMENTS: Achievement[] = [
  // ========================================
  // EARLY PROGRESSION (Levels 1-5)
  // ========================================
  {
    id: 'welcome',
    name: 'Welcome Player',
    description: 'Start your first game',
    icon: '👋',
    category: 'progression',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Welcome to Tetrys! Your journey begins now!'
  },
  {
    id: 'level_2',
    name: 'Getting Started',
    description: 'Reach level 2',
    icon: '🌱',
    category: 'progression',
    condition: { type: 'level', value: 2, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Nice! You\'re getting the hang of it!'
  },
  {
    id: 'level_3',
    name: 'Warming Up',
    description: 'Reach level 3',
    icon: '🔥',
    category: 'progression',
    condition: { type: 'level', value: 3, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'The blocks are coming faster now!'
  },
  {
    id: 'level_4',
    name: 'Building Momentum',
    description: 'Reach level 4',
    icon: '📈',
    category: 'progression',
    condition: { type: 'level', value: 4, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'You\'re building up speed!'
  },
  {
    id: 'level_5',
    name: 'Steady Hand',
    description: 'Reach level 5',
    icon: '✋',
    category: 'progression',
    condition: { type: 'level', value: 5, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Halfway to level 10! Keep it up!'
  },
  {
    id: 'level_6',
    name: 'Rising Star',
    description: 'Reach level 6',
    icon: '⭐',
    category: 'progression',
    condition: { type: 'level', value: 6, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'You\'re on the rise!'
  },
  {
    id: 'level_7',
    name: 'Lucky Seven',
    description: 'Reach level 7',
    icon: '🎰',
    category: 'progression',
    condition: { type: 'level', value: 7, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Lucky number 7! Keep the streak going!'
  },
  {
    id: 'level_8',
    name: 'Octane Boost',
    description: 'Reach level 8',
    icon: '🏎️',
    category: 'progression',
    condition: { type: 'level', value: 8, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Speed is increasing! Stay focused!'
  },
  {
    id: 'level_9',
    name: 'Almost There',
    description: 'Reach level 9',
    icon: '🎯',
    category: 'progression',
    condition: { type: 'level', value: 9, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Level 10 is just around the corner!'
  },
  {
    id: 'level_10',
    name: 'Speed Apprentice',
    description: 'Reach level 10',
    icon: '⚡',
    category: 'progression',
    condition: { type: 'level', value: 10, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Level 10 reached! The speed is picking up!'
  },
  {
    id: 'level_11',
    name: 'Turning it Up',
    description: 'Reach level 11',
    icon: '🔊',
    category: 'progression',
    condition: { type: 'level', value: 11, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Into double digits! This is where it gets intense!'
  },
  {
    id: 'level_12',
    name: 'Dozen Down',
    description: 'Reach level 12',
    icon: '🎲',
    category: 'progression',
    condition: { type: 'level', value: 12, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'A dozen levels conquered!'
  },
  {
    id: 'level_13',
    name: 'Unlucky for Blocks',
    description: 'Reach level 13',
    icon: '🍀',
    category: 'progression',
    condition: { type: 'level', value: 13, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Unlucky for some, but not for you!'
  },
  {
    id: 'level_14',
    name: 'Fortified',
    description: 'Reach level 14',
    icon: '🛡️',
    category: 'progression',
    condition: { type: 'level', value: 14, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Your defenses are strong!'
  },
  {
    id: 'level_15',
    name: 'Speed Demon',
    description: 'Reach level 15',
    icon: '👹',
    category: 'progression',
    condition: { type: 'level', value: 15, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'Speed Demon unlocked! Few can keep up at this pace!'
  },
  {
    id: 'level_16',
    name: 'Sweet Sixteen',
    description: 'Reach level 16',
    icon: '🎂',
    category: 'progression',
    condition: { type: 'level', value: 16, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'Sweet sixteen! You\'re in the elite now!'
  },
  {
    id: 'level_17',
    name: 'High Roller',
    description: 'Reach level 17',
    icon: '🎰',
    category: 'progression',
    condition: { type: 'level', value: 17, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'Rolling with the high stakes!'
  },
  {
    id: 'level_18',
    name: 'Coming of Age',
    description: 'Reach level 18',
    icon: '🎓',
    category: 'progression',
    condition: { type: 'level', value: 18, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'You\'re a seasoned veteran now!'
  },
  {
    id: 'level_19',
    name: 'On the Brink',
    description: 'Reach level 19',
    icon: '⚠️',
    category: 'progression',
    condition: { type: 'level', value: 19, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'One level away from legendary status!'
  },
  {
    id: 'level_20',
    name: 'Velocity Master',
    description: 'Reach level 20',
    icon: '🚀',
    category: 'progression',
    condition: { type: 'level', value: 20, operator: 'gte' },
    rarity: 'legendary',
    rewardMessage: 'Level 20! You\'ve entered legendary territory!'
  },

  // ========================================
  // LINE CLEARING MILESTONES
  // ========================================
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Clear your first line',
    icon: '🎯',
    category: 'gameplay',
    condition: { type: 'lines', value: 1, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'You\'ve cleared your first line! Keep going!'
  },
  {
    id: 'five_lines',
    name: 'Line Beginner',
    description: 'Clear 5 lines',
    icon: '✅',
    category: 'gameplay',
    condition: { type: 'lines', value: 5, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Five lines down! You\'re learning fast!'
  },
  {
    id: 'ten_lines',
    name: 'Double Digits',
    description: 'Clear 10 lines',
    icon: '🔟',
    category: 'gameplay',
    condition: { type: 'lines', value: 10, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Ten lines cleared! You\'re building momentum!'
  },
  {
    id: 'fifteen_lines',
    name: 'Steady Progress',
    description: 'Clear 15 lines',
    icon: '📊',
    category: 'gameplay',
    condition: { type: 'lines', value: 15, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Fifteen lines! Steady as she goes!'
  },
  {
    id: 'twenty_lines',
    name: 'Score!',
    description: 'Clear 20 lines',
    icon: '🎉',
    category: 'gameplay',
    condition: { type: 'lines', value: 20, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Twenty lines! That\'s a solid start!'
  },
  {
    id: 'thirty_lines',
    name: 'Getting Serious',
    description: 'Clear 30 lines',
    icon: '💪',
    category: 'gameplay',
    condition: { type: 'lines', value: 30, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Thirty lines! Now we\'re talking!'
  },
  {
    id: 'forty_lines',
    name: 'Sprint Master',
    description: 'Clear 40 lines',
    icon: '🏃‍♂️',
    category: 'gameplay',
    condition: { type: 'lines', value: 40, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Forty lines! You\'re hitting your stride!'
  },
  {
    id: 'fifty_lines',
    name: 'Half Century',
    description: 'Clear 50 lines',
    icon: '🎖️',
    category: 'gameplay',
    condition: { type: 'lines', value: 50, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Fifty lines! Halfway to 100!'
  },
  {
    id: 'seventy_five_lines',
    name: 'Line Veteran',
    description: 'Clear 75 lines',
    icon: '🎗️',
    category: 'gameplay',
    condition: { type: 'lines', value: 75, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Seventy-five lines! You\'re a veteran now!'
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Clear 100 lines in a single game',
    icon: '💯',
    category: 'gameplay',
    condition: { type: 'lines', value: 100, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Century cleared! Your stacking skills are impressive!'
  },
  {
    id: 'line_150',
    name: 'Sesquicentennial',
    description: 'Clear 150 lines',
    icon: '🏅',
    category: 'gameplay',
    condition: { type: 'lines', value: 150, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: '150 lines! You\'re in the elite!'
  },
  {
    id: 'marathon_runner',
    name: 'Marathon Runner',
    description: 'Clear 200 lines in a single game',
    icon: '🏃',
    category: 'gameplay',
    condition: { type: 'lines', value: 200, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'Marathon complete! You\'re a true endurance master!'
  },

  // ========================================
  // SCORE MILESTONES
  // ========================================
  {
    id: 'score_100',
    name: 'First Points',
    description: 'Score 100 points',
    icon: '💰',
    category: 'scoring',
    condition: { type: 'score', value: 100, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Your first 100 points! Many more to come!'
  },
  {
    id: 'score_500',
    name: 'Getting Points',
    description: 'Score 500 points',
    icon: '💵',
    category: 'scoring',
    condition: { type: 'score', value: 500, operator: 'gte' },
    rarity: 'common',
    rewardMessage: '500 points! You\'re racking them up!'
  },
  {
    id: 'score_1000',
    name: 'Kilopoint',
    description: 'Score 1,000 points',
    icon: '💸',
    category: 'scoring',
    condition: { type: 'score', value: 1000, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'One thousand points! Nice work!'
  },
  {
    id: 'score_2500',
    name: 'Point Collector',
    description: 'Score 2,500 points',
    icon: '🪙',
    category: 'scoring',
    condition: { type: 'score', value: 2500, operator: 'gte' },
    rarity: 'common',
    rewardMessage: '2,500 points! You\'re collecting them fast!'
  },
  {
    id: 'score_5000',
    name: 'Five Grand',
    description: 'Score 5,000 points',
    icon: '💎',
    category: 'scoring',
    condition: { type: 'score', value: 5000, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: '5,000 points! That\'s impressive!'
  },
  {
    id: 'score_10000',
    name: 'Ten Thousand',
    description: 'Score 10,000 points',
    icon: '💰',
    category: 'scoring',
    condition: { type: 'score', value: 10000, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: '10,000 points! You\'re on fire!'
  },
  {
    id: 'score_25000',
    name: 'High Scorer',
    description: 'Score 25,000 points',
    icon: '🏆',
    category: 'scoring',
    condition: { type: 'score', value: 25000, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: '25,000 points! Amazing!'
  },
  {
    id: 'score_50000',
    name: 'Point Master',
    description: 'Score 50,000 points',
    icon: '👑',
    category: 'scoring',
    condition: { type: 'score', value: 50000, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: '50,000 points! You\'re a master!'
  },
  {
    id: 'score_75000',
    name: 'Point Legend',
    description: 'Score 75,000 points',
    icon: '🌟',
    category: 'scoring',
    condition: { type: 'score', value: 75000, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: '75,000 points! Legendary status!'
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Score 100,000 points in a single game',
    icon: '💎',
    category: 'scoring',
    condition: { type: 'score', value: 100000, operator: 'gte' },
    rarity: 'legendary',
    rewardMessage: 'Unstoppable force! This score will be remembered!'
  },

  // ========================================
  // TETRIS ACHIEVEMENTS (4-line clears)
  // ========================================
  {
    id: 'tetris_novice',
    name: 'Tetris Novice',
    description: 'Clear 4 lines at once (Tetris) for the first time',
    icon: '⭐',
    category: 'scoring',
    condition: { type: 'tetris_count', value: 1, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Your first Tetris! The most satisfying move in the game!'
  },
  {
    id: 'tetris_2',
    name: 'Double Tetris',
    description: 'Clear 2 Tetris in a game',
    icon: '✨',
    category: 'scoring',
    condition: { type: 'tetris_count', value: 2, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Two Tetris clears! You\'re learning the best move!'
  },
  {
    id: 'tetris_3',
    name: 'Tetris Trio',
    description: 'Clear 3 Tetris in a game',
    icon: '💫',
    category: 'scoring',
    condition: { type: 'tetris_count', value: 3, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Three Tetris! That\'s the way to score big!'
  },
  {
    id: 'tetris_5',
    name: 'Tetris Enthusiast',
    description: 'Clear 5 Tetris in a game',
    icon: '🌠',
    category: 'scoring',
    condition: { type: 'tetris_count', value: 5, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Five Tetris! You love those 4-line clears!'
  },
  {
    id: 'tetris_7',
    name: 'Lucky Seven Tetris',
    description: 'Clear 7 Tetris in a game',
    icon: '🎰',
    category: 'scoring',
    condition: { type: 'tetris_count', value: 7, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Seven Tetris! Lucky you!'
  },
  {
    id: 'tetris_master',
    name: 'Tetris Master',
    description: 'Clear 10 Tetris (4-line clears) in a single game',
    icon: '🏆',
    category: 'scoring',
    condition: { type: 'tetris_count', value: 10, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'Tetris Master achieved! You\'ve mastered the art of 4-line clears!'
  },
  {
    id: 'tetris_15',
    name: 'Tetris Legend',
    description: 'Clear 15 Tetris in a game',
    icon: '👑',
    category: 'scoring',
    condition: { type: 'tetris_count', value: 15, operator: 'gte' },
    rarity: 'legendary',
    rewardMessage: 'Fifteen Tetris! You\'re a living legend!'
  },

  // ========================================
  // COMBO ACHIEVEMENTS
  // ========================================
  {
    id: 'combo_2',
    name: 'Double Combo',
    description: 'Achieve a 2x combo',
    icon: '🔗',
    category: 'skill',
    condition: { type: 'combo', value: 2, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Nice combo! Keep them coming!'
  },
  {
    id: 'combo_3',
    name: 'Triple Threat',
    description: 'Achieve a 3x combo',
    icon: '🔥',
    category: 'skill',
    condition: { type: 'combo', value: 3, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Triple combo! Your timing is improving!'
  },
  {
    id: 'combo_4',
    name: 'Quad Squad',
    description: 'Achieve a 4x combo',
    icon: '💥',
    category: 'skill',
    condition: { type: 'combo', value: 4, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Four in a row! Impressive!'
  },
  {
    id: 'combo_king',
    name: 'Combo King',
    description: 'Achieve a 5x combo streak',
    icon: '🔥',
    category: 'skill',
    condition: { type: 'combo', value: 5, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Combo King crowned! Your timing is impeccable!'
  },
  {
    id: 'combo_6',
    name: 'Combo Master',
    description: 'Achieve a 6x combo',
    icon: '⚡',
    category: 'skill',
    condition: { type: 'combo', value: 6, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'Six combo! You\'re on fire!'
  },
  {
    id: 'combo_7',
    name: 'Lucky Streak',
    description: 'Achieve a 7x combo',
    icon: '🍀',
    category: 'skill',
    condition: { type: 'combo', value: 7, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'Seven combo! What a streak!'
  },
  {
    id: 'combo_8',
    name: 'Combo Legend',
    description: 'Achieve an 8x combo',
    icon: '👑',
    category: 'skill',
    condition: { type: 'combo', value: 8, operator: 'gte' },
    rarity: 'legendary',
    rewardMessage: 'Eight combo! You\'re unstoppable!'
  },
  {
    id: 'combo_10',
    name: 'Combo God',
    description: 'Achieve a 10x combo',
    icon: '⚡',
    category: 'skill',
    condition: { type: 'combo', value: 10, operator: 'gte' },
    rarity: 'legendary',
    rewardMessage: 'Ten combo! Are you even human?!'
  },

  // ========================================
  // SKILL & SPEED ACHIEVEMENTS
  // ========================================
  {
    id: 'perfect_start',
    name: 'Perfect Start',
    description: 'Clear 10 lines without any gaps',
    icon: '✨',
    category: 'skill',
    condition: { type: 'lines', value: 10, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Perfect execution! Your stacking is flawless!'
  },
  {
    id: 'quick_fingers',
    name: 'Quick Fingers',
    description: 'Clear 50 lines in under 3 minutes',
    icon: '⌚',
    category: 'skill',
    condition: { type: 'time_played', value: 180, operator: 'lte' },
    rarity: 'epic',
    rewardMessage: 'Lightning fast! Your speed is extraordinary!'
  },
  {
    id: 'line_clearer',
    name: 'Line Clearer',
    description: 'Clear 500 total lines across all games',
    icon: '📊',
    category: 'skill',
    condition: { type: 'lines', value: 500, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Half a thousand lines cleared! You\'re becoming a legend!'
  },
  {
    id: 'line_destroyer',
    name: 'Line Destroyer',
    description: 'Clear 1000 total lines',
    icon: '💥',
    category: 'skill',
    condition: { type: 'lines', value: 1000, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'One thousand lines! You\'re a destruction machine!'
  },

  // ========================================
  // SPECIAL & FUN ACHIEVEMENTS
  // ========================================
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Play after midnight',
    icon: '🦉',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Playing late? That\'s dedication!'
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Play before 6 AM',
    icon: '🐦',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Early bird gets the Tetris!'
  },
  {
    id: 'practice_makes_perfect',
    name: 'Practice Makes Perfect',
    description: 'Play 10 games',
    icon: '🎮',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Ten games played! You\'re dedicated!'
  },
  {
    id: 'persistent',
    name: 'Persistent Player',
    description: 'Play 25 games',
    icon: '🏃‍♂️',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Twenty-five games! You never give up!'
  },
  {
    id: 'dedicated',
    name: 'Dedicated Gamer',
    description: 'Play 50 games',
    icon: '🎯',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'epic',
    rewardMessage: 'Fifty games! True dedication!'
  },
  {
    id: 'obsessed',
    name: 'Tetris Obsessed',
    description: 'Play 100 games',
    icon: '🤯',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'legendary',
    rewardMessage: 'One hundred games! You might have a problem... we love it!'
  },
  {
    id: 'theme_explorer',
    name: 'Theme Explorer',
    description: 'Try 3 different themes',
    icon: '🎨',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Exploring the themes! Find your favorite!'
  },
  {
    id: 'audio_enthusiast',
    name: 'Audio Enthusiast',
    description: 'Enable game music',
    icon: '🎵',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Music makes everything better!'
  },
  {
    id: 'speed_lover',
    name: 'Speed Lover',
    description: 'Play with 2x speed multiplier',
    icon: '⚡',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'You love the speed! Adrenaline junkie!'
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Survive near-death situation',
    icon: '💪',
    category: 'special',
    condition: { type: 'level', value: 5, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'That was close! Great recovery!'
  },
  {
    id: 'zen_master',
    name: 'Zen Master',
    description: 'Play 5 games without pausing',
    icon: '🧘',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'rare',
    rewardMessage: 'Focus and flow! You\'re in the zone!'
  },
  {
    id: 'weekend_warrior',
    name: 'Weekend Warrior',
    description: 'Play on Saturday or Sunday',
    icon: '🎉',
    category: 'special',
    condition: { type: 'level', value: 1, operator: 'gte' },
    rarity: 'common',
    rewardMessage: 'Making the most of your weekend!'
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
