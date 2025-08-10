<template>
  <div class="app">
    <header class="header">
      <h1 class="title">TETREES</h1>
      <div class="header-controls">
        <button class="settings-button" @click="showSettings = !showSettings">
          ⚙️ SETTINGS
        </button>
      </div>
    </header>

    <!-- Settings Panel -->
    <div v-if="showSettings" class="settings-panel">
      <div class="settings-content">
        <div class="settings-section">
          <ThemeSelector />
        </div>
        <div class="settings-section">
          <AudioControls />
        </div>
        <div class="settings-actions">
          <button class="close-button" @click="showSettings = false">
            CLOSE
          </button>
        </div>
      </div>
    </div>

    <main class="game-container">
      <!-- Game Over Screen -->
      <div v-if="gameState.isGameOver" class="overlay">
        <div class="modal">
          <h2>GAME OVER</h2>
          <div class="stats">
            <p>Score: {{ formatScore(gameState.score) }}</p>
            <p>Level: {{ gameState.level }}</p>
            <p>Lines: {{ gameState.lines }}</p>
          </div>
          <button @click="restartGame">PLAY AGAIN</button>
        </div>
      </div>

      <!-- Pause Screen -->
      <div v-if="gameState.isPaused && gameState.isPlaying" class="overlay">
        <div class="modal">
          <h2>PAUSED</h2>
          <p>Press P to continue</p>
        </div>
      </div>

      <!-- Game Layout -->
      <div class="game-layout" v-if="gameState.isPlaying">
        <div class="info-panel">
          <ScoreBoard :game-state="gameState" />
          <NextPiece :next-piece="gameState.nextPiece" />
        </div>
        
        <GameBoard :game-state="gameState" />
        
        <GameControls
          :game-state="gameState"
          @move-left="handleMove('left')"
          @move-right="handleMove('right')"
          @move-down="handleMove('down')"
          @rotate="handleRotate"
          @drop="handleDrop"
          @start="startGame"
          @pause="pauseGame"
          @restart="restartGame"
        />
      </div>

      <!-- Start Screen -->
      <div v-if="!gameState.isPlaying && !gameState.isGameOver" class="start-screen">
        <h2>CLASSIC TETREES</h2>
        <p>Drop blocks to clear lines</p>
        <div class="start-options">
          <button @click="startGame">START GAME</button>
          <button @click="showSettings = true" class="secondary-button">
            SETTINGS
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTetris } from '@/composables/useTetris'
import { useTheme } from '@/composables/useTheme'
import { useAudio } from '@/composables/useAudio'
import GameBoard from '@/components/GameBoard.vue'
import GameControls from '@/components/GameControls.vue'
import NextPiece from '@/components/NextPiece.vue'
import ScoreBoard from '@/components/ScoreBoard.vue'
import ThemeSelector from '@/components/ThemeSelector.vue'
import AudioControls from '@/components/AudioControls.vue'

// Settings panel state
const showSettings = ref(false)

// Initialize theme system
useTheme()

// Use audio system
const { playSound, startMusic, stopMusic } = useAudio()

// Use the Tetris game logic
const {
  gameState,
  movePiece,
  rotatePiece,
  dropPiece,
  startGame: originalStartGame,
  pauseGame: originalPauseGame,
  resetGame
} = useTetris()

// Enhanced game controls with audio feedback
const handleMove = (direction: 'left' | 'right' | 'down') => {
  const moved = movePiece(
    direction === 'left' ? -1 : direction === 'right' ? 1 : 0,
    direction === 'down' ? 1 : 0
  )
  if (moved) {
    playSound('move')
  }
}

const handleRotate = () => {
  rotatePiece()
  playSound('rotate')
}

const handleDrop = () => {
  dropPiece()
  playSound('drop')
}

const startGame = () => {
  originalStartGame()
  startMusic()
}

const pauseGame = () => {
  originalPauseGame()
  if (gameState.isPaused) {
    stopMusic()
  } else {
    startMusic()
  }
}

// Format score for display
const formatScore = (score: number): string => {
  return score.toLocaleString()
}

// Restart game with audio
const restartGame = (): void => {
  resetGame()
  startGame()
}

// Prevent context menu on long press (mobile)
document.addEventListener('contextmenu', (e) => {
  if (e.target instanceof HTMLElement && e.target.closest('.control-button')) {
    e.preventDefault()
  }
})

