<template>
  <div 
    class="next-piece-container" 
    role="status" 
    aria-label="Next piece preview"
  >
    <div class="label">NEXT</div>
    <div 
      class="preview" 
      :aria-label="nextPiece ? `Next piece: ${nextPiece.type} piece` : 'No next piece'"
    >
      <div
        v-if="nextPiece"
        class="piece-grid"
        :style="{
          gridTemplateColumns: `repeat(${maxWidth}, 1fr)`,
          gridTemplateRows: `repeat(${maxHeight}, 1fr)`
        }"
        role="img"
        :aria-label="`${nextPiece.type.toUpperCase()} tetromino piece preview`"
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
  background: var(--theme-surface, #111);
  border: 2px solid var(--theme-border, #00ff00);
  padding: 12px;
  min-width: 90px;
  flex: 1;
  box-shadow: var(--theme-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
  border-radius: 6px;
}

.label {
  color: var(--theme-primary, #00ff00);
  font-size: 12px;
  font-family: monospace;
  margin-bottom: 10px;
  text-shadow: var(--theme-glow, none);
  font-weight: bold;
  letter-spacing: 0.5px;
  text-align: center;
}

.preview {
  display: flex;
  justify-content: center;
  min-height: 60px;
  align-items: center;
  padding: 4px;
}

.piece-grid {
  display: grid;
  gap: 1px;
}

.cell {
  width: 15px;
  height: 15px;
  border-radius: 2px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.empty {
  background: transparent;
}

.piece-i { background: var(--piece-i, #00ffff); }
.piece-o { background: var(--piece-o, #ffff00); }
.piece-t { background: var(--piece-t, #ff00ff); }
.piece-s { background: var(--piece-s, #00ff00); }
.piece-z { background: var(--piece-z, #ff0000); }
.piece-j { background: var(--piece-j, #0000ff); }
.piece-l { background: var(--piece-l, #ff8000); }

/* Mobile-first responsive design */
@media (min-width: 480px) {
  .next-piece-container {
    padding: 16px;
    min-width: 100px;
  }
  
  .label {
    font-size: 13px;
    margin-bottom: 12px;
  }
  
  .preview {
    min-height: 70px;
    padding: 6px;
  }
  
  .cell {
    width: 17px;
    height: 17px;
  }
}

@media (min-width: 768px) {
  .next-piece-container {
    padding: 18px;
    min-width: 120px;
  }
  
  .label {
    font-size: 14px;
    margin-bottom: 14px;
  }
  
  .preview {
    min-height: 80px;
  }
  
  .cell {
    width: 19px;
    height: 19px;
  }
}

/* Landscape mobile adjustments */
@media (max-height: 500px) and (orientation: landscape) {
  .next-piece-container {
    padding: 8px 10px;
    min-width: 75px;
  }
  
  .label {
    font-size: 10px;
    margin-bottom: 6px;
  }
  
  .preview {
    min-height: 40px;
    padding: 2px;
  }
  
  .cell {
    width: 12px;
    height: 12px;
  }
}
</style>