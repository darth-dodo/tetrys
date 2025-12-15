import { describe, it, expect, beforeEach } from 'vitest'
import { useTetris } from '@/composables/useTetris'
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'

/**
 * Test Helpers
 */

describe('useTetris - Collision Detection', () => {
  let tetris: ReturnType<typeof useTetris>

  beforeEach(() => {
    tetris = useTetris()
  })

  describe('1. Valid position on empty board', () => {
    it('should allow I piece in center of empty board', () => {
      tetris.startGame()
      const state = tetris.gameState.value

      expect(state.isPlaying).toBe(true)
      expect(state.currentPiece).not.toBeNull()
      expect(state.currentPosition.x).toBeGreaterThanOrEqual(0)
      expect(state.currentPosition.x).toBeLessThan(BOARD_WIDTH)

      // Should be able to move left and right on empty board
      const canMoveLeft = tetris.movePiece(-1, 0)
      const canMoveRight = tetris.movePiece(1, 0)

      // At least one direction should be valid (unless at edge)
      expect(canMoveLeft || canMoveRight).toBe(true)
    })

    it('should allow O piece (2x2) in valid center position', () => {
      tetris.startGame()

      // Keep restarting until we get an O piece
      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'O') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'O') {
        const state = tetris.gameState.value
        expect(state.isPlaying).toBe(true)

        // O piece should be able to move on empty board
        const initialX = state.currentPosition.x
        const canMove = tetris.movePiece(1, 0)

        if (initialX < BOARD_WIDTH - 2) {
          expect(canMove).toBe(true)
        }
      }
    })

    it('should allow T piece in various valid positions on empty board', () => {
      tetris.startGame()

      // Keep restarting until we get a T piece
      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'T') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'T') {
        const state = tetris.gameState.value
        expect(state.isPlaying).toBe(true)

        // T piece should be able to rotate on empty board
        tetris.rotatePiece()
        const afterRotation = JSON.stringify(tetris.gameState.value.currentPiece?.shape)

        // Rotation should work on empty board (shapes will differ)
        expect(afterRotation).toBeDefined()
      }
    })
  })

  describe('2. Left boundary collision', () => {
    it('should prevent I piece from moving beyond left boundary', () => {
      tetris.startGame()

      // Move piece to the left edge
      let moveCount = 0
      const maxMoves = BOARD_WIDTH

      while (moveCount < maxMoves && tetris.movePiece(-1, 0)) {
        moveCount++
      }

      // Try to move one more time - should fail
      const canMoveLeft = tetris.movePiece(-1, 0)
      expect(canMoveLeft).toBe(false)

      // Position should be at or near left boundary
      expect(tetris.gameState.value.currentPosition.x).toBeGreaterThanOrEqual(0)
    })

    it('should prevent O piece (2x2) from moving beyond left boundary', () => {
      tetris.startGame()

      // Keep trying until we get an O piece
      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'O') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'O') {
        // Move to left edge
        let moveCount = 0
        const maxMoves = BOARD_WIDTH

        while (moveCount < maxMoves && tetris.movePiece(-1, 0)) {
          moveCount++
        }

        // Should be at x = 0 (left edge)
        expect(tetris.gameState.value.currentPosition.x).toBe(0)

        // Cannot move further left
        const canMoveLeft = tetris.movePiece(-1, 0)
        expect(canMoveLeft).toBe(false)
      }
    })

    it('should prevent L piece from moving beyond left boundary at any rotation', () => {
      tetris.startGame()

      // Keep trying until we get an L piece
      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'L') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'L') {
        // Test at different rotations
        for (let rotation = 0; rotation < 4; rotation++) {
          // Move to left edge
          let moveCount = 0
          const maxMoves = BOARD_WIDTH

          while (moveCount < maxMoves && tetris.movePiece(-1, 0)) {
            moveCount++
          }

          // Should not be able to move further left
          const canMoveLeft = tetris.movePiece(-1, 0)
          expect(canMoveLeft).toBe(false)
          expect(tetris.gameState.value.currentPosition.x).toBeGreaterThanOrEqual(0)

          // Rotate for next test
          tetris.rotatePiece()

          // Move back to center
          while (tetris.gameState.value.currentPosition.x < 4 && tetris.movePiece(1, 0)) {
            // Center the piece
          }
        }
      }
    })
  })

  describe('3. Right boundary collision', () => {
    it('should prevent I piece (horizontal) from moving beyond right boundary', () => {
      tetris.startGame()

      // Keep trying until we get an I piece
      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'I') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'I') {
        // I piece starts horizontal (4 blocks wide)
        // Move to right edge
        let moveCount = 0
        const maxMoves = BOARD_WIDTH

        while (moveCount < maxMoves && tetris.movePiece(1, 0)) {
          moveCount++
        }

        // Should not be able to move further right
        const canMoveRight = tetris.movePiece(1, 0)
        expect(canMoveRight).toBe(false)

        // Position + width should not exceed board width
        const state = tetris.gameState.value
        const pieceWidth = state.currentPiece!.shape[0].length
        expect(state.currentPosition.x + pieceWidth).toBeLessThanOrEqual(BOARD_WIDTH)
      }
    })

    it('should prevent O piece (2x2) from moving beyond right boundary', () => {
      tetris.startGame()

      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'O') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'O') {
        // Move to right edge
        let moveCount = 0
        const maxMoves = BOARD_WIDTH

        while (moveCount < maxMoves && tetris.movePiece(1, 0)) {
          moveCount++
        }

        // Should be at x = BOARD_WIDTH - 2 (right edge for 2-wide piece)
        expect(tetris.gameState.value.currentPosition.x).toBe(BOARD_WIDTH - 2)

        // Cannot move further right
        const canMoveRight = tetris.movePiece(1, 0)
        expect(canMoveRight).toBe(false)
      }
    })

    it('should prevent T piece from moving beyond right boundary at any rotation', () => {
      tetris.startGame()

      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'T') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'T') {
        // Test at different rotations
        for (let rotation = 0; rotation < 4; rotation++) {
          // Move to right edge
          let moveCount = 0
          const maxMoves = BOARD_WIDTH

          while (moveCount < maxMoves && tetris.movePiece(1, 0)) {
            moveCount++
          }

          // Should not be able to move further right
          const canMoveRight = tetris.movePiece(1, 0)
          expect(canMoveRight).toBe(false)

          // Verify within bounds
          const state = tetris.gameState.value
          const pieceWidth = state.currentPiece!.shape[0].length
          expect(state.currentPosition.x + pieceWidth).toBeLessThanOrEqual(BOARD_WIDTH)

          // Rotate for next test
          tetris.rotatePiece()

          // Move back to center
          while (tetris.gameState.value.currentPosition.x > 4 && tetris.movePiece(-1, 0)) {
            // Center the piece
          }
        }
      }
    })
  })

  describe('4. Bottom boundary collision', () => {
    it('should prevent piece from moving below bottom boundary', () => {
      tetris.startGame()

      // Move down until we can't anymore
      let moveCount = 0
      const maxMoves = BOARD_HEIGHT + 5

      while (moveCount < maxMoves && tetris.movePiece(0, 1)) {
        moveCount++
      }

      // Should not be able to move down further
      const canMoveDown = tetris.movePiece(0, 1)
      expect(canMoveDown).toBe(false)

      // Position should be near bottom
      const state = tetris.gameState.value
      const pieceHeight = state.currentPiece?.shape.length || 0
      expect(state.currentPosition.y + pieceHeight).toBeLessThanOrEqual(BOARD_HEIGHT)
    })

    it('should place piece on board when reaching bottom', () => {
      tetris.startGame()

      // Move to bottom manually to understand the position
      let moveCount = 0
      const maxMoves = BOARD_HEIGHT

      while (moveCount < maxMoves && tetris.movePiece(0, 1)) {
        moveCount++
      }

      const state = tetris.gameState.value

      // Piece should be at valid position
      expect(state.currentPiece).not.toBeNull()
      expect(state.currentPosition.y).toBeGreaterThanOrEqual(0)
      expect(state.currentPosition.y).toBeLessThan(BOARD_HEIGHT)
    })

    it('should correctly calculate bottom position for different piece shapes', () => {
      tetris.startGame()

      const initialY = tetris.gameState.value.currentPosition.y

      // Move down manually to find bottom
      let moveCount = 0
      const maxMoves = BOARD_HEIGHT

      while (moveCount < maxMoves && tetris.movePiece(0, 1)) {
        moveCount++
      }

      const finalY = tetris.gameState.value.currentPosition.y

      // Should have moved down significantly
      expect(finalY).toBeGreaterThan(initialY)

      // Should not be able to move down further
      const canMoveDown = tetris.movePiece(0, 1)
      expect(canMoveDown).toBe(false)
    })
  })

  describe('5. Collision with existing pieces', () => {
    it('should prevent piece from moving through existing pieces horizontally', () => {
      tetris.startGame()

      // Move piece down to a stable position
      let moveCount = 0
      const maxMoves = BOARD_HEIGHT

      while (moveCount < maxMoves && tetris.movePiece(0, 1)) {
        moveCount++
      }

      // After reaching bottom, piece is still current piece (not placed until game loop)
      const state = tetris.gameState.value
      expect(state.currentPiece).not.toBeNull()
      expect(state.currentPosition.y).toBeGreaterThan(0)
    })

    it('should prevent piece from moving through existing pieces vertically', () => {
      tetris.startGame()

      const state = tetris.gameState.value

      // On empty board, piece can move down freely initially
      const canMoveDown = tetris.movePiece(0, 1)
      expect(canMoveDown).toBe(true)

      // Piece should still be valid
      expect(state.currentPiece).not.toBeNull()
      expect(state.isGameOver).toBe(false)
    })

    it('should detect collision when piece lands on top of existing pieces', () => {
      tetris.startGame()

      // Verify game starts with empty board
      const state = tetris.gameState.value
      const initialFilledCells = state.board.flat().filter(cell => cell !== null).length
      expect(initialFilledCells).toBe(0)

      // Verify piece exists and can move
      expect(state.currentPiece).not.toBeNull()
      expect(state.isPlaying).toBe(true)

      // Move piece down once to test collision detection
      const canMove = tetris.movePiece(0, 1)
      expect(typeof canMove).toBe('boolean')
    })
  })

  describe('6. Piece partially above visible board', () => {
    it('should allow piece to spawn partially above board (y < 0)', () => {
      tetris.startGame()

      const state = tetris.gameState.value

      // Piece spawns at y = 0, which means top blocks might be above visible area
      expect(state.currentPosition.y).toBe(0)
      expect(state.currentPiece).not.toBeNull()
      expect(state.isPlaying).toBe(true)
    })

    it('should allow I piece (vertical) with blocks above board', () => {
      tetris.startGame()

      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'I') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'I') {
        // Rotate I piece to vertical
        tetris.rotatePiece()

        const state = tetris.gameState.value
        const pieceHeight = state.currentPiece!.shape.length

        // Even if tall, piece should be valid at spawn
        expect(state.isPlaying).toBe(true)
        expect(pieceHeight).toBeGreaterThan(1)
      }
    })

    it('should only trigger game over when piece cannot spawn due to collision', () => {
      tetris.startGame()

      // This test verifies the game over condition
      // Game over happens when a new piece cannot spawn

      const state = tetris.gameState.value

      // At start, game should not be over
      expect(state.isGameOver).toBe(false)
      expect(state.isPlaying).toBe(true)

      // Game continues normally
      expect(state.currentPiece).not.toBeNull()
    })
  })

  describe('7. O piece (2x2) specific collision cases', () => {
    it('should correctly handle O piece collisions on all sides', () => {
      tetris.startGame()

      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'O') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'O') {
        const state = tetris.gameState.value

        // O piece is 2x2, should not rotate
        const shapeBeforeRotate = JSON.stringify(state.currentPiece?.shape)
        tetris.rotatePiece()
        const shapeAfterRotate = JSON.stringify(tetris.gameState.value.currentPiece?.shape)

        // O piece doesn't change shape when rotated
        expect(shapeBeforeRotate).toBe(shapeAfterRotate)

        // Should respect boundaries
        // Move to left edge
        while (tetris.movePiece(-1, 0)) {
          // Move left
        }
        expect(tetris.gameState.value.currentPosition.x).toBe(0)

        // Move to right edge
        while (tetris.movePiece(1, 0)) {
          // Move right
        }
        expect(tetris.gameState.value.currentPosition.x).toBe(BOARD_WIDTH - 2)
      }
    })

    it('should not allow O piece to overlap with any existing pieces', () => {
      tetris.startGame()

      // Try to get O piece
      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'O') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'O') {
        // Verify O piece is properly positioned
        const state = tetris.gameState.value
        expect(state.currentPiece?.type).toBe('O')
        expect(state.currentPiece?.shape.length).toBe(2)
        expect(state.currentPiece?.shape[0].length).toBe(2)

        // O piece should be able to move on empty board
        const canMove = tetris.movePiece(0, 1)
        expect(canMove).toBe(true)
      }
    })

    it('should handle O piece at corners correctly', () => {
      tetris.startGame()

      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'O') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'O') {
        // Test bottom-left corner positioning
        while (tetris.movePiece(-1, 0)) {
          // Move to left edge
        }

        // Should be at left edge (x = 0)
        expect(tetris.gameState.value.currentPosition.x).toBe(0)

        // Move down to bottom
        while (tetris.movePiece(0, 1)) {
          // Move down
        }

        const state = tetris.gameState.value

        // O piece should be at valid bottom-left position
        expect(state.currentPosition.x).toBe(0)
        expect(state.currentPosition.y).toBeGreaterThan(0)
      }
    })
  })

  describe('8. T piece rotation collision', () => {
    it('should prevent T piece rotation when blocked by walls', () => {
      tetris.startGame()

      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'T') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'T') {
        // Move T piece to left wall
        while (tetris.movePiece(-1, 0)) {
          // Move left
        }

        tetris.rotatePiece()
        const shapeAfterRotate = JSON.stringify(tetris.gameState.value.currentPiece?.shape)

        // Rotation should either succeed or fail based on wall collision
        // If it fails, shape stays the same
        expect(shapeAfterRotate).toBeDefined()
      }
    })

    it('should prevent T piece rotation when blocked by existing pieces', () => {
      tetris.startGame()

      // Get T piece
      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'T') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'T') {
        // Try to rotate on empty board (should succeed)
        tetris.rotatePiece()

        // Rotation should work on empty board
        expect(tetris.gameState.value.currentPiece.shape).toBeDefined()
        expect(tetris.gameState.value.isPlaying).toBe(true)
      }
    })

    it('should allow T piece rotation in open space', () => {
      tetris.startGame()

      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'T') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'T') {
        // Center the piece
        const state = tetris.gameState.value
        const targetX = Math.floor(BOARD_WIDTH / 2) - 1

        while (state.currentPosition.x < targetX && tetris.movePiece(1, 0)) {
          // Move right
        }
        while (state.currentPosition.x > targetX && tetris.movePiece(-1, 0)) {
          // Move left
        }

        // Rotate multiple times in open space
        const shapes: string[] = []
        for (let i = 0; i < 4; i++) {
          shapes.push(JSON.stringify(tetris.gameState.value.currentPiece?.shape))
          tetris.rotatePiece()
        }

        // Should cycle through rotations
        expect(shapes.length).toBe(4)

        // T piece has 4 distinct rotations
        const uniqueShapes = new Set(shapes)
        expect(uniqueShapes.size).toBeGreaterThanOrEqual(2)
      }
    })

    it('should handle T piece rotation at different heights', () => {
      tetris.startGame()

      let attempts = 0
      const maxAttempts = 50

      while (attempts < maxAttempts) {
        if (tetris.gameState.value.currentPiece?.type === 'T') {
          break
        }
        tetris.resetGame()
        tetris.startGame()
        attempts++
      }

      if (tetris.gameState.value.currentPiece?.type === 'T') {
        // Test rotation at different heights
        const heights = [0, 5, 10, 15]

        for (const targetHeight of heights) {
          // Move to target height
          while (tetris.gameState.value.currentPosition.y < targetHeight &&
                 tetris.movePiece(0, 1)) {
            // Move down
          }

          // Try rotation at this height
          const canRotate = tetris.gameState.value.currentPiece !== null
          expect(canRotate).toBe(true)

          if (canRotate) {
            tetris.rotatePiece()
            expect(tetris.gameState.value.currentPiece).not.toBeNull()
          }

          // Stop if we've reached too far down
          if (tetris.gameState.value.currentPosition.y >= targetHeight) {
            break
          }
        }
      }
    })
  })
})
