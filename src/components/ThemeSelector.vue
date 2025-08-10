<template>
  <div class="theme-selector">
    <h3 class="selector-title">THEMES</h3>
    <div class="theme-grid">
      <button
        v-for="theme in availableThemes"
        :key="theme.id"
        class="theme-button"
        :class="{ active: currentThemeId === theme.id }"
        @click="setTheme(theme.id as ThemeId)"
        :title="theme.description"
      >
        <div class="theme-preview">
          <div class="preview-bg" :style="{ backgroundColor: theme.colors.background }">
            <div class="preview-surface" :style="{ backgroundColor: theme.colors.surface }">
              <div 
                class="preview-accent" 
                :style="{ backgroundColor: theme.colors.primary }"
              ></div>
            </div>
          </div>
          <div class="preview-pieces">
            <div 
              v-for="(color, piece) in theme.colors.pieces" 
              :key="piece"
              class="preview-piece"
              :style="{ backgroundColor: color }"
            ></div>
          </div>
        </div>
        <span class="theme-name">{{ theme.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import type { ThemeId } from '@/types/theme'

const { currentThemeId, availableThemes, setTheme } = useTheme()
</script>

<style scoped>
.theme-selector {
  background: var(--theme-surface, #111);
  border: 2px solid var(--theme-border, #00ff00);
  padding: 15px;
  border-radius: 4px;
}

.selector-title {
  color: var(--theme-primary, #00ff00);
  font-size: 12px;
  font-family: monospace;
  margin: 0 0 15px 0;
  text-align: center;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.theme-button {
  background: var(--theme-bg, #000);
  border: 1px solid var(--theme-border, #00ff00);
  padding: 8px;
  cursor: pointer;
  font-family: monospace;
  font-size: 10px;
  color: var(--theme-text, #fff);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  border-radius: 2px;
}

.theme-button:hover {
  background: var(--theme-surface, #111);
  transform: scale(1.02);
}

.theme-button.active {
  border-color: var(--theme-accent, #ffff00);
  background: var(--theme-surface, #111);
  box-shadow: var(--theme-glow, none);
}

.theme-preview {
  width: 30px;
  height: 20px;
  border: 1px solid #666;
  overflow: hidden;
  position: relative;
}

.preview-bg {
  width: 100%;
  height: 100%;
  position: relative;
}

.preview-surface {
  width: 60%;
  height: 60%;
  position: absolute;
  top: 2px;
  left: 2px;
}

.preview-accent {
  width: 4px;
  height: 4px;
  position: absolute;
  top: 1px;
  right: 1px;
}

.preview-pieces {
  position: absolute;
  bottom: 1px;
  left: 1px;
  display: flex;
  gap: 1px;
  flex-wrap: wrap;
  width: calc(100% - 2px);
}

.preview-piece {
  width: 3px;
  height: 3px;
}

.theme-name {
  text-align: center;
  line-height: 1.2;
}

@media (min-width: 480px) {
  .theme-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  
  .theme-button {
    padding: 10px;
    font-size: 11px;
  }
  
  .theme-preview {
    width: 36px;
    height: 24px;
  }
  
  .preview-piece {
    width: 4px;
    height: 4px;
  }
}

@media (min-width: 768px) {
  .theme-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>