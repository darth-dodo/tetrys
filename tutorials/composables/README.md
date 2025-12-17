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
- **Event-Driven Architecture**: Decoupled communication via event bus system

## 🔌 Event-Driven Architecture

### Event System Overview

Tetrys uses a centralized event bus system (`useGameBus`) for decoupled communication between composables and components. This architecture enables:

- **Loose Coupling**: Components and composables don't need direct references to each other
- **Scalability**: Easy to add new event listeners without modifying existing code
- **Maintainability**: Clear event contracts with TypeScript interfaces
- **Debugging**: Event history tracking for development mode
- **Performance**: Efficient pub/sub pattern with automatic cleanup

### Event Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         Event Bus (useGameBus)                    │
│                  Centralized Event Coordination                   │
└───────────┬──────────────────────────────────────────┬───────────┘
            │                                           │
            ▼                                           ▼
┌───────────────────────┐                  ┌──────────────────────┐
│     Publishers        │                  │     Subscribers       │
├───────────────────────┤                  ├──────────────────────┤
│                       │                  │                      │
│  useTetris           │──────┐           │  useAudio            │
│  ├─ game:start       │      │           │  ├─ Listens to       │
│  ├─ game:pause       │      │           │  │  game events       │
│  ├─ game:over        │      ├──────────▶│  └─ Plays sounds     │
│  ├─ piece:move       │      │           │                      │
│  ├─ piece:rotate     │      │           │  useVibration        │
│  ├─ piece:drop       │      │           │  ├─ Listens to       │
│  └─ line:clear       │      │           │  │  game events       │
│                       │      │           │  └─ Triggers haptics │
│  useAchievements     │      │           │                      │
│  ├─ Subscribes to    │◀─────┘           │  useAchievements     │
│  │  game events      │                  │  ├─ Subscribes to    │
│  └─ achievement:     │                  │  │  game events       │
│      unlocked        │──────────────────▶│  └─ Shows notifs     │
│                       │                  │                      │
└───────────────────────┘                  └──────────────────────┘

Event Flow Example:
1. User clears a line
2. useTetris emits 'line:clear' with count: 4
3. useAudio subscribes → plays tetris celebration sound
4. useVibration subscribes → triggers haptic pattern
5. useAchievements subscribes → checks for Tetris Master unlock
6. If unlocked → emits 'achievement:unlocked'
7. AchievementNotification subscribes → shows popup
```

### useGameBus - Event Bus System

```typescript
// Centralized event management composable
export function useGameBus() {
  type EventCallback = (payload?: any) => void
  type EventMap = Map<string, Set<EventCallback>>

  // Global event registry
  const events: EventMap = new Map()
  const eventHistory: Array<{ event: string; payload: any; timestamp: number }> = []
  const MAX_HISTORY = 100

  // Subscribe to events
  const on = (event: string, callback: EventCallback): (() => void) => {
    if (!events.has(event)) {
      events.set(event, new Set())
    }
    events.get(event)!.add(callback)

    // Return unsubscribe function
    return () => off(event, callback)
  }

  // Unsubscribe from events
  const off = (event: string, callback: EventCallback): void => {
    const callbacks = events.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        events.delete(event)
      }
    }
  }

  // Emit events
  const emit = (event: string, payload?: any): void => {
    // Track event history in dev mode
    if (import.meta.env.DEV) {
      eventHistory.push({ event, payload, timestamp: Date.now() })
      if (eventHistory.length > MAX_HISTORY) {
        eventHistory.shift()
      }
      console.log(`[GameBus] ${event}`, payload)
    }

    // Notify all subscribers
    const callbacks = events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(payload)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  // One-time event subscription
  const once = (event: string, callback: EventCallback): void => {
    const wrappedCallback = (payload?: any) => {
      callback(payload)
      off(event, wrappedCallback)
    }
    on(event, wrappedCallback)
  }

  // Clear all listeners for an event
  const clear = (event?: string): void => {
    if (event) {
      events.delete(event)
    } else {
      events.clear()
    }
  }

  // Get event history (dev mode)
  const getHistory = () => [...eventHistory]

  return {
    on,
    off,
    emit,
    once,
    clear,
    getHistory
  }
}
```

### Event Types Reference

| Event Name | Payload Type | Emitted By | Description |
|------------|-------------|------------|-------------|
| `game:start` | `void` | `useTetris` | Game has started |
| `game:pause` | `{ paused: boolean }` | `useTetris` | Game pause state changed |
| `game:over` | `{ score: number, level: number, lines: number }` | `useTetris` | Game ended |
| `game:resume` | `void` | `useTetris` | Game resumed from pause |
| `piece:spawn` | `{ type: TetrominoType }` | `useTetris` | New piece spawned |
| `piece:move` | `{ direction: 'left' \| 'right' \| 'down' }` | `useTetris` | Piece moved |
| `piece:rotate` | `{ direction: 'cw' \| 'ccw' }` | `useTetris` | Piece rotated |
| `piece:drop` | `{ y: number }` | `useTetris` | Piece hard dropped |
| `piece:lock` | `{ type: TetrominoType, position: Position }` | `useTetris` | Piece locked to board |
| `line:clear` | `{ count: number, lines: number[] }` | `useTetris` | Lines cleared |
| `score:update` | `{ score: number, delta: number }` | `useTetris` | Score changed |
| `level:up` | `{ level: number }` | `useTetris` | Level increased |
| `achievement:unlocked` | `Achievement` | `useAchievements` | New achievement unlocked |
| `achievement:progress` | `{ id: string, current: number, target: number }` | `useAchievements` | Achievement progress updated |
| `music:track:change` | `{ track: string }` | `useAudio` | Music track changed |
| `settings:update` | `{ key: string, value: any }` | Multiple | Settings value changed |

### Event Payload Types

```typescript
// Game events
interface GameOverPayload {
  score: number
  level: number
  lines: number
  pieces: number
  duration: number
}

