<template>
  <div class="game-controls">
    <!-- Movement Controls -->
    <div class="controls-grid">
      <div></div>
      <button class="control-button" @click="handleRotate">↻</button>
      <div></div>
      
      <button class="control-button" @click="handleMove('left')">←</button>
      <button class="control-button" @click="handleMove('down')">↓</button>
      <button class="control-button" @click="handleMove('right')">→</button>
    </div>

    <!-- Action buttons -->
    <div class="action-controls">
      <button class="action-button" @click="handleDrop">DROP</button>
      <button class="action-button" @click="$emit('pause')" v-if="gameState.isPlaying">
        {{ gameState.isPaused ? 'RESUME' : 'PAUSE' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { GameState } from '@/types/tetris'

interface Props {
  gameState: GameState
}

interface Emits {
  moveLeft: []
  moveRight: []
  moveDown: []
  rotate: []
  drop: []
  start: []
  pause: []
  restart: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Simple control handlers

const handleMove = (direction: 'left' | 'right' | 'down') => {
  if (!props.gameState.isPlaying || props.gameState.isPaused) return
  
  switch (direction) {
    case 'left':
      emit('moveLeft')
      break
    case 'right':
      emit('moveRight')
      break
    case 'down':
      emit('moveDown')
      break
  }
}

const handleRotate = () => {
  if (!props.gameState.isPlaying || props.gameState.isPaused) return
  emit('rotate')
}

const handleDrop = () => {
  if (!props.gameState.isPlaying || props.gameState.isPaused) return
  emit('drop')
}


// Keyboard controls for desktop
const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.gameState.isPlaying || props.gameState.isPaused) return
  
  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      e.preventDefault()
      handleMove('left')
      break
    case 'ArrowRight':
    case 'KeyD':
      e.preventDefault()
      handleMove('right')
      break
    case 'ArrowDown':
    case 'KeyS':
      e.preventDefault()
      handleMove('down')
      break
    case 'ArrowUp':
    case 'KeyW':
    case 'Space':
      e.preventDefault()
      handleRotate()
      break
    case 'Enter':
      e.preventDefault()
      handleDrop()
      break
    case 'KeyP':
      e.preventDefault()
      emit('pause')
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.game-controls {
  margin-top: 15px;
  width: 100%;
  max-width: 350px;
  margin-left: auto;
  margin-right: auto;
}

.controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  max-width: 160px;
  margin: 0 auto 15px auto;
}

.control-button {
  background: var(--theme-bg, #333);
  color: var(--theme-primary, #00ff00);
  border: 2px solid var(--theme-primary, #00ff00);
  width: 45px;
  height: 45px;
  font-size: 18px;
  font-family: monospace;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  transition: all 0.2s ease;
  box-shadow: var(--theme-shadow, none);
}

.control-button:hover, .control-button:focus {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
  outline: none;
}

.control-button:active {
  background: var(--theme-secondary, #008800);
  transform: scale(0.95);
}

.action-controls {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-button {
  background: var(--theme-bg, #333);
  color: var(--theme-primary, #00ff00);
  border: 2px solid var(--theme-primary, #00ff00);
  padding: 8px 12px;
  font-family: monospace;
  font-size: 12px;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  min-width: 60px;
  transition: all 0.2s ease;
  box-shadow: var(--theme-shadow, none);
}

.action-button:hover, .action-button:focus {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
  outline: none;
}

.action-button:active {
  background: var(--theme-secondary, #008800);
  transform: scale(0.95);
}

@media (min-width: 480px) {
  .game-controls {
    margin-top: 20px;
  }
  
  .controls-grid {
    gap: 10px;
    max-width: 180px;
    margin-bottom: 20px;
  }
  
  .control-button {
    width: 50px;
    height: 50px;
    font-size: 20px;
  }
  
  .action-controls {
    gap: 10px;
  }
  
  .action-button {
    padding: 10px 15px;
    font-size: 14px;
    min-width: 70px;
  }
}

@media (max-width: 320px) {
  .controls-grid {
    max-width: 140px;
    gap: 6px;
  }
  
  .control-button {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .action-button {
    padding: 6px 8px;
    font-size: 11px;
    min-width: 50px;
  }
}
</style>