<template>
  <div class="speed-control">
    <div class="control-title">SPEED</div>
    <div class="speed-selector">
      <button
        v-for="speed in speedOptions"
        :key="speed.value"
        :class="['speed-button', { active: currentSpeed === speed.value }]"
        @click="setSpeed(speed.value)"
      >
        {{ speed.label }}
      </button>
    </div>
    <div class="speed-info">
      {{ getCurrentSpeedInfo() }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface SpeedOption {
  value: number
  label: string
  description: string
}

interface Props {
  currentSpeed: number
}

interface Emits {
  setSpeed: [speed: number]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const speedOptions: SpeedOption[] = [
  { value: 0.5, label: 'SLOW', description: 'Relaxed pace' },
  { value: 1, label: 'NORMAL', description: 'Standard speed' },
  { value: 1.5, label: 'FAST', description: 'Quick pace' },
  { value: 2, label: 'TURBO', description: 'Maximum speed' }
]

const setSpeed = (speed: number) => {
  emit('setSpeed', speed)
}

const getCurrentSpeedInfo = () => {
  const current = speedOptions.find(s => s.value === props.currentSpeed)
  return current?.description || 'Custom speed'
}
</script>

<style scoped>
.speed-control {
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

.speed-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.speed-button {
  background: var(--theme-bg, #000);
  color: var(--theme-text, #fff);
  border: 1px solid var(--theme-border, #00ff00);
  padding: 8px 6px;
  font-family: monospace;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 2px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.speed-button:hover {
  background: var(--theme-surface, #111);
}

.speed-button.active {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
  border-color: var(--theme-primary, #00ff00);
}

.speed-info {
  color: var(--theme-text-secondary, #ccc);
  font-size: 10px;
  font-family: monospace;
  text-align: center;
  line-height: 1.2;
}

@media (min-width: 480px) {
  .speed-control {
    padding: 20px;
  }
  
  .control-title {
    font-size: 14px;
    margin-bottom: 15px;
  }
  
  .speed-selector {
    gap: 10px;
    margin-bottom: 15px;
  }
  
  .speed-button {
    padding: 10px 8px;
    font-size: 12px;
    min-height: 36px;
  }
  
  .speed-info {
    font-size: 11px;
  }
}

@media (min-width: 768px) {
  .speed-selector {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}
</style>