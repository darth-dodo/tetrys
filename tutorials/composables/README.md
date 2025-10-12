# ⚡ Composables Deep Dive

This guide explores the Vue 3 Composition API composables in Tetrys, demonstrating reactive state management, business logic organization, and reusable functionality patterns.

## 🎯 Composables Philosophy

Composables in Tetrys follow these principles:

- **Single Responsibility**: Each composable manages one domain of functionality
- **Reactive by Design**: All state is reactive and automatically updates UI
- **Reusable Logic**: Business logic separated from presentation logic  
- **Type Safety**: Full TypeScript integration with proper interfaces
- **Lifecycle Management**: Proper setup and cleanup of resources
- **Performance Optimized**: Efficient state updates and computed properties

## 📋 Composables Overview

### Core Composables

| Composable | Purpose | Key Features |
|------------|---------|--------------|
| `useTetris` | Game logic and state | Game loop, collision detection, scoring |
| `useAudio` | Audio system management | Web Audio API, music tracks, sound effects |
| `useTheme` | Theme switching system | CSS custom properties, Classic default, persistence |
| `useSpeed` | Game speed control | Speed multiplier, difficulty progression |
| `useVibration` | Haptic feedback system | Contextual vibration patterns, settings management |

## 🎮 useTetris - Core Game Logic

### Architecture Overview

```typescript
export function useTetris() {
  // 1. Reactive State
  const gameState = ref<GameState>(initialState)
  
  // 2. Game Loop Management
  let gameLoop: number | null = null
  let lastTime = 0
  
  // 3. Computed Properties
  const fallSpeed = computed(() => calculateFallSpeed(gameState.value))
  
  // 4. Game Actions
  const movePiece = (dx: number, dy: number): boolean => { /* ... */ }
  const rotatePiece = (): void => { /* ... */ }
  
  // 5. Lifecycle Management
  onUnmounted(() => cleanup())
  
  // 6. Public API
  return { gameState, movePiece, rotatePiece, startGame, pauseGame }
}
```

### Game State Management

```typescript
interface GameState {
  // Board representation (20x10 grid)
  board: (TetrominoType | null)[][]
  
  // Current piece state
  currentPiece: TetrominoShape | null
  currentPosition: Position
  nextPiece: TetrominoShape | null
  
  // Game progression
  score: number
  level: number
  lines: number
  
  // Game control flags
  isGameOver: boolean
  isPaused: boolean
  isPlaying: boolean
  speedMultiplier: number
}
```

### Game Loop Implementation

```typescript
const update = (currentTime: number): void => {
  // Exit conditions
  if (!gameState.value.isPlaying || gameState.value.isPaused || gameState.value.isGameOver) {
    return
  }

  // Time-based piece falling
  if (currentTime - lastTime >= fallSpeed.value) {
    if (!movePiece(0, 1)) {
      // Piece has landed - handle placement
      if (gameState.value.currentPiece) {
        // 1. Place piece on board
        gameState.value.board = placePiece(
          gameState.value.board,
          gameState.value.currentPiece,
          gameState.value.currentPosition
        )

        // 2. Clear completed lines
        const { board: newBoard, linesCleared } = clearLines(gameState.value.board)
        gameState.value.board = newBoard

        // 3. Update score and level
        if (linesCleared > 0) {
          gameState.value.lines += linesCleared
          gameState.value.score += calculateScore(linesCleared, gameState.value.level)
          gameState.value.level = Math.floor(gameState.value.lines / 10) + 1
        }

        // 4. Spawn new piece
        spawnNewPiece()
      }
    }
    lastTime = currentTime
  }

  // Continue game loop
  if (gameState.value.isPlaying) {
    gameLoop = requestAnimationFrame(update)
  }
}
```

### Collision Detection System

