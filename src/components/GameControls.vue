<template>
  <div class="game-controls">
    <!-- Movement Controls -->
    <div class="controls-grid">
      <div></div>
      <button 
        class="control-button" 
        @click="handleRotate"
        @touchstart="handleTouchStart($event, 'rotate')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      >↻</button>
      <div></div>
      
      <button 
        class="control-button" 
        @click="handleMove('left')"
        @touchstart="handleTouchStart($event, 'left')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      >←</button>
      <button 
        class="control-button" 
        @click="handleMove('down')"
        @touchstart="handleTouchStart($event, 'down')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      >↓</button>
      <button 
        class="control-button" 
        @click="handleMove('right')"
        @touchstart="handleTouchStart($event, 'right')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      >→</button>
    </div>

    <!-- Action buttons -->
    <div class="action-controls">
      <button 
        class="action-button drop-button" 
        @click="handleDrop"
        @touchstart="handleTouchStart($event, 'drop')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      >DROP</button>
      <button 
        class="action-button pause-button" 
        @click="$emit('pause')" 
        @touchstart="handleTouchStart($event, 'pause')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
        v-if="gameState.isPlaying"
      >
        {{ gameState.isPaused ? 'RESUME' : 'PAUSE' }}
      </button>
      <button 
        class="action-button reset-button" 
        @click="showResetConfirm = true" 
        @touchstart="handleTouchStart($event, 'reset')"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
        v-if="gameState.isPlaying"
      >
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

// Touch interaction state
const touchState = ref({
  isPressed: false,
  activeButton: null as string | null,
  touchStartTime: 0
})

// Touch event handlers for better mobile responsiveness
const handleTouchStart = (e: TouchEvent, action: string) => {
  e.preventDefault()
  touchState.value.isPressed = true
  touchState.value.activeButton = action
  touchState.value.touchStartTime = Date.now()
  
  // Add visual feedback immediately
  const button = e.target as HTMLElement
  button.classList.add('touch-pressed')
  
  // Provide haptic feedback if available
  if ('vibrate' in navigator) {
    navigator.vibrate(10)
  }
}

const handleTouchEnd = (e?: TouchEvent) => {
  if (e) e.preventDefault()
  
  const button = document.querySelector('.touch-pressed')
  if (button) {
    button.classList.remove('touch-pressed')
  }
  
  // Execute action if touch was quick enough (prevent accidental long presses)
  if (touchState.value.isPressed && touchState.value.activeButton) {
    const touchDuration = Date.now() - touchState.value.touchStartTime
    
    if (touchDuration < 500) { // 500ms max for intentional tap
      const action = touchState.value.activeButton
      
      switch (action) {
        case 'left':
        case 'right':
        case 'down':
          handleMove(action as 'left' | 'right' | 'down')
          break
        case 'rotate':
          handleRotate()
          break
        case 'drop':
          handleDrop()
          break
        case 'pause':
          emit('pause')
          break
        case 'reset':
          showResetConfirm.value = true
          break
      }
    }
  }
  
  touchState.value.isPressed = false
  touchState.value.activeButton = null
}

