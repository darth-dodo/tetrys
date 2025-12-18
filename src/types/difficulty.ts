// Difficulty System Types and Constants

export type DifficultyLevel = 'easy' | 'normal' | 'hard'

// Piece weights for weighted random selection
// Higher weight = more likely to spawn
export interface PieceWeights {
  I: number  // Long piece - best for Tetrises
  O: number  // Square - easy to place
  T: number  // T-piece - versatile
  S: number  // S-piece - tricky
  Z: number  // Z-piece - tricky
  J: number  // J-piece - moderate
  L: number  // L-piece - moderate
}

export interface DifficultyConfig {
  id: DifficultyLevel
  name: string
  description: string
  icon: string
  speedMultiplier: number      // Applied to base fall speed (higher = faster)
  linesPerLevel: number        // Lines needed to level up
  scoreMultiplier: number      // Applied to calculated scores
  pieceWeights: PieceWeights   // Weighted piece generation
}

// Predefined difficulty configurations
export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  easy: {
    id: 'easy',
    name: 'EASY',
    description: 'Relaxed pace, favorable pieces',
    icon: '🌱',
    speedMultiplier: 0.7,
    linesPerLevel: 15,
    scoreMultiplier: 0.75,
    // Easy: More I-pieces and O-pieces, fewer S/Z pieces
    pieceWeights: { I: 15, O: 12, T: 10, S: 6, Z: 6, J: 10, L: 10 }
  },
  normal: {
    id: 'normal',
    name: 'NORMAL',
    description: 'Classic Tetris experience',
    icon: '⚡',
    speedMultiplier: 1.0,
    linesPerLevel: 10,
    scoreMultiplier: 1.0,
    // Normal: Equal distribution (classic)
    pieceWeights: { I: 10, O: 10, T: 10, S: 10, Z: 10, J: 10, L: 10 }
  },
  hard: {
    id: 'hard',
    name: 'HARD',
    description: 'Faster pace, trickier pieces',
    icon: '🔥',
    speedMultiplier: 1.5,
    linesPerLevel: 8,
    scoreMultiplier: 1.5,
    // Hard: Fewer I-pieces, more S/Z pieces
    pieceWeights: { I: 6, O: 8, T: 10, S: 14, Z: 14, J: 10, L: 10 }
  }
}

export const DIFFICULTY_STORAGE_KEY = 'tetrys-difficulty-setting'
export const DEFAULT_DIFFICULTY: DifficultyLevel = 'normal'

// Helper to check if a value is a valid difficulty level
export const isValidDifficulty = (value: string): value is DifficultyLevel => {
  return ['easy', 'normal', 'hard'].includes(value)
}