```typescript
const isValidPosition = (
  board: (TetrominoType | null)[][],
  piece: TetrominoShape,
  position: Position
): boolean => {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const newX = position.x + x
        const newY = position.y + y

        // Boundary checks
        if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
          return false
        }

        // Collision with existing pieces
        if (newY >= 0 && board[newY][newX]) {
          return false
        }
      }
    }
  }
  return true
}
```

### Scoring Algorithm

```typescript
const calculateScore = (linesCleared: number, level: number): number => {
  // Standard Tetris scoring system
  const baseScores = [0, 100, 300, 500, 800] // Single, double, triple, tetris
  return baseScores[linesCleared] * level
}
```

## 🎵 useAudio - Audio System Management

### Web Audio API Architecture

```typescript
// Global audio context management
let audioContext: AudioContext | null = null
let musicGainNode: GainNode | null = null
let soundGainNode: GainNode | null = null

export function useAudio() {
  // Audio settings with persistence
  const settings = ref<AudioSettings>({
    musicEnabled: false,
    soundEnabled: true,
    musicVolume: 0.3,
    soundVolume: 0.7,
    currentTrack: 'tetris'
  })
  
  // Audio context initialization
  const initAudioContext = async (): Promise<boolean> => {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)()
        
        // Create gain nodes for volume control
        musicGainNode = audioContext.createGain()
        soundGainNode = audioContext.createGain()
        
        // Connect to destination
        musicGainNode.connect(audioContext.destination)
        soundGainNode.connect(audioContext.destination)
        
        updateVolumes()
        return true
      } catch (error) {
        console.warn('Failed to initialize audio context:', error)
        return false
      }
    }
    return true
  }
}
```

### Procedural Sound Generation

```typescript
// 8-bit style sound effects using oscillators
const createBeep = (frequency: number, duration: number, type: OscillatorType = 'square') => {
  if (!audioContext || !soundGainNode) return
  
  const oscillator = audioContext.createOscillator()
  const envelope = audioContext.createGain()
  
  // Configure oscillator
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
  
  // Apply ADSR envelope
  envelope.gain.setValueAtTime(0, audioContext.currentTime)
  envelope.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
  envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
  
  // Connect and play
  oscillator.connect(envelope)
  envelope.connect(soundGainNode)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + duration)
}

// Sound effect definitions
const playSound = async (type: 'move' | 'rotate' | 'drop' | 'line' | 'gameover') => {
  if (!settings.value.soundEnabled) return
  
  await ensureAudioContextRunning()
  
  switch (type) {
    case 'move':
      createBeep(220, 0.1, 'square')
      break
    case 'rotate':
      createBeep(330, 0.15, 'triangle')
      break
    case 'drop':
      createBeep(110, 0.2, 'sawtooth')
      break
    case 'line':
      // Chord for line clear
      createBeep(440, 0.3, 'square')
      setTimeout(() => createBeep(550, 0.3, 'square'), 100)
      setTimeout(() => createBeep(660, 0.3, 'square'), 200)
      break
    case 'gameover':
      // Descending sequence
      [220, 196, 174].forEach((freq, i) => {
        setTimeout(() => createBeep(freq, 0.3, 'square'), i * 300)
      })
      break
  }
}
```

### Background Music System

```typescript
// Music tracks defined as note sequences
const musicTracks = {
  tetris: [
    { freq: 329.63, duration: 0.4 }, // E4
    { freq: 246.94, duration: 0.2 }, // B3
    { freq: 261.63, duration: 0.2 }, // C4
    { freq: 293.66, duration: 0.4 }, // D4
    // ... more notes
  ],
  arcade: [
    { freq: 261.63, duration: 0.3 }, // C4
    { freq: 329.63, duration: 0.3 }, // E4
    // ... more notes
  ]
}

let currentNoteIndex = 0
let musicTimeout: number | null = null

const playNextNote = () => {
  if (!settings.value.musicEnabled || !audioContext || !musicGainNode) {
    return
  }
  
  const currentTrack = musicTracks[settings.value.currentTrack]
  const note = currentTrack[currentNoteIndex]
  
  // Create and play note
  const oscillator = audioContext.createOscillator()
  const envelope = audioContext.createGain()
  
  oscillator.type = 'square'
  oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime)
  
  envelope.gain.setValueAtTime(0, audioContext.currentTime)
  envelope.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
  envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + note.duration - 0.01)
  
  oscillator.connect(envelope)
  envelope.connect(musicGainNode)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + note.duration)
  
  // Schedule next note
  currentNoteIndex = (currentNoteIndex + 1) % currentTrack.length
  if (settings.value.musicEnabled) {
    musicTimeout = window.setTimeout(playNextNote, note.duration * 1000)
  }
}
```