// Enhanced control handlers with better mobile support

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
  width: 70px;
  height: 70px;
  font-size: 24px;
  font-family: monospace;
  font-weight: bold;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  transition: all 0.15s ease;
  box-shadow: var(--theme-shadow, 0 4px 0 var(--theme-secondary, #008800));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.control-button:hover, .control-button:focus {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
  outline: none;
  transform: translateY(-2px);
  box-shadow: var(--theme-shadow, 0 6px 0 var(--theme-secondary, #008800));
}

.control-button:active,
.control-button.touch-pressed {
  background: var(--theme-secondary, #008800);
  transform: translateY(2px) scale(0.98);
  box-shadow: var(--theme-shadow, 0 2px 0 var(--theme-accent, #006600));
  transition: all 0.05s ease;
}

/* Touch feedback animation */
.control-button.touch-pressed::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ripple 0.3s ease-out;
}

@keyframes ripple {
  to {
    width: 100%;
    height: 100%;
    opacity: 0;
  }
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
  padding: 14px 24px;
  font-family: monospace;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  min-width: 100px;
  min-height: 56px;
  transition: all 0.15s ease;
  box-shadow: var(--theme-shadow, 0 4px 0 var(--theme-secondary, #008800));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.action-button:hover, .action-button:focus {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
  outline: none;
  transform: translateY(-2px);
  box-shadow: var(--theme-shadow, 0 6px 0 var(--theme-secondary, #008800));
}

.action-button:active,
.action-button.touch-pressed {
  background: var(--theme-secondary, #008800);
  transform: translateY(2px) scale(0.98);
  box-shadow: var(--theme-shadow, 0 2px 0 var(--theme-accent, #006600));
  transition: all 0.05s ease;
}

.action-button.touch-pressed::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ripple 0.3s ease-out;
}

@media (min-width: 480px) {
  .game-controls {
    margin-top: 25px;
    padding: 0 20px;
  }
  
  .controls-grid {
    gap: 15px;
    max-width: 260px;
    margin-bottom: 25px;
  }
  
  .control-button {
    width: 75px;
    height: 75px;
    font-size: 28px;
  }
  
  .action-controls {
    gap: 15px;
  }
  
  .action-button {
    padding: 16px 28px;
    font-size: 18px;
    min-width: 110px;
    min-height: 58px;
  }
}

/* Special button styles */
.drop-button {
  background: var(--theme-bg, #333);
  border-color: #4CAF50;
  color: #4CAF50;
  box-shadow: 0 4px 0 #2E7D32;
}

.drop-button:hover, .drop-button:focus {
  background: #4CAF50;
  color: var(--theme-bg, #000);
  box-shadow: 0 6px 0 #2E7D32;
}

.drop-button:active,
.drop-button.touch-pressed {
  background: #2E7D32;
  box-shadow: 0 2px 0 #1B5E20;
}

.pause-button {
  background: var(--theme-bg, #333);
  border-color: #FF9800;
  color: #FF9800;
  box-shadow: 0 4px 0 #F57C00;
}

.pause-button:hover, .pause-button:focus {
  background: #FF9800;
  color: var(--theme-bg, #000);
  box-shadow: 0 6px 0 #F57C00;
}

.pause-button:active,
.pause-button.touch-pressed {
  background: #F57C00;
  box-shadow: 0 2px 0 #E65100;
}

.reset-button {
  background: var(--theme-bg, #333);
  border-color: #ff6b6b;
  color: #ff6b6b;
  box-shadow: 0 4px 0 #ff5252;
}

.reset-button:hover, .reset-button:focus {
  background: #ff6b6b;
  color: var(--theme-bg, #000);
  box-shadow: 0 6px 0 #ff5252;
}

.reset-button:active,
.reset-button.touch-pressed {
  background: #ff5252;
  box-shadow: 0 2px 0 #f44336;
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

/* Mobile-first responsive adjustments */
@media (max-width: 360px) {
  .controls-grid {
    max-width: 220px;
    gap: 12px;
  }
  
  .control-button {
    width: 65px;
    height: 65px;
    font-size: 22px;
  }
  
  .action-button {
    padding: 12px 18px;
    font-size: 14px;
    min-width: 85px;
    min-height: 50px;
  }
}

@media (max-width: 320px) {
  .controls-grid {
    max-width: 200px;
    gap: 10px;
  }
  
  .control-button {
    width: 60px;
    height: 60px;
    font-size: 20px;
  }
  
  .action-button {
    padding: 10px 16px;
    font-size: 13px;
    min-width: 75px;
    min-height: 48px;
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

/* Landscape mobile adjustments */
@media (max-height: 500px) and (orientation: landscape) {
  .game-controls {
    margin-top: 10px;
  }
  
  .controls-grid {
    margin-bottom: 15px;
    max-width: 200px;
    gap: 8px;
  }
  
  .control-button {
    width: 50px;
    height: 50px;
    font-size: 18px;
  }
  
  .action-controls {
    gap: 8px;
  }
  
  .action-button {
    padding: 8px 12px;
    font-size: 12px;
    min-width: 65px;
    min-height: 40px;
  }
}
</style>