// Prevent zoom on double tap (mobile)
let lastTouchEnd = 0
document.addEventListener('touchend', (e) => {
  const now = new Date().getTime()
  if (now - lastTouchEnd <= 300) {
    e.preventDefault()
  }
  lastTouchEnd = now
}, false)
</script>

<style scoped>
.app {
  background: var(--theme-bg, #000);
  color: var(--theme-text, #fff);
  min-height: 100vh;
  font-family: monospace;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--theme-surface, #111);
  border-bottom: 2px solid var(--theme-border, #333);
}

.title {
  font-size: 32px;
  font-weight: bold;
  margin: 0;
  color: var(--theme-primary, #00ff00);
  text-shadow: var(--theme-glow, none);
}

.header-controls {
  display: flex;
  gap: 10px;
}

.settings-button {
  background: var(--theme-bg, #000);
  color: var(--theme-primary, #00ff00);
  border: 2px solid var(--theme-primary, #00ff00);
  padding: 8px 12px;
  font-family: monospace;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-button:hover {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
}

.settings-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.settings-content {
  background: var(--theme-surface, #111);
  border: 2px solid var(--theme-border, #00ff00);
  padding: 20px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-section {
  flex: 1;
}

.settings-actions {
  display: flex;
  justify-content: center;
  padding-top: 10px;
  border-top: 1px solid var(--theme-border, #00ff00);
}

.close-button {
  background: var(--theme-bg, #000);
  color: var(--theme-primary, #00ff00);
  border: 2px solid var(--theme-primary, #00ff00);
  padding: 10px 20px;
  font-family: monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
}

.game-container {
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 80px);
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--theme-surface, #111);
  border: 2px solid var(--theme-border, #00ff00);
  padding: 30px;
  text-align: center;
  min-width: 200px;
}

.modal h2 {
  color: var(--theme-accent, #ff0000);
  margin: 0 0 20px 0;
  font-size: 24px;
}

.stats {
  margin: 20px 0;
}

.stats p {
  margin: 5px 0;
  color: var(--theme-accent, #ffff00);
}

.modal button, .start-screen button {
  background: var(--theme-bg, #333);
  color: var(--theme-primary, #00ff00);
  border: 2px solid var(--theme-primary, #00ff00);
  padding: 10px 20px;
  font-family: monospace;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  transition: all 0.2s ease;
}

.modal button:hover, .start-screen button:hover {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
}

.secondary-button {
  background: var(--theme-surface, #111) !important;
  color: var(--theme-text-secondary, #ccc) !important;
  border-color: var(--theme-text-secondary, #ccc) !important;
}

.secondary-button:hover {
  background: var(--theme-text-secondary, #ccc) !important;
  color: var(--theme-bg, #000) !important;
}

.start-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.game-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  width: 100%;
  max-width: 600px;
}

.info-panel {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 400px;
  gap: 10px;
}

.start-screen {
  text-align: center;
  padding: 40px;
}

.start-screen h2 {
  color: #00ff00;
  font-size: 28px;
  margin-bottom: 20px;
}

.start-screen p {
  color: #ccc;
  margin-bottom: 30px;
  font-size: 16px;
}

@media (min-width: 768px) {
  .game-container {
    padding: 20px;
    min-height: calc(100vh - 100px);
  }
  
  .game-layout {
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    max-width: 800px;
    width: 100%;
  }
  
  .info-panel {
    flex-direction: column;
    width: 150px;
  }
}

@media (max-width: 480px) {
  .game-container {
    padding: 5px;
  }
  
  .header {
    padding: 15px;
  }
  
  .title {
    font-size: 24px;
  }
  
  .info-panel {
    max-width: 100%;
    gap: 8px;
  }
  
  .start-screen {
    padding: 20px 10px;
  }
  
  .start-screen h2 {
    font-size: 24px;
    margin-bottom: 15px;
  }
  
  .start-screen p {
    font-size: 14px;
    margin-bottom: 20px;
  }
}

@media (max-height: 600px) {
  .game-container {
    min-height: calc(100vh - 60px);
  }
  
  .header {
    padding: 10px;
  }
  
  .title {
    font-size: 20px;
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  .game-layout {
    flex-direction: row;
    gap: 15px;
    align-items: flex-start;
  }
  
  .info-panel {
    flex-direction: column;
    width: auto;
    min-width: 100px;
  }
}
</style>