# Composables API Reference

Complete API documentation for all Tetrys Vue 3 composables.

## Table of Contents

- [Overview](#overview)
- [useAchievements](#useachievements)
- [useAudio](#useaudio)
- [useSpeed](#usespeed)
- [useTetris](#usetetris)
- [useTheme](#usetheme)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)
- [TypeScript Integration](#typescript-integration)

---

## Overview

Tetrys uses Vue 3 Composition API composables for state management and game logic. All composables follow consistent patterns:

- **Singleton state**: State is shared across component instances
- **Reactive**: All state uses Vue's reactivity system
- **Auto-persistence**: Settings automatically save to localStorage
- **TypeScript-first**: Full type safety with comprehensive interfaces
- **Side-effect management**: Proper cleanup with lifecycle hooks

### Architecture Principles

Each composable encapsulates a specific domain:

| Composable | Domain | State Scope |
|------------|--------|-------------|
| `useAchievements` | Achievement system | Global, persisted |
| `useAudio` | Sound and music | Global, persisted |
| `useSpeed` | Game speed control | Global, persisted |
| `useTetris` | Core game logic | Per-instance |
| `useTheme` | Visual themes | Global, persisted |

---

## useAchievements

Achievement system with 74+ achievements, notification queue, and progress tracking.

### Import

```typescript
import { useAchievements } from '@/composables/useAchievements'
```

### Type Definitions

```typescript
type AchievementId =
  | 'first_blood'
  | 'tetris_novice'
  | 'tetris_master'
  // ... 70+ more achievements

type AchievementCategory = 'gameplay' | 'scoring' | 'progression' | 'skill'

interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string
  category: AchievementCategory
  condition: {
    type: 'lines' | 'score' | 'level' | 'tetris_count' | 'combo' | 'time_played'
    value: number
    operator: 'gte' | 'lte' | 'eq'
  }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  rewardMessage?: string
}

interface UnlockedAchievement {
  achievementId: AchievementId
  unlockedAt: Date
  gameStats?: {
    score: number
    level: number
    lines: number
  }
}

interface AchievementProgress {
  achievementId: AchievementId
  currentValue: number
  targetValue: number
  percentage: number
}

interface AchievementStats {
  totalAchievements: number
  unlockedCount: number
  percentage: number
  recentUnlocks: UnlockedAchievement[]
}
```

### Properties

#### `unlockedAchievements`

```typescript
const unlockedAchievements: ComputedRef<UnlockedAchievement[]>
```

**Description**: Array of all unlocked achievements with timestamps and game stats.

**Reactive**: Yes (computed)

**Example**:

```typescript
const { unlockedAchievements } = useAchievements()

watchEffect(() => {
  console.log(`Unlocked: ${unlockedAchievements.value.length}`)
})
```

#### `stats`

```typescript
const stats: ComputedRef<AchievementStats>
```

**Description**: Overall achievement statistics including completion percentage.

**Properties**:
- `totalAchievements`: Total number of achievements in the game
- `unlockedCount`: Number of achievements unlocked
- `percentage`: Completion percentage (0-100)
- `recentUnlocks`: Last 5 unlocked achievements

**Example**:

```typescript
const { stats } = useAchievements()

console.log(`Progress: ${stats.value.percentage}%`)
console.log(`${stats.value.unlockedCount}/${stats.value.totalAchievements}`)
```

#### `sessionStats`

```typescript
const sessionStats: ComputedRef<{
  linesCleared: number
  tetrisCount: number
  maxCombo: number
  gamesPlayed: number
  totalLinesCleared: number
  timePlayed: number
}>
```

**Description**: Session statistics used for achievement condition checking.

**Persisted**: Yes (localStorage)

**Example**:

```typescript
const { sessionStats, updateSessionStats } = useAchievements()

updateSessionStats({
  linesCleared: sessionStats.value.linesCleared + 4,
  tetrisCount: sessionStats.value.tetrisCount + 1
})
```

#### `pendingNotifications`

```typescript
const pendingNotifications: ComputedRef<Achievement[]>
```

**Description**: Queue of achievements waiting to be displayed to the user.

**Usage**: Display UI notifications sequentially, not all at once.

**Example**:

```typescript
const { pendingNotifications, getNextNotification } = useAchievements()

if (pendingNotifications.value.length > 0) {
  const achievement = getNextNotification()
  if (achievement) {
    showNotification(achievement)
  }
}
```

#### `getUnlockedAchievements`

```typescript
const getUnlockedAchievements: ComputedRef<Achievement[]>
```

**Description**: Full achievement objects for all unlocked achievements (merged with unlock data).

**Example**:

```typescript
const { getUnlockedAchievements } = useAchievements()

getUnlockedAchievements.value.forEach(achievement => {
  console.log(`${achievement.icon} ${achievement.name}`)
})
```

#### `getLockedAchievements`

```typescript
const getLockedAchievements: ComputedRef<Achievement[]>
```

**Description**: All achievements that haven't been unlocked yet.

**Example**:

```typescript
const { getLockedAchievements } = useAchievements()

const nextAchievement = getLockedAchievements.value[0]
console.log(`Next goal: ${nextAchievement.name}`)
```

### Methods

#### `isUnlocked(achievementId)`

```typescript
function isUnlocked(achievementId: AchievementId): boolean
```

**Description**: Check if a specific achievement is unlocked.

**Parameters**:
- `achievementId` - The ID of the achievement to check

**Returns**: `true` if unlocked, `false` otherwise

**Example**:

```typescript
const { isUnlocked } = useAchievements()

if (isUnlocked('first_blood')) {
  console.log('Player has started a game!')
}
```

#### `unlockAchievement(achievementId, gameStats?)`

```typescript
function unlockAchievement(
  achievementId: AchievementId,
  gameStats?: { score: number; level: number; lines: number }
): void
```

**Description**: Manually unlock an achievement. Automatically adds to pending notifications.

**Parameters**:
- `achievementId` - The achievement to unlock
- `gameStats` (optional) - Game stats at time of unlock

**Side Effects**:
- Adds to `unlockedAchievements`
- Adds to `pendingNotifications` queue
- Saves to localStorage

**Example**:

```typescript
const { unlockAchievement } = useAchievements()

unlockAchievement('first_blood', {
  score: gameState.score,
  level: gameState.level,
  lines: gameState.lines
})
```

#### `checkAchievements(stats)`

```typescript
function checkAchievements(stats: {
  score?: number
  level?: number
  lines?: number
  tetrisCount?: number
  combo?: number
  timePlayed?: number
}): void
```

**Description**: Check all achievements against current game stats. Automatically unlocks any that meet conditions.

**Parameters**:
- `stats` - Object containing current game statistics

**Usage**: Call after game state changes (line clears, level ups, etc.)

**Example**:

```typescript
const { checkAchievements } = useAchievements()

// After clearing lines
checkAchievements({
  score: gameState.score,
  level: gameState.level,
  lines: gameState.lines,
  tetrisCount: totalTetrises,
  combo: currentCombo
})
```

#### `getProgress(achievementId, currentValue)`

```typescript
function getProgress(
  achievementId: AchievementId,
  currentValue: number
): AchievementProgress
```

**Description**: Calculate progress toward a specific achievement.

**Parameters**:
- `achievementId` - The achievement to check
- `currentValue` - Current value of the stat being tracked

**Returns**: Progress object with current value, target, and percentage

**Example**:

```typescript
const { getProgress } = useAchievements()

const progress = getProgress('line_clearer', currentLines)
console.log(`Lines: ${progress.currentValue}/${progress.targetValue} (${progress.percentage}%)`)
```

#### `getNextNotification()`

```typescript
function getNextNotification(): Achievement | null
```

**Description**: Dequeue and return the next pending achievement notification.

**Returns**: Next achievement to display, or `null` if queue is empty

**Side Effects**: Removes the achievement from the pending queue

**Example**:

```typescript
const { getNextNotification } = useAchievements()

const achievement = getNextNotification()
if (achievement) {
  showAchievementPopup(achievement)
}
```

#### `clearNotifications()`

```typescript
function clearNotifications(): void
```

**Description**: Clear all pending notifications without displaying them.

**Example**:

```typescript
const { clearNotifications } = useAchievements()

// Clear on game reset
clearNotifications()
```

#### `updateSessionStats(update)`

```typescript
function updateSessionStats(update: Partial<{
  linesCleared: number
  tetrisCount: number
  maxCombo: number
  gamesPlayed: number
  totalLinesCleared: number
  timePlayed: number
}>): void
```

**Description**: Update session statistics (persists to localStorage).

**Parameters**:
- `update` - Partial object with stats to update

**Example**:

```typescript
const { updateSessionStats } = useAchievements()

updateSessionStats({
  gamesPlayed: sessionStats.value.gamesPlayed + 1,
  timePlayed: sessionStats.value.timePlayed + 300 // seconds
})
```

#### `resetAchievements()`

```typescript
function resetAchievements(): void
```

**Description**: Clear all unlocked achievements and session stats. Used for testing or full reset.

**Warning**: This is destructive and cannot be undone.

**Example**:

```typescript
const { resetAchievements } = useAchievements()

// In settings menu
if (confirm('Reset all achievements?')) {
  resetAchievements()
}
```

#### `triggerDevAchievement(rarity?)` (Development Only)

```typescript
function triggerDevAchievement(
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
): void
```

**Description**: Trigger a placeholder achievement for testing UI. Development tool only.

**Parameters**:
- `rarity` (optional) - Rarity level of the test achievement (default: 'legendary')

**Example**:

```typescript
const { triggerDevAchievement } = useAchievements()

// Test notification UI
triggerDevAchievement('legendary')
triggerDevAchievement('epic')
```

### Complete Usage Example

```vue
<script setup lang="ts">
import { useAchievements } from '@/composables/useAchievements'
import { useTetris } from '@/composables/useTetris'

const {
  stats,
  checkAchievements,
  getNextNotification,
  getProgress
} = useAchievements()

const { gameState } = useTetris()

// Check achievements after game events
watch(() => gameState.value.lines, (newLines) => {
  checkAchievements({
    score: gameState.value.score,
    level: gameState.value.level,
    lines: newLines
  })
})

// Display notifications
const currentNotification = ref<Achievement | null>(null)

const showNextAchievement = () => {
  const achievement = getNextNotification()
  if (achievement) {
    currentNotification.value = achievement
    setTimeout(() => {
      currentNotification.value = null
      showNextAchievement() // Show next in queue
    }, 3000)
  }
}

// Show progress
const lineProgress = computed(() =>
  getProgress('line_clearer', gameState.value.lines)
)
</script>

<template>
  <div>
    <div class="stats">
      Achievement Progress: {{ stats.percentage }}%
      ({{ stats.unlockedCount }}/{{ stats.totalAchievements }})
    </div>

    <div v-if="currentNotification" class="notification">
      {{ currentNotification.icon }} {{ currentNotification.name }}
      <p>{{ currentNotification.description }}</p>
    </div>

    <div class="progress">
      Lines: {{ lineProgress.currentValue }}/{{ lineProgress.targetValue }}
      ({{ lineProgress.percentage }}%)
    </div>
  </div>
</template>
```

---

## useAudio

Web Audio API-based sound system with music scheduler, sound effects, and volume controls.

### Import

```typescript
import { useAudio } from '@/composables/useAudio'
```

### Type Definitions

```typescript
interface AudioSettings {
  musicEnabled: boolean
  soundEnabled: boolean
  musicVolume: number      // 0.0 - 1.0
  soundVolume: number      // 0.0 - 1.0
  currentTrack: string
}

type SoundType = 'move' | 'rotate' | 'drop' | 'line' | 'gameover'

interface TrackInfo {
  id: string
  name: string
  description: string
}
```

### Properties

#### `settings`

```typescript
const settings: ComputedRef<AudioSettings>
```

**Description**: Current audio settings including volume levels and enabled states.

**Reactive**: Yes (computed)

**Persisted**: Yes (localStorage)

**Example**:

```typescript
const { settings } = useAudio()

console.log(`Music: ${settings.value.musicEnabled}`)
console.log(`Volume: ${Math.round(settings.value.musicVolume * 100)}%`)
```

#### `isMusicEnabled`

```typescript
const isMusicEnabled: ComputedRef<boolean>
```

**Description**: Whether background music is enabled.

**Example**:

```typescript
const { isMusicEnabled, toggleMusic } = useAudio()

watchEffect(() => {
  console.log(`Music: ${isMusicEnabled.value ? 'ON' : 'OFF'}`)
})
```

#### `isSoundEnabled`

```typescript
const isSoundEnabled: ComputedRef<boolean>
```

**Description**: Whether sound effects are enabled.

#### `musicVolume`

```typescript
const musicVolume: ComputedRef<number>
```

**Description**: Current music volume (0.0 - 1.0).

#### `soundVolume`

```typescript
const soundVolume: ComputedRef<number>
```

**Description**: Current sound effects volume (0.0 - 1.0).

#### `isMusicPlaying`

```typescript
const isMusicPlaying: ComputedRef<boolean>
```

**Description**: Whether music is currently playing (not just enabled).

**Example**:

```typescript
const { isMusicPlaying, pauseMusic, resumeMusic } = useAudio()

if (isMusicPlaying.value) {
  pauseMusic()
} else {
  resumeMusic()
}
```

#### `currentTrack`

```typescript
const currentTrack: ComputedRef<string>
```

**Description**: ID of the currently selected music track.

**Available Tracks**:
- `'tetris'` - Classic Tetris theme
- `'arcade'` - Fast-paced arcade beat
- `'chill'` - Relaxing ambient theme
- `'retro'` - 8-bit nostalgic sound

### Methods

#### `startMusic()`

```typescript
async function startMusic(): Promise<void>
```

**Description**: Initialize audio context and start playing background music.

**Async**: Yes (requires user interaction for browser autoplay policies)

**Side Effects**:
- Creates Web Audio context if needed
- Starts music scheduler
- Respects `musicEnabled` setting

**Example**:

```typescript
const { startMusic } = useAudio()

// Must be called from user interaction
button.addEventListener('click', async () => {
  await startMusic()
})
```

#### `stopMusic()`

```typescript
function stopMusic(): void
```

**Description**: Stop music playback and reset to beginning.

**Example**:

```typescript
const { stopMusic } = useAudio()

onGameOver(() => {
  stopMusic()
})
```

#### `pauseMusic()`

```typescript
function pauseMusic(): void
```

**Description**: Pause music playback (can be resumed from same position).

**Example**:

```typescript
const { pauseMusic } = useAudio()

onGamePause(() => {
  pauseMusic()
})
```

#### `resumeMusic()`

```typescript
async function resumeMusic(): Promise<void>
```

**Description**: Resume paused music or start if not playing.

**Async**: Yes (audio context initialization)

**Example**:

```typescript
const { resumeMusic } = useAudio()

onGameResume(async () => {
  await resumeMusic()
})
```

#### `toggleMusic()`

```typescript
async function toggleMusic(): Promise<void>
```

**Description**: Toggle music on/off. Automatically starts or stops playback.

**Async**: Yes (audio context operations)

**Side Effects**:
- Updates `musicEnabled` setting
- Saves to localStorage
- Starts/stops playback

**Example**:

```typescript
const { toggleMusic, isMusicEnabled } = useAudio()

<button @click="toggleMusic">
  Music: {{ isMusicEnabled ? 'ON' : 'OFF' }}
</button>
```

#### `toggleSound()`

```typescript
function toggleSound(): void
```

**Description**: Toggle sound effects on/off.

**Side Effects**:
- Updates `soundEnabled` setting
- Saves to localStorage

#### `setMusicVolume(volume)`

```typescript
async function setMusicVolume(volume: number): Promise<void>
```

**Description**: Set music volume level.

**Parameters**:
- `volume` - Volume level (0.0 - 1.0), clamped to valid range

**Async**: Yes (ensures audio context)

**Example**:

```typescript
const { setMusicVolume } = useAudio()

// Volume slider
<input
  type="range"
  min="0"
  max="100"
  :value="musicVolume * 100"
  @input="setMusicVolume($event.target.value / 100)"
>
```

#### `setSoundVolume(volume)`

```typescript
async function setSoundVolume(volume: number): Promise<void>
```

**Description**: Set sound effects volume level.

**Parameters**:
- `volume` - Volume level (0.0 - 1.0), clamped to valid range

#### `playSound(type)`

```typescript
async function playSound(type: SoundType): Promise<void>
```

**Description**: Play a sound effect.

**Parameters**:
- `type` - Type of sound to play

**Sound Types**:
- `'move'` - Piece horizontal movement (220Hz square wave, 0.1s)
- `'rotate'` - Piece rotation (330Hz triangle wave, 0.15s)
- `'drop'` - Hard drop (110Hz sawtooth wave, 0.2s)
- `'line'` - Line clear (chord: 440/550/660Hz, 0.3s)
- `'gameover'` - Game over (descending tones sequence)

**Async**: Yes (ensures audio context)

**Example**:

```typescript
const { playSound } = useAudio()

onPieceMove(() => playSound('move'))
onPieceRotate(() => playSound('rotate'))
onLineClear(() => playSound('line'))
```

#### `setCurrentTrack(trackId)`

```typescript
async function setCurrentTrack(trackId: string): Promise<void>
```

**Description**: Switch to a different music track.

**Parameters**:
- `trackId` - ID of track to play

**Side Effects**:
- Switches track seamlessly if music is playing
- Saves to localStorage

**Example**:

```typescript
const { setCurrentTrack, getAvailableTracks } = useAudio()

const tracks = getAvailableTracks()

<select @change="setCurrentTrack($event.target.value)">
  <option v-for="track in tracks" :value="track.id">
    {{ track.name }}
  </option>
</select>
```

#### `getAvailableTracks()`

```typescript
function getAvailableTracks(): TrackInfo[]
```

**Description**: Get list of all available music tracks.

**Returns**: Array of track metadata objects

**Example**:

```typescript
const { getAvailableTracks } = useAudio()

const tracks = getAvailableTracks()
// [
//   { id: 'tetris', name: 'Classic Tetris', description: '...' },
//   { id: 'arcade', name: 'Arcade Beat', description: '...' },
//   ...
// ]
```

#### `ensureAudioContextRunning()`

```typescript
async function ensureAudioContextRunning(): Promise<boolean>
```

**Description**: Ensure Web Audio context is initialized and running. Used internally.

**Returns**: `true` if context is running, `false` if failed

**Async**: Yes (audio context resume)

**Example**:

```typescript
const { ensureAudioContextRunning } = useAudio()

// Before playing custom audio
if (await ensureAudioContextRunning()) {
  // Safe to use audio context
}
```

### Audio Architecture

The audio system uses Web Audio API with a lookahead scheduler for precise timing:

- **Music Scheduler**: Schedules notes 100ms ahead for glitch-free playback
- **Gain Nodes**: Separate volume controls for music and sound effects
- **Oscillators**: Procedural sound generation (no audio files needed)
- **ADSR Envelope**: Attack-Decay-Sustain-Release for natural sound

### Complete Usage Example

```vue
<script setup lang="ts">
import { useAudio } from '@/composables/useAudio'
import { useTetris } from '@/composables/useTetris'

const {
  isMusicEnabled,
  isSoundEnabled,
  musicVolume,
  soundVolume,
  currentTrack,
  toggleMusic,
  toggleSound,
  setMusicVolume,
  setSoundVolume,
  playSound,
  setCurrentTrack,
  getAvailableTracks,
  startMusic
} = useAudio()

const { gameState } = useTetris()

const tracks = getAvailableTracks()

// Play sounds on game events
watch(() => gameState.value.lines, () => {
  playSound('line')
})

// Start music on first user interaction
onMounted(() => {
  document.addEventListener('click', startMusic, { once: true })
})
</script>

<template>
  <div class="audio-controls">
    <div class="toggle-group">
      <button @click="toggleMusic">
        Music: {{ isMusicEnabled ? '🔊' : '🔇' }}
      </button>
      <button @click="toggleSound">
        Sound: {{ isSoundEnabled ? '🔊' : '🔇' }}
      </button>
    </div>

    <div class="volume-controls">
      <label>
        Music Volume: {{ Math.round(musicVolume * 100) }}%
        <input
          type="range"
          min="0"
          max="100"
          :value="musicVolume * 100"
          @input="setMusicVolume($event.target.value / 100)"
        >
      </label>

      <label>
        Sound Volume: {{ Math.round(soundVolume * 100) }}%
        <input
          type="range"
          min="0"
          max="100"
          :value="soundVolume * 100"
          @input="setSoundVolume($event.target.value / 100)"
        >
      </label>
    </div>

    <div class="track-selector">
      <label>
        Track:
        <select :value="currentTrack" @change="setCurrentTrack($event.target.value)">
          <option v-for="track in tracks" :key="track.id" :value="track.id">
            {{ track.name }} - {{ track.description }}
          </option>
        </select>
      </label>
    </div>
  </div>
</template>
```

---

## useSpeed

Game speed multiplier management with persistence.

### Import

```typescript
import { useSpeed } from '@/composables/useSpeed'
```

### Properties

#### `speedMultiplier`

```typescript
const speedMultiplier: ComputedRef<number>
```

**Description**: Current speed multiplier (0.5x - 3.0x).

**Default**: 1.0 (normal speed)

**Range**: 0.5 (slow) to 3.0 (fast)

**Persisted**: Yes (localStorage)

**Reactive**: Yes (computed)

**Example**:

```typescript
const { speedMultiplier } = useSpeed()

console.log(`Speed: ${speedMultiplier.value}x`)
```

### Methods

#### `setSpeed(speed)`

```typescript
function setSpeed(speed: number): void
```

**Description**: Set game speed multiplier.

**Parameters**:
- `speed` - Speed multiplier (automatically clamped to 0.5 - 3.0)

**Side Effects**:
- Clamps value to valid range
- Saves to localStorage
- Updates reactive state

**Example**:

```typescript
const { setSpeed } = useSpeed()

// Preset speeds
const setNormalSpeed = () => setSpeed(1.0)
const setFastSpeed = () => setSpeed(2.0)
const setSuperFastSpeed = () => setSpeed(3.0)

// Custom slider
<input
  type="range"
  min="0.5"
  max="3"
  step="0.1"
  @input="setSpeed(parseFloat($event.target.value))"
>
```

#### `loadSpeed()`

```typescript
function loadSpeed(): void
```

**Description**: Load speed setting from localStorage. Called automatically on mount.

**Manual Use**: Useful for resetting to saved value after temporary changes.

**Example**:

```typescript
const { loadSpeed, setSpeed } = useSpeed()

// Temporary speed boost
const boostSpeed = () => {
  setSpeed(3.0)
  setTimeout(() => {
    loadSpeed() // Restore saved speed
  }, 5000)
}
```

### Integration with Game Logic

The speed multiplier affects fall speed calculation in `useTetris`:

```typescript
const fallSpeed = computed(() => {
  const baseSpeed = Math.max(100, INITIAL_FALL_SPEED - (level - 1) * SPEED_INCREASE_PER_LEVEL)
  return Math.max(50, Math.floor(baseSpeed / speedMultiplier.value))
})
```

Higher multiplier = faster fall speed = more challenging gameplay.

### Complete Usage Example

```vue
<script setup lang="ts">
import { useSpeed } from '@/composables/useSpeed'
import { useTetris } from '@/composables/useTetris'

const { speedMultiplier, setSpeed } = useSpeed()
const { gameState, setSpeedMultiplier } = useTetris()

// Sync speed with game
watch(speedMultiplier, (newSpeed) => {
  setSpeedMultiplier(newSpeed)
})

const speedPresets = [
  { label: 'Slow', value: 0.5 },
  { label: 'Normal', value: 1.0 },
  { label: 'Fast', value: 1.5 },
  { label: 'Turbo', value: 2.0 },
  { label: 'Insane', value: 3.0 }
]
</script>

<template>
  <div class="speed-control">
    <h3>Game Speed: {{ speedMultiplier }}x</h3>

    <div class="presets">
      <button
        v-for="preset in speedPresets"
        :key="preset.value"
        @click="setSpeed(preset.value)"
        :class="{ active: speedMultiplier === preset.value }"
      >
        {{ preset.label }}
      </button>
    </div>

    <input
      type="range"
      min="0.5"
      max="3"
      step="0.1"
      :value="speedMultiplier"
      @input="setSpeed(parseFloat($event.target.value))"
    >
  </div>
</template>
```

---

## useTetris

Core Tetris game logic including board management, piece movement, collision detection, and scoring.

### Import

```typescript
import { useTetris } from '@/composables/useTetris'
```

### Type Definitions

```typescript
type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L'

interface Position {
  x: number
  y: number
}

interface TetrominoShape {
  shape: number[][]
  type: TetrominoType
}

interface GameState {
  board: (TetrominoType | null)[][]  // 20x10 grid
  currentPiece: TetrominoShape | null
  currentPosition: Position
  nextPiece: TetrominoShape | null
  score: number
  level: number
  lines: number
  isGameOver: boolean
  isPaused: boolean
  isPlaying: boolean
  speedMultiplier: number
}
```

### Constants

```typescript
const BOARD_WIDTH = 10
const BOARD_HEIGHT = 20
const INITIAL_FALL_SPEED = 800      // ms
const SPEED_INCREASE_PER_LEVEL = 50 // ms per level
```

### Properties

#### `gameState`

```typescript
const gameState: ComputedRef<GameState>
```

**Description**: Complete game state including board, current piece, score, etc.

**Reactive**: Yes (computed)

**Example**:

```typescript
const { gameState } = useTetris()

watchEffect(() => {
  console.log(`Score: ${gameState.value.score}`)
  console.log(`Level: ${gameState.value.level}`)
  console.log(`Lines: ${gameState.value.lines}`)
})
```

**Board Structure**:
- 20 rows × 10 columns
- `null` for empty cells
- `TetrominoType` for filled cells

### Methods

#### `movePiece(dx, dy)`

```typescript
function movePiece(dx: number, dy: number): boolean
```

**Description**: Move current piece by delta x and y.

**Parameters**:
- `dx` - Horizontal movement (-1 left, +1 right, 0 none)
- `dy` - Vertical movement (+1 down, 0 none)

**Returns**: `true` if move was successful, `false` if blocked

**Example**:

```typescript
const { movePiece } = useTetris()

// Keyboard controls
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') movePiece(-1, 0)
  if (e.key === 'ArrowRight') movePiece(1, 0)
  if (e.key === 'ArrowDown') movePiece(0, 1)
})
```

#### `rotatePiece()`

```typescript
function rotatePiece(): void
```

**Description**: Rotate current piece clockwise 90 degrees.

**Algorithm**: Uses rotation matrices from `TETROMINO_SHAPES` (up to 4 rotations).

**Wall Kicks**: No wall kick system (rotation blocked if new position invalid).

**Example**:

```typescript
const { rotatePiece } = useTetris()

document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === ' ') {
    rotatePiece()
  }
})
```

#### `dropPiece()`

```typescript
function dropPiece(): void
```

**Description**: Hard drop - instantly move piece to lowest valid position.

**Example**:

```typescript
const { dropPiece, playSound } = useTetris()

const hardDrop = () => {
  dropPiece()
  playSound('drop')
}

document.addEventListener('keydown', (e) => {
  if (e.key === ' ') hardDrop()
})
```

#### `startGame()`

```typescript
function startGame(): void
```

**Description**: Initialize new game and start game loop.

**Side Effects**:
- Resets board to empty
- Resets score, level, lines to 0
- Spawns first piece
- Starts requestAnimationFrame loop
- Preserves current speed multiplier

**Example**:

```typescript
const { startGame, gameState } = useTetris()

<button
  @click="startGame"
  :disabled="gameState.isPlaying"
>
  New Game
</button>
```

#### `pauseGame()`

```typescript
function pauseGame(): void
```

**Description**: Toggle pause state. Stops/resumes game loop.

**Side Effects**:
- Toggles `isPaused` state
- Cancels/restarts animation frame loop

**Example**:

```typescript
const { pauseGame, gameState } = useTetris()

<button @click="pauseGame">
  {{ gameState.isPaused ? 'Resume' : 'Pause' }}
</button>
```

#### `resetGame()`

```typescript
function resetGame(): void
```

**Description**: Stop game and reset state (does not auto-start).

**Side Effects**:
- Cancels game loop
- Sets `isPlaying` to false
- Sets `isGameOver` to false
- Sets `isPaused` to false

**Use Case**: Cleanup before starting new game or returning to menu.

**Example**:

```typescript
const { resetGame } = useTetris()

onBeforeUnmount(() => {
  resetGame() // Cleanup
})
```

#### `setSpeedMultiplier(multiplier)`

```typescript
function setSpeedMultiplier(multiplier: number): void
```

**Description**: Update speed multiplier (affects fall speed calculation).

**Parameters**:
- `multiplier` - Speed multiplier (recommended: 0.5 - 3.0)

**Example**:

```typescript
const { setSpeedMultiplier } = useTetris()
const { speedMultiplier } = useSpeed()

watch(speedMultiplier, (newSpeed) => {
  setSpeedMultiplier(newSpeed)
})
```

### Game Loop Mechanics

The game uses `requestAnimationFrame` for smooth 60 FPS updates:

```typescript
// Internal game loop
const update = (currentTime: number): void => {
  if (!isPlaying || isPaused || isGameOver) return

  if (currentTime - lastTime >= fallSpeed.value) {
    // Move piece down
    if (!movePiece(0, 1)) {
      // Piece landed - place it, clear lines, spawn next
    }
    lastTime = currentTime
  }

  gameLoop = requestAnimationFrame(update)
}
```

**Fall Speed Calculation**:

```typescript
const fallSpeed = computed(() => {
  const baseSpeed = Math.max(100, INITIAL_FALL_SPEED - (level - 1) * SPEED_INCREASE_PER_LEVEL)
  return Math.max(50, Math.floor(baseSpeed / speedMultiplier))
})
```

### Scoring System

```typescript
const baseScores = [0, 100, 300, 500, 800] // 0, 1, 2, 3, 4 lines
const score = baseScores[linesCleared] * level
```

- **1 line**: 100 × level
- **2 lines**: 300 × level
- **3 lines**: 500 × level
- **4 lines (Tetris)**: 800 × level

**Level Progression**: Level = floor(totalLines / 10) + 1

### Complete Usage Example

```vue
<script setup lang="ts">
import { useAudio } from '@/composables/useAudio'
import { useTetris } from '@/composables/useTetris'

const {
  gameState,
  movePiece,
  rotatePiece,
  dropPiece,
  startGame,
  pauseGame
} = useTetris()

const { playSound } = useAudio()

// Keyboard controls
const handleKeyDown = (e: KeyboardEvent) => {
  if (!gameState.value.isPlaying || gameState.value.isPaused) return

  switch (e.key) {
    case 'ArrowLeft':
      if (movePiece(-1, 0)) playSound('move')
      break
    case 'ArrowRight':
      if (movePiece(1, 0)) playSound('move')
      break
    case 'ArrowDown':
      movePiece(0, 1)
      break
    case 'ArrowUp':
      rotatePiece()
      playSound('rotate')
      break
    case ' ':
      dropPiece()
      playSound('drop')
      break
    case 'p':
      pauseGame()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

// Watch for game over
watch(() => gameState.value.isGameOver, (isOver) => {
  if (isOver) {
    playSound('gameover')
  }
})
</script>

<template>
  <div class="tetris-game">
    <div class="game-board">
      <div
        v-for="(row, y) in gameState.board"
        :key="y"
        class="row"
      >
        <div
          v-for="(cell, x) in row"
          :key="x"
          class="cell"
          :class="cell ? `cell-${cell}` : 'cell-empty'"
        />
      </div>
    </div>

    <div class="game-info">
      <div class="score">Score: {{ gameState.score }}</div>
      <div class="level">Level: {{ gameState.level }}</div>
      <div class="lines">Lines: {{ gameState.lines }}</div>

      <div class="next-piece">
        Next:
        <!-- Render gameState.nextPiece -->
      </div>

      <button
        v-if="!gameState.isPlaying"
        @click="startGame"
      >
        Start Game
      </button>

      <button
        v-if="gameState.isPlaying"
        @click="pauseGame"
      >
        {{ gameState.isPaused ? 'Resume' : 'Pause' }}
      </button>
    </div>

    <div v-if="gameState.isGameOver" class="game-over">
      <h2>Game Over!</h2>
      <p>Final Score: {{ gameState.score }}</p>
      <button @click="startGame">Play Again</button>
    </div>
  </div>
</template>

<style scoped>
.cell-I { background-color: var(--piece-i); }
.cell-O { background-color: var(--piece-o); }
.cell-T { background-color: var(--piece-t); }
.cell-S { background-color: var(--piece-s); }
.cell-Z { background-color: var(--piece-z); }
.cell-J { background-color: var(--piece-j); }
.cell-L { background-color: var(--piece-l); }
.cell-empty { background-color: var(--theme-surface); }
</style>
```

---

## useTheme

Visual theme management with CSS custom properties and persistence.

### Import

```typescript
import { useTheme } from '@/composables/useTheme'
```

### Type Definitions

```typescript
interface ThemeColors {
  background: string
  surface: string
  primary: string
  secondary: string
  accent: string
  text: string
  textSecondary: string
  border: string
  pieces: {
    I: string
    O: string
    T: string
    S: string
    Z: string
    J: string
    L: string
  }
}

interface Theme {
  id: string
  name: string
  description: string
  colors: ThemeColors
  effects?: {
    glow?: boolean
    shadows?: boolean
    animations?: boolean
  }
}

type ThemeId =
  | 'classic'
  | 'retro'
  | 'neon'
  | 'ocean'
  | 'sunset'
  | 'minimal'
  | 'matrix'
  | 'gameboy'
```

### Properties

#### `currentTheme`

```typescript
const currentTheme: ComputedRef<Theme>
```

**Description**: Currently active theme object with all colors and effects.

**Reactive**: Yes (computed)

**Example**:

```typescript
const { currentTheme } = useTheme()

console.log(currentTheme.value.name)          // "Classic Tetris"
console.log(currentTheme.value.colors.primary) // "#4a90e2"
console.log(currentTheme.value.effects?.glow)  // false
```

#### `currentThemeId`

```typescript
const currentThemeId: ComputedRef<ThemeId>
```

**Description**: ID of the currently active theme.

**Example**:

```typescript
const { currentThemeId } = useTheme()

console.log(currentThemeId.value) // "classic"
```

#### `availableThemes`

```typescript
const availableThemes: ComputedRef<Theme[]>
```

**Description**: Array of all available themes.

**Example**:

```typescript
const { availableThemes } = useTheme()

console.log(availableThemes.value.length) // 8 themes
```

### Methods

#### `setTheme(themeId)`

```typescript
function setTheme(themeId: ThemeId): void
```

**Description**: Switch to a different theme.

**Parameters**:
- `themeId` - ID of theme to activate

**Side Effects**:
- Updates all CSS custom properties on `:root`
- Adds `theme-{id}` class to `<body>`
- Saves to localStorage

**CSS Variables Set**:
- `--theme-bg`
- `--theme-surface`
- `--theme-primary`
- `--theme-secondary`
- `--theme-accent`
- `--theme-text`
- `--theme-text-secondary`
- `--theme-border`
- `--piece-i`, `--piece-o`, `--piece-t`, `--piece-s`, `--piece-z`, `--piece-j`, `--piece-l`
- `--theme-glow`
- `--theme-shadow`

**Example**:

```typescript
const { setTheme } = useTheme()

// Theme selector
<select @change="setTheme($event.target.value)">
  <option value="classic">Classic</option>
  <option value="neon">Neon Nights</option>
  <option value="retro">Retro Terminal</option>
</select>
```

### Available Themes

| Theme ID | Name | Description | Special Effects |
|----------|------|-------------|-----------------|
| `classic` | Classic Tetris | Traditional Tetris colors | Shadows |
| `retro` | Retro Terminal | Green terminal aesthetic | Glow, animations |
| `neon` | Neon Nights | Cyberpunk neon glow | Glow, shadows, animations |
| `ocean` | Deep Ocean | Calming underwater theme | Shadows, animations |
| `sunset` | Sunset Vibes | Warm sunset gradients | Glow, shadows, animations |
| `minimal` | Minimal White | Clean minimal design | None |
| `matrix` | Matrix Code | Digital rain matrix theme | Glow, animations |
| `gameboy` | Game Boy | Classic Game Boy green | None |

### Using CSS Variables

All theme colors are available as CSS custom properties:

```css
.my-component {
  background-color: var(--theme-bg);
  color: var(--theme-text);
  border: 1px solid var(--theme-border);
  box-shadow: var(--theme-shadow);
}

.tetromino-I {
  background-color: var(--piece-i);
}
```

### Complete Usage Example

```vue
<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const {
  currentTheme,
  currentThemeId,
  availableThemes,
  setTheme
} = useTheme()

// Group themes by style
const themeGroups = computed(() => ({
  modern: availableThemes.value.filter(t =>
    ['neon', 'ocean', 'sunset'].includes(t.id)
  ),
  classic: availableThemes.value.filter(t =>
    ['classic', 'retro', 'matrix', 'gameboy'].includes(t.id)
  ),
  minimal: availableThemes.value.filter(t =>
    t.id === 'minimal'
  )
}))
</script>

<template>
  <div class="theme-selector">
    <h3>Current Theme: {{ currentTheme.name }}</h3>
    <p>{{ currentTheme.description }}</p>

    <div class="theme-grid">
      <button
        v-for="theme in availableThemes"
        :key="theme.id"
        @click="setTheme(theme.id)"
        :class="{ active: currentThemeId === theme.id }"
        class="theme-card"
      >
        <div class="theme-preview">
          <div
            class="color-swatch"
            :style="{ backgroundColor: theme.colors.primary }"
          />
          <div
            class="color-swatch"
            :style="{ backgroundColor: theme.colors.accent }"
          />
        </div>
        <div class="theme-info">
          <h4>{{ theme.name }}</h4>
          <p>{{ theme.description }}</p>
          <div class="theme-effects">
            <span v-if="theme.effects?.glow">✨ Glow</span>
            <span v-if="theme.effects?.shadows">🌑 Shadows</span>
            <span v-if="theme.effects?.animations">🎬 Animations</span>
          </div>
        </div>
      </button>
    </div>

    <!-- Grouped theme selector -->
    <div class="theme-groups">
      <div v-for="(themes, group) in themeGroups" :key="group">
        <h4>{{ group }}</h4>
        <button
          v-for="theme in themes"
          :key="theme.id"
          @click="setTheme(theme.id)"
        >
          {{ theme.name }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.theme-card {
  background-color: var(--theme-surface);
  color: var(--theme-text);
  border: 2px solid var(--theme-border);
  box-shadow: var(--theme-shadow);
}

.theme-card.active {
  border-color: var(--theme-primary);
  box-shadow: 0 0 20px var(--theme-primary);
}
</style>
```

---

## Best Practices

### Composable Usage Patterns

#### 1. Single Instance Pattern

Most composables use singleton state:

```typescript
// ✅ Correct - state shared across components
const { gameState } = useTetris()

// ❌ Wrong - creates multiple instances (loses shared state)
export default function createTetris() {
  return useTetris()
}
```

#### 2. Lifecycle Management

Always clean up in components:

```typescript
const { startMusic, stopMusic } = useAudio()

onMounted(() => {
  startMusic()
})

onUnmounted(() => {
  stopMusic() // Important cleanup
})
```

#### 3. Reactive Dependencies

Use `watch` or `watchEffect` for reactive updates:

```typescript
// ✅ Correct - reactive
const { speedMultiplier } = useSpeed()
const { setSpeedMultiplier } = useTetris()

watch(speedMultiplier, (newSpeed) => {
  setSpeedMultiplier(newSpeed)
})

// ❌ Wrong - not reactive
setSpeedMultiplier(speedMultiplier.value)
```

#### 4. Async Operations

Always await async audio operations:

```typescript
// ✅ Correct
const handleClick = async () => {
  await startMusic()
  console.log('Music started')
}

// ❌ Wrong - may fail silently
const handleClick = () => {
  startMusic() // No await
  console.log('Music might not be started')
}
```

### State Management

#### Persistence Strategy

All composables automatically persist to localStorage:

- **Key Pattern**: `tetrys-{domain}-{type}`
- **Timing**: Immediate on change
- **Load**: Automatic on first use

#### Sharing State

Components share state through composable singletons:

```typescript
// ComponentA.vue
const { setSpeed } = useSpeed()
setSpeed(2.0)

// ComponentB.vue (different component)
const { speedMultiplier } = useSpeed()
console.log(speedMultiplier.value) // 2.0 (shared)
```

### Performance Optimization

#### Computed vs Ref

Composables expose computed refs for safety:

```typescript
// Internal: ref (mutable)
const settings = ref({ musicEnabled: true })

// Exposed: computed (read-only)
return {
  settings: computed(() => settings.value)
}
```

#### Avoiding Watchers

Use event callbacks instead of watchers when possible:

```typescript
// ✅ Better - direct event handling
const { checkAchievements } = useAchievements()
onLineClear(() => {
  checkAchievements({ lines: newLines })
})

// ❌ Less efficient - constant watching
watch(() => gameState.value.lines, (newLines) => {
  checkAchievements({ lines: newLines })
})
```

---

## Common Patterns

### Game Initialization

```typescript
const initGame = async () => {
  // 1. Load persisted settings
  const { speedMultiplier } = useSpeed()
  const { currentTheme } = useTheme()

  // 2. Initialize audio (requires user interaction)
  const { startMusic } = useAudio()
  await startMusic()

  // 3. Load achievements
  const { stats } = useAchievements()
  console.log(`Welcome back! ${stats.value.percentage}% complete`)

  // 4. Start game
  const { startGame, setSpeedMultiplier } = useTetris()
  setSpeedMultiplier(speedMultiplier.value)
  startGame()
}
```

### Event-Driven Updates

```typescript
const { checkAchievements } = useAchievements()
const { playSound } = useAudio()
const { gameState } = useTetris()

// Watch for line clears
watch(() => gameState.value.lines, (newLines, oldLines) => {
  const linesCleared = newLines - oldLines

  if (linesCleared > 0) {
    playSound('line')

    checkAchievements({
      score: gameState.value.score,
      level: gameState.value.level,
      lines: newLines
    })
  }
})
```

### Settings Panel

```typescript
const SettingsPanel = {
  setup() {
    const audio = useAudio()
    const speed = useSpeed()
    const theme = useTheme()

    return {
      // Audio
      ...audio,

      // Speed
      ...speed,

      // Theme
      ...theme
    }
  }
}
```

### Achievement Notifications

```typescript
const {
  pendingNotifications,
  getNextNotification
} = useAchievements()

const currentNotification = ref<Achievement | null>(null)
const notificationVisible = ref(false)

const showNextAchievement = () => {
  if (pendingNotifications.value.length === 0) return

  const achievement = getNextNotification()
  if (!achievement) return

  currentNotification.value = achievement
  notificationVisible.value = true

  setTimeout(() => {
    notificationVisible.value = false
    setTimeout(showNextAchievement, 500) // Next after animation
  }, 3000)
}

// Trigger on achievement unlock
watch(
  () => pendingNotifications.value.length,
  (newLength, oldLength) => {
    if (newLength > oldLength && !notificationVisible.value) {
      showNextAchievement()
    }
  }
)
```

---

## TypeScript Integration

### Type Safety

All composables return fully typed objects:

```typescript
// Explicit typing (optional - inferred automatically)
const {
  gameState,
  movePiece,
  rotatePiece
}: {
  gameState: ComputedRef<GameState>
  movePiece: (dx: number, dy: number) => boolean
  rotatePiece: () => void
} = useTetris()
```

### Custom Type Guards

```typescript
import type { TetrominoType } from '@/types/tetris'

function isValidTetrominoType(type: string): type is TetrominoType {
  return ['I', 'O', 'T', 'S', 'Z', 'J', 'L'].includes(type)
}

// Usage
const cellType = board[y][x]
if (cellType && isValidTetrominoType(cellType)) {
  // TypeScript knows cellType is TetrominoType
}
```

### Extending Composables

```typescript
// Custom composable extending useAchievements
export function useAchievementNotifications() {
  const achievements = useAchievements()

  const notificationQueue = ref<Achievement[]>([])

  const processNotifications = () => {
    const next = achievements.getNextNotification()
    if (next) {
      notificationQueue.value.push(next)
    }
  }

  return {
    ...achievements,
    notificationQueue: computed(() => notificationQueue.value),
    processNotifications
  }
}
```

### Type-Safe Event Handlers

```typescript
type GameEvent =
  | { type: 'move'; direction: 'left' | 'right' | 'down' }
  | { type: 'rotate' }
  | { type: 'drop' }
  | { type: 'pause' }

const handleGameEvent = (event: GameEvent) => {
  const { movePiece, rotatePiece, dropPiece, pauseGame } = useTetris()

  switch (event.type) {
    case 'move':
      const dx = event.direction === 'left' ? -1 :
                  event.direction === 'right' ? 1 : 0
      const dy = event.direction === 'down' ? 1 : 0
      movePiece(dx, dy)
      break
    case 'rotate':
      rotatePiece()
      break
    case 'drop':
      dropPiece()
      break
    case 'pause':
      pauseGame()
      break
  }
}
```

---

## Anti-Patterns

### ❌ Don't: Mutate Computed State

```typescript
// ❌ Wrong - computed refs are read-only
const { gameState } = useTetris()
gameState.value.score = 1000 // Error!

// ✅ Correct - use provided methods
// No direct setter - score updates through game logic
```

### ❌ Don't: Bypass Persistence

```typescript
// ❌ Wrong - direct localStorage access
localStorage.setItem('tetrys-speed-setting', '2.0')

// ✅ Correct - use composable methods
const { setSpeed } = useSpeed()
setSpeed(2.0)
```

### ❌ Don't: Ignore Async

```typescript
// ❌ Wrong - not awaiting async operations
const { toggleMusic } = useAudio()
button.onclick = () => {
  toggleMusic() // May fail silently
  console.log('Music toggled') // May be wrong
}

// ✅ Correct - await async operations
button.onclick = async () => {
  await toggleMusic()
  console.log('Music toggled')
}
```

### ❌ Don't: Create Multiple Instances

```typescript
// ❌ Wrong - loses singleton benefits
function ComponentA() {
  const tetris1 = useTetris()
  return tetris1
}

function ComponentB() {
  const tetris2 = useTetris()
  return tetris2
}
// tetris1 and tetris2 ARE the same instance (singleton)
// This is correct behavior, but don't assume they're separate
```

---

## Troubleshooting

### Audio Not Playing

**Problem**: Music or sounds don't play

**Solutions**:
1. Ensure user interaction before calling `startMusic()`
2. Check browser autoplay policies
3. Verify audio context state
4. Check volume settings

```typescript
// Correct initialization
const { startMusic, ensureAudioContextRunning } = useAudio()

button.onclick = async () => {
  const isRunning = await ensureAudioContextRunning()
  if (isRunning) {
    await startMusic()
  } else {
    console.error('Audio context failed to start')
  }
}
```

### State Not Persisting

**Problem**: Settings reset on page reload

**Solutions**:
1. Check localStorage availability
2. Verify no privacy mode blocking
3. Check for errors in console

```typescript
// Debug localStorage
const { loadSpeed } = useSpeed()

try {
  loadSpeed()
} catch (error) {
  console.error('Failed to load speed:', error)
  // Fallback to default
}
```

### Game Loop Issues

**Problem**: Game pauses unexpectedly or doesn't resume

**Solutions**:
1. Check `isPlaying` and `isPaused` states
2. Verify game loop is running
3. Check for tab visibility changes

```typescript
// Handle visibility changes
document.addEventListener('visibilitychange', () => {
  const { gameState, pauseGame } = useTetris()

  if (document.hidden && gameState.value.isPlaying) {
    pauseGame() // Auto-pause when tab hidden
  }
})
```

---

## Summary

The Tetrys composable system provides:

- **Modular architecture**: Each composable handles one domain
- **Reactive state**: Vue 3 Composition API reactivity throughout
- **Type safety**: Full TypeScript support with comprehensive interfaces
- **Persistence**: Automatic localStorage integration
- **Clean APIs**: Consistent naming and return patterns
- **Side-effect management**: Proper lifecycle and cleanup

Use these composables to build rich Tetris experiences with achievements, themes, audio, and flexible game mechanics.
