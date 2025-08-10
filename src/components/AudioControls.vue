<template>
  <div class="audio-controls">
    <h3 class="controls-title">AUDIO</h3>
    
    <!-- Music Controls -->
    <div class="control-section">
      <div class="control-row">
        <label class="control-label">Music</label>
        <button 
          class="toggle-button"
          :class="{ active: isMusicEnabled }"
          @click="toggleMusic"
        >
          {{ isMusicEnabled ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="volume-control" v-if="isMusicEnabled">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          :value="musicVolume"
          @input="setMusicVolume(parseFloat($event.target.value))"
          class="volume-slider"
        />
        <span class="volume-label">{{ Math.round(musicVolume * 100) }}%</span>
      </div>
    </div>

    <!-- Sound Effects Controls -->
    <div class="control-section">
      <div class="control-row">
        <label class="control-label">Sound</label>
        <button 
          class="toggle-button"
          :class="{ active: isSoundEnabled }"
          @click="toggleSound"
        >
          {{ isSoundEnabled ? 'ON' : 'OFF' }}
        </button>
      </div>
      <div class="volume-control" v-if="isSoundEnabled">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          :value="soundVolume"
          @input="setSoundVolume(parseFloat($event.target.value))"
          class="volume-slider"
        />
        <span class="volume-label">{{ Math.round(soundVolume * 100) }}%</span>
      </div>
    </div>

    <!-- Music Track Selection -->
    <div class="control-section" v-if="isMusicEnabled">
      <div class="control-label">Music Track</div>
      <div class="track-selector">
        <button
          v-for="track in availableTracks"
          :key="track.id"
          :class="['track-button', { active: currentTrack === track.id }]"
          @click="selectTrack(track.id)"
        >
          {{ track.name }}
        </button>
      </div>
      <div class="track-info">{{ getCurrentTrackDescription() }}</div>
    </div>

    <!-- Test Sound Button -->
    <div class="control-section">
      <button 
        class="test-button"
        @click="playTestSound"
        :disabled="!isSoundEnabled"
      >
        TEST SOUND
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAudio } from '@/composables/useAudio'

const { 
  isMusicEnabled,
  isSoundEnabled,
  musicVolume,
  soundVolume,
  toggleMusic,
  toggleSound,
  setMusicVolume,
  setSoundVolume,
  playSound,
  setCurrentTrack,
  getAvailableTracks,
  currentTrack
} = useAudio()

const availableTracks = getAvailableTracks()

const playTestSound = () => {
  playSound('line')
}

const selectTrack = (trackId: string) => {
  setCurrentTrack(trackId)
}

const getCurrentTrackDescription = () => {
  const track = availableTracks.find(t => t.id === currentTrack.value)
  return track?.description || 'Classic theme'
}
</script>

<style scoped>
.audio-controls {
  background: var(--theme-surface, #111);
  border: 2px solid var(--theme-border, #00ff00);
  padding: 15px;
  border-radius: 4px;
}

.controls-title {
  color: var(--theme-primary, #00ff00);
  font-size: 12px;
  font-family: monospace;
  margin: 0 0 15px 0;
  text-align: center;
}

.control-section {
  margin-bottom: 12px;
}

.control-section:last-child {
  margin-bottom: 0;
}

.control-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.control-label {
  color: var(--theme-text, #fff);
  font-size: 11px;
  font-family: monospace;
}

.toggle-button {
  background: var(--theme-bg, #000);
  color: var(--theme-text, #fff);
  border: 1px solid var(--theme-border, #00ff00);
  padding: 4px 8px;
  font-family: monospace;
  font-size: 10px;
  cursor: pointer;
  min-width: 40px;
  transition: all 0.2s ease;
}

.toggle-button:hover {
  background: var(--theme-surface, #111);
}

.toggle-button.active {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.volume-slider {
  flex: 1;
  appearance: none;
  height: 4px;
  background: var(--theme-bg, #000);
  border: 1px solid var(--theme-border, #00ff00);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  appearance: none;
  width: 12px;
  height: 12px;
  background: var(--theme-primary, #00ff00);
  border-radius: 2px;
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  background: var(--theme-primary, #00ff00);
  border: none;
  border-radius: 2px;
  cursor: pointer;
}

.volume-label {
  color: var(--theme-text-secondary, #ccc);
  font-size: 10px;
  font-family: monospace;
  min-width: 35px;
  text-align: right;
}

.test-button {
  background: var(--theme-bg, #000);
  color: var(--theme-text, #fff);
  border: 1px solid var(--theme-border, #00ff00);
  padding: 6px 12px;
  font-family: monospace;
  font-size: 10px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s ease;
}

.test-button:hover:not(:disabled) {
  background: var(--theme-surface, #111);
}

.test-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.track-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin: 8px 0;
}

.track-button {
  background: var(--theme-bg, #000);
  color: var(--theme-text, #fff);
  border: 1px solid var(--theme-border, #00ff00);
  padding: 6px 4px;
  font-family: monospace;
  font-size: 9px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.track-button:hover {
  background: var(--theme-surface, #111);
}

.track-button.active {
  background: var(--theme-primary, #00ff00);
  color: var(--theme-bg, #000);
  border-color: var(--theme-primary, #00ff00);
}

.track-info {
  color: var(--theme-text-secondary, #ccc);
  font-size: 9px;
  font-family: monospace;
  text-align: center;
  line-height: 1.2;
  margin-top: 4px;
}

@media (min-width: 480px) {
  .audio-controls {
    padding: 20px;
  }
  
  .controls-title {
    font-size: 14px;
  }
  
  .control-label {
    font-size: 12px;
  }
  
  .toggle-button {
    font-size: 11px;
    padding: 6px 12px;
    min-width: 50px;
  }
  
  .volume-label {
    font-size: 11px;
  }
  
  .test-button {
    font-size: 11px;
    padding: 8px 16px;
  }
  
  .track-selector {
    gap: 8px;
    margin: 10px 0;
  }
  
  .track-button {
    font-size: 10px;
    padding: 8px 6px;
    min-height: 36px;
  }
  
  .track-info {
    font-size: 10px;
    margin-top: 6px;
  }
}

@media (min-width: 768px) {
  .track-selector {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}
</style>