interface PieceMovePayload {
  direction: 'left' | 'right' | 'down'
  position: Position
}

interface PieceRotatePayload {
  direction: 'cw' | 'ccw'
  rotation: number
}

interface LineClearPayload {
  count: number       // Number of lines cleared (1-4)
  lines: number[]     // Y-coordinates of cleared lines
  isTetris: boolean   // True if 4 lines cleared
  isCombo: boolean    // True if part of combo
}

// Achievement events
interface AchievementUnlockedPayload {
  id: string
  name: string
  description: string
  category: AchievementCategory
  timestamp: number
}

interface AchievementProgressPayload {
  id: string
  current: number
  target: number
  percentage: number
}

// Audio events
interface MusicTrackChangePayload {
  track: 'tetris' | 'arcade' | 'chill' | 'intense'
  previousTrack?: string
}
```

## 📋 Composables Overview

### Core Composables

| Composable | Purpose | Key Features | Events |
|------------|---------|--------------|--------|
| `useGameBus` | Event coordination | Pub/sub pattern, history tracking, error handling | All events |
| `useTetris` | Game logic and state | Game loop, collision detection, scoring | Emits: game, piece, score events |
| `useAudio` | Audio system management | Web Audio API, MusicScheduler, 9 sound effects | Subscribes: game/piece events; Emits: music:track:change |
| `useAchievements` | Achievement tracking | 74 achievements, progress tracking, notifications | Subscribes: game/score/piece events; Emits: achievement events |
| `useTheme` | Theme switching system | CSS custom properties, 5 themes, persistence | - |
| `useSpeed` | Game speed control | Speed multiplier, difficulty progression | - |
| `useVibration` | Haptic feedback system | Contextual vibration patterns, settings | Subscribes: game/piece events |

## 🎮 useTetris - Core Game Logic

### Architecture Overview

```typescript
export function useTetris() {
  // 1. Event Bus Integration
  const { emit } = useGameBus()

  // 2. Reactive State
  const gameState = ref<GameState>(initialState)

  // 3. Game Loop Management
  let gameLoop: number | null = null
  let lastTime = 0

  // 4. Computed Properties
  const fallSpeed = computed(() => calculateFallSpeed(gameState.value))

  // 5. Game Actions (with event emission)
  const movePiece = (dx: number, dy: number): boolean => {
    const moved = /* movement logic */
    if (moved) {
      emit('piece:move', {
        direction: dx < 0 ? 'left' : dx > 0 ? 'right' : 'down',
        position: gameState.value.currentPosition
      })
    }
    return moved
  }

  const rotatePiece = (): void => {
    /* rotation logic */
    emit('piece:rotate', { direction: 'cw', rotation: /* ... */ })
  }

  // 6. Lifecycle Management
  onUnmounted(() => cleanup())

  // 7. Public API
  return { gameState, movePiece, rotatePiece, startGame, pauseGame }
}
```

### Events Emitted by useTetris

The game logic composable publishes events at critical moments:

```typescript
// Game lifecycle events
emit('game:start')                           // When game begins
emit('game:pause', { paused: true })         // When game is paused
emit('game:resume')                          // When game resumes
emit('game:over', {                          // When game ends
  score: gameState.value.score,
  level: gameState.value.level,
  lines: gameState.value.lines,
  pieces: gameState.value.piecesPlaced,
  duration: Date.now() - gameStartTime
})

// Piece events
emit('piece:spawn', {                        // New tetromino spawned
  type: gameState.value.currentPiece.type
})

emit('piece:move', {                         // Piece moved
  direction: 'left' | 'right' | 'down',
  position: gameState.value.currentPosition
})

emit('piece:rotate', {                       // Piece rotated
  direction: 'cw' | 'ccw',
  rotation: gameState.value.currentPiece.rotation
})

emit('piece:drop', {                         // Hard drop executed
  y: gameState.value.currentPosition.y
})

emit('piece:lock', {                         // Piece locked to board
  type: gameState.value.currentPiece.type,
  position: gameState.value.currentPosition
})

// Scoring events
emit('line:clear', {                         // Lines cleared
  count: linesCleared,
  lines: [18, 19],                           // Y-coordinates
  isTetris: linesCleared === 4,
  isCombo: comboCount > 0
})

emit('score:update', {                       // Score changed
  score: gameState.value.score,
  delta: scoreIncrease
})

emit('level:up', {                           // Level increased
  level: gameState.value.level
})
```

### Event-Driven Game Actions

```typescript
// Enhanced game actions with event emissions
const startGame = () => {
  gameState.value = {
    ...initialGameState,
    isPlaying: true,
    isPaused: false
  }

  spawnNewPiece()
  gameStartTime = Date.now()

  // Notify all subscribers
  emit('game:start')

  // Start game loop
  gameLoop = requestAnimationFrame(update)
}

const pauseGame = () => {
  const wasPaused = gameState.value.isPaused
  gameState.value.isPaused = !wasPaused

  // Emit appropriate event
  if (gameState.value.isPaused) {
    emit('game:pause', { paused: true })
  } else {
    emit('game:resume')
  }
}

