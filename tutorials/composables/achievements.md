# 🏆 Achievement System Deep Dive

The Tetrys achievement system provides a comprehensive gamification layer with 74 achievements, real-time progress tracking, and visual notifications.

## System Architecture

```
Achievement System
├── Achievement Tracking
│   ├── 74 Total Achievements
│   ├── 4 Rarity Tiers (Common, Rare, Epic, Legendary)
│   ├── 7 Categories
│   └── Real-time Progress Monitoring
├── Notification Queue
│   ├── Achievement Unlock Notifications
│   ├── Rarity-Based Visual Effects
│   ├── 4-Second Auto-Dismiss
│   └── Sequential Display System
├── Progress Tracking
│   ├── Per-Achievement Progress Calculation
│   ├── Completion Percentage
│   └── Statistics Dashboard
└── Persistence Layer
    ├── localStorage Achievement Data
    ├── Session Statistics
    └── Unlock Timestamps
```

## Core Components

### Achievement Interface

```typescript
interface Achievement {
  id: AchievementId
  name: string
  description: string
  icon: string              // Emoji icon
  category: 'gameplay' | 'progression' | 'scoring' | 'skill' | 'mastery' | 'special' | 'speed'
  condition: {
    type: 'lines' | 'score' | 'level' | 'tetris_count' | 'combo' | 'time_played'
    value: number
    operator: 'gte' | 'lte' | 'eq'
  }
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  rewardMessage: string
}
```

### Unlocked Achievement

```typescript
interface UnlockedAchievement {
  achievementId: AchievementId
  unlockedAt: Date
  gameStats?: {
    score: number
    level: number
    lines: number
  }
}
```

### Achievement Progress

```typescript
interface AchievementProgress {
  achievementId: AchievementId
  currentValue: number
  targetValue: number
  percentage: number        // 0-100
}
```

## Achievement Categories

### Level Progression (20 achievements)
Early-game focused milestones to encourage new players:
- **Common (1-10)**: Level 1 through Level 10
- **Rare (11-20)**: Level 15, 20, 25, 30, 40, 50
- **Epic (21+)**: Level 75, 100
- **Legendary**: Level 150+

### Line Clearing (12 achievements)
Progressive line-clearing milestones:
- **Early**: 1, 5, 10, 15, 20 lines
- **Mid**: 30, 40, 50, 75 lines
- **Late**: 100, 150, 200+ lines

### Score Milestones (10 achievements)
Point-based progression:
- **Common**: 100, 500, 1K, 2.5K points
- **Rare**: 5K, 10K, 25K points
- **Epic**: 50K, 75K points
- **Legendary**: 100K+ points

### Tetris Achievements (7 achievements)
Rewarding 4-line clears:
- **Common**: 1st, 2nd, 3rd Tetris
- **Rare**: 5 Tetris, 7 Tetris
- **Epic**: 10 Tetris
- **Legendary**: 15+ Tetris

### Combo System (8 achievements)
Multi-line clear combos:
- 2x, 3x, 4x, 5x combos (Common/Rare)
- 6x, 7x combos (Epic)
- 8x, 10x combos (Legendary)

### Skill & Speed (4 achievements)
Advanced gameplay milestones:
- Fast clears (time-based)
- Perfect games
- Efficiency challenges

### Special & Fun (13 achievements)
Unique and entertaining milestones:
- Time-of-day achievements (Night Owl, Early Bird)
- Streak achievements
- Special events

## Rarity Distribution

| Rarity | Count | Percentage | Visual Style |
|--------|-------|------------|--------------|
| Common | 42 | 56.8% | Green, subtle glow |
| Rare | 17 | 23.0% | Blue, moderate glow |
| Epic | 12 | 16.2% | Purple, strong glow |
| Legendary | 3 | 4.1% | Gold, intense effects |

## Achievement Tracking

### Check System

The achievement system checks conditions on every game state update:

```typescript
const checkAchievements = (stats: {
  score?: number
  level?: number
  lines?: number
  tetrisCount?: number
  combo?: number
  timePlayed?: number
}) => {
  ACHIEVEMENTS.forEach(achievement => {
    if (isUnlocked(achievement.id)) return

    const { condition } = achievement
    let currentValue: number | undefined

    // Map stat to condition type
    switch (condition.type) {
      case 'lines': currentValue = stats.lines; break
      case 'score': currentValue = stats.score; break
      // ... other types
    }

    // Check condition
    let conditionMet = false
    switch (condition.operator) {
      case 'gte': conditionMet = currentValue >= condition.value; break
      case 'lte': conditionMet = currentValue <= condition.value; break
      case 'eq': conditionMet = currentValue === condition.value; break
    }

    if (conditionMet) {
      unlockAchievement(achievement.id, gameStats)
    }
  })
}
```

### Progress Calculation

```typescript
const getProgress = (achievementId: AchievementId, currentValue: number): AchievementProgress => {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
  const targetValue = achievement.condition.value
  const percentage = Math.min((currentValue / targetValue) * 100, 100)

  return {
    achievementId,
    currentValue,
    targetValue,
    percentage: Math.round(percentage)
  }
}
```

## Notification System

### Notification Queue

Achievements are queued and displayed sequentially:

```typescript
const pendingNotifications = ref<Achievement[]>([])

// Unlock adds to queue
const unlockAchievement = (achievementId: AchievementId) => {
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
  pendingNotifications.value.push(achievement)
  saveAchievements()
}

// Get next notification from queue
const getNextNotification = (): Achievement | null => {
  return pendingNotifications.value.shift() || null
}
```

### Visual Notification Component

The `AchievementNotification.vue` component displays achievements with:
- **Slide-in Animation**: Smooth entrance from top
- **Rarity-Based Styling**: Colors and glows based on tier
- **Progress Bar**: 4-second auto-dismiss countdown
- **Mobile Responsive**: Landscape and portrait optimizations
- **Accessibility**: Keyboard navigation, ARIA labels

