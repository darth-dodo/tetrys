<template>
  <div class="next-piece-container">
    <div class="label">NEXT</div>
    <div class="preview">
      <div
        v-if="nextPiece"
        class="piece-grid"
        :style="{
          gridTemplateColumns: `repeat(${maxWidth}, 1fr)`,
          gridTemplateRows: `repeat(${maxHeight}, 1fr)`
        }"
      >
        <div
          v-for="(cell, index) in renderGrid"
          :key="index"
          class="cell"
          :class="cell ? `piece-${cell.toLowerCase()}` : 'empty'"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TetrominoShape } from '@/types/tetris'

interface Props {
  nextPiece: TetrominoShape | null
}

const props = defineProps<Props>()

// Calculate grid dimensions
const maxWidth = computed(() => {
  if (!props.nextPiece) return 4
  return Math.max(...props.nextPiece.shape.map(row => row.length))
})

const maxHeight = computed(() => {
  if (!props.nextPiece) return 4
  return props.nextPiece.shape.length
})

// Create render grid
const renderGrid = computed(() => {
  if (!props.nextPiece) return []
  
  const grid: (string | null)[] = []
  const { shape, type } = props.nextPiece
  
  for (let y = 0; y < maxHeight.value; y++) {
    for (let x = 0; x < maxWidth.value; x++) {
      if (y < shape.length && x < shape[y].length && shape[y][x]) {
        grid.push(type)
      } else {
        grid.push(null)
      }
    }
  }
  
  return grid
})
</script>

<style scoped>
.next-piece-container {
  background: #111;
  border: 2px solid #00ff00;
  padding: 10px;
  min-width: 70px;
  flex: 1;
}

.label {
  color: #00ff00;
  font-size: 10px;
  font-family: monospace;
  margin-bottom: 8px;
}

.preview {
  display: flex;
  justify-content: center;
  min-height: 50px;
  align-items: center;
}

.piece-grid {
  display: grid;
  gap: 1px;
}

.cell {
  width: 12px;
  height: 12px;
}

.empty {
  background: transparent;
}

.piece-i { background: #00ffff; }
.piece-o { background: #ffff00; }
.piece-t { background: #ff00ff; }
.piece-s { background: #00ff00; }
.piece-z { background: #ff0000; }
.piece-j { background: #0000ff; }
.piece-l { background: #ff8000; }

@media (min-width: 480px) {
  .next-piece-container {
    padding: 15px;
    min-width: 80px;
  }
  
  .label {
    font-size: 12px;
    margin-bottom: 10px;
  }
  
  .preview {
    min-height: 60px;
  }
  
  .cell {
    width: 15px;
    height: 15px;
  }
}
</style>