const handleGameOver = () => {
  gameState.value.isGameOver = true
  gameState.value.isPlaying = false

  // Cancel game loop
  if (gameLoop) {
    cancelAnimationFrame(gameLoop)
    gameLoop = null
  }

  // Emit game over with complete statistics
  emit('game:over', {
    score: gameState.value.score,
    level: gameState.value.level,
    lines: gameState.value.lines,
    pieces: gameState.value.piecesPlaced,
    duration: Date.now() - gameStartTime
  })
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

## 🎵 useAudio - Advanced Audio System

### System Architecture Overview

The Tetrys audio system uses the Web Audio API with advanced features:

- **MusicScheduler**: Lookahead scheduling for precise timing
- **Event-Driven**: Subscribes to game events for synchronized audio
- **Multi-Track Support**: 4 different music tracks with seamless switching
- **Procedural Sounds**: Generated sound effects using oscillators
- **Performance Optimized**: Pre-scheduled notes with buffer management

> **See Also**: [Expanded Audio System Documentation](../architecture/audio-system.md) for complete technical details.

### Web Audio API Architecture

```typescript
// Global audio context management
let audioContext: AudioContext | null = null
let musicGainNode: GainNode | null = null
let soundGainNode: GainNode | null = null

// Music scheduler for precise timing
let musicScheduler: MusicScheduler | null = null

export function useAudio() {
  // Event bus integration
  const { on, emit } = useGameBus()

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

        // Initialize music scheduler
        musicScheduler = new MusicScheduler(audioContext, musicGainNode)

        updateVolumes()
        return true
      } catch (error) {
        console.warn('Failed to initialize audio context:', error)
        return false
      }
    }
    return true
  }

  // Subscribe to game events
  onMounted(() => {
    // Game lifecycle events
    on('game:start', () => {
      if (settings.value.musicEnabled) {
        startMusic()
      }
    })

    on('game:pause', ({ paused }) => {
      if (paused) {
        pauseMusic()
      } else {
        resumeMusic()
      }
    })

    on('game:over', () => {
      stopMusic()
      playSound('gameover')
    })

    // Piece events
    on('piece:move', () => playSound('move'))
    on('piece:rotate', () => playSound('rotate'))
    on('piece:drop', () => playSound('drop'))

    // Scoring events
    on('line:clear', ({ count, isTetris }) => {
      if (isTetris) {
        playSound('tetris')
      } else {
        playSound('line')
      }
    })
  })
}
```

### MusicScheduler - Lookahead Scheduling

The music scheduler uses lookahead scheduling for precise, glitch-free playback:

```typescript
class MusicScheduler {
  private audioContext: AudioContext
  private gainNode: GainNode
  private currentTrack: MusicTrack
  private currentNoteIndex: number = 0
  private scheduledNotes: ScheduledNote[] = []
  private schedulerTimer: number | null = null

  // Lookahead configuration
  private readonly SCHEDULE_AHEAD_TIME = 0.1  // Schedule 100ms ahead
  private readonly SCHEDULE_INTERVAL = 25     // Check every 25ms

  constructor(audioContext: AudioContext, gainNode: GainNode) {
    this.audioContext = audioContext
    this.gainNode = gainNode
  }

  start(track: MusicTrack): void {
    this.currentTrack = track
    this.currentNoteIndex = 0
    this.scheduledNotes = []

    // Start scheduling loop
    this.schedulerTimer = window.setInterval(
      () => this.scheduleNotes(),
      this.SCHEDULE_INTERVAL
    )
  }

  private scheduleNotes(): void {
    // Calculate time window for scheduling
    const currentTime = this.audioContext.currentTime
    const scheduleUntil = currentTime + this.SCHEDULE_AHEAD_TIME

    // Schedule all notes in the lookahead window
    while (this.getNextNoteTime() < scheduleUntil) {
      this.scheduleNote(this.currentNoteIndex, this.getNextNoteTime())
      this.advanceNote()
    }

    // Clean up old scheduled notes
    this.scheduledNotes = this.scheduledNotes.filter(
      note => note.stopTime > currentTime
    )
  }

  private scheduleNote(noteIndex: number, time: number): void {
    const note = this.currentTrack.notes[noteIndex]

    // Create oscillator for note
    const oscillator = this.audioContext.createOscillator()
    const envelope = this.audioContext.createGain()

    // Configure oscillator
    oscillator.type = note.waveform || 'square'
    oscillator.frequency.setValueAtTime(note.frequency, time)

    // Apply ADSR envelope
    envelope.gain.setValueAtTime(0, time)
    envelope.gain.linearRampToValueAtTime(0.1, time + 0.01)
    envelope.gain.exponentialRampToValueAtTime(
      0.001,
      time + note.duration - 0.01
    )

    // Connect and schedule
    oscillator.connect(envelope)
    envelope.connect(this.gainNode)

    oscillator.start(time)
    oscillator.stop(time + note.duration)

    // Track scheduled note
    this.scheduledNotes.push({
      noteIndex,
      startTime: time,
      stopTime: time + note.duration,
      oscillator
    })
  }

  private getNextNoteTime(): number {
    if (this.scheduledNotes.length === 0) {
      return this.audioContext.currentTime
    }
    const lastNote = this.scheduledNotes[this.scheduledNotes.length - 1]
    return lastNote.stopTime
  }

  private advanceNote(): void {
    this.currentNoteIndex = (this.currentNoteIndex + 1) % this.currentTrack.notes.length
  }

  stop(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer)
      this.schedulerTimer = null
    }

    // Stop all scheduled notes
    this.scheduledNotes.forEach(note => {
      try {
        note.oscillator.stop()
      } catch {
        // Already stopped
      }
    })
    this.scheduledNotes = []
  }

  pause(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer)
      this.schedulerTimer = null
    }
  }

  resume(): void {
    if (!this.schedulerTimer) {
      this.schedulerTimer = window.setInterval(
        () => this.scheduleNotes(),
        this.SCHEDULE_INTERVAL
      )
    }
  }
}
```

### Sound Effect System

The audio system generates 9 different sound effects procedurally:

```typescript
type SoundEffectType =
  | 'move'      // Piece movement (left/right/down)
  | 'rotate'    // Piece rotation
  | 'drop'      // Hard drop
  | 'lock'      // Piece locked to board
  | 'line'      // Single/double/triple line clear
  | 'tetris'    // Four lines cleared (Tetris)
  | 'combo'     // Combo multiplier
  | 'levelup'   // Level increase
  | 'gameover'  // Game over sequence
```

### Procedural Sound Generation

All sound effects are generated using Web Audio API oscillators:

```typescript
// 8-bit style sound effects using oscillators
const createBeep = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'square',
  envelope: 'sharp' | 'soft' = 'sharp'
) => {
  if (!audioContext || !soundGainNode) return

  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  // Configure oscillator
  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)

  // Apply ADSR envelope based on type
  if (envelope === 'sharp') {
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)
  } else {
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration - 0.01)
  }

  // Connect and play
  oscillator.connect(gainNode)
  gainNode.connect(soundGainNode)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + duration)
}

// Comprehensive sound effect definitions
const playSound = async (type: SoundEffectType) => {
  if (!settings.value.soundEnabled) return
  await ensureAudioContextRunning()

  switch (type) {
    case 'move':
      // Short click for movement
      createBeep(220, 0.05, 'square', 'sharp')
      break

    case 'rotate':
      // Chirp for rotation
      createBeep(330, 0.1, 'triangle', 'soft')
      break

    case 'drop':
      // Deep thud for hard drop
      createBeep(110, 0.15, 'sawtooth', 'sharp')
      setTimeout(() => createBeep(55, 0.1, 'sawtooth', 'sharp'), 50)
      break

    case 'lock':
      // Locking confirmation
      createBeep(440, 0.08, 'square', 'sharp')
      break

    case 'line':
      // Ascending chord for line clear
      createBeep(440, 0.2, 'square', 'soft')
      setTimeout(() => createBeep(550, 0.2, 'square', 'soft'), 80)
      setTimeout(() => createBeep(660, 0.2, 'square', 'soft'), 160)
      break

    case 'tetris':
      // Triumphant sequence for Tetris (4 lines)
      const tetrisNotes = [440, 550, 660, 880]
      tetrisNotes.forEach((freq, i) => {
        setTimeout(() => createBeep(freq, 0.3, 'square', 'soft'), i * 100)
      })
      break

    case 'combo':
      // Rising tone for combo
      createBeep(330, 0.15, 'sawtooth', 'soft')
      setTimeout(() => createBeep(440, 0.15, 'sawtooth', 'soft'), 100)
      break

    case 'levelup':
      // Fanfare for level up
      createBeep(523, 0.2, 'square', 'soft')
      setTimeout(() => createBeep(659, 0.2, 'square', 'soft'), 150)
      setTimeout(() => createBeep(784, 0.3, 'square', 'soft'), 300)
      break

    case 'gameover':
      // Descending sequence for game over
      const gameOverNotes = [220, 196, 174, 147, 131]
      gameOverNotes.forEach((freq, i) => {
        setTimeout(() => createBeep(freq, 0.25, 'sawtooth', 'soft'), i * 200)
      })
      break
  }
}
```

### Music Track System

Four distinct music tracks with different moods:

```typescript
interface MusicNote {
  frequency: number    // Hz
  duration: number     // Seconds
  waveform?: OscillatorType
}

interface MusicTrack {
  id: string
  name: string
  tempo: number        // BPM
  notes: MusicNote[]
}

const musicTracks: Record<string, MusicTrack> = {
  tetris: {
    id: 'tetris',
    name: 'Classic Tetris Theme',
    tempo: 144,
    notes: [
      // Korobeiniki (Traditional Russian folk song)
      { frequency: 659.25, duration: 0.4 },  // E5
      { frequency: 493.88, duration: 0.2 },  // B4
      { frequency: 523.25, duration: 0.2 },  // C5
      { frequency: 587.33, duration: 0.4 },  // D5
      // ... more notes
    ]
  },

  arcade: {
    id: 'arcade',
    name: 'Arcade Energy',
    tempo: 160,
    notes: [
      // Upbeat chiptune melody
      { frequency: 523.25, duration: 0.25, waveform: 'square' },  // C5
      { frequency: 659.25, duration: 0.25, waveform: 'square' },  // E5
      // ... more notes
    ]
  },

  chill: {
    id: 'chill',
    name: 'Chill Vibes',
    tempo: 90,
    notes: [
      // Relaxed ambient melody
      { frequency: 261.63, duration: 0.5, waveform: 'triangle' },  // C4
      { frequency: 329.63, duration: 0.5, waveform: 'triangle' },  // E4
      // ... more notes
    ]
  },

  intense: {
    id: 'intense',
    name: 'Intense Focus',
    tempo: 180,
    notes: [
      // Fast-paced dramatic melody
      { frequency: 440.00, duration: 0.2, waveform: 'sawtooth' },  // A4
      { frequency: 493.88, duration: 0.2, waveform: 'sawtooth' },  // B4
      // ... more notes
    ]
  }
}
```

### Track Switching

```typescript
const changeTrack = async (trackId: string) => {
  if (!musicTracks[trackId]) {
    console.warn(`Unknown track: ${trackId}`)
    return
  }

  const wasPlaying = settings.value.musicEnabled
  const previousTrack = settings.value.currentTrack

  // Stop current music
  if (musicScheduler) {
    musicScheduler.stop()
  }

  // Update settings
  settings.value.currentTrack = trackId
  saveSettings()

  // Emit track change event
  emit('music:track:change', { track: trackId, previousTrack })

  // Resume if was playing
  if (wasPlaying) {
    await startMusic()
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

## 🏆 useAchievements - Achievement System

### Event-Driven Achievement Tracking

The achievement system is fully event-driven, listening to game events and emitting unlock notifications:

```typescript
export function useAchievements() {
  // Event bus integration
  const { on, emit } = useGameBus()

  // Achievement state
  const achievements = ref<Achievement[]>(allAchievements)
  const unlockedIds = ref<Set<string>>(new Set())
  const recentUnlocks = ref<Achievement[]>([])

  // Subscribe to game events
  onMounted(() => {
    // Score-based achievements
    on('score:update', ({ score }) => {
      checkScoreAchievements(score)
    })

    // Line-clearing achievements
    on('line:clear', ({ count, isTetris, isCombo }) => {
      if (isTetris) {
        unlockAchievement('tetris_master')
      }
      if (isCombo) {
        updateComboProgress()
      }
      checkLineClearAchievements(count)
    })

    // Level progression achievements
    on('level:up', ({ level }) => {
      checkLevelAchievements(level)
    })

    // Piece-specific achievements
    on('piece:lock', ({ type, position }) => {
      trackPieceUsage(type)
      checkPieceAchievements()
    })

    // Game completion achievements
    on('game:over', ({ score, level, lines, duration }) => {
      checkGameCompletionAchievements({ score, level, lines, duration })
    })
  })

  // Unlock achievement and emit event
  const unlockAchievement = (achievementId: string) => {
    if (unlockedIds.value.has(achievementId)) {
      return // Already unlocked
    }

    const achievement = achievements.value.find(a => a.id === achievementId)
    if (!achievement) {
      console.warn(`Unknown achievement: ${achievementId}`)
      return
    }

    // Mark as unlocked
    achievement.unlocked = true
    achievement.unlockedAt = Date.now()
    unlockedIds.value.add(achievementId)
    recentUnlocks.value.unshift(achievement)

    // Persist to storage
    saveAchievements()

    // Emit unlock event for notifications
    emit('achievement:unlocked', {
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      timestamp: achievement.unlockedAt
    })

    // Update statistics
    updateAchievementStats()
  }

  // Update achievement progress
  const updateProgress = (achievementId: string, current: number) => {
    const achievement = achievements.value.find(a => a.id === achievementId)
    if (!achievement || achievement.unlocked) {
      return
    }

    achievement.progress = current

    // Check if threshold reached
    if (current >= achievement.target) {
      unlockAchievement(achievementId)
    } else {
      // Emit progress event
      emit('achievement:progress', {
        id: achievementId,
        current,
        target: achievement.target,
        percentage: Math.round((current / achievement.target) * 100)
      })
    }
  }

  return {
    achievements: computed(() => achievements.value),
    unlockedIds: computed(() => unlockedIds.value),
    recentUnlocks: computed(() => recentUnlocks.value),
    unlockAchievement,
    updateProgress
  }
}
```

### Events Subscribed By useAchievements

The achievement system listens to these game events:

| Event | Handler | Purpose |
|-------|---------|---------|
| `score:update` | `checkScoreAchievements()` | Track score milestones |
| `line:clear` | `checkLineClearAchievements()` | Track line clear patterns |
| `level:up` | `checkLevelAchievements()` | Track level progression |
| `piece:lock` | `trackPieceUsage()` | Track piece usage statistics |
| `game:over` | `checkGameCompletionAchievements()` | Track game completion stats |

### Events Emitted By useAchievements

```typescript
// Achievement unlocked
emit('achievement:unlocked', {
  id: 'first_tetris',
  name: 'Tetris Master',
  description: 'Clear 4 lines at once',
  category: 'gameplay',
  timestamp: 1234567890
})

// Achievement progress updated
emit('achievement:progress', {
  id: 'score_marathon',
  current: 7500,
  target: 10000,
  percentage: 75
})
```

### Achievement Categories and Tracking

```typescript
interface Achievement {
  id: string
  name: string
  description: string
  category: 'gameplay' | 'mastery' | 'collection' | 'special'
  icon: string
  target: number
  progress: number
  unlocked: boolean
  unlockedAt?: number
  hidden?: boolean
}

// Example achievement definitions
const achievements: Achievement[] = [
  {
    id: 'first_game',
    name: 'Getting Started',
    description: 'Play your first game',
    category: 'gameplay',
    icon: '🎮',
    target: 1,
    progress: 0,
    unlocked: false
  },
  {
    id: 'score_novice',
    name: 'Score Novice',
    description: 'Reach 1,000 points',
    category: 'gameplay',
    icon: '🎯',
    target: 1000,
    progress: 0,
    unlocked: false
  },
  {
    id: 'tetris_master',
    name: 'Tetris Master',
    description: 'Clear 4 lines at once (Tetris)',
    category: 'mastery',
    icon: '👑',
    target: 1,
    progress: 0,
    unlocked: false
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Reach level 10',
    category: 'mastery',
    icon: '⚡',
    target: 10,
    progress: 0,
    unlocked: false
  },
  {
    id: 'piece_collector_i',
    name: 'I-Piece Collector',
    description: 'Place 100 I-pieces',
    category: 'collection',
    icon: '📊',
    target: 100,
    progress: 0,
    unlocked: false
  }
]
```

### Achievement Notification Integration

Components can subscribe to achievement events for UI notifications:

```typescript
// In AchievementNotification.vue
const { on } = useGameBus()
const notifications = ref<AchievementUnlockedPayload[]>([])

onMounted(() => {
  on('achievement:unlocked', (payload: AchievementUnlockedPayload) => {
    // Add notification to queue
    notifications.value.push(payload)

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notifications.value = notifications.value.filter(n => n.id !== payload.id)
    }, 5000)
  })
})
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

