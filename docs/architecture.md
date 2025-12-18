# Tetrys Architecture Documentation

## Overview

Tetrys is a modern Tetris implementation built with Vue 3, TypeScript, and an event-driven architecture. The application follows best practices for reactive state management, loose coupling through event buses, and modular component design.

## Technology Stack

- **Vue 3** - Composition API with TypeScript
- **Vite** - Build tool and development server
- **mitt** - Tiny event bus for inter-component communication
- **Howler.js** - Audio playback with Web Audio API
- **Tailwind CSS** - Utility-first styling

## Core Architecture Patterns

### Event-Driven Architecture

The application uses an event-driven architecture to decouple game logic from achievement tracking and UI updates. This approach provides:

- **Loose Coupling** - Components communicate through events rather than direct dependencies
- **Scalability** - New features can subscribe to existing events without modifying core game logic
- **Testability** - Event publishers and subscribers can be tested independently
- **Maintainability** - Clear separation of concerns with unidirectional data flow

#### Event Bus Implementation

**Location**: `/src/composables/useGameBus.ts`

```typescript
import mitt from 'mitt'
import type { GameBusEvents } from '@/types/events'

// Singleton event bus instance
const gameBus = mitt<GameBusEvents>()

// Development mode: log all events for debugging
if (import.meta.env.DEV) {
  gameBus.on('*', (type, event) => {
    console.log(`[GameBus] ${String(type)}`, event)
  })
}

export function useGameBus() {
  return gameBus
}
```

**Key Features**:
- Singleton pattern ensures single source of truth
- TypeScript-typed events prevent runtime errors
- Development logging for debugging event flow
- Centralized event routing for all game events

#### Event Type Definitions

**Location**: `/src/types/events.ts`

All events are strongly typed with TypeScript interfaces:

```typescript
// Game Events - emitted by useTetris
export interface GameEvents {
  // Game lifecycle
  'game:started': { timestamp: number }
  'game:paused': { isPaused: boolean; timePlayed: number }
  'game:over': { score: number; level: number; lines: number; tetrisCount: number; timePlayed: number }
  'game:reset': { timestamp: number }

  // Line clearing
  'lines:cleared': { count: number; isTetris: boolean; newTotal: number; newLevel: number }

  // Scoring
  'score:updated': { score: number; delta: number; level: number }

  // Level progression
  'level:up': { level: number; previousLevel: number }

  // Combo tracking
  'combo:updated': { combo: number; isReset: boolean }

  // Piece placement
  'piece:placed': { type: TetrominoType; position: { x: number; y: number } }

  // Time tracking
  'time:tick': { timePlayed: number }
}

// Achievement Events - emitted by useAchievements
export interface AchievementEvents {
  'achievement:unlocked': { id: AchievementId; rarity: string; timestamp: number }
}

// Combined event bus type
export type GameBusEvents = GameEvents & AchievementEvents
```

**Design Principles**:
- Descriptive event names with namespace prefixes (`game:`, `lines:`, `score:`)
- Rich event payloads containing all relevant context
- Separate interfaces for different subsystems (Game vs Achievements)
- Type safety prevents invalid event emissions

#### Event Publishers

**Location**: `/src/composables/useTetris.ts`

The game logic composable publishes events at key moments:

```typescript
export function useTetris() {
  const bus = useGameBus()

  // Game lifecycle events
  const startGame = (): void => {
    // ... game initialization logic ...
    bus.emit('game:started', { timestamp: Date.now() })
  }

  const pauseGame = (): void => {
    gameState.value.isPaused = !gameState.value.isPaused
    bus.emit('game:paused', {
      isPaused: gameState.value.isPaused,
      timePlayed: gameState.value.timePlayed
    })
  }

  // Line clearing events
  if (linesCleared > 0) {
    bus.emit('lines:cleared', {
      count: linesCleared,
      isTetris: linesCleared === 4,
      newTotal: gameState.value.lines,
      newLevel: gameState.value.level
    })

    bus.emit('score:updated', {
      score: gameState.value.score,
      delta: calculateScore(linesCleared, gameState.value.level),
      level: gameState.value.level
    })

    if (gameState.value.level > previousLevel) {
      bus.emit('level:up', {
        level: gameState.value.level,
        previousLevel
      })
    }

    bus.emit('combo:updated', {
      combo: gameState.value.combo,
      isReset: false
    })
  }

  // Time tracking
  const updateTimePlayed = (): void => {
    if (gameState.value.isPlaying && !gameState.value.isPaused) {
      gameState.value.timePlayed = Math.floor((Date.now() - gameStartTime - pausedTime) / 1000)
      bus.emit('time:tick', { timePlayed: gameState.value.timePlayed })
    }
  }
}
```