### Audio Context User Interaction Handling

```typescript
// Ensure audio context resumes on user interaction
const ensureAudioContextRunning = async (): Promise<boolean> => {
  if (!audioContext) {
    return await initAudioContext()
  }
  
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume()
      return audioContext.state !== 'suspended'
    } catch (error) {
      console.warn('Failed to resume audio context on interaction:', error)
      return false
    }
  }
  
  return audioContext.state === 'running'
}

// Enhanced settings functions with context management
const toggleMusic = async () => {
  await ensureAudioContextRunning()
  
  settings.value.musicEnabled = !settings.value.musicEnabled
  
  if (settings.value.musicEnabled) {
    await startMusic()
  } else {
    stopMusic()
  }
  
  updateVolumes()
  saveSettings()
}
```

## 🎨 useTheme - Dynamic Theme System

### CSS Custom Properties Integration

```typescript
export function useTheme() {
  // Current theme state (Classic theme as default)
  const currentThemeId = ref<ThemeId>('classic')
  
  // Computed theme object
  const currentTheme = computed<Theme>(() => themes[currentThemeId.value])
  
  // Apply theme to document root
  const applyThemeToDocument = (theme: Theme) => {
    const root = document.documentElement
    
    // Apply color scheme
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${kebabCase(key)}`, value)
    })
    
    // Apply piece colors
    Object.entries(theme.pieces).forEach(([piece, color]) => {
      root.style.setProperty(`--piece-${piece.toLowerCase()}`, color)
    })
  }
  
  // Theme switching with persistence
  const setTheme = (themeId: ThemeId) => {
    currentThemeId.value = themeId
    applyThemeToDocument(themes[themeId])
    localStorage.setItem(THEME_STORAGE_KEY, themeId)
  }
}
```

### Theme Configuration Structure

```typescript
interface Theme {
  id: string
  name: string
  colors: {
    bg: string           // Background color
    surface: string      // Surface/card background
    primary: string      // Primary accent color
    secondary: string    // Secondary accent color
    accent: string       // Highlight color
    text: string         // Primary text color
    textSecondary: string // Secondary text color
    border: string       // Border color
    glow?: string        // CSS glow effect
  }
  pieces: {
    I: string // Cyan
    O: string // Yellow
    T: string // Purple
    S: string // Green
    Z: string // Red
    J: string // Blue
    L: string // Orange
  }
}
```

### Reactive Theme Application

```typescript
// Watch for theme changes and apply immediately
watch(currentThemeId, (newThemeId) => {
  applyThemeToDocument(themes[newThemeId])
}, { immediate: true })

