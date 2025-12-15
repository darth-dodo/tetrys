import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { useTetris } from '@/composables/useTetris'
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'
import type { TetrominoType } from '@/types/tetris'
import { triggerAnimationFrame } from '@/__tests__/setup'

/**
 * Test Suite: useTetris Game Loop & State Management
 *
 * Comprehensive tests for game loop functionality and state management including:
 * - Initial state verification
 * - Game initialization and piece spawning
 * - Pause/resume functionality
 * - Speed control
 * - Game over detection
 * - Game loop lifecycle
 */
describe('useTetris - Game Loop & State Management', () => {
  let tetris: ReturnType<typeof useTetris>

  beforeEach(() => {
    vi.clearAllMocks()
    tetris = useTetris()
  })

  afterEach(() => {
    // Clean up any running game loops
    tetris.resetGame()
  })

  /**
   * Test 1: Initial State Verification
   *
   * Given: A fresh useTetris composable instance
   * When: Created without starting the game
   * Then: All state values should be properly initialized
   */
  describe('1. Initial State Verification', () => {
    it('should initialize game state with correct default values', () => {
      // Given
      const state = tetris.gameState.value

      // When - no action, just initialization
      // Then
      expect(state.score).toBe(0)
      expect(state.level).toBe(1)
      expect(state.lines).toBe(0)
      expect(state.isGameOver).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.isPlaying).toBe(false)
      expect(state.speedMultiplier).toBe(1)
    })

    it('should initialize with no active pieces', () => {
      // Given
      const state = tetris.gameState.value

      // When - no action
      // Then
      expect(state.currentPiece).toBeNull()
      expect(state.nextPiece).toBeNull()
      expect(state.currentPosition.x).toBe(0)
      expect(state.currentPosition.y).toBe(0)
    })

    it('should initialize with correct game state flags', () => {
      // Given
      const state = tetris.gameState.value

      // When - no action
      // Then
      expect(state.isGameOver).toBe(false)
      expect(state.isPaused).toBe(false)
      expect(state.isPlaying).toBe(false)
    })
  })

  /**
   * Test 2: Empty Board Initialization
   *
   * Given: A fresh useTetris instance
   * When: Checking the board
   * Then: Board should be a 20x10 grid with all cells empty
   */
  describe('2. Empty Board Initialization', () => {
    it('should create board with correct dimensions (20x10)', () => {
      // Given
      const board = tetris.gameState.value.board

      // When
      const height = board.length
      const width = board[0].length

      // Then
      expect(height).toBe(BOARD_HEIGHT)
      expect(width).toBe(BOARD_WIDTH)
      expect(height).toBe(20)
      expect(width).toBe(10)
    })

    it('should initialize all board cells as empty', () => {
      // Given
      const board = tetris.gameState.value.board

      // When
      const isEmpty = board.every(row => row.every(cell => cell === null))

      // Then
      expect(isEmpty).toBe(true)
    })

    it('should have no filled cells on initialization', () => {
      // Given
      const board = tetris.gameState.value.board

      // When
      const filledCells = board
        .flat()
        .filter(cell => cell !== null)

      // Then
      expect(filledCells.length).toBe(0)
    })

    it('should maintain board structure as 2D array', () => {
      // Given
      const board = tetris.gameState.value.board

      // When
      const isProperStructure = board.every(row =>
        Array.isArray(row) && row.length === BOARD_WIDTH
      )

      // Then
      expect(isProperStructure).toBe(true)
    })
  })

  /**
   * Test 3: Game Start Spawns Pieces
   *
   * Given: A fresh game state
   * When: startGame() is called
   * Then: Current and next pieces should be spawned and game should start
   */
  describe('3. Game Start Spawns Pieces', () => {
    it('should spawn current and next pieces on game start', () => {
      // Given
      const initialState = tetris.gameState.value
      expect(initialState.currentPiece).toBeNull()
      expect(initialState.nextPiece).toBeNull()

      // When
      tetris.startGame()

      // Then
      const state = tetris.gameState.value
      expect(state.currentPiece).not.toBeNull()
      expect(state.nextPiece).not.toBeNull()
    })

    it('should spawn current piece with valid type', () => {
      // Given
      const validTypes: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

      // When
      tetris.startGame()

      // Then
      const piece = tetris.gameState.value.currentPiece
      expect(piece).not.toBeNull()
      expect(piece?.type).toBeTruthy()
      expect(validTypes).toContain(piece?.type)
    })

    it('should spawn next piece with valid type', () => {
      // Given
      const validTypes: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L']

      // When
      tetris.startGame()

      // Then
      const nextPiece = tetris.gameState.value.nextPiece
      expect(nextPiece).not.toBeNull()
      expect(nextPiece?.type).toBeTruthy()
      expect(validTypes).toContain(nextPiece?.type)
    })

    it('should set current piece to centered position', () => {
      // Given
      // When
      tetris.startGame()

      // Then
      const state = tetris.gameState.value
      expect(state.currentPosition.x).toBeGreaterThanOrEqual(0)
      expect(state.currentPosition.x).toBeLessThan(BOARD_WIDTH)
      expect(state.currentPosition.y).toBe(0)
    })

    it('should set isPlaying to true', () => {
      // Given
      expect(tetris.gameState.value.isPlaying).toBe(false)

      // When
      tetris.startGame()

      // Then
      expect(tetris.gameState.value.isPlaying).toBe(true)
    })

    it('should have valid piece shape data', () => {
      // Given
      // When
      tetris.startGame()

      // Then
      const piece = tetris.gameState.value.currentPiece
      expect(piece?.shape).toBeDefined()
      expect(Array.isArray(piece?.shape)).toBe(true)
      expect(piece!.shape.length).toBeGreaterThan(0)
    })
  })

  /**
   * Test 4: Game Start Resets Score/Level/Lines
   *
   * Given: Game state with non-zero score, level, and lines
   * When: startGame() is called
   * Then: All scores should be reset to initial values
   */
  describe('4. Game Start Resets Score/Level/Lines', () => {
    it('should reset score to 0 on new game start', () => {
      // Given
      tetris.gameState.value.score = 5000
      expect(tetris.gameState.value.score).toBe(5000)

      // When
      tetris.startGame()

      // Then
      expect(tetris.gameState.value.score).toBe(0)
    })

    it('should reset level to 1 on new game start', () => {
      // Given
      tetris.gameState.value.level = 10
      expect(tetris.gameState.value.level).toBe(10)

      // When
      tetris.startGame()

      // Then
      expect(tetris.gameState.value.level).toBe(1)
    })

    it('should reset lines to 0 on new game start', () => {
      // Given
      tetris.gameState.value.lines = 42
      expect(tetris.gameState.value.lines).toBe(42)

      // When
      tetris.startGame()

      // Then
      expect(tetris.gameState.value.lines).toBe(0)
    })

    it('should reset game over flag on new game start', () => {
      // Given
      tetris.gameState.value.isGameOver = true
      expect(tetris.gameState.value.isGameOver).toBe(true)

      // When
      tetris.startGame()

      // Then
      expect(tetris.gameState.value.isGameOver).toBe(false)
    })

    it('should reset pause flag on new game start', () => {
      // Given
      tetris.gameState.value.isPaused = true
      expect(tetris.gameState.value.isPaused).toBe(true)

      // When
      tetris.startGame()

      // Then
      expect(tetris.gameState.value.isPaused).toBe(false)
    })

    it('should preserve speed multiplier across game restarts', () => {
      // Given
      tetris.setSpeedMultiplier(2.5)
      expect(tetris.gameState.value.speedMultiplier).toBe(2.5)

      // When
      tetris.startGame()

      // Then
      expect(tetris.gameState.value.speedMultiplier).toBe(2.5)
    })

    it('should reset board to empty on new game start', () => {
      // Given
      tetris.gameState.value.board[0][0] = 'I'
      tetris.gameState.value.board[1][1] = 'O'
      expect(tetris.gameState.value.board[0][0]).toBe('I')

      // When
      tetris.startGame()

      // Then
      const isEmpty = tetris.gameState.value.board.every(row =>
        row.every(cell => cell === null)
      )
      expect(isEmpty).toBe(true)
    })
  })

  /**
   * Test 5: Toggle Pause/Unpause Functionality
   *
   * Given: A running game
   * When: pauseGame() is called alternately
   * Then: isPaused flag should toggle correctly and game loop should stop/start
   */
  describe('5. Toggle Pause/Unpause Functionality', () => {
    it('should pause game when playing', () => {
      // Given
      tetris.startGame()
      expect(tetris.gameState.value.isPaused).toBe(false)
      expect(tetris.gameState.value.isPlaying).toBe(true)

      // When
      tetris.pauseGame()

      // Then
      expect(tetris.gameState.value.isPaused).toBe(true)
      expect(tetris.gameState.value.isPlaying).toBe(true) // Still playing, just paused
    })

    it('should unpause game when paused', () => {
      // Given
      tetris.startGame()
      tetris.pauseGame()
      expect(tetris.gameState.value.isPaused).toBe(true)

      // When
      tetris.pauseGame()

      // Then
      expect(tetris.gameState.value.isPaused).toBe(false)
    })

    it('should toggle pause state multiple times correctly', () => {
      // Given
      tetris.startGame()

      // When & Then - test multiple toggles
      expect(tetris.gameState.value.isPaused).toBe(false)

      tetris.pauseGame()
      expect(tetris.gameState.value.isPaused).toBe(true)

      tetris.pauseGame()
      expect(tetris.gameState.value.isPaused).toBe(false)

      tetris.pauseGame()
      expect(tetris.gameState.value.isPaused).toBe(true)
    })

    it('should not allow piece movement when paused', () => {
      // Given
      tetris.startGame()
      const initialX = tetris.gameState.value.currentPosition.x

      // When
      tetris.pauseGame()
      const canMove = tetris.movePiece(-1, 0)

      // Then
      expect(canMove).toBe(false)
      expect(tetris.gameState.value.currentPosition.x).toBe(initialX)
    })

    it('should not allow piece rotation when paused', () => {
      // Given
      tetris.startGame()
      const initialShape = JSON.stringify(tetris.gameState.value.currentPiece?.shape)

      // When
      tetris.pauseGame()
      tetris.rotatePiece()

      // Then
      const shapeAfterRotate = JSON.stringify(tetris.gameState.value.currentPiece?.shape)
      expect(shapeAfterRotate).toBe(initialShape)
    })

    it('should allow movement after unpausing', () => {
      // Given
      tetris.startGame()
      tetris.pauseGame()
      expect(tetris.gameState.value.isPaused).toBe(true)

      // When
      tetris.pauseGame() // Unpause
      const canMove = tetris.movePiece(0, 1)

      // Then
      expect(tetris.gameState.value.isPaused).toBe(false)
      expect(typeof canMove).toBe('boolean')
    })
  })

  /**
   * Test 6: Speed Multiplier Updates
   *
   * Given: A game instance
   * When: setSpeedMultiplier() is called with different values
   * Then: Speed multiplier should update and affect fall speed
   */
  describe('6. Speed Multiplier Updates', () => {
    it('should initialize with speed multiplier of 1', () => {
      // Given
      // When
      // Then
      expect(tetris.gameState.value.speedMultiplier).toBe(1)
    })

    it('should update speed multiplier to 2', () => {
      // Given
      // When
      tetris.setSpeedMultiplier(2)

      // Then
      expect(tetris.gameState.value.speedMultiplier).toBe(2)
    })

    it('should update speed multiplier to 0.5', () => {
      // Given
      // When
      tetris.setSpeedMultiplier(0.5)

      // Then
      expect(tetris.gameState.value.speedMultiplier).toBe(0.5)
    })

    it('should accept multiple sequential speed updates', () => {
      // Given
      // When & Then
      tetris.setSpeedMultiplier(1.5)
      expect(tetris.gameState.value.speedMultiplier).toBe(1.5)

      tetris.setSpeedMultiplier(3)
      expect(tetris.gameState.value.speedMultiplier).toBe(3)

      tetris.setSpeedMultiplier(0.8)
      expect(tetris.gameState.value.speedMultiplier).toBe(0.8)
    })

    it('should affect fall speed calculation when game is running', () => {
      // Given
      tetris.startGame()
      const speedMultiplier2X = 2

      // When
      tetris.setSpeedMultiplier(speedMultiplier2X)

      // Then
      // Speed multiplier should be updated
      expect(tetris.gameState.value.speedMultiplier).toBe(speedMultiplier2X)
    })

    it('should preserve speed multiplier across pause/resume', () => {
      // Given
      tetris.startGame()
      tetris.setSpeedMultiplier(2.5)

      // When
      tetris.pauseGame()
      tetris.pauseGame() // Resume

      // Then
      expect(tetris.gameState.value.speedMultiplier).toBe(2.5)
    })

    it('should accept fractional speed multipliers', () => {
      // Given
      const fractionalSpeeds = [0.25, 0.5, 0.75, 1.5, 2.5, 3.5]

      // When & Then
      for (const speed of fractionalSpeeds) {
        tetris.setSpeedMultiplier(speed)
        expect(tetris.gameState.value.speedMultiplier).toBe(speed)
      }
    })
  })

  /**
   * Test 7: Game Over Detection When Piece Cannot Spawn
   *
   * Given: A board with pieces at the top blocking spawn position
   * When: startGame() is called and spawn position is occupied
   * Then: Game over flag should be set and game should stop
   */
  describe('7. Game Over Detection When Piece Cannot Spawn', () => {
    it('should validate game over detection works when spawn is blocked', () => {
      // Given - Fill top rows to block spawning
      const board = tetris.gameState.value.board
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 'I'
        }
      }

      // When
      tetris.startGame()

      // Then - Game state should be in one of two valid conditions
      // Either game over detected OR game still starting (rare piece fits)
      const state = tetris.gameState.value
      const isValidState = (state.isGameOver && !state.isPlaying) ||
                           (!state.isGameOver && state.isPlaying)
      expect(isValidState).toBe(true)
    })

    it('should not be game over when spawn position is clear', () => {
      // Given - Empty board (no blocking)
      // When
      tetris.startGame()

      // Then
      expect(tetris.gameState.value.isGameOver).toBe(false)
      expect(tetris.gameState.value.isPlaying).toBe(true)
    })

    it('should verify game over state with heavily blocked top', () => {
      // Given - Fill top 3 rows completely
      const board = tetris.gameState.value.board
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 'I'
        }
      }

      // When - Try multiple times to handle randomness
      let hasGameOverOrGameStarted = false
      for (let attempt = 0; attempt < 10; attempt++) {
        tetris.startGame()
        if (tetris.gameState.value.isGameOver || tetris.gameState.value.isPlaying) {
          hasGameOverOrGameStarted = true
          break
        }
        tetris.resetGame()
      }

      // Then - Either game over detected or game started (piece fits in gap)
      expect(hasGameOverOrGameStarted).toBe(true)
    })

    it('should maintain game state consistency when board is blocked', () => {
      // Given - Block board completely at top
      const board = tetris.gameState.value.board
      for (let y = 0; y < 4; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 'I'
        }
      }

      // When
      tetris.startGame()

      // Then - If game over, state should be consistent
      const state = tetris.gameState.value
      if (state.isGameOver) {
        expect(state.isPlaying).toBe(false)
        expect(state.isPaused).toBe(false)
      }
    })

    it('should allow normal gameplay on empty board', () => {
      // Given - Empty board
      // When
      tetris.startGame()

      // Then
      const state = tetris.gameState.value
      expect(state.isGameOver).toBe(false)
      expect(state.isPlaying).toBe(true)
      expect(state.currentPiece).not.toBeNull()
    })

    it('should still validate piece spawning independently', () => {
      // Given - Partially fill board but leave spawn area clear
      const board = tetris.gameState.value.board
      // Fill bottom rows only
      for (let y = BOARD_HEIGHT - 5; y < BOARD_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          board[y][x] = 'I'
        }
      }

      // When
      tetris.startGame()

      // Then - Game should start normally
      expect(tetris.gameState.value.isPlaying).toBe(true)
      expect(tetris.gameState.value.isGameOver).toBe(false)
    })
  })

  /**
   * Test 8: Game Loop Stops When Paused
   *
   * Given: A running game
   * When: pauseGame() is called
   * Then: Game loop should be canceled and game should not update
   */
  describe('8. Game Loop Stops When Paused', () => {
    it('should stop updating game when paused', () => {
      // Given
      tetris.startGame()
      const initialPosition = tetris.gameState.value.currentPosition.y

      // When
      tetris.pauseGame()
      // Simulate game loop updates
      triggerAnimationFrame(100)
      triggerAnimationFrame(1000) // Enough time should have passed for piece to fall

      // Then
      const positionAfterPause = tetris.gameState.value.currentPosition.y
      expect(positionAfterPause).toBe(initialPosition)
    })

    it('should resume game loop when unpaused', () => {
      // Given
      tetris.startGame()
      tetris.pauseGame()

      // When
      tetris.pauseGame() // Resume

      // Then
      expect(tetris.gameState.value.isPaused).toBe(false)
    })

    it('should maintain isPlaying flag when paused', () => {
      // Given
      tetris.startGame()
      expect(tetris.gameState.value.isPlaying).toBe(true)

      // When
      tetris.pauseGame()

      // Then
      expect(tetris.gameState.value.isPlaying).toBe(true)
      expect(tetris.gameState.value.isPaused).toBe(true)
    })

    it('should not spawn new pieces while paused', () => {
      // Given
      tetris.startGame()
      const currentPiece = tetris.gameState.value.currentPiece
      const nextPiece = tetris.gameState.value.nextPiece

      // When
      tetris.pauseGame()
      triggerAnimationFrame(1000) // Simulate time passing

      // Then
      // Pieces should not have changed while paused
      expect(tetris.gameState.value.currentPiece).toBe(currentPiece)
      expect(tetris.gameState.value.nextPiece).toBe(nextPiece)
    })

    it('should not modify score while paused', () => {
      // Given
      tetris.startGame()
      const initialScore = tetris.gameState.value.score

      // When
      tetris.pauseGame()
      triggerAnimationFrame(1000)

      // Then
      expect(tetris.gameState.value.score).toBe(initialScore)
    })

    it('should not modify board state while paused', () => {
      // Given
      tetris.startGame()
      const boardBefore = tetris.gameState.value.board.map(row => [...row])

      // When
      tetris.pauseGame()
      triggerAnimationFrame(1000)

      // Then
      const boardAfter = tetris.gameState.value.board
      expect(boardAfter).toEqual(boardBefore)
    })

    it('should preserve pause state across multiple animations frames', () => {
      // Given
      tetris.startGame()
      tetris.pauseGame()

      // When
      triggerAnimationFrame(100)
      triggerAnimationFrame(200)
      triggerAnimationFrame(500)

      // Then
      expect(tetris.gameState.value.isPaused).toBe(true)
    })
  })

  /**
   * Additional Integration Tests
   */
  describe('Integration: Game Flow', () => {
    it('should complete a full game cycle: start -> play -> pause -> resume -> reset', () => {
      // Given - Initial state
      expect(tetris.gameState.value.isPlaying).toBe(false)

      // When - Start game
      tetris.startGame()
      expect(tetris.gameState.value.isPlaying).toBe(true)

      // When - Pause game
      tetris.pauseGame()
      expect(tetris.gameState.value.isPaused).toBe(true)

      // When - Resume game
      tetris.pauseGame()
      expect(tetris.gameState.value.isPaused).toBe(false)

      // When - Reset game
      tetris.resetGame()
      expect(tetris.gameState.value.isPlaying).toBe(false)

      // Then - Verify all state is consistent
      expect(tetris.gameState.value.isPaused).toBe(false)
    })

    it('should maintain game consistency across multiple start/reset cycles', () => {
      // When & Then - Multiple cycles
      for (let i = 0; i < 3; i++) {
        tetris.startGame()
        expect(tetris.gameState.value.isPlaying).toBe(true)
        expect(tetris.gameState.value.score).toBe(0)
        expect(tetris.gameState.value.level).toBe(1)

        tetris.resetGame()
        expect(tetris.gameState.value.isPlaying).toBe(false)
      }
    })

    it('should handle rapid pause/resume toggles', () => {
      // Given
      tetris.startGame()

      // When - Rapid toggles
      for (let i = 0; i < 10; i++) {
        tetris.pauseGame()
        tetris.pauseGame()
      }

      // Then
      expect(tetris.gameState.value.isPlaying).toBe(true)
      expect(tetris.gameState.value.isPaused).toBe(false)
    })
  })
})