**Rarity Visual Effects:**
```css
.common { /* Green, subtle glow */ }
.rare { /* Blue, moderate particle effects */ }
.epic { /* Purple, strong glow + particles */ }
.legendary { /* Gold, intense shimmer + sparkles */ }
```

## Persistence

### localStorage Schema

```typescript
// Achievement unlocks
localStorage.setItem('tetris_achievements', JSON.stringify([
  {
    achievementId: 'welcome',
    unlockedAt: '2025-10-15T10:30:00.000Z',
    gameStats: { score: 0, level: 1, lines: 0 }
  }
]))

// Session statistics
localStorage.setItem('tetris_achievement_stats', JSON.stringify({
  linesCleared: 0,
  tetrisCount: 0,
  maxCombo: 0,
  gamesPlayed: 0,
  totalLinesCleared: 0,
  timePlayed: 0
}))
```

## API Reference

### State & Statistics

```typescript
// Reactive state
unlockedAchievements: Ref<UnlockedAchievement[]>
stats: ComputedRef<AchievementStats>
sessionStats: ComputedRef<SessionStats>
pendingNotifications: ComputedRef<Achievement[]>

// Computed
getUnlockedAchievements: ComputedRef<Achievement[]>
getLockedAchievements: ComputedRef<Achievement[]>
```

### Core Methods

```typescript
isUnlocked(achievementId: AchievementId): boolean
unlockAchievement(achievementId: AchievementId, gameStats?: GameStats): void
checkAchievements(stats: GameStats): void
getProgress(achievementId: AchievementId, currentValue: number): AchievementProgress
```

### Notification Management

```typescript
getNextNotification(): Achievement | null
clearNotifications(): void
```

### Session Management

```typescript
updateSessionStats(update: Partial<SessionStats>): void
resetAchievements(): void  // For testing/debugging
```

### Development Tools

```typescript
// Trigger test achievement (dev mode only)
triggerDevAchievement(rarity?: 'common' | 'rare' | 'epic' | 'legendary'): void
```

**Usage:**
```javascript
// Browser console (dev mode)
__triggerAchievement('legendary')  // Trigger legendary achievement

// Or keyboard shortcut
Ctrl/Cmd + Shift + A  // Trigger random rarity achievement
```

## Usage Example

### In Vue Component

```vue
<script setup lang="ts">
import { useAchievements } from '@/composables/useAchievements'
import { useTetris } from '@/composables/useTetris'
import { watch } from 'vue'

const {
  checkAchievements,
  stats,
  getUnlockedAchievements,
  getProgress
} = useAchievements()

const { score, level, lines, tetrisCount, combo } = useTetris()

// Check achievements whenever game state changes
watch([score, level, lines, tetrisCount, combo], () => {
  checkAchievements({
    score: score.value,
    level: level.value,
    lines: lines.value,
    tetrisCount: tetrisCount.value,
    combo: combo.value
  })
})

// Display progress for specific achievement
const progressToLevel10 = computed(() =>
  getProgress('level_10', level.value)
)
</script>

<template>
  <div class="achievements">
    <h3>Achievements ({{ stats.percentage }}%)</h3>
    <p>{{ stats.unlockedCount }} / {{ stats.totalAchievements }}</p>

    <div class="progress">
      Level 10: {{ progressToLevel10.percentage }}%
    </div>
  </div>
</template>
```

### Integration with Game Loop

```typescript
// In game update loop
const onLinesClear = (linesCleared: number) => {
  lines.value += linesCleared

  // Check achievements after state update
  checkAchievements({
    score: score.value,
    level: level.value,
    lines: lines.value,
    tetrisCount: tetrisCount.value,
    combo: combo.value
  })
}
```

## Performance Considerations

### Efficient Checking

- ✅ Early exit for already unlocked achievements
- ✅ Single loop through all achievements
- ✅ Minimal computation per check
- ✅ Batch updates to localStorage

### Memory Management

```typescript
// Unlocked achievements stored in memory
const unlockedAchievements = ref<UnlockedAchievement[]>([])  // Max 74 items

// Notification queue auto-clears after display
const pendingNotifications = ref<Achievement[]>([])  // Self-managing queue
```

### localStorage Optimization

```typescript
// Save only on achievement unlock (not every check)
const unlockAchievement = (...) => {
  unlockedAchievements.value.push(unlock)
  saveAchievements()  // Single write operation
}
```

## Testing

### Manual Testing

```typescript
// Reset all achievements
resetAchievements()

// Trigger specific achievement
unlockAchievement('welcome')

// Check progress
const progress = getProgress('level_10', 7)
console.log(`${progress.percentage}% complete`)
```

### Dev Tools

```typescript
// Trigger notifications for UI testing
triggerDevAchievement('common')    // Green notification
triggerDevAchievement('rare')      // Blue notification
triggerDevAchievement('epic')      // Purple notification
triggerDevAchievement('legendary') // Gold notification
```

## Future Enhancements

- [ ] Achievement categories/collections view
- [ ] Steam-like global statistics
- [ ] Social sharing integration
- [ ] Leaderboards for achievement hunters
- [ ] Hidden achievements
- [ ] Meta-achievements (unlock X achievements)
- [ ] Achievement sound effects
- [ ] Seasonal/event achievements

---

**See Also:**
- [Achievement Data](../../src/data/achievements.ts) - Complete achievement definitions
- [Achievement Types](../../src/types/achievements.ts) - TypeScript interfaces
- [AchievementNotification Component](../components/README.md#achievementnotification) - UI implementation
- [useAchievements Composable](./README.md#useachievements) - Complete API
