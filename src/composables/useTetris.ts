import { ref, computed, onUnmounted, getCurrentInstance } from 'vue'
import type {
  GameState,
  TetrominoShape,
  TetrominoType,
  Position
} from '@/types/tetris'
import {
  TETROMINO_SHAPES,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  INITIAL_FALL_SPEED,
  SPEED_INCREASE_PER_LEVEL
} from '@/types/tetris'
import { useGameBus } from './useGameBus'

export function useTetris() {
  // Initialize game bus
  const bus = useGameBus()

  // Game state
  const gameState = ref<GameState>({
    board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
    currentPiece: null,
    currentPosition: { x: 0, y: 0 },
    nextPiece: null,
    score: 0,
    level: 1,
    lines: 0,
    tetrisCount: 0,
    combo: 0,
    timePlayed: 0,
    isGameOver: false,
    isPaused: false,
    isPlaying: false,
    speedMultiplier: 1
  })

  let gameLoop: number | null = null
  let lastTime = 0
  let currentRotation = 0
  let gameStartTime = 0
  let pausedTime = 0 // Accumulated time from previous play sessions
  let pauseStartTime = 0 // When the current pause started
  let timeTrackingInterval: number | null = null

  // Computed properties
  const fallSpeed = computed(() => {
    const baseSpeed = Math.max(100, INITIAL_FALL_SPEED - (gameState.value.level - 1) * SPEED_INCREASE_PER_LEVEL)
    return Math.max(50, Math.floor(baseSpeed / gameState.value.speedMultiplier))
  })

  // Create random tetromino
  const createRandomTetromino = (): TetrominoShape => {
    const types: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']
    const type = types[Math.floor(Math.random() * types.length)]
    const shapes = TETROMINO_SHAPES[type]

    return {
      shape: shapes[0], // Start with first rotation
      type
    }
  }

  // Check if position is valid
  const isValidPosition = (
    board: (TetrominoType | null)[][],
    piece: TetrominoShape,
    position: Position
  ): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = position.x + x
          const newY = position.y + y

          // Check boundaries
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false
          }

          // Check collision with existing pieces
          if (newY >= 0 && board[newY][newX]) {
            return false
          }
        }
      }
    }
    return true
  }

  // Place piece on board
  const placePiece = (
    board: (TetrominoType | null)[][],
    piece: TetrominoShape,
    position: Position
  ): (TetrominoType | null)[][] => {
    const newBoard = board.map(row => [...row])

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x] && position.y + y >= 0) {
          newBoard[position.y + y][position.x + x] = piece.type
        }
      }
    }

    return newBoard
  }

  // Clear completed lines
  const clearLines = (board: (TetrominoType | null)[][]): {
    board: (TetrominoType | null)[][]
    linesCleared: number
  } => {
    const newBoard: (TetrominoType | null)[][] = []
    let linesCleared = 0

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (board[y].every(cell => cell !== null)) {
        linesCleared++
      } else {
        newBoard.unshift(board[y])
      }
    }

    // Add empty lines at top
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null))
    }

    return { board: newBoard, linesCleared }
  }

  // Calculate score
  const calculateScore = (linesCleared: number, level: number): number => {
    const baseScores = [0, 100, 300, 500, 800]
    return baseScores[linesCleared] * level
  }

  // Move piece
  const movePiece = (dx: number, dy: number): boolean => {
    if (!gameState.value.currentPiece || gameState.value.isPaused) return false

    const newPosition = {
      x: gameState.value.currentPosition.x + dx,
      y: gameState.value.currentPosition.y + dy
    }

    if (isValidPosition(gameState.value.board, gameState.value.currentPiece, newPosition)) {
      gameState.value.currentPosition = newPosition
      return true
    }

    return false
  }

  // Rotate piece
  const rotatePiece = (): void => {
    if (!gameState.value.currentPiece || gameState.value.isPaused) return

    const shapes = TETROMINO_SHAPES[gameState.value.currentPiece.type]
    const nextRotation = (currentRotation + 1) % shapes.length
    const rotatedPiece = {
      ...gameState.value.currentPiece,
      shape: shapes[nextRotation]
    }

    if (isValidPosition(gameState.value.board, rotatedPiece, gameState.value.currentPosition)) {
      gameState.value.currentPiece = rotatedPiece
      currentRotation = nextRotation
    }
  }

  // Drop piece fast
  const dropPiece = (): void => {
    if (!gameState.value.currentPiece || gameState.value.isPaused) return

    while (movePiece(0, 1)) {
      // Keep dropping until we can't
    }
  }

  // Spawn new piece
  const spawnNewPiece = (): void => {
    if (!gameState.value.nextPiece) {
      gameState.value.nextPiece = createRandomTetromino()
    }

    gameState.value.currentPiece = gameState.value.nextPiece
    gameState.value.nextPiece = createRandomTetromino()
    currentRotation = 0

    // Center the piece horizontally
    gameState.value.currentPosition = {
      x: Math.floor((BOARD_WIDTH - gameState.value.currentPiece.shape[0].length) / 2),
      y: 0
    }

    // Check if game is over
    if (!isValidPosition(gameState.value.board, gameState.value.currentPiece, gameState.value.currentPosition)) {
      gameState.value.isGameOver = true
      gameState.value.isPlaying = false
      stopTimeTracking()

      // Emit game over event
      bus.emit('game:over', {
        score: gameState.value.score,
        level: gameState.value.level,
        lines: gameState.value.lines,
        tetrisCount: gameState.value.tetrisCount,
        timePlayed: gameState.value.timePlayed
      })
    }
  }

  // Game loop
  const update = (currentTime: number): void => {
    if (!gameState.value.isPlaying || gameState.value.isPaused || gameState.value.isGameOver) {
      return
    }

    if (currentTime - lastTime >= fallSpeed.value) {
      if (!movePiece(0, 1)) {
        // Piece has landed
        if (gameState.value.currentPiece) {
          gameState.value.board = placePiece(
            gameState.value.board,
            gameState.value.currentPiece,
            gameState.value.currentPosition
          )

          // Clear lines
          const { board: newBoard, linesCleared } = clearLines(gameState.value.board)
          gameState.value.board = newBoard

          if (linesCleared > 0) {
            const previousLevel = gameState.value.level
            gameState.value.lines += linesCleared
            gameState.value.score += calculateScore(linesCleared, gameState.value.level)
            gameState.value.level = Math.floor(gameState.value.lines / 10) + 1

            // Track tetrisCount (4 lines cleared at once)
            if (linesCleared === 4) {
              gameState.value.tetrisCount++
            }

            // Track combo (consecutive line clears)
            gameState.value.combo++

            // Emit line clear events
            bus.emit('lines:cleared', {
              count: linesCleared,
              isTetris: linesCleared === 4,
              newTotal: gameState.value.lines,
              newLevel: gameState.value.level
            })

            bus.emit('score:updated', {
              score: gameState.value.score,
              delta: calculateScore(linesCleared, gameState.value.level),
              level: gameState.value.level
            })

            if (gameState.value.level > previousLevel) {
              bus.emit('level:up', {
                level: gameState.value.level,
                previousLevel
              })
            }

            bus.emit('combo:updated', {
              combo: gameState.value.combo,
              isReset: false
            })
          } else {
            // Reset combo when no lines cleared
            gameState.value.combo = 0
            bus.emit('combo:updated', {
              combo: 0,
              isReset: true
            })
          }

          spawnNewPiece()
        }
      }
      lastTime = currentTime
    }

    if (gameState.value.isPlaying) {
      gameLoop = requestAnimationFrame(update)
    }
  }

  // Speed control
  const setSpeedMultiplier = (multiplier: number): void => {
    gameState.value.speedMultiplier = multiplier
  }

  // Time tracking helper
  const updateTimePlayed = (): void => {
    if (gameState.value.isPlaying && !gameState.value.isPaused) {
      // Calculate elapsed time excluding pause duration
      const elapsedTime = Math.floor((Date.now() - gameStartTime - pausedTime) / 1000)
      gameState.value.timePlayed = elapsedTime

      // Emit time tick event
      bus.emit('time:tick', { timePlayed: gameState.value.timePlayed })
    }
  }

  const startTimeTracking = (): void => {
    gameStartTime = Date.now()
    pausedTime = 0
    pauseStartTime = 0

    if (timeTrackingInterval) {
      clearInterval(timeTrackingInterval)
    }

    timeTrackingInterval = window.setInterval(() => {
      updateTimePlayed()
    }, 1000)
  }

  const stopTimeTracking = (): void => {
    if (timeTrackingInterval) {
      clearInterval(timeTrackingInterval)
      timeTrackingInterval = null
    }
  }

  // Game controls
  const startGame = (): void => {
    const currentSpeed = gameState.value.speedMultiplier
    gameState.value = {
      board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
      currentPiece: null,
      currentPosition: { x: 0, y: 0 },
      nextPiece: null,
      score: 0,
      level: 1,
      lines: 0,
      tetrisCount: 0,
      combo: 0,
      timePlayed: 0,
      isGameOver: false,
      isPaused: false,
      isPlaying: true,
      speedMultiplier: currentSpeed
    }

    startTimeTracking()
    spawnNewPiece()
    gameLoop = requestAnimationFrame(update)

    // Emit game started event
    bus.emit('game:started', { timestamp: Date.now() })
  }

  const pauseGame = (): void => {
    gameState.value.isPaused = !gameState.value.isPaused

    if (gameState.value.isPaused) {
      // Starting pause: record when pause started
      pauseStartTime = Date.now()

      // Cancel the current game loop
      if (gameLoop) {
        cancelAnimationFrame(gameLoop)
        gameLoop = null
      }
    } else if (gameState.value.isPlaying) {
      // Resuming: accumulate the pause duration
      if (pauseStartTime > 0) {
        pausedTime += Date.now() - pauseStartTime
        pauseStartTime = 0
      }

      // Update time played immediately after resume
      updateTimePlayed()

      // Resume: start a new game loop
      gameLoop = requestAnimationFrame(update)
    }

    // Emit pause event
    bus.emit('game:paused', {
      isPaused: gameState.value.isPaused,
      timePlayed: gameState.value.timePlayed
    })
  }

  const resetGame = (): void => {
    if (gameLoop) {
      cancelAnimationFrame(gameLoop)
    }
    stopTimeTracking()
    gameState.value.isPlaying = false
    gameState.value.isGameOver = false
    gameState.value.isPaused = false
    gameState.value.timePlayed = 0
    pausedTime = 0
    pauseStartTime = 0
    gameStartTime = 0
  }

  // Cleanup - only register if in component context
  if (getCurrentInstance()) {
    onUnmounted(() => {
      if (gameLoop) {
        cancelAnimationFrame(gameLoop)
      }
      stopTimeTracking()
    })
  }

  return {
    gameState: computed(() => gameState.value),
    movePiece,
    rotatePiece,
    dropPiece,
    startGame,
    pauseGame,
    resetGame,
    setSpeedMultiplier
  }
}