// Load saved theme on mount
onMounted(() => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme && savedTheme in themes) {
    currentThemeId.value = savedTheme as ThemeId
  }
  // Apply default theme
  applyThemeToDocument(currentTheme.value)
})
```

## 📳 useVibration - Haptic Feedback System

### Vibration System Architecture

The haptic feedback system provides contextual vibration patterns for enhanced mobile gaming experience:

```typescript
export function useVibration() {
  // Vibration settings with persistence
  const settings = ref({
    enabled: true,
    intensity: 1.0
  })
  
  // Contextual vibration patterns
  const patterns = {
    move: [8],                        // Short pulse for movement
    rotate: [8, 20, 8],              // Double pulse for rotation  
    drop: [15, 30, 15, 30, 15],      // Strong pattern for drop
    lineClear: [20, 50, 20, 50, 20], // Celebration pattern
    pause: [10, 50, 10],             // Pause confirmation
    gameOver: [50, 100, 50, 100, 50] // Game over sequence
  }
  
  // Vibrate with pattern
  const vibrate = (action: keyof typeof patterns) => {
    if (!settings.value.enabled || !('vibrate' in navigator)) {
      return false
    }
    
    const pattern = patterns[action]
    const adjustedPattern = pattern.map(duration => 
      Math.round(duration * settings.value.intensity)
    )
    
    navigator.vibrate(adjustedPattern)
    return true
  }
  
  // Settings management
  const toggleVibration = () => {
    settings.value.enabled = !settings.value.enabled
    saveSettings()
    
    // Test vibration when enabled
    if (settings.value.enabled) {
      vibrate('move')
    }
  }
  
  const setIntensity = (intensity: number) => {
    settings.value.intensity = Math.max(0.1, Math.min(2.0, intensity))
    saveSettings()
    vibrate('move') // Test vibration
  }
  
  return {
    settings: computed(() => settings.value),
    vibrate,
    toggleVibration,
    setIntensity,
    isSupported: 'vibrate' in navigator
  }
}
```

### Vibration Pattern Design

Each game action has a unique vibration pattern designed for:

- **Movement** (left/right): Short 8ms pulse for quick response
- **Rotation**: Double pulse (8ms, pause 20ms, 8ms) for confirmation
- **Drop**: Extended pattern for satisfying feedback
- **Line Clear**: Celebration pattern with rhythmic pulses
- **Pause**: Confirmation pattern with distinctive timing
- **Game Over**: Dramatic descending pattern

### Integration with Game Controls

```typescript
// In GameControls.vue
const { vibrate, settings: vibrationSettings } = useVibration()

const handleTouchStart = (action: string) => {
  // Trigger haptic feedback
  vibrate(action as VibrationAction)
  
  // Execute game action
  executeGameAction(action)
}
```

## ⚡ useSpeed - Performance Control

### Speed System Architecture

```typescript
export function useSpeed() {
  // Shared speed state across all instances
  const speedMultiplier = ref(1.0)
  
  // Computed speed levels
  const speedLevel = computed(() => {
    if (speedMultiplier.value <= 0.5) return 'Slow'
    if (speedMultiplier.value <= 1.0) return 'Normal'
    if (speedMultiplier.value <= 1.5) return 'Fast'
    return 'Extreme'
  })
  
  // Speed adjustment with validation
  const setSpeed = (multiplier: number) => {
    speedMultiplier.value = Math.max(0.25, Math.min(3.0, multiplier))
    saveSpeed()
  }
  
  // Persistence
  const saveSpeed = () => {
    localStorage.setItem(SPEED_STORAGE_KEY, speedMultiplier.value.toString())
  }
  
  const loadSpeed = () => {
    const saved = localStorage.getItem(SPEED_STORAGE_KEY)
    if (saved) {
      speedMultiplier.value = parseFloat(saved) || DEFAULT_SPEED
    }
  }
  
  return {
    speedMultiplier: computed(() => speedMultiplier.value),
    speedLevel,
    setSpeed,
    resetSpeed: () => setSpeed(DEFAULT_SPEED)
  }
}
```

## 🔄 Composable Integration Patterns

### Cross-Composable Communication

```typescript
// In App.vue - composables work together
export default defineComponent({
  setup() {
    // Initialize all systems
    const { gameState, startGame, pauseGame } = useTetris()
    const { playSound, startMusic, pauseMusic } = useAudio()
    const { speedMultiplier } = useSpeed()
    
    // Coordinate audio with game state
    const enhancedStartGame = () => {
      startGame()
      startMusic()
    }
    
    const enhancedPauseGame = () => {
      const wasPaused = gameState.value.isPaused
      pauseGame()
      
      // Coordinate audio with pause state
      if (gameState.value.isPaused) {
        pauseMusic()
      } else {
        resumeMusic()
      }
    }
    
    // Watch for game events to trigger audio
    watch(() => gameState.value.lines, (newLines, oldLines) => {
      if (newLines > oldLines) {
        playSound('line')
      }
    })
    
    return {
      gameState,
      enhancedStartGame,
      enhancedPauseGame
    }
  }
})
```

### Composable Testing Strategies

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useTetris } from '@/composables/useTetris'

describe('useTetris', () => {
  let tetrisComposable: ReturnType<typeof useTetris>
  
  beforeEach(() => {
    tetrisComposable = useTetris()
  })
  
  it('should initialize with default state', () => {
    const { gameState } = tetrisComposable
    
    expect(gameState.value.isPlaying).toBe(false)
    expect(gameState.value.score).toBe(0)
    expect(gameState.value.level).toBe(1)
  })
  
  it('should handle piece movement correctly', () => {
    const { gameState, startGame, movePiece } = tetrisComposable
    
    startGame()
    const initialPosition = { ...gameState.value.currentPosition }
    
    const moved = movePiece(1, 0)
    
    expect(moved).toBe(true)
    expect(gameState.value.currentPosition.x).toBe(initialPosition.x + 1)
  })
  
  it('should detect collisions properly', () => {
    const { gameState, startGame, movePiece } = tetrisComposable
    
    startGame()
    
    // Try to move piece outside board
    const moved = movePiece(-10, 0)
    
    expect(moved).toBe(false)
  })
})
```

