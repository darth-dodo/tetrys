# 🧩 Vue Components Deep Dive

This guide explores the Vue 3 components architecture in Tetrys, demonstrating modern component patterns, composition API usage, and responsive design implementations.

## 📋 Component Overview

### Component Hierarchy

```
App.vue (Root)
├── GameBoard.vue (Game Grid)
├── GameControls.vue (User Input)
├── ScoreBoard.vue (Statistics)
├── NextPiece.vue (Preview)
├── ThemeSelector.vue (Theme Switching)
├── AudioControls.vue (Audio Settings)
└── SpeedControl.vue (Speed Adjustment)
```

## 🎮 Core Game Components

### App.vue - Application Root

**Purpose**: Main application container, layout orchestration, global state coordination

**Key Responsibilities**:
- Game state management integration
- Settings panel overlay handling
- Global event listeners (keyboard, touch)
- Layout switching between game and landing screens

```vue
<script setup lang="ts">
import { ref, watch } from 'vue'
import { useTetris } from '@/composables/useTetris'
import { useAudio } from '@/composables/useAudio'

// Settings panel state
const showSettings = ref(false)

// Initialize game systems
const { gameState, startGame, pauseGame, resetGame } = useTetris()
const { playSound, startMusic, stopMusic } = useAudio()

// Enhanced game controls with audio feedback
const handleMove = (direction: 'left' | 'right' | 'down') => {
  const moved = movePiece(
    direction === 'left' ? -1 : direction === 'right' ? 1 : 0,
    direction === 'down' ? 1 : 0
  )
  if (moved) playSound('move')
}
</script>
```

**Architecture Patterns**:
- **Container Component**: Manages child component coordination
- **State Provider**: Distributes global state to children
- **Event Hub**: Handles cross-component communication

### GameBoard.vue - Game Grid Renderer

**Purpose**: Renders the 20x10 Tetris game board with current piece overlay

**Key Features**:
- Dynamic grid generation
- Piece overlay rendering
- Cell type-based styling
- Responsive grid sizing

```vue
<template>
  <div class="game-board">
    <div class="board-grid">
      <div 
        v-for="(row, y) in displayBoard" 
        :key="y"
        class="board-row"
      >
        <div
          v-for="(cell, x) in row"
          :key="x"
          class="board-cell"
          :class="[
            cell ? `cell-${cell.toLowerCase()}` : 'cell-empty',
            { 'cell-preview': isPreviewCell(x, y) }
          ]"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GameState } from '@/types/tetris'

interface Props {
  gameState: GameState
}

const props = defineProps<Props>()

// Merge board with current piece for display
const displayBoard = computed(() => {
  const board = props.gameState.board.map(row => [...row])
  
  if (props.gameState.currentPiece) {
    const { currentPiece, currentPosition } = props.gameState
    
    currentPiece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const boardX = currentPosition.x + x
          const boardY = currentPosition.y + y
          
          if (boardY >= 0 && boardY < 20 && boardX >= 0 && boardX < 10) {
            board[boardY][boardX] = currentPiece.type
          }
        }
      })
    })
  }
  
  return board
})
</script>
```

**Component Patterns**:
- **Computed Properties**: Efficient board state calculation
- **Props Interface**: Type-safe component communication
- **Dynamic Classes**: Conditional styling based on cell state

### GameControls.vue - Input Handling

**Purpose**: Provides on-screen controls and handles user input events

**Features**:
- Touch-friendly button layout
- Keyboard event handling
- Game action coordination
- Reset confirmation modal

```vue
<template>
  <div class="game-controls">
    <!-- Movement Controls -->
    <div class="movement-controls">
      <button 
        class="control-button"
        @touchstart.prevent="handleTouchStart('left')"
        @touchend.prevent="handleTouchEnd"
        @mousedown="handleMouseDown('left')"
        @mouseup="handleMouseUp"
      >
        ←
      </button>
      <!-- More controls... -->
    </div>
    
    <!-- Action Controls -->
    <div class="action-controls">
      <button 
        class="action-button"
        @click="$emit('pause')"
      >
        {{ gameState.isPaused ? 'RESUME' : 'PAUSE' }}
      </button>
      
      <button 
        class="action-button reset-button"
        @click="showResetConfirm = true"
        v-if="gameState.isPlaying"
      >
        RESET
      </button>
    </div>
    
    <!-- Reset Confirmation Modal -->
    <div v-if="showResetConfirm" class="modal-overlay">
      <div class="modal">
        <h3>Reset Game?</h3>
        <p>This will end your current game.</p>
        <div class="modal-actions">
          <button @click="confirmReset" class="confirm-btn">Reset</button>
          <button @click="showResetConfirm = false" class="cancel-btn">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { GameState } from '@/types/tetris'

interface Props {
  gameState: GameState
}

interface Emits {
  moveLeft: []
  moveRight: []
  moveDown: []
  rotate: []
  drop: []
  pause: []
  reset: []
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Reset confirmation state
const showResetConfirm = ref(false)

// Touch handling for responsive controls
let touchRepeatInterval: number | null = null

const handleTouchStart = (direction: string) => {
  handleSingleAction(direction)
  
  // Start repeating action for held touches
  touchRepeatInterval = window.setInterval(() => {
    handleSingleAction(direction)
  }, 150)
}

const handleTouchEnd = () => {
  if (touchRepeatInterval) {
    clearInterval(touchRepeatInterval)
    touchRepeatInterval = null
  }
}

const confirmReset = () => {
  emit('reset')
  showResetConfirm.value = false
}
</script>
```

