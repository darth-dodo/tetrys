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
  margin-top: 20px;
  width: 100%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 10px;
}

.controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  max-width: 220px;
  margin: 0 auto 20px auto;
}

.control-button {
  background: var(--theme-bg, #333);
  color: var(--theme-primary, #00ff00);
  border: 3px solid var(--theme-primary, #00ff00);
  width: 60px;
  height: 60px;
  font-size: 22px;
  font-family: monospace;
  font-weight: bold;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  transition: all 0.2s ease;
  box-shadow: var(--theme-shadow, none);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
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
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-button {
  background: var(--theme-bg, #333);
  color: var(--theme-primary, #00ff00);
  border: 3px solid var(--theme-primary, #00ff00);
  padding: 12px 20px;
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  min-width: 80px;
  min-height: 48px;
  transition: all 0.2s ease;
  box-shadow: var(--theme-shadow, none);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
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
    margin-top: 25px;
    padding: 0 20px;
  }
  
  .controls-grid {
    gap: 15px;
    max-width: 250px;
    margin-bottom: 25px;
  }
  
  .control-button {
    width: 70px;
    height: 70px;
    font-size: 26px;
  }
  
  .action-controls {
    gap: 15px;
  }
  
  .action-button {
    padding: 15px 25px;
    font-size: 16px;
    min-width: 100px;
    min-height: 52px;
  }
}

@media (max-width: 320px) {
  .controls-grid {
    max-width: 200px;
    gap: 10px;
  }
  
  .control-button {
    width: 55px;
    height: 55px;
    font-size: 20px;
  }
  
  .action-button {
    padding: 10px 16px;
    font-size: 12px;
    min-width: 70px;
    min-height: 44px;
  }
}
</style>