**Event Publishing Strategy**:
- Emit events immediately after state changes
- Include comprehensive context in event payloads
- Use semantic event names that describe what happened
- No assumptions about event consumers

#### Event Subscribers

**Location**: `/src/composables/useAchievements.ts`

The achievement system subscribes to game events and checks achievement conditions internally:

```typescript
export function useAchievements() {
  const bus = useGameBus()

  // Module-level event tracking state
  let eventDrivenStats = {
    score: 0,
    level: 1,
    lines: 0,
    tetrisCount: 0,
    combo: 0,
    timePlayed: 0
  }

  // Setup event subscriptions
  const setupEventSubscriptions = () => {
    // Reset stats when game starts
    bus.on('game:started', () => {
      eventDrivenStats = {
        score: 0,
        level: 1,
        lines: 0,
        tetrisCount: 0,
        combo: 0,
        timePlayed: 0
      }
    })

    // Helper to check achievements with progressive unlocking
    const checkWithCurrentStats = () => {
      const MAX_CHECKS = 25
      let checksPerformed = 0

      // Progressive unlock loop - allows cascade achievements
      while (checksPerformed < MAX_CHECKS) {
        const previousUnlockedCount = unlockedAchievements.value.length
        checkAchievementsInternal(eventDrivenStats)

        // If no new achievements unlocked, we're done
        if (unlockedAchievements.value.length === previousUnlockedCount) {
          break
        }
        checksPerformed++
      }
    }

    // Subscribe to game events
    bus.on('lines:cleared', (data: { count: number; isTetris?: boolean }) => {
      eventDrivenStats.lines += data.count
      if (data.isTetris) {
        eventDrivenStats.tetrisCount++
      }
      checkWithCurrentStats()
    })

    bus.on('score:updated', (data: { score: number }) => {
      eventDrivenStats.score = data.score
      checkWithCurrentStats()
    })

    bus.on('combo:updated', (data: { combo: number }) => {
      eventDrivenStats.combo = data.combo
      checkWithCurrentStats()
    })

    bus.on('time:tick', (data: { timePlayed: number }) => {
      eventDrivenStats.timePlayed = data.timePlayed
      checkWithCurrentStats()
    })
  }

  // Initialize subscriptions
  setupEventSubscriptions()
}
```

**Subscription Strategy**:
- Maintain internal event-driven state separate from external APIs
- Check achievements immediately when relevant events occur
- Support progressive/cascade unlocking with multiple check iterations
- Self-contained logic - no external coordination required

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          EVENT-DRIVEN FLOW                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  useTetris.ts    │  Game Logic (Publisher)
│                  │
│  • Game Loop     │
│  • Line Clear    │
│  • Score Calc    │
│  • Level Up      │
│  • Combo Track   │
└────────┬─────────┘
         │
         │ emits events:
         │ - game:started
         │ - lines:cleared
         │ - score:updated
         │ - level:up
         │ - combo:updated
         │ - time:tick
         │ - game:over
         ▼
┌──────────────────┐
│   Event Bus      │  Singleton mitt instance (useGameBus.ts)
│   (mitt)         │
│                  │  • Routes events to all subscribers
│  Type: GameBus   │  • Type-safe event payloads
│  Events          │  • Dev mode logging
└────────┬─────────┘
         │
         │ broadcasts to subscribers
         ▼