**Component Patterns**:
- **Event Emitters**: Parent-child communication via emits
- **Modal Management**: Local component state for UI overlays  
- **Touch Optimization**: Responsive input handling
- **Accessibility**: Proper ARIA labels and keyboard support

## 📊 Display Components

### ScoreBoard.vue - Game Statistics

**Purpose**: Displays current game statistics and progression

```vue
<template>
  <div class="scoreboard">
    <div class="score-section">
      <h3 class="score-label">SCORE</h3>
      <div class="score-value">{{ formatScore(gameState.score) }}</div>
    </div>
    
    <div class="level-section">
      <h3 class="score-label">LEVEL</h3>
      <div class="score-value">{{ gameState.level }}</div>
    </div>
    
    <div class="lines-section">
      <h3 class="score-label">LINES</h3>
      <div class="score-value">{{ gameState.lines }}</div>
    </div>
    
    <!-- Next Level Progress -->
    <div class="progress-section">
      <h4 class="progress-label">Next Level</h4>
      <div class="progress-bar">
        <div 
          class="progress-fill"
          :style="{ width: `${nextLevelProgress}%` }"
        />
      </div>
      <div class="progress-text">
        {{ linesUntilNextLevel }} lines to go
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { GameState } from '@/types/tetris'

interface Props {
  gameState: GameState
}

const props = defineProps<Props>()

// Format score with thousands separators
const formatScore = (score: number): string => {
  return score.toLocaleString()
}

// Calculate next level progression
const nextLevelProgress = computed(() => {
  const linesInCurrentLevel = props.gameState.lines % 10
  return (linesInCurrentLevel / 10) * 100
})

const linesUntilNextLevel = computed(() => {
  const linesInCurrentLevel = props.gameState.lines % 10
  return 10 - linesInCurrentLevel
})
</script>
```

### NextPiece.vue - Piece Preview

**Purpose**: Shows the next tetromino piece to help player strategy

```vue
<template>
  <div class="next-piece">
    <h3 class="next-label">NEXT</h3>
    <div class="piece-preview">
      <div class="preview-grid">
        <div
          v-for="(row, y) in previewGrid"
          :key="y"
          class="preview-row"
        >
          <div
            v-for="(cell, x) in row"
            :key="x"
            class="preview-cell"
            :class="cell ? `cell-${cell.toLowerCase()}` : 'cell-empty'"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TetrominoShape } from '@/types/tetris'

interface Props {
  nextPiece: TetrominoShape | null
}

const props = defineProps<Props>()

// Create 4x4 preview grid with centered piece
const previewGrid = computed(() => {
  const grid = Array(4).fill(null).map(() => Array(4).fill(null))
  
  if (props.nextPiece) {
    const shape = props.nextPiece.shape
    const offsetX = Math.floor((4 - shape[0].length) / 2)
    const offsetY = Math.floor((4 - shape.length) / 2)
    
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          grid[offsetY + y][offsetX + x] = props.nextPiece!.type
        }
      })
    })
  }
  
  return grid
})
</script>
```

## ⚙️ Settings Components

### ThemeSelector.vue - Theme Management

**Purpose**: Provides interface for theme selection and preview

```vue
<template>
  <div class="theme-selector">
    <h3 class="selector-title">THEME</h3>
    <div class="theme-grid">
      <button
        v-for="theme in availableThemes"
        :key="theme.id"
        class="theme-button"
        :class="{ active: currentTheme.id === theme.id }"
        @click="setTheme(theme.id)"
      >
        <div class="theme-preview">
          <div 
            class="preview-color"
            :style="{ backgroundColor: theme.colors.primary }"
          />
          <div 
            class="preview-color"
            :style="{ backgroundColor: theme.colors.secondary }"
          />
          <div 
            class="preview-color"
            :style="{ backgroundColor: theme.colors.accent }"
          />
        </div>
        <span class="theme-name">{{ theme.name }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { currentTheme, availableThemes, setTheme } = useTheme()
</script>
```

### AudioControls.vue - Audio Settings

**Purpose**: Comprehensive audio system controls

```vue
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
      
      <!-- Volume Control -->
      <div class="volume-control" v-if="isMusicEnabled">
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          :value="musicVolume"
          @input="(e) => setMusicVolume(parseFloat((e.target as HTMLInputElement).value))"
          class="volume-slider"
        />
        <span class="volume-label">{{ Math.round(musicVolume * 100) }}%</span>
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAudio } from '@/composables/useAudio'

const { 
  isMusicEnabled,
  musicVolume,
  toggleMusic,
  setMusicVolume,
  getAvailableTracks,
  setCurrentTrack,
  currentTrack
} = useAudio()

const availableTracks = getAvailableTracks()

const selectTrack = async (trackId: string) => {
  await setCurrentTrack(trackId)
}
</script>
```

