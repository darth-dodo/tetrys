<template>
  <div class="app">
    <!-- Achievement Notification Overlay -->
    <AchievementNotification />

    <!-- Header only shown during gameplay -->
    <header class="header" v-if="gameState.isPlaying || gameState.isGameOver">
      <h1 class="title">TETRYS</h1>
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
          <button class="close-button" @click="closeSettings">
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


      <!-- Game Layout -->
      <div class="game-layout" v-if="gameState.isPlaying">
        <div class="game-area">
          <GameBoard 
            :game-state="gameState"
            @move-left="handleMove('left')"
            @move-right="handleMove('right')"
            @move-down="handleMove('down')"
            @rotate="handleRotate"
            @drop="handleDrop"
          />
          
          <div class="info-panel">
            <ScoreBoard :game-state="gameState" />
            <NextPiece :next-piece="gameState.nextPiece" />
          </div>
        </div>
        
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
        <div class="landing-container">
          <div class="logo-container">
            <h1 class="game-logo">TETRYS</h1>
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
          
          <div class="start-actions">
            <button @click="startGame" class="start-button primary">
              ▶ START GAME
            </button>
            <button @click="showSettings = true" class="settings-button secondary">
              ⚙ SETTINGS
            </button>
          </div>
          
          <div class="controls-hint">
            <div class="mobile-controls">📱 Tap game board to rotate • Swipe to move • Use buttons to control</div>
            <div class="desktop-controls"><span class="key">←→↓</span> Move • <span class="key">↑</span> Rotate • <span class="key">ESC</span> Pause</div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useTetris } from '@/composables/useTetris'
import { useTheme } from '@/composables/useTheme'
import { useAudio } from '@/composables/useAudio'
import { useSpeed } from '@/composables/useSpeed'
import { useAchievements } from '@/composables/useAchievements'
import GameBoard from '@/components/GameBoard.vue'
import GameControls from '@/components/GameControls.vue'
import NextPiece from '@/components/NextPiece.vue'
import ScoreBoard from '@/components/ScoreBoard.vue'
import ThemeSelector from '@/components/ThemeSelector.vue'
import AudioControls from '@/components/AudioControls.vue'
import SpeedControl from '@/components/SpeedControl.vue'
import AchievementNotification from '@/components/AchievementNotification.vue'

// Settings panel state
const showSettings = ref(false)

// Initialize theme system
useTheme()

// Use audio system
const { playSound, startMusic, pauseMusic, resumeMusic, isMusicEnabled } = useAudio()

// Use speed system
const { speedMultiplier, setSpeed } = useSpeed()

// Use achievements system
const { triggerDevAchievement } = useAchievements()

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

// Audio system manages its own state - no interference needed

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

// Handle settings panel close with audio context resume
const closeSettings = async (): Promise<void> => {
  showSettings.value = false

  // Ensure music continues playing if it was enabled and the game is running
  if (gameState.value.isPlaying && isMusicEnabled.value && !gameState.value.isPaused) {
    await resumeMusic()
  }
}

// DEV: Keyboard shortcut for testing achievements (Ctrl/Cmd + Shift + A)
const handleDevKeyPress = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
    e.preventDefault()
    const rarities: Array<'common' | 'rare' | 'epic' | 'legendary'> = ['common', 'rare', 'epic', 'legendary']
    const randomRarity = rarities[Math.floor(Math.random() * rarities.length)]
    triggerDevAchievement(randomRarity)
    console.log('🎮 Dev shortcut triggered! Press Ctrl/Cmd+Shift+A for random achievement')
  }
}

// DEV: Expose achievement trigger to window for console access
if (import.meta.env.DEV) {
  (window as any).__triggerAchievement = (rarity?: 'common' | 'rare' | 'epic' | 'legendary') => {
    triggerDevAchievement(rarity)
  }
  console.log('🎮 Dev Mode: Use __triggerAchievement("legendary") in console or press Ctrl/Cmd+Shift+A')
}

onMounted(() => {
  document.addEventListener('keydown', handleDevKeyPress)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDevKeyPress)
  if (import.meta.env.DEV) {
    delete (window as any).__triggerAchievement
  }
})

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
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: calc(100vh - 80px);
  width: 100%;
  max-width: 100vw;
  box-sizing: border-box;
  position: relative;
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


.game-layout {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 100vw;
  padding: 0 8px;
  box-sizing: border-box;
  min-height: calc(100vh - 80px);
}

.game-area {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  flex: 1;
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 120px;
  flex-shrink: 0;
}

.start-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 0 20px;
}

