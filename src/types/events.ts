import type { TetrominoType } from './tetris'
import type { AchievementId } from './achievements'

// Game Events - emitted by useTetris
export interface GameEvents {
  // Game lifecycle events
  'game:started': { timestamp: number }
  'game:paused': { isPaused: boolean; timePlayed: number }
  'game:over': {
    score: number
    level: number
    lines: number
    tetrisCount: number
    timePlayed: number
  }
  'game:reset': { timestamp: number }

  // Line clearing events
  'lines:cleared': {
    count: number
    isTetris: boolean
    newTotal: number
    newLevel: number
  }

  // Scoring events
  'score:updated': {
    score: number
    delta: number
    level: number
  }

  // Level events
  'level:up': {
    level: number
    previousLevel: number
  }

  // Combo events
  'combo:updated': {
    combo: number
    isReset: boolean
  }

  // Piece events
  'piece:placed': {
    type: TetrominoType
    position: { x: number; y: number }
  }

  // Time events
  'time:tick': { timePlayed: number }
}

// Achievement Events - emitted by useAchievements
export interface AchievementEvents {
  'achievement:unlocked': {
    id: AchievementId
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
    timestamp: number
  }
}

// Combined events for the global bus - satisfies mitt's Record constraint
export type GameBusEvents = {
  [K in keyof (GameEvents & AchievementEvents)]: (GameEvents & AchievementEvents)[K]
} & {
  [key: string]: unknown
}

// Event payload type helper
export type EventPayload<E extends keyof GameBusEvents> = GameBusEvents[E]
