# 🎮 Event-Driven Game State Architecture

Tetrys uses an event-driven architecture to decouple game state management from gameplay systems. This enables reactive features like achievements, analytics, and future extensibility without tightly coupling components.

## Table of Contents

1. [Event-Driven Architecture Overview](#event-driven-architecture-overview)
2. [The Event Bus: useGameBus](#the-event-bus-usegamebus)
3. [useTetris as Event Publisher](#usetetris-as-event-publisher)
4. [Event Flow Patterns](#event-flow-patterns)
5. [GameState Interface](#gamestate-interface)
6. [Integration with Other Systems](#integration-with-other-systems)
7. [Testing with Events](#testing-with-events)
8. [Best Practices](#best-practices)

---

## Event-Driven Architecture Overview

### Why Events Over Direct Coupling?

**Problem**: Traditional approach creates tight coupling between systems:

```typescript
// ❌ Tightly Coupled Approach
function clearLines() {
  const linesCleared = calculateLines()

  // Game logic directly calls achievement system
  achievementSystem.checkForLineAchievements(linesCleared)

  // Game logic directly calls analytics
  analyticsSystem.trackLineClear(linesCleared)

  // Adding new features requires modifying game logic
  tutorialSystem.updateProgress(linesCleared)
}
```

**Solution**: Event-driven architecture decouples publishers from subscribers:

```typescript
// ✅ Event-Driven Approach
function clearLines() {
  const linesCleared = calculateLines()

  // Game logic publishes event - doesn't know who listens
  bus.emit('lines:cleared', {
    count: linesCleared,
    isTetris: linesCleared === 4,
    newTotal: gameState.lines,
    newLevel: gameState.level
  })
}

// Systems subscribe independently
bus.on('lines:cleared', handleAchievements)
bus.on('lines:cleared', handleAnalytics)
bus.on('lines:cleared', handleTutorial)
```

### Benefits of Event-Driven Architecture

1. **Loose Coupling**: Publishers don't know about subscribers
2. **Extensibility**: Add new features without modifying game logic
3. **Testability**: Mock event bus or emit events directly in tests
4. **Maintainability**: Clear separation of concerns
5. **Reusability**: Same events can trigger multiple independent systems

### Publisher/Subscriber Pattern

```
┌─────────────────┐
│   useTetris     │  Publisher
│  (Game Logic)   │  - Manages state
└────────┬────────┘  - Emits events
         │
         │ emit('lines:cleared', {...})
         ▼
┌─────────────────┐
│   Event Bus     │  Central Hub
│  (useGameBus)   │  - Routes events
└────────┬────────┘  - No business logic
         │
         ├──────────────┬──────────────┬──────────────┐
         ▼              ▼              ▼              ▼
┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
│Achievements│  │ Analytics  │  │  Tutorial  │  │  Component │
│  System    │  │  System    │  │  System    │  │    UI      │
└────────────┘  └────────────┘  └────────────┘  └────────────┘
  Subscribers - Listen to specific events
```

---

## The Event Bus: useGameBus

### Singleton Event Bus with Mitt

The event bus is implemented as a **singleton** using the [mitt](https://github.com/developit/mitt) library, ensuring all systems communicate through the same event hub.

```typescript
// src/composables/useGameBus.ts
import mitt from 'mitt'
import type { GameBusEvents } from '@/types/events'

// Create singleton event bus
const gameBus = mitt<GameBusEvents>()

// Development mode: log all events
if (import.meta.env.DEV) {
  gameBus.on('*', (type, event) => {
    console.log(`[GameBus] ${String(type)}`, event)
  })
}

export function useGameBus() {
  return gameBus
}

// Export bus instance for testing
export { gameBus }
```

### Key Design Decisions

**Singleton Pattern**: Ensures single source of truth for all event communication.

```typescript
// ✅ Same instance everywhere
const busInTetris = useGameBus()
const busInAchievements = useGameBus()
busInTetris === busInAchievements // true
```

**Type-Safe Events**: All events are strongly typed via `GameBusEvents` interface.

```typescript
// TypeScript ensures event names and payloads match
bus.emit('lines:cleared', {
  count: 4,
  isTetris: true,
  newTotal: 40,
  newLevel: 5
}) // ✅ Type-safe

bus.emit('lines:cleared', { count: 4 }) // ❌ TypeScript error: missing required fields
bus.emit('invalid:event', {}) // ❌ TypeScript error: event doesn't exist
```

**Development Logging**: Wildcard listener (`*`) logs all events in dev mode for debugging.

```
[GameBus] game:started { timestamp: 1702345678 }
[GameBus] lines:cleared { count: 4, isTetris: true, newTotal: 40, newLevel: 5 }
[GameBus] score:updated { score: 800, delta: 800, level: 5 }
```

### Event Bus API

```typescript
const bus = useGameBus()

// Subscribe to event
bus.on('game:started', (payload) => {
  console.log('Game started at:', payload.timestamp)
})

// Subscribe to all events (wildcard)
bus.on('*', (type, payload) => {
  console.log(`Event: ${type}`, payload)
})

// Emit event
bus.emit('game:started', { timestamp: Date.now() })

// Unsubscribe from event
const handler = (payload) => console.log(payload)
bus.on('game:started', handler)
bus.off('game:started', handler)

// Clear all listeners for event
bus.off('game:started')

// Clear all listeners (all events)
bus.all.clear()
```

---

## useTetris as Event Publisher

The `useTetris` composable is the **primary event publisher** in Tetrys. It manages game state and emits events when significant game actions occur.

### Game Lifecycle Events

#### game:started

Emitted when a new game begins.

```typescript
const startGame = (): void => {
  // Reset game state
  gameState.value = {
    board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
    currentPiece: null,
    score: 0,
    level: 1,
    lines: 0,
    tetrisCount: 0,
    combo: 0,
    timePlayed: 0,
    isGameOver: false,
    isPaused: false,
    isPlaying: true,
    speedMultiplier: 1
  }

  startTimeTracking()
  spawnNewPiece()
  gameLoop = requestAnimationFrame(update)

  // Emit game started event
  bus.emit('game:started', { timestamp: Date.now() })
}
```

**Payload Type**:
```typescript
'game:started': { timestamp: number }
```

**Use Cases**:
- Reset achievement tracking for new game
- Start analytics session
- Initialize tutorial state
- Reset UI elements

---

#### game:paused

Emitted when game is paused or resumed.

```typescript
const pauseGame = (): void => {
  gameState.value.isPaused = !gameState.value.isPaused

  if (gameState.value.isPaused) {
    // Pause: stop game loop and record pause time
    pauseStartTime = Date.now()
    if (gameLoop) {
      cancelAnimationFrame(gameLoop)
      gameLoop = null
    }
  } else {
    // Resume: accumulate pause duration and restart loop
    if (pauseStartTime > 0) {
      pausedTime += Date.now() - pauseStartTime
      pauseStartTime = 0
    }
    updateTimePlayed()
    gameLoop = requestAnimationFrame(update)
  }

  // Emit pause event
  bus.emit('game:paused', {
    isPaused: gameState.value.isPaused,
    timePlayed: gameState.value.timePlayed
  })
}
```

**Payload Type**:
```typescript
'game:paused': {
  isPaused: boolean    // true = paused, false = resumed
  timePlayed: number   // Total seconds played (excluding pause time)
}
```

**Use Cases**:
- Pause achievement progression
- Track pause analytics
- Show/hide pause menu
- Stop sound effects

---

#### game:over

Emitted when the game ends (board overflow).

```typescript
const spawnNewPiece = (): void => {
  // ... piece spawning logic ...

  // Check if game is over (no space for new piece)
  if (!isValidPosition(gameState.value.board, gameState.value.currentPiece, gameState.value.currentPosition)) {
    gameState.value.isGameOver = true
    gameState.value.isPlaying = false
    stopTimeTracking()

    // Emit game over event with final stats
    bus.emit('game:over', {
      score: gameState.value.score,
      level: gameState.value.level,
      lines: gameState.value.lines,
      tetrisCount: gameState.value.tetrisCount,
      timePlayed: gameState.value.timePlayed
    })
  }
}
```

**Payload Type**:
```typescript
'game:over': {
  score: number         // Final score
  level: number         // Final level reached
  lines: number         // Total lines cleared
  tetrisCount: number   // Number of 4-line clears
  timePlayed: number    // Total seconds played
}
```

**Use Cases**:
- Final achievement check (e.g., "Reach Level 10")
- Save high scores
- Analytics session end
- Show game over screen with stats

---

#### game:reset

Emitted when game is reset (currently not emitted in production code, reserved for future use).

**Payload Type**:
```typescript
'game:reset': { timestamp: number }
```

---

### Gameplay Events

#### lines:cleared

Emitted when one or more lines are cleared.

```typescript
const update = (currentTime: number): void => {
  // ... piece movement logic ...

  if (!movePiece(0, 1)) {
    // Piece landed
    gameState.value.board = placePiece(
      gameState.value.board,
      gameState.value.currentPiece,
      gameState.value.currentPosition
    )

    // Clear completed lines
    const { board: newBoard, linesCleared } = clearLines(gameState.value.board)
    gameState.value.board = newBoard

    if (linesCleared > 0) {
      const previousLevel = gameState.value.level
      gameState.value.lines += linesCleared
      gameState.value.score += calculateScore(linesCleared, gameState.value.level)
      gameState.value.level = Math.floor(gameState.value.lines / 10) + 1

      // Track tetris (4 lines at once)
      if (linesCleared === 4) {
        gameState.value.tetrisCount++
      }

      // Track combo
      gameState.value.combo++

      // Emit line clear events
      bus.emit('lines:cleared', {
        count: linesCleared,
        isTetris: linesCleared === 4,
        newTotal: gameState.value.lines,
        newLevel: gameState.value.level
      })

      // ... emit other related events ...
    }
  }
}
```

**Payload Type**:
```typescript
'lines:cleared': {
  count: number        // Number of lines cleared (1-4)
  isTetris: boolean   // true if 4 lines cleared at once
  newTotal: number    // Updated total lines cleared
  newLevel: number    // Updated level (calculated from total lines)
}
```

**Use Cases**:
- Unlock line-clearing achievements
- Play clear animation/sound
- Update statistics panel
- Track Tetris count for special achievements

---

#### score:updated

Emitted when score changes.

```typescript
if (linesCleared > 0) {
  gameState.value.score += calculateScore(linesCleared, gameState.value.level)

  bus.emit('score:updated', {
    score: gameState.value.score,
    delta: calculateScore(linesCleared, gameState.value.level),
    level: gameState.value.level
  })
}
```

**Payload Type**:
```typescript
'score:updated': {
  score: number   // New total score
  delta: number   // Points added this update
  level: number   // Current level (affects scoring)
}
```

**Scoring Algorithm**:
```typescript
const calculateScore = (linesCleared: number, level: number): number => {
  const baseScores = [0, 100, 300, 500, 800]
  return baseScores[linesCleared] * level
}
```

| Lines Cleared | Base Score | Level 1 | Level 5 | Level 10 |
|---------------|------------|---------|---------|----------|
| 1             | 100        | 100     | 500     | 1000     |
| 2             | 300        | 300     | 1500    | 3000     |
| 3             | 500        | 500     | 2500    | 5000     |
| 4 (Tetris)    | 800        | 800     | 4000    | 8000     |

**Use Cases**:
- Unlock score-based achievements
- Animate score counter
- Update leaderboard
- Track score progression analytics

---

#### level:up

Emitted when player advances to a new level.

```typescript
if (linesCleared > 0) {
  const previousLevel = gameState.value.level
  gameState.value.level = Math.floor(gameState.value.lines / 10) + 1

  if (gameState.value.level > previousLevel) {
    bus.emit('level:up', {
      level: gameState.value.level,
      previousLevel
    })
  }
}
```

**Payload Type**:
```typescript
'level:up': {
  level: number           // New level reached
  previousLevel: number   // Previous level
}
```

**Level Progression**:
- Every 10 lines cleared = +1 level
- Level 1: Lines 0-9
- Level 2: Lines 10-19
- Level N: Lines (N-1)*10 to N*10-1

**Use Cases**:
- Unlock level achievements
- Play level-up animation/sound
- Increase game speed
- Show difficulty increase notification

---

#### combo:updated

Emitted when combo counter changes (consecutive line clears).

```typescript
if (linesCleared > 0) {
  // Increment combo on line clear
  gameState.value.combo++

  bus.emit('combo:updated', {
    combo: gameState.value.combo,
    isReset: false
  })
} else {
  // Reset combo when piece lands without clearing lines
  gameState.value.combo = 0

  bus.emit('combo:updated', {
    combo: 0,
    isReset: true
  })
}
```

**Payload Type**:
```typescript
'combo:updated': {
  combo: number      // Current combo count
  isReset: boolean   // true if combo was broken
}
```

**Combo Mechanics**:
- **Increment**: Every time lines are cleared
- **Reset**: When a piece lands without clearing lines
- **Maximum**: Theoretically unlimited (highest achievement: 10x combo)

**Use Cases**:
- Unlock combo achievements (2x, 3x, 4x, 5x, 10x)
- Display combo multiplier UI
- Play combo sound effects
- Track player consistency

---

#### piece:placed

Emitted when a piece is placed on the board.

**Payload Type**:
```typescript
'piece:placed': {
  type: TetrominoType            // 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
  position: { x: number; y: number }
}
```

**Note**: Currently defined in event types but not emitted in production code. Reserved for future features like piece placement analytics.

---

#### time:tick

Emitted every second during active gameplay.

```typescript
const updateTimePlayed = (): void => {
  if (gameState.value.isPlaying && !gameState.value.isPaused) {
    // Calculate elapsed time excluding pause duration
    const elapsedTime = Math.floor((Date.now() - gameStartTime - pausedTime) / 1000)
    gameState.value.timePlayed = elapsedTime

    // Emit time tick event
    bus.emit('time:tick', { timePlayed: gameState.value.timePlayed })
  }
}

// Called every 1000ms when game is active
timeTrackingInterval = window.setInterval(() => {
  updateTimePlayed()
}, 1000)
```

**Payload Type**:
```typescript
'time:tick': { timePlayed: number }  // Total seconds played (excluding pauses)
```

**Use Cases**:
- Update playtime display
- Check time-based achievements (e.g., "Play for 5 minutes")
- Session analytics
- Track player engagement

---

## Event Flow Patterns

### User Action → State Mutation → Event Emission

Event-driven architecture follows a clear flow: user input triggers state changes, which emit events for subscribers to react to.

```
┌──────────────┐
│ User Input   │  Player presses rotate button
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Game Logic   │  useTetris.rotatePiece()
│ (useTetris)  │  - Validates rotation
└──────┬───────┘  - Mutates gameState.currentPiece
       │
       ▼
┌──────────────┐
│ State Update │  gameState.currentPiece = rotatedPiece
└──────┬───────┘
       │
       ▼ (optional - rotation doesn't emit events)
┌──────────────┐
│ Event Emit   │  bus.emit('piece:rotated', {...})
└──────┬───────┘
       │
       ├──────────────┬──────────────┬──────────────┐
       ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Subscriber  │ │ Subscriber  │ │ Subscriber  │ │ Subscriber  │
│    #1       │ │     #2      │ │     #3      │ │     #4      │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### Example: Line Clear Flow

Complete flow from piece landing to achievement unlock:

```
1. Game Loop (useTetris.update)
   │
   ├─▶ Piece can't move down
   │
   ├─▶ placePiece() → Update board state
   │
   ├─▶ clearLines() → Detect 4 completed lines
   │
   ├─▶ Update State:
   │   • gameState.lines += 4
   │   • gameState.tetrisCount++
   │   • gameState.score += 3200 (800 * level 4)
   │   • gameState.combo++
   │
   ├─▶ Emit Events:
   │   ├─▶ lines:cleared { count: 4, isTetris: true, ... }
   │   ├─▶ score:updated { score: 3200, delta: 3200, level: 4 }
   │   └─▶ combo:updated { combo: 5, isReset: false }
   │
   └─▶ Subscribers React:
       ├─▶ useAchievements
       │   ├─▶ Check tetris achievement (4 lines)
       │   ├─▶ Check combo achievement (5x)
       │   └─▶ Emit achievement:unlocked events
       │
       ├─▶ UI Component
       │   ├─▶ Play sound effect
       │   ├─▶ Show "+3200" score popup
       │   └─▶ Animate combo counter
       │
       └─▶ Analytics (future)
           └─▶ Track line clear event
```

### Multiple Subscribers Example

Single event triggering multiple independent systems:

```typescript
// Publisher: useTetris
bus.emit('game:over', {
  score: 15000,
  level: 8,
  lines: 70,
  tetrisCount: 5,
  timePlayed: 420
})

// Subscriber 1: useAchievements
bus.on('game:over', ({ score, level, lines, tetrisCount }) => {
  checkAchievements({ score, level, lines, tetrisCount })
  // Unlocks: "Score 10K+", "Reach Level 5", "Clear 50 Lines"
})

// Subscriber 2: UI Component
bus.on('game:over', ({ score, level }) => {
  showGameOverScreen({
    finalScore: score,
    finalLevel: level,
    message: 'Great game!'
  })
})

// Subscriber 3: Analytics System (future)
bus.on('game:over', (stats) => {
  analytics.trackGameSession({
    ...stats,
    timestamp: Date.now(),
    sessionId: generateSessionId()
  })
})

// Subscriber 4: Leaderboard System (future)
bus.on('game:over', ({ score }) => {
  if (score > currentHighScore) {
    leaderboard.submitScore(score)
  }
})
```

**Key Insight**: Each subscriber operates **independently**. Adding/removing subscribers doesn't affect game logic or other subscribers.

---

## GameState Interface

The complete game state structure managed by `useTetris`:

```typescript
interface GameState {
  // Board representation (20 rows × 10 columns)
  board: (TetrominoType | null)[][]

  // Active piece state
  currentPiece: TetrominoShape | null      // Currently falling piece
  currentPosition: Position                // { x: number, y: number }
  nextPiece: TetrominoShape | null        // Preview piece for next spawn

  // Scoring and progression
  score: number                           // Current score (0+)
  level: number                           // Current level (1+)
  lines: number                           // Total lines cleared (0+)
  tetrisCount: number                     // Count of 4-line clears (0+)
  combo: number                           // Consecutive line clear streak (0+)
  timePlayed: number                      // Seconds played (excluding pauses)

  // Game control flags
  isGameOver: boolean                     // true when board overflows
  isPaused: boolean                       // true when game is paused
  isPlaying: boolean                      // true when game is active
  speedMultiplier: number                 // Speed adjustment (1.0 = normal)
}
```

### Computed vs Reactive State

**Reactive State** (`ref<GameState>`): Mutable game state that triggers Vue reactivity.

```typescript
const gameState = ref<GameState>({
  board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
  score: 0,
  level: 1,
  // ... other fields
})

// Mutations trigger reactivity
gameState.value.score += 100  // UI updates automatically
```

**Computed State**: Derived values calculated from game state.

```typescript
// Fall speed calculated from level and multiplier
const fallSpeed = computed(() => {
  const baseSpeed = Math.max(
    100,
    INITIAL_FALL_SPEED - (gameState.value.level - 1) * SPEED_INCREASE_PER_LEVEL
  )
  return Math.max(50, Math.floor(baseSpeed / gameState.value.speedMultiplier))
})

// Read-only computed reference
const gameStateComputed = computed(() => gameState.value)
```

### State Access Patterns

**From Components**:
```vue
<script setup lang="ts">
import { useTetris } from '@/composables/useTetris'

const { gameState, movePiece, rotatePiece } = useTetris()
</script>

<template>
  <div>
    <p>Score: {{ gameState.score }}</p>
    <p>Level: {{ gameState.level }}</p>
    <p>Lines: {{ gameState.lines }}</p>
    <button @click="rotatePiece">Rotate</button>
  </div>
</template>
```

**From Event Subscribers**:
```typescript
// Subscribers receive state snapshots via event payloads
bus.on('score:updated', ({ score, level }) => {
  // Use payload data, not direct state access
  console.log(`Score: ${score}, Level: ${level}`)
})
```

**State Immutability in Events**:
Events contain **snapshots** of state at emission time. Subscribers cannot mutate game state.

```typescript
// ❌ Bad: Subscriber tries to mutate game state
bus.on('lines:cleared', ({ count }) => {
  gameState.value.score += 1000  // Direct mutation - violates encapsulation
})

// ✅ Good: Publisher manages state, subscribers react
bus.on('lines:cleared', ({ count, newTotal }) => {
  console.log(`Cleared ${count} lines, total: ${newTotal}`)
  // No state mutation - pure side effects
})
```

---

## Integration with Other Systems

### How useAchievements Subscribes to Game Events

The achievement system demonstrates perfect event-driven integration: it reacts to game events without `useTetris` knowing it exists.

#### Architecture

```
┌──────────────────────────────────────────────────────┐
│                   useTetris                          │
│  Game Logic (Publisher)                              │
│  - Manages game state                                │
│  - Emits events on state changes                     │
│  - No knowledge of achievement system                │
└───────────────────┬──────────────────────────────────┘
                    │
                    │ Events: lines:cleared, score:updated,
                    │         combo:updated, time:tick, etc.
                    ▼
         ┌──────────────────────┐
         │     Event Bus        │
         │   (useGameBus)       │
         └──────────┬───────────┘
                    │
                    │ Subscribe to game events
                    ▼
┌──────────────────────────────────────────────────────┐
│                useAchievements                       │
│  Achievement System (Subscriber)                     │
│  - Subscribes to game events                         │
│  - Tracks internal stats from event payloads         │
│  - Checks achievement conditions                     │
│  - Emits achievement:unlocked events                 │
└──────────────────────────────────────────────────────┘
```

#### Event-Driven Stats Tracking

`useAchievements` maintains **internal stats** updated only by events:

```typescript
// Module-level event tracking state
let eventDrivenStats = {
  score: 0,
  level: 1,
  lines: 0,
  tetrisCount: 0,
  combo: 0,
  timePlayed: 0
}

// Setup event subscriptions for reactive achievement unlocking
const setupEventSubscriptions = () => {
  const bus = useGameBus()

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

  // Track line clears
  bus.on('lines:cleared', (data) => {
    eventDrivenStats.lines += data.count
    if (data.isTetris) {
      eventDrivenStats.tetrisCount++
    }
    checkWithCurrentStats()  // Check for newly unlocked achievements
  })

  // Track score updates
  bus.on('score:updated', (data) => {
    eventDrivenStats.score = data.score
    checkWithCurrentStats()
  })

  // Track combo changes
  bus.on('combo:updated', (data) => {
    eventDrivenStats.combo = data.combo
    checkWithCurrentStats()
  })

  // Track time played
  bus.on('time:tick', (data) => {
    eventDrivenStats.timePlayed = data.timePlayed
    checkWithCurrentStats()
  })
}
```

#### Progressive Achievement Unlocking

When an event updates stats, achievements are checked in a **progressive loop** to enable cascade unlocking:

```typescript
const checkWithCurrentStats = () => {
  const MAX_CHECKS = 25
  let checksPerformed = 0

  // Progressive unlock loop - allows cascade achievements
  while (checksPerformed < MAX_CHECKS) {
    const previousUnlockedCount = unlockedAchievements.value.length

    // Check all achievements with current stats
    checkAchievementsInternal(eventDrivenStats)

    // If no new achievements unlocked, we're done
    if (unlockedAchievements.value.length === previousUnlockedCount) {
      break
    }

    checksPerformed++
  }

  if (checksPerformed >= MAX_CHECKS) {
    console.warn('⚠️ Achievement check limit reached.')
  }
}
```

**Example**: Progressive level achievements unlock in sequence:
1. `lines:cleared` event → lines = 10
2. Check achievements → unlock "Level 2"
3. Re-check achievements → unlock "Level 3" (prerequisite: "Level 2")
4. Re-check achievements → no new unlocks → stop

#### Achievement System Events

After unlocking, `useAchievements` **emits its own events**:

```typescript
const unlockAchievement = (achievementId: AchievementId, gameStats?: GameStats) => {
  if (isUnlocked(achievementId)) return

  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
  if (!achievement) return

  const unlock: UnlockedAchievement = {
    achievementId,
    unlockedAt: new Date(),
    gameStats
  }

  unlockedAchievements.value.push(unlock)
  pendingNotifications.value.push(achievement)

  // Emit achievement unlocked event
  const bus = useGameBus()
  bus.emit('achievement:unlocked', {
    id: achievement.id,
    rarity: achievement.rarity,
    timestamp: unlock.unlockedAt.getTime()
  })

  // Persist to localStorage
  saveAchievements()
}
```

**UI Components** subscribe to `achievement:unlocked` to show notifications:

```typescript
bus.on('achievement:unlocked', ({ id, rarity }) => {
  showAchievementNotification({
    name: achievement.name,
    description: achievement.description,
    rarity
  })
})
```

---

### Component Event Subscriptions

Vue components can subscribe to events for UI updates:

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useGameBus } from '@/composables/useGameBus'

const bus = useGameBus()
const currentCombo = ref(0)
const showComboAnimation = ref(false)

// Event handler
const handleComboUpdate = ({ combo, isReset }) => {
  currentCombo.value = combo

  if (combo >= 3 && !isReset) {
    // Show combo animation for 3+ combos
    showComboAnimation.value = true
    setTimeout(() => {
      showComboAnimation.value = false
    }, 2000)
  }
}

// Subscribe on mount
onMounted(() => {
  bus.on('combo:updated', handleComboUpdate)
})

// Unsubscribe on unmount (prevent memory leaks)
onUnmounted(() => {
  bus.off('combo:updated', handleComboUpdate)
})
</script>

<template>
  <div class="combo-display">
    <p v-if="currentCombo > 1">
      {{ currentCombo }}x Combo!
    </p>
    <div v-if="showComboAnimation" class="combo-animation">
      🔥 ON FIRE! 🔥
    </div>
  </div>
</template>
```

**Best Practice**: Always unsubscribe in `onUnmounted` to prevent memory leaks.

---

### Future Extensibility

Event-driven architecture makes adding new features trivial:

#### Analytics System

```typescript
// src/composables/useAnalytics.ts
export function useAnalytics() {
  const bus = useGameBus()

  bus.on('game:started', () => {
    analytics.trackEvent('game_started', { timestamp: Date.now() })
  })

  bus.on('lines:cleared', ({ count, isTetris }) => {
    analytics.trackEvent('lines_cleared', { count, isTetris })
  })

  bus.on('game:over', (stats) => {
    analytics.trackEvent('game_over', stats)
  })
}
```

#### Tutorial System

```typescript
// src/composables/useTutorial.ts
export function useTutorial() {
  const bus = useGameBus()
  const tutorialStep = ref(0)

  bus.on('game:started', () => {
    if (tutorialStep.value === 0) {
      showTutorial('Welcome! Try rotating pieces with the up arrow.')
    }
  })

  bus.on('lines:cleared', ({ count }) => {
    if (tutorialStep.value === 1 && count > 0) {
      showTutorial('Great! Now try clearing 4 lines at once for a Tetris.')
      tutorialStep.value = 2
    }
  })
}
```

#### Leaderboard System

```typescript
// src/composables/useLeaderboard.ts
export function useLeaderboard() {
  const bus = useGameBus()

  bus.on('game:over', async ({ score, level, lines }) => {
    const isHighScore = score > getLocalHighScore()

    if (isHighScore) {
      await submitScore({ score, level, lines, timestamp: Date.now() })
      showHighScoreNotification()
    }
  })
}
```

**Key Insight**: All these systems integrate **without modifying useTetris**. The game logic remains unchanged.

---

## Testing with Events

Event-driven architecture enables powerful testing patterns.

### Emitting Events Directly in Tests

You can test subscribers by emitting events directly:

```typescript
// tests/composables/useAchievements.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameBus } from '@/composables/useGameBus'
import { useAchievements } from '@/composables/useAchievements'

describe('useAchievements - Event Integration', () => {
  const bus = useGameBus()

  beforeEach(() => {
    const { resetAchievements } = useAchievements()
    resetAchievements()
  })

  it('should unlock achievement when lines:cleared event is emitted', () => {
    const { isUnlocked } = useAchievements()

    // Emit game started event
    bus.emit('game:started', { timestamp: Date.now() })

    // Emit lines cleared event
    bus.emit('lines:cleared', {
      count: 5,
      isTetris: false,
      newTotal: 5,
      newLevel: 1
    })

    // Achievement should be unlocked
    expect(isUnlocked('five_lines')).toBe(true)
  })

  it('should unlock tetris achievement on 4-line clear', () => {
    const { isUnlocked } = useAchievements()

    bus.emit('game:started', { timestamp: Date.now() })

    // Emit tetris event (4 lines)
    bus.emit('lines:cleared', {
      count: 4,
      isTetris: true,
      newTotal: 4,
      newLevel: 1
    })

    expect(isUnlocked('first_tetris')).toBe(true)
  })

  it('should unlock combo achievements progressively', () => {
    const { isUnlocked } = useAchievements()

    bus.emit('game:started', { timestamp: Date.now() })

    // First combo
    bus.emit('combo:updated', { combo: 2, isReset: false })
    expect(isUnlocked('combo_2')).toBe(true)

    // Second combo (requires combo_2)
    bus.emit('combo:updated', { combo: 3, isReset: false })
    expect(isUnlocked('combo_3')).toBe(true)

    // Third combo (requires combo_3)
    bus.emit('combo:updated', { combo: 4, isReset: false })
    expect(isUnlocked('combo_4')).toBe(true)
  })
})
```

### Mocking the Event Bus

For isolated testing, mock the event bus:

```typescript
// tests/mocks/mockEventBus.ts
import type { GameBusEvents } from '@/types/events'

export function createMockEventBus() {
  const listeners = new Map<keyof GameBusEvents, Function[]>()

  return {
    on(event: keyof GameBusEvents, handler: Function) {
      if (!listeners.has(event)) {
        listeners.set(event, [])
      }
      listeners.get(event)!.push(handler)
    },

    off(event: keyof GameBusEvents, handler?: Function) {
      if (!handler) {
        listeners.delete(event)
      } else {
        const handlers = listeners.get(event)
        if (handlers) {
          const index = handlers.indexOf(handler)
          if (index > -1) {
            handlers.splice(index, 1)
          }
        }
      }
    },

    emit(event: keyof GameBusEvents, payload: any) {
      const handlers = listeners.get(event) || []
      handlers.forEach(handler => handler(payload))
    },

    // Test helpers
    getListenerCount(event: keyof GameBusEvents): number {
      return listeners.get(event)?.length || 0
    },

    clearAll() {
      listeners.clear()
    }
  }
}
```

**Usage in Tests**:
```typescript
import { vi } from 'vitest'
import { createMockEventBus } from './mocks/mockEventBus'

vi.mock('@/composables/useGameBus', () => ({
  useGameBus: () => createMockEventBus()
}))
```

### BDD-Style Event Testing

Behavior-driven testing focuses on event flows:

```typescript
describe('Game Over Flow', () => {
  it('GIVEN a running game WHEN board overflows THEN game:over event is emitted with final stats', () => {
    // GIVEN: Running game at level 5 with 45 lines
    const { startGame, gameState } = useTetris()
    startGame()

    // Manually set state for testing
    gameState.value.level = 5
    gameState.value.lines = 45
    gameState.value.score = 10000
    gameState.value.tetrisCount = 3

    // WHEN: Board overflows (simulate by spawning when no space)
    const bus = useGameBus()
    let gameOverPayload: any = null

    bus.on('game:over', (payload) => {
      gameOverPayload = payload
    })

    // Force game over by filling top row
    for (let x = 0; x < 10; x++) {
      gameState.value.board[0][x] = 'I'
    }
    spawnNewPiece()  // This will trigger game over

    // THEN: game:over event emitted with correct stats
    expect(gameOverPayload).toEqual({
      score: 10000,
      level: 5,
      lines: 45,
      tetrisCount: 3,
      timePlayed: expect.any(Number)
    })
  })
})
```

### Testing Event Side Effects

Test that events trigger expected side effects:

```typescript
describe('Sound System Integration', () => {
  it('should play sound when lines:cleared event is emitted', () => {
    const bus = useGameBus()
    const playSoundMock = vi.fn()

    // Setup sound system subscriber
    bus.on('lines:cleared', ({ count, isTetris }) => {
      if (isTetris) {
        playSoundMock('tetris_clear')
      } else {
        playSoundMock('line_clear')
      }
    })

    // Emit single line clear
    bus.emit('lines:cleared', {
      count: 1,
      isTetris: false,
      newTotal: 1,
      newLevel: 1
    })
    expect(playSoundMock).toHaveBeenCalledWith('line_clear')

    // Emit tetris clear
    bus.emit('lines:cleared', {
      count: 4,
      isTetris: true,
      newTotal: 5,
      newLevel: 1
    })
    expect(playSoundMock).toHaveBeenCalledWith('tetris_clear')
  })
})
```

---

## Best Practices

### 1. Event Naming Conventions

Use consistent naming patterns for clarity:

```typescript
// ✅ Good: namespace:action format
'game:started'
'game:paused'
'game:over'
'lines:cleared'
'score:updated'
'achievement:unlocked'

// ❌ Bad: inconsistent naming
'gameStarted'
'pauseGame'
'linesCleared'
```

### 2. Event Payload Design

Include all relevant context in payloads:

```typescript
// ✅ Good: Complete context
bus.emit('lines:cleared', {
  count: 4,              // Number of lines cleared
  isTetris: true,       // Special case flag
  newTotal: 40,         // Updated total for easy access
  newLevel: 5           // Current level for context
})

// ❌ Bad: Missing context
bus.emit('lines:cleared', { count: 4 })
// Subscribers must query game state or calculate values
```

### 3. Avoid Event Chains

Don't emit events in response to other events (creates coupling):

```typescript
// ❌ Bad: Event chain
bus.on('lines:cleared', ({ count }) => {
  bus.emit('score:should:update', { linesCleared: count })
})

bus.on('score:should:update', ({ linesCleared }) => {
  // Update score
})

// ✅ Good: Publisher emits all relevant events
const clearLines = () => {
  // ... clear lines logic ...

  bus.emit('lines:cleared', { count, newTotal, newLevel })
  bus.emit('score:updated', { score, delta, level })
}
```

### 4. Unsubscribe in Component Cleanup

Always remove listeners when components unmount:

```typescript
// ✅ Good: Cleanup listeners
onMounted(() => {
  bus.on('game:over', handleGameOver)
})

onUnmounted(() => {
  bus.off('game:over', handleGameOver)
})

// ❌ Bad: No cleanup (memory leak)
onMounted(() => {
  bus.on('game:over', handleGameOver)
})
```

### 5. Type-Safe Event Handling

Use TypeScript for type safety:

```typescript
// ✅ Good: Type-safe handler
bus.on('lines:cleared', (payload) => {
  // payload is typed as { count: number; isTetris: boolean; ... }
  console.log(payload.count)  // Type-safe
})

// ❌ Bad: Untyped handler
bus.on('lines:cleared', (payload: any) => {
  console.log(payload.cunt)  // Typo not caught
})
```

### 6. Event Documentation

Document events in centralized location (`src/types/events.ts`):

```typescript
export interface GameEvents {
  /**
   * Emitted when a new game starts.
   * Use to reset tracking, initialize systems, or show tutorials.
   */
  'game:started': { timestamp: number }

  /**
   * Emitted when one or more lines are cleared.
   * Includes count, tetris flag, and updated totals.
   */
  'lines:cleared': {
    count: number        // Number of lines cleared (1-4)
    isTetris: boolean   // true if 4 lines cleared at once
    newTotal: number    // Updated total lines cleared
    newLevel: number    // Updated level
  }
}
```

### 7. Development Debugging

Use wildcard listener for development debugging:

```typescript
if (import.meta.env.DEV) {
  bus.on('*', (type, event) => {
    console.log(`[GameBus] ${String(type)}`, event)
  })
}
```

### 8. Performance Considerations

- **Batch Updates**: Emit one event with complete payload instead of multiple events
- **Debounce Frequent Events**: For high-frequency events like `time:tick`, consider debouncing subscribers
- **Lazy Subscription**: Subscribe only when needed, unsubscribe when not

```typescript
// ✅ Good: Batched emission
bus.emit('game:over', {
  score: 10000,
  level: 5,
  lines: 45,
  tetrisCount: 3,
  timePlayed: 420
})

// ❌ Bad: Multiple emissions
bus.emit('game:over:score', { score: 10000 })
bus.emit('game:over:level', { level: 5 })
bus.emit('game:over:lines', { lines: 45 })
```

---

## Summary

Tetrys's event-driven architecture provides:

✅ **Loose Coupling**: Game logic doesn't know about achievement system, analytics, or UI components
✅ **Extensibility**: Add new features (leaderboards, tutorials, analytics) without modifying game logic
✅ **Testability**: Emit events directly in tests, mock event bus for isolation
✅ **Maintainability**: Clear separation of concerns between systems
✅ **Type Safety**: Strong TypeScript typing for all events and payloads

**Core Pattern**:
```
useTetris (Publisher) → Event Bus → Subscribers (useAchievements, Components, etc.)
```

**Key Insight**: Events are the **public API** of the game state. All interactions with game state should flow through events, enabling clean architecture and future extensibility.

For implementation details, see:
- [Event Types Reference](../../src/types/events.ts)
- [Event Bus Implementation](../../src/composables/useGameBus.ts)
- [Publisher Implementation](../../src/composables/useTetris.ts)
- [Subscriber Example](../../src/composables/useAchievements.ts)
