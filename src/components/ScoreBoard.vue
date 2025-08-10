<template>
  <div class="scoreboard">
    <div class="stat">
      <div class="label">SCORE</div>
      <div class="value">{{ formatNumber(gameState.score) }}</div>
    </div>

    <div class="stat">
      <div class="label">LEVEL</div>
      <div class="value">{{ gameState.level }}</div>
    </div>

    <div class="stat">
      <div class="label">LINES</div>
      <div class="value">{{ gameState.lines }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { GameState } from '@/types/tetris'

interface Props {
  gameState: GameState
}

const props = defineProps<Props>()


// Format numbers with commas
const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

</script>

<style scoped>
.scoreboard {
  background: #111;
  border: 2px solid #00ff00;
  padding: 10px;
  min-width: 100px;
  flex: 1;
}

.stat {
  margin-bottom: 8px;
}

.stat:last-child {
  margin-bottom: 0;
}

.label {
  color: #00ff00;
  font-size: 10px;
  font-family: monospace;
  margin-bottom: 2px;
}

.value {
  color: #fff;
  font-size: 14px;
  font-family: monospace;
  font-weight: bold;
}

@media (min-width: 480px) {
  .scoreboard {
    padding: 15px;
    min-width: 120px;
  }
  
  .label {
    font-size: 12px;
  }
  
  .value {
    font-size: 18px;
  }
  
  .stat {
    margin-bottom: 10px;
  }
}
</style>