┌──────────────────┐
│ useAchievements  │  Achievement System (Subscriber)
│      .ts         │
│                  │  • Subscribes to game events
│  Event Tracking: │  • Maintains event-driven stats
│  • lines:cleared │  • Checks achievements internally
│  • score:updated │  • Progressive unlock cascade
│  • combo:updated │  • Emits achievement:unlocked
│  • time:tick     │
└──────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                         KEY BENEFITS                                │
├─────────────────────────────────────────────────────────────────────┤
│ ✓ Loose Coupling - No direct dependencies between game & achievements│
│ ✓ Testability - Components can be tested independently             │
│ ✓ Scalability - New subscribers add without modifying publishers   │
│ ✓ Type Safety - TypeScript prevents invalid event emissions        │
│ ✓ Debuggability - Development logging tracks all event flow        │
└─────────────────────────────────────────────────────────────────────┘
```

#### Migration from Tight Coupling

**Previous Architecture** (Removed):
```typescript
// App.vue - Direct coordination (DEPRECATED)
watch(
  () => gameState.value,
  (newState) => {
    // App.vue directly calling checkAchievements - tight coupling
    checkAchievements({
      score: newState.score,
      level: newState.level,
      lines: newState.lines,
      tetrisCount: newState.tetrisCount,
      combo: newState.combo,
      timePlayed: newState.timePlayed
    })
  },
  { deep: true }
)
```

**Current Architecture** (Event-Driven):
- `useTetris.ts` emits events → Event Bus → `useAchievements.ts` subscribes
- No coordination needed in `App.vue`
- Each subsystem is self-contained and independently testable
- New features can subscribe to events without modifying existing code

**Benefits of Refactoring**:
1. **Separation of Concerns** - Game logic doesn't know about achievements
2. **Reduced Coupling** - Components communicate through well-defined event contracts
3. **Improved Testability** - Mock event bus for isolated unit testing
4. **Better Performance** - Targeted updates only when relevant events occur (vs. deep watching entire game state)
5. **Easier Maintenance** - Changes to game logic don't require achievement system updates

---

## Composables (Composition API)

### useTetris

**Purpose**: Core game logic and state management

**Responsibilities**:
- Game board management (10x20 grid)
- Tetromino generation and movement
- Collision detection
- Line clearing and scoring
- Level progression
- Time tracking
- Event publishing for game state changes

**Key Functions**:
- `startGame()` - Initialize new game
- `pauseGame()` - Toggle pause state
- `resetGame()` - Reset to initial state
- `movePiece(dx, dy)` - Move current piece
- `rotatePiece()` - Rotate current piece
- `dropPiece()` - Fast drop to bottom
- `setSpeedMultiplier(n)` - Adjust fall speed

### useAchievements

**Purpose**: Achievement system with event-driven unlocking

**Responsibilities**:
- Subscribe to game events
- Track achievement progress
- Evaluate unlock conditions
- Manage achievement persistence (localStorage)
- Queue achievement notifications
- Support progressive unlocking (prerequisites)

**Key Functions**:
- `checkAchievements(stats)` - Manual check (backward compatibility)
- `unlockAchievement(id)` - Unlock specific achievement
- `isUnlocked(id)` - Check if achievement unlocked
- `getProgress(id, value)` - Calculate progress percentage
- `getNextNotification()` - Pop next notification from queue
- `resetAchievements()` - Clear all achievements (dev/testing)

**Internal Event Subscriptions**:
- `game:started` - Reset event-driven stats
- `lines:cleared` - Update lines and check achievements
- `score:updated` - Update score and check achievements
- `combo:updated` - Update combo and check achievements
- `time:tick` - Update time played and check achievements

### useGameBus

**Purpose**: Centralized event bus for application-wide events

**Responsibilities**:
- Provide singleton mitt instance
- Type-safe event emission and subscription
- Development mode logging

**Usage**:
```typescript
const bus = useGameBus()

// Emit events
bus.emit('lines:cleared', { count: 4, isTetris: true, newTotal: 40, newLevel: 5 })

// Subscribe to events
bus.on('lines:cleared', (data) => {
  console.log(`Cleared ${data.count} lines`)
})