### Event-Driven Cross-Composable Communication

The event bus eliminates the need for direct composable coupling:

```typescript
// In App.vue - composables communicate via events
export default defineComponent({
  setup() {
    // Initialize all systems (they auto-subscribe to events)
    const { gameState, startGame, pauseGame } = useTetris()
    const { settings: audioSettings } = useAudio()
    const { settings: vibrationSettings } = useVibration()
    const { achievements } = useAchievements()
    const { speedMultiplier } = useSpeed()

    // No manual coordination needed!
    // Each composable subscribes to relevant events

    // Game actions now automatically trigger:
    // - useTetris emits 'game:start' event
    // - useAudio subscribes and starts music
    // - useVibration subscribes and provides haptic feedback
    // - useAchievements subscribes and checks for unlocks

    return {
      gameState,
      startGame,
      pauseGame,
      audioSettings,
      vibrationSettings,
      achievements
    }
  }
})
```

### Complete Event Flow Example

```typescript
// User clicks "Start Game" button

// 1. Component calls startGame()
const handleStartGame = () => {
  startGame()
}

// 2. useTetris emits event
// Inside useTetris:
const startGame = () => {
  // ... game setup
  emit('game:start')
}

// 3. Multiple subscribers react automatically
// useAudio subscriber:
on('game:start', () => {
  if (settings.value.musicEnabled) {
    musicScheduler?.start(musicTracks[settings.value.currentTrack])
  }
})

// useVibration subscriber:
on('game:start', () => {
  vibrate('pause')  // Confirmation haptic
})

// useAchievements subscriber:
on('game:start', () => {
  updateProgress('first_game', 1)
  gameStartTime = Date.now()
})

// 4. Line clearing triggers cascade of events
// useTetris detects 4 lines cleared:
emit('line:clear', { count: 4, isTetris: true, lines: [16,17,18,19] })

// useAudio plays special sound:
on('line:clear', ({ isTetris }) => {
  playSound(isTetris ? 'tetris' : 'line')
})

// useVibration provides strong haptic:
on('line:clear', ({ isTetris }) => {
  vibrate(isTetris ? 'lineClear' : 'lineClear')
})

// useAchievements checks for unlock:
on('line:clear', ({ isTetris }) => {
  if (isTetris) {
    unlockAchievement('tetris_master')
  }
})

// 5. Achievement unlock triggers notification
// useAchievements emits:
emit('achievement:unlocked', {
  id: 'tetris_master',
  name: 'Tetris Master',
  description: 'Clear 4 lines at once',
  category: 'mastery',
  timestamp: Date.now()
})

// AchievementNotification component shows popup:
on('achievement:unlocked', (payload) => {
  notifications.value.push(payload)
  setTimeout(() => removeNotification(payload.id), 5000)
})
```

