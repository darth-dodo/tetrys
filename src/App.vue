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
        <div class="settings-section">
          <SpeedControl 
            :current-speed="speedMultiplier" 
            @set-speed="setSpeed"
          />
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
          @reset="handleReset"
        />
      </div>

      <!-- Start Screen -->
      <div v-if="!gameState.isPlaying && !gameState.isGameOver" class="start-screen">
        <div class="logo-container">
          <h1 class="game-logo">TETREES</h1>
          <div class="logo-subtitle">Classic Block Puzzle</div>
        </div>
        
        <div class="game-preview">
          <div class="preview-grid">
            <div class="preview-block t-piece"></div>
            <div class="preview-block i-piece"></div>
            <div class="preview-block o-piece"></div>
            <div class="preview-block l-piece"></div>
          </div>
        </div>
        
        <div class="game-description">
          <p>Stack falling blocks to clear lines</p>
          <p>The classic puzzle game reimagined</p>
        </div>
        
        <div class="start-options">
          <button @click="startGame" class="start-button">
            ▶ START GAME
          </button>
          <button @click="showSettings = true" class="settings-button">
            ⚙ SETTINGS
          </button>
        </div>
        
        <div class="controls-hint">
          <div class="hint-row">
            <span class="key">←→↓</span> Move • <span class="key">↑</span> Rotate • <span class="key">P</span> Pause
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTetris } from '@/composables/useTetris'
import { useTheme } from '@/composables/useTheme'
import { useAudio } from '@/composables/useAudio'
import { useSpeed } from '@/composables/useSpeed'
import GameBoard from '@/components/GameBoard.vue'
import GameControls from '@/components/GameControls.vue'
import NextPiece from '@/components/NextPiece.vue'
import ScoreBoard from '@/components/ScoreBoard.vue'
import ThemeSelector from '@/components/ThemeSelector.vue'
import AudioControls from '@/components/AudioControls.vue'
import SpeedControl from '@/components/SpeedControl.vue'

// Settings panel state
const showSettings = ref(false)

// Initialize theme system
useTheme()

// Use audio system
const { playSound, startMusic, stopMusic, pauseMusic, resumeMusic, isMusicEnabled } = useAudio()

// Use speed system
const { speedMultiplier, setSpeed } = useSpeed()

// Use the Tetris game logic
const {
  gameState,
  movePiece,
  rotatePiece,
  dropPiece,
  startGame: originalStartGame,
  pauseGame: originalPauseGame,
  resetGame,
  setSpeedMultiplier
} = useTetris()

// Watch for speed changes and update game
watch(speedMultiplier, (newSpeed) => {
  setSpeedMultiplier(newSpeed)
}, { immediate: true })

// Manage audio state during settings panel interactions
let settingsAudioPaused = false

watch(showSettings, async (isOpen) => {
  // Only manage audio state if game is actively playing (not paused by player)
  if (gameState.value.isPlaying && !gameState.value.isPaused) {
    if (isOpen) {
      // Settings opened during active gameplay - pause music temporarily
      if (isMusicEnabled.value) {
        pauseMusic()
        settingsAudioPaused = true
      }
    } else {
      // Settings closed - resume music if we paused it
      if (settingsAudioPaused && isMusicEnabled.value) {
        await resumeMusic()
        settingsAudioPaused = false
      }
    }
  } else if (!isOpen) {
    // Reset flag when settings closed regardless of game state
    settingsAudioPaused = false
  }
})

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
  const wasPaused = gameState.value.isPaused
  originalPauseGame()
  
  // Audio logic based on the NEW state (after toggle)
  if (gameState.value.isPaused) {
    // Game just got paused
    pauseMusic()
  } else {
    // Game just got resumed
    resumeMusic()
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

// Reset game without starting a new one
const handleReset = (): void => {
  resetGame()
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
  padding: 30px 20px;
  max-width: 400px;
  margin: 0 auto;
}

.logo-container {
  margin-bottom: 30px;
}

.game-logo {
  color: var(--theme-primary, #00ff00);
  font-size: 48px;
  font-weight: 900;
  margin: 0;
  text-shadow: var(--theme-glow, 0 0 20px rgba(0, 255, 0, 0.3));
  letter-spacing: 2px;
}

.logo-subtitle {
  color: var(--theme-text-secondary, #ccc);
  font-size: 14px;
  margin-top: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.game-preview {
  margin: 30px 0;
  display: flex;
  justify-content: center;
}

.preview-grid {
  display: flex;
  gap: 8px;
  align-items: center;
}

.preview-block {
  width: 20px;
  height: 20px;
  border: 1px solid var(--theme-border, #333);
  animation: float 2s ease-in-out infinite;
}

.t-piece { 
  background: var(--piece-t, #ff00ff); 
  animation-delay: 0s;
}
.i-piece { 
  background: var(--piece-i, #00ffff); 
  animation-delay: 0.5s;
}
.o-piece { 
  background: var(--piece-o, #ffff00); 
  animation-delay: 1s;
}
.l-piece { 
  background: var(--piece-l, #ff8000); 
  animation-delay: 1.5s;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

.game-description {
  margin: 25px 0;
}

.game-description p {
  color: var(--theme-text-secondary, #ccc);
  margin: 8px 0;
  font-size: 14px;
  line-height: 1.4;
}

.start-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  margin: 30px 0;
}

.start-button {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
  border: 3px solid var(--theme-primary, #00ff00);
  padding: 15px 30px;
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 6px;
  box-shadow: 0 4px 0 var(--theme-secondary, #008800);
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 200px;
}

.start-button:hover {
  background: var(--theme-secondary, #008800);
  border-color: var(--theme-secondary, #008800);
  transform: translateY(-2px);
  box-shadow: 0 6px 0 var(--theme-accent, #006600);
}

.start-button:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 var(--theme-accent, #006600);
}

.settings-button {
  background: transparent;
  color: var(--theme-text-secondary, #ccc);
  border: 2px solid var(--theme-text-secondary, #ccc);
  padding: 10px 20px;
  font-family: monospace;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.settings-button:hover {
  background: var(--theme-text-secondary, #ccc);
  color: var(--theme-bg, #000);
}

.controls-hint {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid var(--theme-border, #333);
}

.hint-row {
  color: var(--theme-text-secondary, #888);
  font-size: 12px;
  font-family: monospace;
  line-height: 1.4;
}

.key {
  background: var(--theme-surface, #111);
  color: var(--theme-text, #fff);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--theme-border, #333);
  font-weight: bold;
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
    padding: 20px 15px;
  }
  
  .game-logo {
    font-size: 36px;
  }
  
  .logo-subtitle {
    font-size: 12px;
  }
  
  .game-description p {
    font-size: 13px;
  }
  
  .start-button {
    padding: 12px 25px;
    font-size: 16px;
    min-width: 180px;
  }
  
  .settings-button {
    padding: 8px 16px;
    font-size: 12px;
  }
  
  .preview-block {
    width: 16px;
    height: 16px;
  }
  
  .hint-row {
    font-size: 11px;
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