## 🎨 Component Design Patterns

### Composition API Patterns

```typescript
// Reactive Props Pattern
interface Props {
  gameState: GameState
  options?: GameOptions
}

const props = defineProps<Props>()

// Computed Derived State
const displayData = computed(() => 
  transformData(props.gameState)
)

// Event Emitter Pattern
interface Emits {
  update: [value: string]
  action: [type: ActionType, payload?: any]
}

const emit = defineEmits<Emits>()

// Composable Integration
const { state, actions } = useGameFeature()
```

### Responsive Component Pattern

```vue
<template>
  <div class="responsive-component">
    <!-- Mobile Layout -->
    <div v-if="isMobile" class="mobile-layout">
      <slot name="mobile" :data="componentData" />
    </div>
    
    <!-- Desktop Layout -->
    <div v-else class="desktop-layout">
      <slot name="desktop" :data="componentData" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const isMobile = ref(false)

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})
</script>
```

### Accessibility Pattern

```vue
<template>
  <button
    :aria-label="ariaLabel"
    :aria-pressed="isActive"
    :disabled="isDisabled"
    class="accessible-button"
    @click="handleClick"
    @keydown.enter="handleClick"
    @keydown.space.prevent="handleClick"
  >
    <span class="visually-hidden">{{ screenReaderText }}</span>
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  ariaLabel: string
  isActive?: boolean
  isDisabled?: boolean
  screenReaderText?: string
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  isDisabled: false,
  screenReaderText: ''
})
</script>
```

## 📱 Mobile-First Component Design

### Touch-Optimized Components

```vue
<style scoped>
/* Mobile-first base styles */
.control-button {
  min-height: 48px; /* Touch target minimum */
  min-width: 48px;
  font-size: 16px;
  padding: 12px;
}

/* Tablet enhancement */
@media (min-width: 768px) {
  .control-button {
    min-height: 44px;
    min-width: 44px;
    font-size: 14px;
    padding: 10px;
  }
}

/* Desktop optimization */
@media (min-width: 1024px) {
  .control-button {
    min-height: 40px;
    min-width: 40px;
    font-size: 12px;
    padding: 8px;
  }
}
</style>
```

### Performance Optimization Patterns

```vue
<script setup lang="ts">
// Lazy loading for heavy components
const HeavyComponent = defineAsyncComponent(() => 
  import('@/components/HeavyComponent.vue')
)

// Memoized expensive computations
const expensiveComputation = computed(() => {
  // Only recalculates when dependencies change
  return heavyCalculation(props.data)
})

// Efficient list rendering
const visibleItems = computed(() => {
  // Virtual scrolling for large lists
  return items.value.slice(startIndex.value, endIndex.value)
})
</script>
```

## 🧪 Component Testing Strategies

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameBoard from '@/components/GameBoard.vue'
import type { GameState } from '@/types/tetris'

describe('GameBoard', () => {
  const mockGameState: GameState = {
    board: Array(20).fill(null).map(() => Array(10).fill(null)),
    currentPiece: null,
    currentPosition: { x: 0, y: 0 },
    // ... other state
  }

  it('renders empty board correctly', () => {
    const wrapper = mount(GameBoard, {
      props: { gameState: mockGameState }
    })
    
    expect(wrapper.find('.game-board').exists()).toBe(true)
    expect(wrapper.findAll('.board-cell')).toHaveLength(200) // 20x10
  })

  it('renders current piece overlay', () => {
    const gameStateWithPiece = {
      ...mockGameState,
      currentPiece: { type: 'I', shape: [[1, 1, 1, 1]] },
      currentPosition: { x: 3, y: 0 }
    }
    
    const wrapper = mount(GameBoard, {
      props: { gameState: gameStateWithPiece }
    })
    
    expect(wrapper.find('.cell-i').exists()).toBe(true)
  })
})
```

## 🚀 Component Best Practices

### Performance Best Practices

1. **Use `v-memo` for expensive renders**
2. **Implement virtual scrolling for large lists**
3. **Lazy load heavy components**
4. **Minimize watchers and computed dependencies**
5. **Use `shallowRef` for large objects**

### Accessibility Best Practices

1. **Provide meaningful ARIA labels**
2. **Ensure keyboard navigation support**
3. **Maintain focus management**
4. **Use semantic HTML elements**
5. **Test with screen readers**

### Code Organization Best Practices

1. **Single Responsibility Principle per component**
2. **Props interface documentation**
3. **Consistent naming conventions**
4. **Proper TypeScript typing**
5. **Comprehensive error handling**

This component architecture provides a solid foundation for building maintainable, performant, and accessible Vue 3 applications with modern development practices.