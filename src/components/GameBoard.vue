<template>
  <div class="game-board-container">
    <div 
      class="game-board"
      :style="{ 
        gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
        gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`
      }"
    >
      <div
        v-for="(cell, index) in renderBoard"
        :key="index"
        class="cell"
        :class="getCellClass(cell)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GameState, TetrominoType } from '@/types/tetris'
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'

interface Props {
  gameState: GameState
}

const props = defineProps<Props>()

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
  max-width: 300px;
  height: 600px;
  border: 3px solid var(--theme-border, #00ff00);
  background: var(--theme-bg, #000);
  margin: 0 auto;
  box-shadow: var(--theme-shadow, none);
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

@media (max-width: 480px) {
  .game-board-container {
    max-width: 280px;
    height: 500px;
  }
}

@media (max-width: 360px) {
  .game-board-container {
    max-width: 250px;
    height: 450px;
  }
}

@media (max-height: 600px) {
  .game-board-container {
    height: 400px;
  }
}

@media (max-height: 500px) {
  .game-board-container {
    height: 350px;
  }
}
</style>