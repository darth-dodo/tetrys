<template>
  <div class="difficulty-selector">
    <div class="control-title">DIFFICULTY</div>
    <div class="difficulty-options">
      <button
        v-for="config in availableDifficulties"
        :key="config.id"
        :class="['difficulty-button', { active: currentDifficulty === config.id, disabled: isPlaying }]"
        @click="selectDifficulty(config.id)"
        :disabled="isPlaying"
        :title="isPlaying ? 'Cannot change difficulty during game' : config.description"
      >
        <span class="difficulty-icon">{{ config.icon }}</span>
        <span class="difficulty-name">{{ config.name }}</span>
      </button>
    </div>
    <div class="difficulty-stats">
      <div class="stat-row">
        <span class="stat-label">Speed</span>
        <span class="stat-value">{{ formatSpeed(difficultyConfig.speedMultiplier) }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Lines/Level</span>
        <span class="stat-value">{{ difficultyConfig.linesPerLevel }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Score</span>
        <span class="stat-value">{{ formatScore(difficultyConfig.scoreMultiplier) }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Pieces</span>
        <span class="stat-value">{{ getPieceBias() }}</span>
      </div>
    </div>
    <div class="difficulty-description">
      {{ difficultyConfig.description }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDifficulty } from '@/composables/useDifficulty'
import type { DifficultyLevel } from '@/types/difficulty'

interface Props {
  isPlaying?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isPlaying: false
})

const {
  currentDifficulty,
  difficultyConfig,
  availableDifficulties,
  setDifficulty
} = useDifficulty()

const selectDifficulty = (difficulty: DifficultyLevel) => {
  if (!props.isPlaying) {
    setDifficulty(difficulty)
  }
}

const formatSpeed = (value: number): string => {
  if (value < 1) return `${Math.round(value * 100)}% (slower)`
  if (value > 1) return `${Math.round(value * 100)}% (faster)`
  return '100%'
}

const formatScore = (value: number): string => {
  if (value < 1) return `${Math.round(value * 100)}%`
  if (value > 1) return `${Math.round(value * 100)}%`
  return '100%'
}

const getPieceBias = (): string => {
  const weights = difficultyConfig.value.pieceWeights
  // Compare I-piece weight to S/Z weights to determine bias
  const iWeight = weights.I
  const szAvg = (weights.S + weights.Z) / 2

  if (iWeight > szAvg + 2) return 'Favorable'
  if (iWeight < szAvg - 2) return 'Tricky'
  return 'Balanced'
}
</script>

<style scoped>
.difficulty-selector {
  background: var(--theme-surface, #111);
  border: 2px solid var(--theme-border, #00ff00);
  padding: 15px;
  border-radius: 4px;
  width: 100%;
}

.control-title {
  color: var(--theme-primary, #00ff00);
  font-size: 12px;
  font-family: monospace;
  font-weight: bold;
  margin: 0 0 12px;
  text-align: center;
}

.difficulty-options {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.difficulty-button {
  background: var(--theme-bg, #000);
  color: var(--theme-text, #fff);
  border: 1px solid var(--theme-border, #00ff00);
  padding: 10px 6px;
  font-family: monospace;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 2px;
  min-height: 44px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.difficulty-button:hover:not(.disabled) {
  background: var(--theme-surface, #111);
  transform: translateY(-1px);
}

.difficulty-button.active {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
  border-color: var(--theme-primary, #00ff00);
}

.difficulty-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.difficulty-icon {
  font-size: 16px;
  line-height: 1;
}

.difficulty-name {
  font-size: 9px;
  letter-spacing: 0.5px;
}

.difficulty-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 10px;
  padding: 8px;
  background: var(--theme-bg, #000);
  border-radius: 2px;
}

.stat-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  color: var(--theme-text-secondary, #888);
  font-size: 8px;
  font-family: monospace;
  text-transform: uppercase;
}

.stat-value {
  color: var(--theme-primary, #00ff00);
  font-size: 10px;
  font-family: monospace;
  font-weight: bold;
}

.difficulty-description {
  color: var(--theme-text-secondary, #ccc);
  font-size: 10px;
  font-family: monospace;
  text-align: center;
  line-height: 1.3;
}

@media (min-width: 480px) {
  .difficulty-selector {
    padding: 20px;
  }

  .control-title {
    font-size: 14px;
    margin-bottom: 15px;
  }

  .difficulty-options {
    gap: 10px;
    margin-bottom: 15px;
  }

  .difficulty-button {
    padding: 12px 8px;
    min-height: 52px;
    gap: 6px;
  }

  .difficulty-icon {
    font-size: 20px;
  }

  .difficulty-name {
    font-size: 11px;
  }

  .difficulty-stats {
    padding: 10px;
    margin-bottom: 12px;
  }

  .stat-label {
    font-size: 9px;
  }

  .stat-value {
    font-size: 11px;
  }

  .difficulty-description {
    font-size: 11px;
  }
}
</style>
