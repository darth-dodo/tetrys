export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

export interface Position {
  x: number
  y: number
}

export interface TetrominoShape {
  shape: number[][]
  type: TetrominoType
}

export interface GameState {
  board: (TetrominoType | null)[][]
  currentPiece: TetrominoShape | null
  currentPosition: Position
  nextPiece: TetrominoShape | null
  score: number
  level: number
  lines: number
  isGameOver: boolean
  isPaused: boolean
  isPlaying: boolean
  speedMultiplier: number
}

export interface GameStats {
  totalLines: number
  totalScore: number
  level: number
  timeElapsed: number
}

export const TETROMINO_SHAPES: Record<TetrominoType, number[][][]> = {
  I: [
    [[1, 1, 1, 1]],
    [[1], [1], [1], [1]]
  ],
  O: [
    [[1, 1], [1, 1]]
  ],
  T: [
    [[0, 1, 0], [1, 1, 1]],
    [[1, 0], [1, 1], [1, 0]],
    [[1, 1, 1], [0, 1, 0]],
    [[0, 1], [1, 1], [0, 1]]
  ],
  S: [
    [[0, 1, 1], [1, 1, 0]],
    [[1, 0], [1, 1], [0, 1]]
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1]],
    [[0, 1], [1, 1], [1, 0]]
  ],
  J: [
    [[1, 0, 0], [1, 1, 1]],
    [[1, 1], [1, 0], [1, 0]],
    [[1, 1, 1], [0, 0, 1]],
    [[0, 1], [0, 1], [1, 1]]
  ],
  L: [
    [[0, 0, 1], [1, 1, 1]],
    [[1, 0], [1, 0], [1, 1]],
    [[1, 1, 1], [1, 0, 0]],
    [[1, 1], [0, 1], [0, 1]]
  ]
}

export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20
export const INITIAL_FALL_SPEED = 800 // milliseconds
export const SPEED_INCREASE_PER_LEVEL = 50 // milliseconds faster per level