### Architecture Comparison

**Before Event Bus (Tightly Coupled)**:
```typescript
// App.vue needs to know about all systems
const { gameState, startGame } = useTetris()
const { playSound, startMusic } = useAudio()
const { vibrate } = useVibration()
const { unlockAchievement } = useAchievements()

// Manual coordination required
const handleStartGame = () => {
  startGame()
  startMusic()
  vibrate('pause')
  // Achievement tracking logic scattered across components
}

watch(() => gameState.value.lines, (newLines, oldLines) => {
  if (newLines > oldLines) {
    playSound('line')
    vibrate('lineClear')
    // Check achievements manually
  }
})
```

**After Event Bus (Loosely Coupled)**:
```typescript
// App.vue only needs game logic
const { gameState, startGame } = useTetris()

// All other systems auto-subscribe to events
// useAudio, useVibration, useAchievements initialize themselves

// Simple game actions
const handleStartGame = () => {
  startGame()  // Emits 'game:start' - all systems react automatically
}

// No watchers needed - events handle everything
```

### Event Lifecycle Management

```typescript
export function useAudio() {
  const { on, off } = useGameBus()
  const unsubscribers: Array<() => void> = []

  onMounted(() => {
    // Subscribe to events and store unsubscribe functions
    unsubscribers.push(
      on('game:start', handleGameStart),
      on('game:pause', handleGamePause),
      on('piece:move', () => playSound('move')),
      on('line:clear', handleLineClear)
    )
  })

  onUnmounted(() => {
    // Clean up all subscriptions
    unsubscribers.forEach(unsub => unsub())
    unsubscribers.length = 0

    // Clean up audio resources
    cleanup()
  })
}
```