// Wildcard subscription (dev logging)
bus.on('*', (type, event) => {
  console.log(`[Event] ${String(type)}`, event)
})
```

### useSound

**Purpose**: Audio playback system with lookahead scheduling

**Responsibilities**:
- Sound effect playback (line clear, game over, achievement unlock)
- Background music management with fade transitions
- Lookahead audio scheduling for precise timing
- Volume control and mute functionality
- Mobile audio unlock handling

**Key Features**:
- **Lookahead Scheduling**: Pre-schedules audio playback for rhythm accuracy
- **Audio Context Management**: Single AudioContext for all sounds
- **Fade Transitions**: Smooth volume changes for music
- **Mobile Compatibility**: Touch event handlers for iOS audio unlock
- **Resource Management**: Proper cleanup on component unmount

---

## State Management

### Reactive State

The application uses Vue 3's Composition API with `ref` and `computed` for reactive state:

```typescript
// Game state (useTetris)
const gameState = ref<GameState>({
  board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
  currentPiece: null,
  currentPosition: { x: 0, y: 0 },
  nextPiece: null,
  score: 0,
  level: 1,
  lines: 0,
  tetrisCount: 0,
  combo: 0,
  timePlayed: 0,
  isGameOver: false,
  isPaused: false,
  isPlaying: false,
  speedMultiplier: 1
})

// Achievement state (useAchievements)
const unlockedAchievements = ref<UnlockedAchievement[]>([])
const pendingNotifications = ref<Achievement[]>([])
```

### Computed Properties

```typescript
// Calculated values derived from reactive state
const fallSpeed = computed(() => {
  const baseSpeed = Math.max(100, INITIAL_FALL_SPEED - (gameState.value.level - 1) * SPEED_INCREASE_PER_LEVEL)
  return Math.max(50, Math.floor(baseSpeed / gameState.value.speedMultiplier))
})

const achievementStats = computed<AchievementStats>(() => {
  const totalAchievements = ACHIEVEMENTS.length
  const unlockedCount = unlockedAchievements.value.length
  const percentage = Math.round((unlockedCount / totalAchievements) * 100)
  return { totalAchievements, unlockedCount, percentage }
})
```

---

## Persistence

### LocalStorage Strategy

**Achievement Data**: Persisted to localStorage with atomic rollback on error

```typescript
const STORAGE_KEY = 'tetris_achievements'

