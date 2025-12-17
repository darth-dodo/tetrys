# Event System Documentation

## Overview

The Tetrys event system implements a decoupled, event-driven architecture using the [mitt](https://github.com/developit/mitt) event emitter library (~200 bytes gzipped). This architecture enables loosely coupled communication between game systems, allowing features like achievements, audio, and analytics to respond to gameplay events without direct dependencies.

### Key Benefits

- **Decoupled Components**: Game logic (`useTetris`) doesn't need to know about achievements, audio, or other subscribers
- **Scalable Architecture**: New features can subscribe to existing events without modifying game core
- **Type Safety**: Full TypeScript support with strongly-typed event payloads
- **Minimal Overhead**: Tiny library footprint with zero dependencies
- **Testable**: Easy to test event-driven interactions in isolation
- **Development Experience**: Automatic event logging in development mode

## Architecture

### Event Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                      Game Bus (mitt)                         │
│                    Singleton Event Hub                       │
└──────────────────────────────────────────────────────────────┘
                          ▲         │
                          │         │
           emit events    │         │  subscribe to events
                          │         ▼
        ┌─────────────────┴─┐   ┌──┴──────────────────┐
        │   useTetris       │   │  useAchievements    │
        │   (Game Core)     │   │  (Achievement Sys)  │
        │                   │   │                     │
        │  - Score updates  │   │  - Track progress   │
        │  - Line clears    │   │  - Unlock badges    │
        │  - Level ups      │   │  - Queue notifs     │
        │  - Game lifecycle │   │                     │
        └───────────────────┘   └─────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │   UI Components      │
                              │   - Notifications    │
                              │   - Sound effects    │
                              │   - Statistics       │
                              └──────────────────────┘
```

### Component Responsibilities

**Event Bus (`useGameBus`)**
- Provides singleton event emitter instance
- Logs all events in development mode
- Type-safe event emission and subscription

**Event Emitters**
- `useTetris`: Emits gameplay events (score, lines, level, combo)
- `useAchievements`: Emits achievement unlock events

**Event Subscribers**
- `useAchievements`: Listens to gameplay events for achievement tracking
- Audio system (future): Listen for sound effect triggers
- Analytics (future): Track player behavior and statistics
- Tutorial system (future): Respond to gameplay milestones

## Event Types Reference

All event types are defined in `/src/types/events.ts` with full TypeScript interfaces.

### Game Lifecycle Events

#### `game:started`

Emitted when a new game begins.

```typescript
interface GameStartedEvent {
  timestamp: number  // Unix timestamp when game started
}
```

**Example:**
```typescript
const bus = useGameBus()
bus.emit('game:started', { timestamp: Date.now() })
```

**Use Cases:**
- Reset achievement tracking stats
- Start background music
- Initialize game timers
- Log analytics session start

---

#### `game:paused`

Emitted when game is paused or resumed.

```typescript
interface GamePausedEvent {
  isPaused: boolean   // true = paused, false = resumed
  timePlayed: number  // Total time played in milliseconds
}
```

**Example:**
```typescript
bus.emit('game:paused', {
  isPaused: true,
  timePlayed: 45000  // 45 seconds
})
```

**Use Cases:**
- Pause/resume background music
- Show/hide pause menu
- Track pause duration for analytics

---

#### `game:over`

Emitted when game ends (board fills up).

```typescript
interface GameOverEvent {
  score: number        // Final score
  level: number        // Final level reached
  lines: number        // Total lines cleared
  tetrisCount: number  // Number of Tetris (4-line) clears
  timePlayed: number   // Total playtime in milliseconds
}
```

**Example:**
```typescript
bus.emit('game:over', {
  score: 12500,
  level: 8,
  lines: 42,
  tetrisCount: 5,
  timePlayed: 300000  // 5 minutes
})
```

**Use Cases:**
- Check for final achievements
- Display game over screen
- Save high scores
- Track completion statistics

---

#### `game:reset`

Emitted when game is reset to initial state.

```typescript
interface GameResetEvent {
  timestamp: number  // Unix timestamp when reset occurred
}
```

**Example:**
```typescript
bus.emit('game:reset', { timestamp: Date.now() })
```

**Use Cases:**
- Clear temporary state
- Reset UI displays
- Stop all sounds

---

### Gameplay Events

#### `lines:cleared`

Emitted when one or more lines are cleared.

```typescript
interface LinesClearedEvent {
  count: number      // Number of lines cleared (1-4)
  isTetris: boolean  // true if 4 lines cleared at once
  newTotal: number   // Total lines cleared in game
  newLevel: number   // Current level after clear
}
```

**Example:**
```typescript
bus.emit('lines:cleared', {
  count: 4,
  isTetris: true,
  newTotal: 24,
  newLevel: 3
})
```

**Use Cases:**
- Track line clear achievements (5, 15, 40, 50 lines)
- Play line clear sound effects
- Trigger visual effects for Tetris clears
- Update statistics display

---

#### `score:updated`

Emitted when player's score changes.

```typescript
interface ScoreUpdatedEvent {
  score: number  // Total score
  delta: number  // Points earned this update
  level: number  // Current level
}
```

**Example:**
```typescript
bus.emit('score:updated', {
  score: 1700,
  delta: 800,   // Tetris at level 1 = 800 points
  level: 1
})
```

**Use Cases:**
- Track score-based achievements (100, 500, 1000, etc.)
- Animate score counter
- Play score increase sound
- Update leaderboard

---

#### `level:up`

Emitted when player advances to next level.

```typescript
interface LevelUpEvent {
  level: number         // New level
  previousLevel: number // Previous level
}
```

**Example:**
```typescript
bus.emit('level:up', {
  level: 5,
  previousLevel: 4
})
```

**Use Cases:**
- Track level achievements (2, 3, 4, 5, etc.)
- Play level up fanfare
- Show level up notification
- Increase difficulty

---

#### `combo:updated`

Emitted when combo counter changes (consecutive line clears).

```typescript
interface ComboUpdatedEvent {
  combo: number    // Current combo count (0 = broken)
  isReset: boolean // true if combo was broken
}
```

**Example:**
```typescript
// Building combo
bus.emit('combo:updated', { combo: 3, isReset: false })

// Breaking combo
bus.emit('combo:updated', { combo: 0, isReset: true })
```

**Use Cases:**
- Track combo achievements (2, 3, 4, 5 combo)
- Display combo counter UI
- Play combo sound effects
- Visual feedback for combo breaks

---

#### `piece:placed`

Emitted when a tetromino is placed on the board.

```typescript
interface PiecePlacedEvent {
  type: TetrominoType  // 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'
  position: {
    x: number  // Column position
    y: number  // Row position
  }
}
```

**Example:**
```typescript
bus.emit('piece:placed', {
  type: 'T',
  position: { x: 3, y: 18 }
})
```

**Use Cases:**
- Track piece placement patterns
- Calculate board heatmap
- Advanced analytics

---

#### `time:tick`

Emitted every second during active gameplay.

```typescript
interface TimeTickEvent {
  timePlayed: number  // Elapsed time in milliseconds
}
```

**Example:**
```typescript
bus.emit('time:tick', { timePlayed: 60000 })  // 1 minute
```

**Use Cases:**
- Track time-based achievements (2min, 5min, 10min)
- Update game timer display
- Calculate play session duration
- Time-based difficulty scaling

---

### Achievement Events

#### `achievement:unlocked`

Emitted when an achievement is unlocked.

```typescript
interface AchievementUnlockedEvent {
  id: AchievementId  // Unique achievement identifier
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  timestamp: number  // Unix timestamp when unlocked
}
```

**Example:**
```typescript
bus.emit('achievement:unlocked', {
  id: 'first_tetris',
  rarity: 'legendary',
  timestamp: Date.now()
})
```

**Use Cases:**
- Display achievement notification
- Play unlock sound effect
- Track achievement statistics
- Share to social media

---

## Usage Examples

### Emitting Events

Events are emitted by game systems when state changes occur.

```typescript
import { useGameBus } from '@/composables/useGameBus'

const bus = useGameBus()

// Emit line clear event
bus.emit('lines:cleared', {
  count: 4,
  isTetris: true,
  newTotal: 20,
  newLevel: 2
})

// Emit score update
bus.emit('score:updated', {
  score: 800,
  delta: 800,
  level: 1
})

// Emit level up
bus.emit('level:up', {
  level: 2,
  previousLevel: 1
})
```

### Subscribing to Events

Subscribers listen for events and respond accordingly.

```typescript
import { useGameBus } from '@/composables/useGameBus'

const bus = useGameBus()

// Listen for line clears
bus.on('lines:cleared', (data) => {
  console.log(`Cleared ${data.count} lines!`)
  if (data.isTetris) {
    console.log('TETRIS!')
  }
})

// Listen for achievements
bus.on('achievement:unlocked', (data) => {
  showNotification(`Achievement unlocked: ${data.id}`)
  playSound(`unlock_${data.rarity}.mp3`)
})

// Listen for game over
bus.on('game:over', (data) => {
  console.log(`Game Over! Final Score: ${data.score}`)
  saveHighScore(data.score)
})
```

### Multiple Subscribers

Multiple systems can subscribe to the same event independently.

```typescript
const bus = useGameBus()

// Achievement system tracks score
bus.on('score:updated', (data) => {
  checkScoreAchievements(data.score)
})

// UI updates score display
bus.on('score:updated', (data) => {
  updateScoreDisplay(data.score)
})

// Audio plays score sound
bus.on('score:updated', (data) => {
  if (data.delta > 500) {
    playSoundEffect('big_score.mp3')
  }
})

// All three subscribers are called independently when event fires
```

### Unsubscribing from Events

Clean up subscriptions when component unmounts or no longer needs events.

```typescript
import { onUnmounted } from 'vue'

const bus = useGameBus()

// Create handler reference
const handleLevelUp = (data) => {
  console.log(`Level ${data.level}!`)
}

// Subscribe
bus.on('level:up', handleLevelUp)

// Unsubscribe when component unmounts
onUnmounted(() => {
  bus.off('level:up', handleLevelUp)
})
```

### Wildcard Listener

Listen to all events (useful for debugging or logging).

```typescript
const bus = useGameBus()

// Listen to all events
bus.on('*', (type, data) => {
  console.log(`Event: ${type}`, data)
})
```

---

## Development Mode Logging

In development mode, the event bus automatically logs all events to the console for debugging.

### Automatic Logging

```typescript
// src/composables/useGameBus.ts
if (import.meta.env.DEV) {
  gameBus.on('*', (type, event) => {
    console.log(`[GameBus] ${String(type)}`, event)
  })
}
```

### Console Output Example

```
[GameBus] game:started { timestamp: 1703001234567 }
[GameBus] lines:cleared { count: 1, isTetris: false, newTotal: 1, newLevel: 1 }
[GameBus] score:updated { score: 100, delta: 100, level: 1 }
[GameBus] lines:cleared { count: 4, isTetris: true, newTotal: 5, newLevel: 1 }
[GameBus] combo:updated { combo: 2, isReset: false }
[GameBus] achievement:unlocked { id: 'first_tetris', rarity: 'legendary', timestamp: 1703001235000 }
```

This logging is **automatically disabled in production** builds for optimal performance.

---

## Testing with Events

The event system is fully testable using Vitest and mocking.

### Basic Event Test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useGameBus, gameBus } from '@/composables/useGameBus'

describe('Event System', () => {
  beforeEach(() => {
    // Clear all listeners before each test
    gameBus.all.clear()
  })

  it('should emit and receive events', () => {
    const bus = useGameBus()
    const handler = vi.fn()

    // Subscribe
    bus.on('score:updated', handler)

    // Emit
    bus.emit('score:updated', {
      score: 100,
      delta: 100,
      level: 1
    })

    // Assert
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({
      score: 100,
      delta: 100,
      level: 1
    })
  })
})
```

### Testing Event-Driven Features

```typescript
it('should unlock achievement when score threshold reached', () => {
  const bus = useGameBus()
  const achievements = useAchievements()

  // Start game (resets tracking)
  bus.emit('game:started', { timestamp: Date.now() })

  // Update score to threshold
  bus.emit('score:updated', {
    score: 100,
    delta: 100,
    level: 1
  })

  // Check achievement unlocked
  expect(achievements.isUnlocked('score_100')).toBe(true)
})
```

### Testing Multiple Subscribers

```typescript
it('should notify all subscribers independently', () => {
  const bus = useGameBus()
  const handler1 = vi.fn()
  const handler2 = vi.fn()
  const handler3 = vi.fn()

  // Multiple subscribers
  bus.on('lines:cleared', handler1)
  bus.on('lines:cleared', handler2)
  bus.on('lines:cleared', handler3)

  // Emit once
  bus.emit('lines:cleared', {
    count: 4,
    isTetris: true,
    newTotal: 4,
    newLevel: 1
  })

  // All called
  expect(handler1).toHaveBeenCalledTimes(1)
  expect(handler2).toHaveBeenCalledTimes(1)
  expect(handler3).toHaveBeenCalledTimes(1)
})
```

### Testing Cleanup

```typescript
it('should stop receiving events after unsubscribe', () => {
  const bus = useGameBus()
  const handler = vi.fn()

  bus.on('game:started', handler)

  // Emit once
  bus.emit('game:started', { timestamp: 1 })
  expect(handler).toHaveBeenCalledTimes(1)

  // Unsubscribe
  bus.off('game:started', handler)

  // Emit again
  bus.emit('game:started', { timestamp: 2 })
  expect(handler).toHaveBeenCalledTimes(1) // Still 1, not 2
})
```

For comprehensive test examples, see `/src/composables/__tests__/useGameBus.spec.ts`.

---

## Future Extensibility

The event system is designed to support future features without modifying existing code.

### Audio System Integration (Planned)

```typescript
// src/composables/useAudio.ts
import { useGameBus } from './useGameBus'

export function useAudio() {
  const bus = useGameBus()

  // Subscribe to gameplay events
  bus.on('lines:cleared', (data) => {
    if (data.isTetris) {
      playSound('tetris.mp3', { volume: 0.8 })
    } else {
      playSound('line_clear.mp3', { volume: 0.5 })
    }
  })

  bus.on('level:up', () => {
    playSound('level_up.mp3', { volume: 0.7 })
  })

  bus.on('achievement:unlocked', (data) => {
    const soundMap = {
      common: 'unlock_common.mp3',
      rare: 'unlock_rare.mp3',
      epic: 'unlock_epic.mp3',
      legendary: 'unlock_legendary.mp3'
    }
    playSound(soundMap[data.rarity], { volume: 0.9 })
  })

  bus.on('game:over', () => {
    playSound('game_over.mp3', { volume: 0.6 })
  })
}
```

### Analytics Integration (Planned)

```typescript
// src/composables/useAnalytics.ts
import { useGameBus } from './useGameBus'

export function useAnalytics() {
  const bus = useGameBus()

  // Track game sessions
  bus.on('game:started', () => {
    trackEvent('game_started', { timestamp: Date.now() })
  })

  bus.on('game:over', (data) => {
    trackEvent('game_completed', {
      score: data.score,
      level: data.level,
      lines: data.lines,
      duration: data.timePlayed
    })
  })

  // Track achievements
  bus.on('achievement:unlocked', (data) => {
    trackEvent('achievement_unlocked', {
      achievement_id: data.id,
      rarity: data.rarity
    })
  })

  // Track gameplay patterns
  bus.on('combo:updated', (data) => {
    if (data.combo >= 5) {
      trackEvent('high_combo', { combo: data.combo })
    }
  })
}
```

### Tutorial System Integration (Planned)

```typescript
// src/composables/useTutorial.ts
import { ref } from 'vue'
import { useGameBus } from './useGameBus'

export function useTutorial() {
  const bus = useGameBus()
  const currentStep = ref(0)
  const isComplete = ref(false)

  const tutorialSteps = [
    { event: 'game:started', message: 'Game started! Use arrow keys to move pieces.' },
    { event: 'lines:cleared', message: 'Great! You cleared a line!' },
    { event: 'combo:updated', message: 'Combo! Clear consecutive lines for more points!' },
    { event: 'level:up', message: 'Level up! Game speed increases each level.' }
  ]

  // Progress tutorial based on events
  bus.on('*', (type) => {
    if (!isComplete.value && currentStep.value < tutorialSteps.length) {
      const step = tutorialSteps[currentStep.value]
      if (type === step.event) {
        showTutorialMessage(step.message)
        currentStep.value++
        if (currentStep.value >= tutorialSteps.length) {
          isComplete.value = true
          trackEvent('tutorial_completed')
        }
      }
    }
  })

  return { currentStep, isComplete }
}
```

### Social Sharing Integration (Planned)

```typescript
// src/composables/useSocialShare.ts
import { useGameBus } from './useGameBus'

export function useSocialShare() {
  const bus = useGameBus()

  // Share high scores
  bus.on('game:over', (data) => {
    if (isNewHighScore(data.score)) {
      promptShare({
        title: 'New High Score in Tetrys!',
        text: `I just scored ${data.score} points!`,
        url: window.location.href
      })
    }
  })

  // Share rare achievements
  bus.on('achievement:unlocked', (data) => {
    if (data.rarity === 'legendary' || data.rarity === 'epic') {
      promptShare({
        title: `${data.rarity.toUpperCase()} Achievement Unlocked!`,
        text: `I unlocked the ${data.id} achievement in Tetrys!`,
        url: window.location.href
      })
    }
  })
}
```

---

## Best Practices

### Event Naming Convention

- Use lowercase with colons: `game:started`, `score:updated`
- Format: `category:action`
- Be specific and descriptive
- Use past tense for completed actions: `cleared`, `updated`, `unlocked`

### Event Payload Design

- Keep payloads minimal but complete
- Include all necessary context
- Use TypeScript interfaces for type safety
- Avoid circular references
- Don't include DOM elements or functions

### Performance Considerations

- Event bus is synchronous - handlers execute immediately
- Keep event handlers lightweight and fast
- For heavy operations, use `setTimeout` or `requestAnimationFrame`
- Unsubscribe when components unmount to prevent memory leaks
- Limit wildcard listeners (`*`) to development/debugging

### Testing Recommendations

- Always clear event listeners in `beforeEach`/`afterEach`
- Use mock functions (`vi.fn()`) to verify event emissions
- Test both successful emissions and edge cases
- Verify event payloads match TypeScript interfaces
- Test cleanup and unsubscribe behavior

---

## Implementation Details

### Singleton Pattern

The event bus uses a singleton pattern to ensure all components share the same event instance:

```typescript
// src/composables/useGameBus.ts
import mitt from 'mitt'
import type { GameBusEvents } from '@/types/events'

// Create singleton event bus
const gameBus = mitt<GameBusEvents>()

export function useGameBus() {
  return gameBus
}

// Export for testing
export { gameBus }
```

### Type Safety

All events are strongly typed using TypeScript:

```typescript
// src/types/events.ts
export interface GameBusEvents {
  'game:started': { timestamp: number }
  'lines:cleared': { count: number; isTetris: boolean; ... }
  'score:updated': { score: number; delta: number; level: number }
  // ... all event types
}

// Type-safe event emission
const bus = useGameBus()
bus.emit('score:updated', {
  score: 100,
  delta: 100,
  level: 1
}) // ✓ TypeScript validates payload structure

bus.emit('score:updated', {
  score: '100'  // ✗ TypeScript error: string not assignable to number
})
```

### Achievement System Integration

The achievement system demonstrates event-driven architecture:

```typescript
// src/composables/useAchievements.ts
const setupEventSubscriptions = () => {
  const bus = useGameBus()

  // Reset stats when game starts
  bus.on('game:started', () => {
    eventDrivenStats = { score: 0, level: 1, lines: 0, ... }
  })

  // Track lines cleared
  bus.on('lines:cleared', (data) => {
    eventDrivenStats.lines += data.count
    if (data.isTetris) {
      eventDrivenStats.tetrisCount++
    }
    checkAchievements()
  })

  // Track score updates
  bus.on('score:updated', (data) => {
    eventDrivenStats.score = data.score
    checkAchievements()
  })

  // Track combo updates
  bus.on('combo:updated', (data) => {
    eventDrivenStats.combo = data.combo
    checkAchievements()
  })
}
```

---

## Related Documentation

- **Type Definitions**: `/src/types/events.ts` - Full event type interfaces
- **Event Bus Implementation**: `/src/composables/useGameBus.ts` - Bus setup and dev logging
- **Game Emitter**: `/src/composables/useTetris.ts` - Gameplay event emissions
- **Achievement Subscriber**: `/src/composables/useAchievements.ts` - Event-driven achievement tracking
- **Test Suite**: `/src/composables/__tests__/useGameBus.spec.ts` - Comprehensive event system tests
- **mitt Documentation**: [https://github.com/developit/mitt](https://github.com/developit/mitt)

---

## Summary

The event system provides a robust, type-safe, and extensible foundation for decoupled game features. By using events, new systems can be added without modifying existing code, making the architecture scalable and maintainable.

**Key Takeaways:**
- Use `useGameBus()` to get the singleton event bus
- Emit events when state changes occur
- Subscribe to events to respond to changes
- Always unsubscribe when components unmount
- All events are strongly typed with TypeScript
- Development mode provides automatic event logging
- Future features integrate seamlessly through event subscription