### Event-Driven Testing Strategies

Testing event-driven composables requires verifying event emissions and subscriptions:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTetris } from '@/composables/useTetris'
import { useGameBus } from '@/composables/useGameBus'

describe('useTetris', () => {
  let tetrisComposable: ReturnType<typeof useTetris>
  let gameBus: ReturnType<typeof useGameBus>

  beforeEach(() => {
    gameBus = useGameBus()
    tetrisComposable = useTetris()
  })

  it('should initialize with default state', () => {
    const { gameState } = tetrisComposable

    expect(gameState.value.isPlaying).toBe(false)
    expect(gameState.value.score).toBe(0)
    expect(gameState.value.level).toBe(1)
  })

  it('should emit game:start event when starting game', () => {
    const { startGame } = tetrisComposable
    const eventSpy = vi.fn()

    // Subscribe to event
    gameBus.on('game:start', eventSpy)

    // Trigger action
    startGame()

    // Verify event was emitted
    expect(eventSpy).toHaveBeenCalledTimes(1)
  })

  it('should emit piece:move event with correct payload', () => {
    const { startGame, movePiece } = tetrisComposable
    const eventSpy = vi.fn()

    gameBus.on('piece:move', eventSpy)

    startGame()
    movePiece(1, 0)

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        direction: 'right',
        position: expect.any(Object)
      })
    )
  })

  it('should emit line:clear event when lines are cleared', () => {
    const { gameState, startGame } = tetrisComposable
    const eventSpy = vi.fn()

    gameBus.on('line:clear', eventSpy)

    startGame()

    // Simulate full line
    gameState.value.board[19] = Array(10).fill('I')

    // Trigger line clear check
    // ... (implementation specific)

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        count: 1,
        lines: [19],
        isTetris: false
      })
    )
  })

  it('should detect collisions properly', () => {
    const { gameState, startGame, movePiece } = tetrisComposable

    startGame()

    // Try to move piece outside board
    const moved = movePiece(-10, 0)

    expect(moved).toBe(false)
  })
})

