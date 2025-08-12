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
  background: var(--theme-surface, #111);
  border: 2px solid var(--theme-border, #00ff00);
  padding: 12px;
  min-width: 120px;
  flex: 1;
  box-shadow: var(--theme-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
  border-radius: 6px;
}

.stat {
  margin-bottom: 10px;
  padding: 4px 0;
  text-align: center;
}

.stat:last-child {
  margin-bottom: 0;
}

.label {
  color: var(--theme-primary, #00ff00);
  font-size: 12px;
  font-family: monospace;
  margin-bottom: 4px;
  text-shadow: var(--theme-glow, none);
  font-weight: bold;
  letter-spacing: 0.5px;
}

.value {
  color: var(--theme-text, #fff);
  font-size: 18px;
  font-family: monospace;
  font-weight: bold;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
}

/* Mobile-first responsive design */
@media (min-width: 480px) {
  .scoreboard {
    padding: 16px;
    min-width: 140px;
  }
  
  .label {
    font-size: 13px;
  }
  
  .value {
    font-size: 20px;
  }
  
  .stat {
    margin-bottom: 12px;
    padding: 6px 0;
  }
}

@media (min-width: 768px) {
  .scoreboard {
    padding: 18px;
    min-width: 160px;
  }
  
  .label {
    font-size: 14px;
  }
  
  .value {
    font-size: 22px;
  }
  
  .stat {
    margin-bottom: 14px;
  }
}

/* Landscape mobile adjustments */
@media (max-height: 500px) and (orientation: landscape) {
  .scoreboard {
    padding: 8px 12px;
    min-width: 100px;
  }
  
  .label {
    font-size: 10px;
    margin-bottom: 2px;
  }
  
  .value {
    font-size: 14px;
  }
  
  .stat {
    margin-bottom: 6px;
    padding: 2px 0;
  }
}
</style>