import { ref, computed, onMounted, onUnmounted } from 'vue'
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

export function useTetris() {
  // Game state
  const gameState = ref<GameState>({
    board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
    currentPiece: null,
    currentPosition: { x: 0, y: 0 },
    nextPiece: null,
    score: 0,
    level: 1,
    lines: 0,
    isGameOver: false,
    isPaused: false,
    isPlaying: false
  })

  let gameLoop: number | null = null
  let lastTime = 0
  let currentRotation = 0

  // Computed properties
  const fallSpeed = computed(() => 
    Math.max(100, INITIAL_FALL_SPEED - (gameState.value.level - 1) * SPEED_INCREASE_PER_LEVEL)
  )

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
            gameState.value.lines += linesCleared
            gameState.value.score += calculateScore(linesCleared, gameState.value.level)
            gameState.value.level = Math.floor(gameState.value.lines / 10) + 1
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

  // Game controls
  const startGame = (): void => {
    gameState.value = {
      board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
      currentPiece: null,
      currentPosition: { x: 0, y: 0 },
      nextPiece: null,
      score: 0,
      level: 1,
      lines: 0,
      isGameOver: false,
      isPaused: false,
      isPlaying: true
    }

    spawnNewPiece()
    gameLoop = requestAnimationFrame(update)
  }

  const pauseGame = (): void => {
    gameState.value.isPaused = !gameState.value.isPaused
    if (!gameState.value.isPaused && gameState.value.isPlaying) {
      gameLoop = requestAnimationFrame(update)
    }
  }

  const resetGame = (): void => {
    if (gameLoop) {
      cancelAnimationFrame(gameLoop)
    }
    gameState.value.isPlaying = false
    gameState.value.isGameOver = false
    gameState.value.isPaused = false
  }

  // Cleanup
  onUnmounted(() => {
    if (gameLoop) {
      cancelAnimationFrame(gameLoop)
    }
  })

  return {
    gameState: computed(() => gameState.value),
    movePiece,
    rotatePiece,
    dropPiece,
    startGame,
    pauseGame,
    resetGame
  }
}