const saveAchievements = () => {
  const backup = localStorage.getItem(STORAGE_KEY)

  try {
    const achievementsJson = JSON.stringify(unlockedAchievements.value)
    localStorage.setItem(STORAGE_KEY, achievementsJson)
    saveError.value = null
  } catch (error) {
    console.error('Failed to save achievements, rolling back:', error)

    // Atomic rollback on failure
    try {
      if (backup !== null) {
        localStorage.setItem(STORAGE_KEY, backup)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch (rollbackError) {
      console.error('Failed to rollback, localStorage may be corrupted:', rollbackError)
    }

    saveError.value = 'Failed to save achievements'
  }
}
```

**Data Format**:
```json
[
  {
    "achievementId": "first_line",
    "unlockedAt": "2024-12-16T12:00:00.000Z",
    "gameStats": {
      "score": 100,
      "level": 1,
      "lines": 1,
      "tetrisCount": 0,
      "combo": 1,
      "timePlayed": 45
    }
  }
]
```

**Error Handling**:
- Atomic rollback prevents partial state corruption
- User-visible error messages with `saveError` ref
- Graceful degradation on localStorage quota exceeded

---

## Achievement System Details

### Achievement Structure

```typescript
interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string
  category: 'gameplay' | 'mastery' | 'speed' | 'special'
  condition: {
    type: 'lines' | 'score' | 'level' | 'tetris_count' | 'combo' | 'time_played'
    value: number
    operator: 'gte' | 'lte' | 'eq'
  }
  additionalConditions?: Array<{ type: string; value: number; operator: string }>
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  rewardMessage?: string
}
```

### Progressive Unlocking

Achievements can have prerequisites that must be unlocked first:

```typescript
const getRequiredPredecessor = (achievementId: AchievementId): AchievementId | null => {
  const progressionMap: Partial<Record<AchievementId, AchievementId>> = {
    'level_3': 'level_2',
    'level_4': 'level_3',
    'score_500': 'score_100',
    'score_1000': 'score_500',
    'combo_3': 'combo_2',
    // ... more progressions
  }

  return progressionMap[achievementId] || null
}
```

**Cascade Unlocking**: When an achievement unlocks, the system re-checks all achievements up to 25 times to handle cascading prerequisites.

### Achievement Checking Logic

```typescript
const checkAchievementsInternal = (stats: GameStats) => {
  // 1. Sanitize stats (prevent negative values)
  const sanitizedStats = {
    score: stats.score !== undefined ? Math.max(0, stats.score) : undefined,
    level: stats.level !== undefined ? Math.max(0, stats.level) : undefined,
    // ... more sanitization
  }

  // 2. Snapshot current unlocks (prevent cascade within same call)
  const unlockedSnapshot = new Set(unlockedAchievements.value.map(u => u.achievementId))

  // 3. Check each achievement
  ACHIEVEMENTS.forEach(achievement => {
    if (isUnlocked(achievement.id)) return

    // 4. Check prerequisite
    const prerequisite = getRequiredPredecessor(achievement.id)
    if (prerequisite && !unlockedSnapshot.has(prerequisite)) {
      return // Cannot unlock until prerequisite is unlocked
    }

    // 5. Evaluate primary condition
    const primaryConditionMet = evaluateCondition(achievement.condition, sanitizedStats)
    if (!primaryConditionMet) return

    // 6. Evaluate additional conditions (all must pass)
    if (achievement.additionalConditions && achievement.additionalConditions.length > 0) {
      const allAdditionalConditionsMet = achievement.additionalConditions.every(
        additionalCondition => evaluateCondition(additionalCondition, sanitizedStats)
      )
      if (!allAdditionalConditionsMet) return
    }

    // 7. Unlock achievement
    unlockAchievement(achievement.id, sanitizedStats)
  })
}
```

### Notification Queue

Achievement notifications are queued to prevent overwhelming the UI:

```typescript
const MAX_PENDING_NOTIFICATIONS = 50

const unlockAchievement = (achievementId: AchievementId, gameStats?: GameStats) => {
  // ... unlock logic ...

  // Add to notification queue if there's space
  if (pendingNotifications.value.length < MAX_PENDING_NOTIFICATIONS) {
    pendingNotifications.value.push(achievement)
  } else {
    console.warn(`Notification queue full (${MAX_PENDING_NOTIFICATIONS}), skipping notification`)
  }

  // Emit event for other systems
  bus.emit('achievement:unlocked', {
    id: achievement.id,
    rarity: achievement.rarity,
    timestamp: unlock.unlockedAt.getTime()
  })
}
```

**Queue Management**:
- FIFO queue with 50-notification capacity
- `getNextNotification()` pops from front of queue
- `clearNotifications()` empties entire queue
- Overflow warnings logged to console

---

## Audio System Architecture

### Sound Manager (useSound)

**Audio Context Strategy**:
- Single shared `AudioContext` for all sounds
- Howler.js for cross-browser audio playback
- Lookahead scheduling for precise timing
- Mobile audio unlock with touch events

**Sound Categories**:
1. **Sound Effects** - One-shot sounds (line clear, game over, achievement unlock)
2. **Background Music** - Looping tracks with fade transitions
3. **UI Sounds** - Button clicks, menu interactions

**Lookahead Scheduling**:
```typescript
const scheduleAudioLookahead = (audioElement: Howl, lookaheadTime: number = 0.1) => {
  const currentTime = Howler.ctx.currentTime
  const playTime = currentTime + lookaheadTime

  // Schedule precise playback
  audioElement.seek(0)
  audioElement.play()

  // Fine-tune timing with Web Audio API
  const source = audioElement._sounds[0]._node
  if (source) {
    source.start(playTime)
  }
}
```

**Volume Management**:
```typescript
const fadeMusic = (targetVolume: number, duration: number = 1000) => {
  if (!currentMusic.value) return

  const steps = 20
  const stepTime = duration / steps
  const volumeStep = (targetVolume - currentMusic.value.volume()) / steps

  let step = 0
  const fadeInterval = setInterval(() => {
    if (!currentMusic.value || step >= steps) {
      clearInterval(fadeInterval)
      if (currentMusic.value) {
        currentMusic.value.volume(targetVolume)
      }
      return
    }

    const newVolume = currentMusic.value.volume() + volumeStep
    currentMusic.value.volume(Math.max(0, Math.min(1, newVolume)))
    step++
  }, stepTime)
}
```

---

## Component Structure

### App.vue

**Purpose**: Root component and application shell

**Responsibilities**:
- Initialize composables (`useTetris`, `useAchievements`, `useSound`)
- Render game board and UI components
- Handle keyboard input
- Manage mobile controls
- Display achievement notifications

**Key Features**:
- No direct coordination between game logic and achievements (event-driven)
- Keyboard event listeners with proper cleanup
- Mobile-responsive layout with touch controls
- Achievement notification toast system

### GameBoard.vue

**Purpose**: Visual representation of the Tetris grid

**Responsibilities**:
- Render 10x20 game board
- Display current piece and ghost piece (preview)
- Show placed tetrominos with color coding
- Responsive grid sizing

### AchievementToast.vue

**Purpose**: Achievement unlock notification UI

**Responsibilities**:
- Display achievement details (name, description, icon)
- Rarity-based styling (common, rare, epic, legendary)
- Auto-dismiss after 5 seconds
- Smooth enter/exit animations

**Rarity Styling**:
```typescript
const rarityStyles = {
  common: 'border-gray-400 bg-gray-50',
  rare: 'border-blue-400 bg-blue-50',
  epic: 'border-purple-400 bg-purple-50',
  legendary: 'border-yellow-400 bg-yellow-50'
}
```

### AchievementsPanel.vue

**Purpose**: Achievement gallery and progress tracking

**Responsibilities**:
- Display all achievements (locked and unlocked)
- Show achievement progress bars
- Filter by category
- Statistics dashboard (total unlocked, percentage complete)
- Sort by rarity or unlock date

---

## Development Tools

### Achievement Testing

**Dev Command**: `triggerDevAchievement(rarity)`

```typescript
// From browser console or dev tools
triggerDevAchievement('legendary') // Test notification UI
triggerDevAchievement('epic')      // Test different rarities
```

**Features**:
- Creates placeholder achievement with specified rarity
- Adds to notification queue for UI testing
- Does not persist (dev-only)
- Logs to console for debugging

### Event Bus Logging

**Automatic in Development**:
```typescript
if (import.meta.env.DEV) {
  gameBus.on('*', (type, event) => {
    console.log(`[GameBus] ${String(type)}`, event)
  })
}
```

**Console Output**:
```
[GameBus] game:started { timestamp: 1702742400000 }
[GameBus] lines:cleared { count: 1, isTetris: false, newTotal: 1, newLevel: 1 }
[GameBus] score:updated { score: 100, delta: 100, level: 1 }
[GameBus] combo:updated { combo: 1, isReset: false }
[GameBus] achievement:unlocked { id: 'first_line', rarity: 'common', timestamp: 1702742410000 }
```

---

## Performance Considerations

### Game Loop Optimization

- **requestAnimationFrame**: Smooth 60 FPS rendering
- **Throttled Updates**: Game logic only runs at `fallSpeed` interval
- **Efficient Board Rendering**: Only re-render changed cells

### Event System Performance

- **Targeted Subscriptions**: Subscribers only listen to relevant events
- **No Deep Watching**: Event-driven updates avoid expensive watchers
- **Minimal Event Payloads**: Only include necessary data in events
- **Unsubscribe on Unmount**: Prevent memory leaks with `onUnmounted`

### Audio Performance

- **Lazy Loading**: Sounds loaded on first play
- **Pooling**: Reuse Howl instances for repeated sounds
- **Throttling**: Prevent rapid-fire sound effects from overlapping
- **Web Audio API**: Hardware-accelerated audio processing

---

## Testing Strategy

### Unit Testing

**Composables**:
- Test `useTetris` game logic in isolation
- Mock event bus for achievement tests
- Test achievement condition evaluation
- Verify progressive unlocking logic

**Example**:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { useAchievements } from '@/composables/useAchievements'

describe('useAchievements', () => {
  it('unlocks achievement when condition met', () => {
    const { checkAchievements, isUnlocked } = useAchievements()

    checkAchievements({ lines: 1 })

    expect(isUnlocked('first_line')).toBe(true)
  })

  it('requires prerequisite for progressive achievements', () => {
    const { checkAchievements, isUnlocked } = useAchievements()

    // Try to unlock level_3 without level_2
    checkAchievements({ level: 3 })
    expect(isUnlocked('level_3')).toBe(false)

    // Unlock level_2 first
    checkAchievements({ level: 2 })
    expect(isUnlocked('level_2')).toBe(true)

    // Now level_3 can unlock
    checkAchievements({ level: 3 })
    expect(isUnlocked('level_3')).toBe(true)
  })
})
```

### Integration Testing

**Event Flow**:
- Test event emission from `useTetris`
- Verify achievement unlocking via events
- Test notification queue management
- Validate localStorage persistence

### E2E Testing (Playwright)

**User Journeys**:
- Play game and clear lines
- Verify achievement unlocks
- Test achievement persistence across sessions
- Validate mobile controls
- Test audio playback

---

## Future Enhancements

### Planned Features

1. **Multiplayer** - WebSocket-based real-time multiplayer
2. **Leaderboards** - Global high scores with backend API
3. **Daily Challenges** - Time-limited challenges with special achievements
4. **Customization** - Themes, board sizes, custom controls
5. **Analytics** - Player behavior tracking (privacy-preserving)

### Architecture Improvements

1. **State Machine** - Formalize game states (menu, playing, paused, game over)
2. **Command Pattern** - Undo/redo for piece movements
3. **Web Workers** - Offload achievement checking to background thread
4. **IndexedDB** - Richer persistence for replays and statistics
5. **Service Worker** - Offline gameplay and PWA features

---

## Troubleshooting

### Common Issues

**Achievements Not Unlocking**:
- Check browser console for event bus logs
- Verify `setupEventSubscriptions()` is called
- Ensure `useTetris` is emitting events correctly
- Check for prerequisite achievements

**Audio Not Playing on Mobile**:
- Touch event must occur before audio playback (iOS restriction)
- Check `Howler.ctx.state` for "suspended" state
- Call `unlockAudio()` on first user interaction

**localStorage Quota Exceeded**:
- Clear old achievement data: `localStorage.removeItem('tetris_achievements')`
- Check for corrupted JSON in storage
- Verify `saveAchievements()` atomic rollback

---

## Code Style and Conventions

### TypeScript

- Strict mode enabled
- Explicit return types for public functions
- Prefer interfaces over type aliases for object shapes
- Use `readonly` for immutable arrays/objects

### Vue

- Composition API with `<script setup>`
- Reactive refs with explicit typing
- Computed properties for derived state
- `onMounted`/`onUnmounted` for lifecycle management

### Naming Conventions

- **Composables**: `use*` prefix (e.g., `useTetris`)
- **Components**: PascalCase (e.g., `GameBoard.vue`)
- **Events**: namespace:action format (e.g., `game:started`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_PENDING_NOTIFICATIONS`)

### File Organization

```
src/
├── assets/          # Images, fonts, global CSS
├── components/      # Vue components
├── composables/     # Composition API logic
├── data/            # Static data (achievements.ts)
├── types/           # TypeScript type definitions
└── App.vue          # Root component
```

---

## References

- **Vue 3 Documentation**: https://vuejs.org/guide/introduction.html
- **mitt Event Bus**: https://github.com/developit/mitt
- **Howler.js Audio**: https://howlerjs.com/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

---

**Last Updated**: December 16, 2024