describe('useAudio - Event Integration', () => {
  let audioComposable: ReturnType<typeof useAudio>
  let gameBus: ReturnType<typeof useGameBus>

  beforeEach(() => {
    gameBus = useGameBus()
    audioComposable = useAudio()
  })

  it('should play sound when piece:move event is emitted', async () => {
    const { playSound } = audioComposable
    const playSoundSpy = vi.spyOn(audioComposable, 'playSound')

    // Enable sound
    audioComposable.settings.value.soundEnabled = true

    // Emit event
    gameBus.emit('piece:move', { direction: 'left' })

    // Verify sound was played
    await vi.waitFor(() => {
      expect(playSoundSpy).toHaveBeenCalledWith('move')
    })
  })

  it('should start music when game:start event is emitted', async () => {
    const { settings } = audioComposable
    settings.value.musicEnabled = true

    const startMusicSpy = vi.spyOn(audioComposable, 'startMusic')

    gameBus.emit('game:start')

    await vi.waitFor(() => {
      expect(startMusicSpy).toHaveBeenCalled()
    })
  })

  it('should emit music:track:change when track is changed', () => {
    const eventSpy = vi.fn()
    gameBus.on('music:track:change', eventSpy)

    audioComposable.changeTrack('arcade')

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        track: 'arcade',
        previousTrack: 'tetris'
      })
    )
  })
})

describe('useAchievements - Event Integration', () => {
  let achievementComposable: ReturnType<typeof useAchievements>
  let gameBus: ReturnType<typeof useGameBus>

  beforeEach(() => {
    gameBus = useGameBus()
    achievementComposable = useAchievements()
  })

  it('should unlock achievement when line:clear event with Tetris is emitted', () => {
    const eventSpy = vi.fn()
    gameBus.on('achievement:unlocked', eventSpy)

    // Emit Tetris line clear
    gameBus.emit('line:clear', { count: 4, isTetris: true, lines: [16, 17, 18, 19] })

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'tetris_master',
        name: 'Tetris Master'
      })
    )
  })

  it('should emit achievement:progress when score milestone is reached', () => {
    const eventSpy = vi.fn()
    gameBus.on('achievement:progress', eventSpy)

    // Emit score update
    gameBus.emit('score:update', { score: 5000, delta: 100 })

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        current: expect.any(Number),
        target: expect.any(Number),
        percentage: expect.any(Number)
      })
    )
  })

  it('should track multiple event subscriptions correctly', () => {
    const unlockSpy = vi.fn()
    const progressSpy = vi.fn()

    gameBus.on('achievement:unlocked', unlockSpy)
    gameBus.on('achievement:progress', progressSpy)

    // Trigger multiple events
    gameBus.emit('score:update', { score: 1000 })
    gameBus.emit('level:up', { level: 5 })
    gameBus.emit('line:clear', { count: 2, isTetris: false })

    // Verify subscriptions handled events
    expect(unlockSpy).toHaveBeenCalled()
    expect(progressSpy).toHaveBeenCalled()
  })
})

