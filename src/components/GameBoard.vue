<template>
  <div 
    class="game-board-container"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
    @touchcancel="handleTouchEnd"
    role="application"
    aria-label="Tetris game board. Tap to rotate, swipe to move pieces"
    tabindex="0"
  >
    <div 
      class="game-board"
      :style="{ 
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`
      }"
      role="grid"
      aria-label="Game board with falling tetromino pieces"
    >
      <div
        v-for="(cell, index) in renderBoard"
        :key="index"
        class="cell"
        :class="getCellClass(cell)"
        role="gridcell"
        :aria-label="cell ? `${cell} piece` : 'empty cell'"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { GameState, TetrominoType } from '@/types/tetris'
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'

interface Props {
  gameState: GameState
}

interface Emits {
  moveLeft: []
  moveRight: []
  moveDown: []
  rotate: []
  drop: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Touch gesture state
const touchState = ref({
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  isDragging: false,
  startTime: 0
})

// Touch gesture handlers
const handleTouchStart = (e: TouchEvent) => {
  if (!props.gameState.isPlaying || props.gameState.isPaused) return
  
  e.preventDefault()
  const touch = e.touches[0]
  touchState.value = {
    startX: touch.clientX,
    startY: touch.clientY,
    currentX: touch.clientX,
    currentY: touch.clientY,
    isDragging: true,
    startTime: Date.now()
  }
}

const handleTouchMove = (e: TouchEvent) => {
  if (!touchState.value.isDragging || !props.gameState.isPlaying || props.gameState.isPaused) return
  
  e.preventDefault()
  const touch = e.touches[0]
  touchState.value.currentX = touch.clientX
  touchState.value.currentY = touch.clientY
}

const handleTouchEnd = (e: TouchEvent) => {
  if (!touchState.value.isDragging || !props.gameState.isPlaying || props.gameState.isPaused) return
  
  e.preventDefault()
  
  const deltaX = touchState.value.currentX - touchState.value.startX
  const deltaY = touchState.value.currentY - touchState.value.startY
  const touchDuration = Date.now() - touchState.value.startTime
  
  const minSwipeDistance = 30
  const maxTapDuration = 200
  
  // Determine gesture type
  if (touchDuration < maxTapDuration && Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
    // Tap gesture - rotate piece
    emit('rotate')
  } else if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        emit('moveRight')
      } else {
        emit('moveLeft')
      }
    }
  } else {
    // Vertical swipe
    if (Math.abs(deltaY) > minSwipeDistance) {
      if (deltaY > 0) {
        // Swipe down - either move down or drop based on distance
        if (Math.abs(deltaY) > 80) {
          emit('drop') // Long swipe = hard drop
        } else {
          emit('moveDown') // Short swipe = soft drop
        }
      }
    }
  }
  
  // Provide enhanced haptic feedback based on gesture
  if ('vibrate' in navigator) {
    if (touchDuration < maxTapDuration && Math.abs(deltaX) < minSwipeDistance && Math.abs(deltaY) < minSwipeDistance) {
      // Tap/rotate gesture - double pulse
      navigator.vibrate([8, 20, 8])
    } else if (Math.abs(deltaY) > 80) {
      // Hard drop - strong pattern
      navigator.vibrate([15, 30, 15, 30, 15])
    } else {
      // Movement or soft drop - single pulse
      navigator.vibrate(10)
    }
  }
  
  touchState.value.isDragging = false
}

// Create a combined board with current piece
const renderBoard = computed(() => {
  const board = props.gameState.board.map(row => [...row])
  
  // Add current piece to the render board
  if (props.gameState.currentPiece && props.gameState.isPlaying && !props.gameState.isGameOver) {
    const { currentPiece, currentPosition } = props.gameState
    
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          const boardX = currentPosition.x + x
          const boardY = currentPosition.y + y
          
          if (boardX >= 0 && boardX < BOARD_WIDTH && boardY >= 0 && boardY < BOARD_HEIGHT) {
            board[boardY][boardX] = currentPiece.type
          }
        }
      }
    }
  }
  
  return board.flat()
})

// Get CSS class for cell
const getCellClass = (cell: TetrominoType | null): string => {
  if (!cell) return 'empty'
  return `piece-${cell.toLowerCase()}`
}
</script>

<style scoped>
.game-board-container {
  width: 100%;
  max-width: calc(100vw - 130px);
  height: calc(100vh - 200px);
  min-height: 450px;
  max-height: 700px;
  border: 3px solid var(--theme-border, #00ff00);
  background: var(--theme-bg, #000);
  box-shadow: var(--theme-shadow, 0 4px 12px rgba(0, 0, 0, 0.4));
  border-radius: 8px;
  touch-action: none;
  user-select: none;
  position: relative;
  overflow: hidden;
  flex: 1;
}

.game-board {
  width: 100%;
  height: 100%;
  display: grid;
  gap: 1px;
  background: var(--theme-surface, #111);
  padding: 2px;
}

.cell {
  border: 1px solid var(--theme-border, #333);
  width: 100%;
  height: 100%;
  min-height: 0;
  min-width: 0;
  transition: background-color 0.1s ease;
  border-radius: 1px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.empty {
  background: var(--theme-bg, #000);
}

.piece-i { background: var(--piece-i, #00ffff); }
.piece-o { background: var(--piece-o, #ffff00); }
.piece-t { background: var(--piece-t, #ff00ff); }
.piece-s { background: var(--piece-s, #00ff00); }
.piece-z { background: var(--piece-z, #ff0000); }
.piece-j { background: var(--piece-j, #0000ff); }
.piece-l { background: var(--piece-l, #ff8000); }

/* Mobile responsive board sizing for side-by-side layout */
@media (max-width: 479px) {
  .game-board-container {
    max-width: calc(100vw - 110px);
    height: calc(100vh - 180px);
    min-height: 400px;
    max-height: 550px;
  }
}

@media (min-width: 480px) and (max-width: 767px) {
  .game-board-container {
    max-width: calc(100vw - 150px);
    height: calc(100vh - 200px);
    min-height: 460px;
    max-height: 620px;
  }
}

/* Height-based adjustments for short screens */
@media (max-height: 600px) {
  .game-board-container {
    height: calc(100vh - 160px);
    min-height: 320px;
  }
}

@media (max-height: 500px) {
  .game-board-container {
    height: calc(100vh - 140px);
    min-height: 300px;
  }
}

/* Landscape mobile optimization */
@media (max-height: 500px) and (orientation: landscape) {
  .game-board-container {
    max-width: calc(100vw - 200px);
    height: calc(100vh - 120px);
    min-height: 280px;
    max-height: 350px;
  }
}

/* Large tablets and desktop */
@media (min-width: 768px) {
  .game-board-container {
    max-width: 400px;
    height: calc(100vh - 180px);
    min-height: 580px;
    max-height: 720px;
  }
}
</style>