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
      <button class="action-button reset-button" @click="showResetConfirm = true" v-if="gameState.isPlaying">
        RESET
      </button>
    </div>

    <!-- Reset Confirmation Modal -->
    <div v-if="showResetConfirm" class="reset-modal-overlay" @click="showResetConfirm = false">
      <div class="reset-modal" @click.stop>
        <h3>Reset Game?</h3>
        <p>Are you sure you want to reset the current game? This will clear your progress.</p>
        <div class="reset-modal-actions">
          <button class="modal-button cancel-button" @click="showResetConfirm = false">
            CANCEL
          </button>
          <button class="modal-button reset-confirm-button" @click="confirmReset">
            RESET
          </button>
        </div>
      </div>
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
  reset: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reset confirmation modal state
const showResetConfirm = ref(false)

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

const confirmReset = () => {
  showResetConfirm.value = false
  emit('reset')
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

/* Reset button specific styles */
.reset-button {
  background: var(--theme-bg, #333);
  border-color: #ff6b6b;
  color: #ff6b6b;
}

.reset-button:hover, .reset-button:focus {
  background: #ff6b6b;
  color: var(--theme-bg, #000);
}

.reset-button:active {
  background: #ff5252;
  transform: scale(0.95);
}

/* Reset confirmation modal */
.reset-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.reset-modal {
  background: var(--theme-bg, #333);
  border: 3px solid var(--theme-primary, #00ff00);
  border-radius: 8px;
  padding: 24px;
  max-width: 400px;
  width: 100%;
  box-shadow: var(--theme-shadow, none);
  text-align: center;
}

.reset-modal h3 {
  color: var(--theme-primary, #00ff00);
  font-family: monospace;
  font-size: 20px;
  font-weight: bold;
  margin: 0 0 16px 0;
}

.reset-modal p {
  color: var(--theme-text, #ccc);
  font-family: monospace;
  font-size: 14px;
  line-height: 1.4;
  margin: 0 0 24px 0;
}

.reset-modal-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.modal-button {
  font-family: monospace;
  font-size: 14px;
  font-weight: bold;
  padding: 12px 20px;
  border: 3px solid;
  border-radius: 4px;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  min-width: 100px;
  min-height: 48px;
  transition: all 0.2s ease;
}

.cancel-button {
  background: var(--theme-bg, #333);
  color: var(--theme-text-secondary, #999);
  border-color: var(--theme-text-secondary, #999);
}

.cancel-button:hover, .cancel-button:focus {
  background: var(--theme-text-secondary, #999);
  color: var(--theme-bg, #000);
}

.reset-confirm-button {
  background: var(--theme-bg, #333);
  color: #ff6b6b;
  border-color: #ff6b6b;
}

.reset-confirm-button:hover, .reset-confirm-button:focus {
  background: #ff6b6b;
  color: var(--theme-bg, #000);
}

.modal-button:active {
  transform: scale(0.95);
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

  .reset-modal {
    padding: 20px;
  }

  .reset-modal h3 {
    font-size: 18px;
  }

  .reset-modal p {
    font-size: 12px;
  }

  .modal-button {
    padding: 10px 16px;
    font-size: 12px;
    min-width: 80px;
    min-height: 44px;
  }

  .reset-modal-actions {
    gap: 10px;
  }
}
</style>