describe('useGameBus', () => {
  let gameBus: ReturnType<typeof useGameBus>

  beforeEach(() => {
    gameBus = useGameBus()
  })

  it('should register and trigger event listeners', () => {
    const listener = vi.fn()

    gameBus.on('test:event', listener)
    gameBus.emit('test:event', { data: 'test' })

    expect(listener).toHaveBeenCalledWith({ data: 'test' })
  })

  it('should support multiple listeners for the same event', () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()

    gameBus.on('test:event', listener1)
    gameBus.on('test:event', listener2)

    gameBus.emit('test:event')

    expect(listener1).toHaveBeenCalled()
    expect(listener2).toHaveBeenCalled()
  })

  it('should unsubscribe listeners correctly', () => {
    const listener = vi.fn()

    const unsubscribe = gameBus.on('test:event', listener)
    unsubscribe()

    gameBus.emit('test:event')

    expect(listener).not.toHaveBeenCalled()
  })

  it('should support one-time event listeners', () => {
    const listener = vi.fn()

    gameBus.once('test:event', listener)

    gameBus.emit('test:event')
    gameBus.emit('test:event')

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('should track event history in dev mode', () => {
    gameBus.emit('test:event', { data: 'test' })

    const history = gameBus.getHistory()

    expect(history).toContainEqual(
      expect.objectContaining({
        event: 'test:event',
        payload: { data: 'test' }
      })
    )
  })

  it('should handle errors in event handlers gracefully', () => {
    const errorListener = vi.fn(() => {
      throw new Error('Test error')
    })
    const normalListener = vi.fn()

    gameBus.on('test:event', errorListener)
    gameBus.on('test:event', normalListener)

    // Should not throw
    expect(() => gameBus.emit('test:event')).not.toThrow()

    // Normal listener should still execute
    expect(normalListener).toHaveBeenCalled()
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

1. **Single Responsibility**: Each composable manages one domain of functionality
2. **Reactive by Default**: All state should be reactive using Vue's reactivity system
3. **Event-Driven Communication**: Use event bus for cross-composable interactions
4. **Composable Composition**: Composables can use other composables internally
5. **Proper Cleanup**: Always clean up resources and unsubscribe from events in onUnmounted
6. **Type Safety**: Use TypeScript interfaces for all APIs, especially event payloads
7. **Loose Coupling**: Avoid direct dependencies between composables - use events

### Event-Driven Architecture Principles

1. **Clear Event Contracts**: Define explicit event types and payload interfaces
2. **Descriptive Event Names**: Use namespace:action pattern (e.g., 'game:start', 'piece:move')
3. **Payload Validation**: Ensure event payloads are properly typed and validated
4. **Error Handling**: Wrap event handlers in try-catch to prevent cascading failures
5. **Lifecycle Management**: Unsubscribe from events when components unmount
6. **Event History**: Use event history for debugging in development mode
7. **Performance**: Minimize payload size and avoid unnecessary event emissions

### Error Handling

Event-driven systems require robust error handling to prevent cascading failures:

```typescript
export function useAudio() {
  const { on, emit } = useGameBus()
  const error = ref<string | null>(null)

  const playSound = async (type: SoundType) => {
    try {
      error.value = null
      await audioOperation(type)
    } catch (err) {
      error.value = `Failed to play sound: ${err.message}`
      console.warn('Audio error:', err)

      // Emit error event for monitoring
      emit('audio:error', {
        type,
        message: err.message,
        timestamp: Date.now()
      })
    }
  }

  // Wrap event handlers in try-catch
  onMounted(() => {
    on('piece:move', (payload) => {
      try {
        playSound('move')
      } catch (err) {
        console.error('Error handling piece:move event:', err)
        // Event handler errors are caught by useGameBus
      }
    })
  })

  return {
    error: computed(() => error.value),
    playSound
  }
}
```

### Event-Driven Architecture Benefits

The event bus pattern provides significant advantages:

**Scalability**
- Easy to add new features without modifying existing code
- New composables can subscribe to existing events
- No need to update multiple files when adding functionality

**Maintainability**
- Clear separation of concerns between composables
- Event contracts serve as documentation
- Easy to trace event flow in development mode

**Testability**
- Mock event bus for isolated unit tests
- Test event emissions and subscriptions independently
- Verify event payloads match TypeScript interfaces

**Debugging**
- Event history tracking in development mode
- Console logging of all events with payloads
- Clear audit trail of system interactions

**Performance**
- Efficient pub/sub pattern with Set-based storage
- Automatic cleanup prevents memory leaks
- No unnecessary component re-renders

## 📚 Summary

This composables architecture provides a solid foundation for reactive, performant, and maintainable Vue 3 applications with:

### Key Features
- **Event-Driven Architecture**: Decoupled communication via useGameBus
- **Advanced Audio System**: MusicScheduler with lookahead scheduling for precise timing
- **74 Achievement System**: Comprehensive tracking with progress monitoring
- **Reactive State Management**: Vue 3 reactivity with proper TypeScript typing
- **Performance Optimized**: Efficient computed properties and memory management
- **Fully Tested**: Event-driven testing strategies with comprehensive coverage

### Architecture Highlights
- **useGameBus**: Centralized event coordination with 20+ event types
- **useTetris**: Core game logic emitting 11 different game/piece/score events
- **useAudio**: Web Audio API with MusicScheduler and 9 procedural sound effects
- **useAchievements**: Event-driven achievement tracking across 4 categories
- **useTheme**: CSS custom properties with 5 themes
- **useSpeed**: Dynamic speed control with persistence
- **useVibration**: Contextual haptic feedback patterns

### Event System
- **Pub/Sub Pattern**: Efficient event bus with automatic cleanup
- **Type Safety**: TypeScript interfaces for all event payloads
- **Error Handling**: Graceful degradation with event handler error isolation
- **Development Tools**: Event history tracking and console logging
- **Lifecycle Management**: Automatic subscription cleanup on unmount

### Best Practices Demonstrated
- Single Responsibility Principle for each composable
- Event-driven communication for loose coupling
- Proper resource cleanup and lifecycle management
- Comprehensive TypeScript typing for type safety
- Performance optimization with computed properties
- Thorough testing with event-driven test strategies

This architecture enables rapid feature development, easy maintenance, and excellent developer experience through clear event contracts and decoupled systems.