.landing-container {
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.logo-container {
  margin-bottom: 60px;
}

.game-logo {
  color: var(--theme-primary, #00ff00);
  font-size: 72px;
  font-weight: 900;
  margin: 0 0 12px 0;
  text-shadow: var(--theme-glow, 0 0 30px rgba(0, 255, 0, 0.4));
  letter-spacing: 4px;
  font-family: monospace;
}

.logo-subtitle {
  color: var(--theme-text-secondary, #ccc);
  font-size: 18px;
  font-family: monospace;
  font-weight: 300;
  opacity: 0.9;
  letter-spacing: 1px;
}

.game-preview {
  margin: 40px 0;
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
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
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

.start-actions {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  margin: 45px 0 35px 0;
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
  margin-top: 35px;
  padding-top: 25px;
  border-top: 1px solid var(--theme-border, #333);
  color: var(--theme-text-secondary, #888);
  font-size: 12px;
  font-family: monospace;
  line-height: 1.4;
}

.mobile-controls {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--theme-text-secondary, #ccc);
}

.desktop-controls {
  display: none;
  font-size: 11px;
  color: var(--theme-text-secondary, #888);
}

/* Show desktop controls only on larger screens */
@media (min-width: 768px) {
  .mobile-controls {
    display: none;
  }
  
  .desktop-controls {
    display: block;
  }
}

/* Hide desktop controls on touch devices */
@media (hover: none) and (pointer: coarse) {
  .desktop-controls {
    display: none !important;
  }
  
  .mobile-controls {
    display: block !important;
  }
}


.key {
  background: var(--theme-surface, #111);
  color: var(--theme-text, #fff);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--theme-border, #333);
  font-weight: bold;
}

/* Mobile-first responsive breakpoints */
@media (max-width: 479px) {
  .game-container {
    padding: 4px;
  }
  
  .game-layout {
    gap: 8px;
    padding: 0 4px;
    min-height: calc(100vh - 70px);
  }
  
  .game-area {
    gap: 6px;
  }
  
  .info-panel {
    width: 100px;
    gap: 6px;
  }
}

@media (min-width: 480px) {
  .game-container {
    padding: 12px;
  }
  
  .game-layout {
    gap: 16px;
    padding: 0 12px;
  }
  
  .game-area {
    gap: 12px;
  }
  
  .info-panel {
    width: 140px;
    gap: 10px;
  }
}

@media (min-width: 768px) {
  .game-container {
    padding: 20px;
    min-height: calc(100vh - 100px);
  }
  
  .game-layout {
    flex-direction: column;
    align-items: center;
    max-width: 600px;
    gap: 24px;
  }
  
  .game-area {
    flex-direction: row;
    justify-content: center;
    align-items: flex-start;
    gap: 30px;
    max-width: 600px;
  }
  
  .info-panel {
    flex-direction: column;
    width: 180px;
    gap: 16px;
  }
}

/* Small mobile devices - header and start screen adjustments */
@media (max-width: 480px) {
  .header {
    padding: 10px;
  }
  
  .title {
    font-size: 22px;
  }
  
  .start-screen {
    padding: 15px 10px;
  }
  
  .game-logo {
    font-size: 32px;
  }
  
  .logo-subtitle {
    font-size: 12px;
  }
  
  .start-button {
    padding: 12px 20px;
    font-size: 16px;
    min-width: 160px;
  }
  
  .settings-button {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .preview-block {
    width: 14px;
    height: 14px;
  }
}

/* Very small screens - ultra compact */
@media (max-width: 360px) {
  .header {
    padding: 8px;
  }
  
  .title {
    font-size: 18px;
  }
  
  .game-logo {
    font-size: 28px;
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

/* Landscape mobile optimization */
@media (max-height: 500px) and (orientation: landscape) {
  .game-container {
    padding: 4px;
    min-height: calc(100vh - 50px);
  }
  
  .game-layout {
    flex-direction: row;
    gap: 10px;
    align-items: flex-start;
    padding: 0;
  }
  
  .info-panel {
    flex-direction: column;
    width: auto;
    min-width: 90px;
    padding: 0;
    margin-bottom: 0;
    gap: 8px;
  }
  
  .header {
    padding: 8px 15px;
  }
  
  .title {
    font-size: 18px;
  }
}

/* Ultra-wide mobile landscape */
@media (min-width: 640px) and (max-height: 400px) {
  .game-layout {
    max-width: 100%;
    justify-content: space-around;
  }
  
  .info-panel {
    width: 140px;
  }
}
</style>