## 📈 Performance Optimization Patterns

### Efficient Computed Properties

```typescript
// Expensive computation with proper memoization
const expensiveDisplayBoard = computed(() => {
  if (!gameState.value.currentPiece) {
    return gameState.value.board
  }
  
  // Only recalculate when dependencies change
  return mergeCurrentPieceWithBoard(
    gameState.value.board,
    gameState.value.currentPiece,
    gameState.value.currentPosition
  )
})
```

### Memory Management

```typescript
export function useAudio() {
  // Cleanup function
  const cleanup = () => {
    stopMusic()
    if (audioContext) {
      audioContext.close()
      audioContext = null
      musicGainNode = null
      soundGainNode = null
    }
  }
  
  // Automatic cleanup
  onUnmounted(() => {
    cleanup()
  })
  
  return {
    // ... other methods
    cleanup
  }
}
```

### Reactive State Optimization

```typescript
// Use shallowRef for large objects that change entirely
const largeGameData = shallowRef(initialLargeData)

// Use ref for primitives and reactive objects
const gameScore = ref(0)
const gameSettings = reactive({
  volume: 0.5,
  theme: 'retro'
})

// Use computed for derived state
const displayScore = computed(() => 
  gameScore.value.toLocaleString()
)
```

## 🚀 Best Practices for Composables

### Design Principles

1. **Single Responsibility**: Each composable manages one domain
2. **Reactive by Default**: All state should be reactive
3. **Composable Composition**: Composables can use other composables
4. **Proper Cleanup**: Always clean up resources in onUnmounted
5. **Type Safety**: Use TypeScript interfaces for all APIs

### Error Handling

```typescript
export function useAudio() {
  const error = ref<string | null>(null)
  
  const playSound = async (type: SoundType) => {
    try {
      error.value = null
      await audioOperation(type)
    } catch (err) {
      error.value = `Failed to play sound: ${err.message}`
      console.warn('Audio error:', err)
    }
  }
  
  return {
    error: computed(() => error.value),
    playSound
  }
}
```

This composables architecture provides a solid foundation for reactive, performant, and maintainable Vue 3 applications with proper separation of concerns and reusable business logic.