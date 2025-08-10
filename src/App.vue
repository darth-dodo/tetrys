<template>
  <div class="app">
    <header class="header">
      <h1 class="title">TETRIS</h1>
    </header>

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
          @move-left="movePiece(-1, 0)"
          @move-right="movePiece(1, 0)"
          @move-down="movePiece(0, 1)"
          @rotate="rotatePiece"
          @drop="dropPiece"
          @start="startGame"
          @pause="pauseGame"
          @restart="restartGame"
        />
      </div>

      <!-- Start Screen -->
      <div v-if="!gameState.isPlaying && !gameState.isGameOver" class="start-screen">
        <h2>CLASSIC TETRIS</h2>
        <p>Drop blocks to clear lines</p>
        <button @click="startGame">START GAME</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useTetris } from '@/composables/useTetris'
import GameBoard from '@/components/GameBoard.vue'
import GameControls from '@/components/GameControls.vue'
import NextPiece from '@/components/NextPiece.vue'
import ScoreBoard from '@/components/ScoreBoard.vue'

// Use the Tetris game logic
const {
  gameState,
  movePiece,
  rotatePiece,
  dropPiece,
  startGame,
  pauseGame,
  resetGame
} = useTetris()

// Format score for display
const formatScore = (score: number): string => {
  return score.toLocaleString()
}

// Restart game
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
  background: #000;
  color: #fff;
  min-height: 100vh;
  font-family: monospace;
}

.header {
  text-align: center;
  padding: 20px;
  background: #111;
  border-bottom: 2px solid #333;
}

.title {
  font-size: 32px;
  font-weight: bold;
  margin: 0;
  color: #00ff00;
  text-shadow: 0 0 10px #00ff00;
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
  background: #111;
  border: 2px solid #00ff00;
  padding: 30px;
  text-align: center;
  min-width: 200px;
}

.modal h2 {
  color: #ff0000;
  margin: 0 0 20px 0;
  font-size: 24px;
}

.stats {
  margin: 20px 0;
}

.stats p {
  margin: 5px 0;
  color: #ffff00;
}

.modal button, .start-screen button {
  background: #333;
  color: #00ff00;
  border: 2px solid #00ff00;
  padding: 10px 20px;
  font-family: monospace;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
}

.modal button:hover, .start-screen button:hover {
  background: #00ff00;
  color: #000;
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