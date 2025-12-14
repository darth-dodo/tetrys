# Mobile Development Guide

## Overview

This guide covers mobile-first development practices for Tetrys, focusing on touch controls, responsive design, haptic feedback, and performance optimization for mobile gaming experiences.

## Table of Contents

1. [Mobile-First Design Philosophy](#mobile-first-design-philosophy)
2. [Touch Control Implementation](#touch-control-implementation)
3. [Responsive Layout Strategies](#responsive-layout-strategies)
4. [Haptic Feedback Patterns](#haptic-feedback-patterns)
5. [Performance Optimization](#performance-optimization)
6. [Accessibility & Touch Targets](#accessibility--touch-targets)
7. [Testing on Real Devices](#testing-on-real-devices)
8. [PWA Configuration](#pwa-configuration)
9. [Offline Support](#offline-support)
10. [Mobile Debugging](#mobile-debugging)
11. [Common Issues & Solutions](#common-issues--solutions)
12. [Best Practices](#best-practices)

---

## Mobile-First Design Philosophy

### Core Principles

Tetrys follows a mobile-first approach where:

1. **Touch is Primary**: All interactions designed for touch first, keyboard second
2. **Screen Real Estate**: Efficient use of limited mobile screen space
3. **Performance First**: Optimized for mobile hardware constraints
4. **Progressive Enhancement**: Start mobile, enhance for desktop

### Design Decisions

```vue
<!-- Mobile-first layout: Side-by-side game board and info panel -->
<div class="game-area">
  <GameBoard />        <!-- Left: Main game board -->
  <div class="info-panel">  <!-- Right: Compact info -->
    <ScoreBoard />
    <NextPiece />
  </div>
</div>
```

**Why Side-by-Side?**
- Maximizes vertical space for game board (critical for Tetris)
- Keeps score/next piece visible without scrolling
- Natural thumb reach zones on both sides
- Prevents accidental touches on game board

### Mobile-First CSS Structure

```css
/* Base styles = mobile styles */
.game-board-container {
  width: 100%;
  max-width: calc(100vw - 110px); /* Account for info panel */
  height: calc(100vh - 180px);    /* Full viewport height usage */
  min-height: 400px;
  touch-action: none;             /* Prevent browser gestures */
  user-select: none;              /* Prevent text selection */
}

/* Progressively enhance for larger screens */
@media (min-width: 768px) {
  .game-board-container {
    max-width: 400px;
    height: calc(100vh - 180px);
    min-height: 580px;
  }
}
```

---

## Touch Control Implementation

### Gesture Recognition System

Tetrys implements a sophisticated touch gesture system with three gesture types:

#### 1. Tap Gesture (Rotate)

**Implementation:**
```typescript
const handleTouchEnd = (e: TouchEvent) => {
  const deltaX = touchState.value.currentX - touchState.value.startX
  const deltaY = touchState.value.currentY - touchState.value.startY
  const touchDuration = Date.now() - touchState.value.startTime

  const maxTapDuration = 200  // milliseconds
  const minSwipeDistance = 30 // pixels

  // Detect tap: short duration + minimal movement
  if (touchDuration < maxTapDuration &&
      Math.abs(deltaX) < minSwipeDistance &&
      Math.abs(deltaY) < minSwipeDistance) {
    emit('rotate')
    navigator.vibrate([8, 20, 8]) // Double pulse feedback
  }
}
```

**Design Rationale:**
- 200ms threshold balances speed vs accidental taps
- 30px minimum movement prevents jittery fingers from false positives
- Double pulse haptic provides clear rotation confirmation

#### 2. Horizontal Swipe (Move Left/Right)

**Implementation:**
```typescript
// Horizontal swipe detection
if (Math.abs(deltaX) > Math.abs(deltaY)) {
  if (Math.abs(deltaX) > minSwipeDistance) {
    if (deltaX > 0) {
      emit('moveRight')
    } else {
      emit('moveLeft')
    }
    navigator.vibrate(10) // Single pulse
  }
}
```

**Design Considerations:**
- Horizontal movement must exceed vertical (prevents diagonal ambiguity)
- 30px minimum prevents accidental swipes during taps
- Single short pulse for quick, non-intrusive feedback

#### 3. Vertical Swipe (Soft Drop vs Hard Drop)

**Implementation:**
```typescript
// Vertical swipe detection
if (Math.abs(deltaY) > minSwipeDistance) {
  if (deltaY > 0) {
    if (Math.abs(deltaY) > 80) {
      emit('drop')  // Hard drop for long swipe
      navigator.vibrate([15, 30, 15, 30, 15]) // Strong pattern
    } else {
      emit('moveDown')  // Soft drop for short swipe
      navigator.vibrate(10)  // Single pulse
    }
  }
}
```

**Two-Tier System:**
- **Soft Drop** (30-80px): Move piece down one row
- **Hard Drop** (>80px): Instantly drop to bottom
- Different haptic patterns provide clear action differentiation

### Touch State Management

```typescript
const touchState = ref({
  startX: 0,
  startY: 0,
  currentX: 0,
  currentY: 0,
  isDragging: false,
  startTime: 0
})

const handleTouchStart = (e: TouchEvent) => {
  if (!gameState.isPlaying || gameState.isPaused) return

  e.preventDefault() // Prevent default browser behaviors
  const touch = e.touches[0]

  touchState.value = {
    startX: touch.clientX,
    startY: touch.clientY,
    currentX: touch.clientX,
    currentY: touch.clientY,
    isDragging: true,
    startTime: Date.now()
  }
}
```

### Preventing Browser Interference

```css
@layer base {
  * {
    -webkit-tap-highlight-color: transparent; /* Remove iOS tap highlight */
    user-select: none;                        /* Prevent text selection */
  }

  body {
    touch-action: manipulation;  /* Disable double-tap zoom */
    overscroll-behavior: none;   /* Prevent pull-to-refresh */
  }
}

.game-board-container {
  touch-action: none;  /* Disable ALL browser gestures */
}
```

**Critical Settings:**
- `touch-action: none` - Prevents pinch-zoom, double-tap zoom, pan
- `user-select: none` - Prevents accidental text selection during swipes
- `overscroll-behavior: none` - Prevents pull-to-refresh on game board

### Dual Control System

Tetrys provides both touch gestures AND button controls:

```vue
<template>
  <!-- Gesture controls on game board -->
  <div
    class="game-board-container"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  />

  <!-- Button controls below -->
  <GameControls
    @move-left="handleMove('left')"
    @move-right="handleMove('right')"
    @rotate="handleRotate"
  />
</template>
```

**Why Both?**
- Gestures: Fast, intuitive for experienced players
- Buttons: Precise, reliable, better for beginners
- Accessibility: Some users prefer buttons (motor control issues)
- Testing: Buttons work in desktop browsers

---

## Responsive Layout Strategies

### Breakpoint System

Tetrys uses a mobile-first breakpoint system optimized for real device sizes:

```css
/* Extra Small Phones: <360px */
@media (max-width: 360px) {
  .control-button {
    width: 68px;
    height: 68px;
    min-width: 48px;  /* WCAG minimum */
  }
}

/* Small Phones: 360-479px (Default mobile styles) */
.game-board-container {
  max-width: calc(100vw - 110px);
  height: calc(100vh - 180px);
}

/* Medium Phones: 480-767px */
@media (min-width: 480px) and (max-width: 767px) {
  .game-board-container {
    max-width: calc(100vw - 150px);
    height: calc(100vh - 200px);
  }
}

/* Tablets & Desktop: >=768px */
@media (min-width: 768px) {
  .game-board-container {
    max-width: 400px;
    height: calc(100vh - 180px);
  }

  .game-layout {
    flex-direction: column; /* Switch to vertical layout */
    align-items: center;
  }
}
```

### Viewport Units Strategy

```css
/* Dynamic sizing based on viewport */
.game-board-container {
  width: 100%;
  height: calc(100vh - 180px);  /* Full height minus header/controls */
  max-height: 700px;            /* Cap for large screens */
  min-height: 450px;            /* Minimum playable size */
}
```

**Calculation Breakdown:**
- `100vh` = Full viewport height
- `-180px` = Header (70px) + Controls (110px)
- `max-height: 700px` = Prevents oversized board on tablets
- `min-height: 450px` = Ensures 20 rows are visible

### Orientation Handling

```css
/* Portrait (default) */
.game-area {
  flex-direction: row;  /* Side-by-side layout */
}

/* Landscape mobile optimization */
@media (max-height: 500px) and (orientation: landscape) {
  .game-board-container {
    max-width: calc(100vw - 200px);
    height: calc(100vh - 120px);
    max-height: 350px;
  }

  .control-button {
    width: 48px;   /* Smaller for landscape */
    height: 48px;
  }
}
```

**Landscape Challenges:**
- Limited vertical space
- Controls compete with game board
- Solution: Shrink controls, maximize board height

### Height-Based Adjustments

```css
/* Short screens (e.g., iPhone SE landscape) */
@media (max-height: 600px) {
  .game-board-container {
    height: calc(100vh - 160px);
    min-height: 320px;
  }
}

@media (max-height: 500px) {
  .game-board-container {
    height: calc(100vh - 140px);
    min-height: 300px;
  }
}
```

### Fluid Typography

```css
/* Mobile: Smaller, compact text */
.title {
  font-size: 22px;
}

.game-logo {
  font-size: 32px;
}

/* Desktop: Larger, more prominent */
@media (min-width: 768px) {
  .title {
    font-size: 32px;
  }

  .game-logo {
    font-size: 72px;
  }
}
```

---

## Haptic Feedback Patterns

### Vibration API Integration

Tetrys uses the Web Vibration API for tactile feedback:

```typescript
// Basic vibration check
if ('vibrate' in navigator) {
  navigator.vibrate(10) // Single 10ms pulse
}

// Pattern vibration (vibrate, pause, vibrate...)
navigator.vibrate([15, 30, 15, 30, 15])
//                 [on, off, on, off, on] in milliseconds
```

### Action-Specific Patterns

```typescript
const vibratePattern = (action: string) => {
  if (!isVibrationEnabled.value || !('vibrate' in navigator)) return

  switch (action) {
    case 'left':
    case 'right':
      navigator.vibrate(8)  // Short pulse for quick movements
      break

    case 'down':
      navigator.vibrate(12)  // Slightly longer for down movement
      break

    case 'rotate':
      navigator.vibrate([8, 20, 8])  // Double pulse for rotation
      break

    case 'drop':
      navigator.vibrate([15, 30, 15, 30, 15])  // Strong pattern
      break

    case 'pause':
      navigator.vibrate([25, 50, 25])  // Distinctive pause pattern
      break
  }
}
```

**Design Philosophy:**
- **Short actions** (8-12ms): Movement feedback, non-intrusive
- **Medium actions** (15-25ms): Important actions like rotation
- **Patterns**: Multiple pulses for significant actions (drop, pause)
- **Unique patterns**: Each action feels different

### Pattern Examples Visualized

```
Movement (Left/Right):     ▃ (8ms)
Down Movement:             ▄ (12ms)
Rotation:                  ▃ ▃ (8ms, pause 20ms, 8ms)
Hard Drop:                 ▅ ▅ ▅ (15ms, pause 30ms, 15ms, pause 30ms, 15ms)
Pause:                     ▆ ▆ (25ms, pause 50ms, 25ms)
```

### User Preference System

```typescript
const VIBRATION_KEY = 'tetris-vibration-enabled'
const isVibrationEnabled = ref(true)

// Load preference from localStorage
const initializeVibration = () => {
  try {
    const stored = localStorage.getItem(VIBRATION_KEY)
    if (stored !== null) {
      isVibrationEnabled.value = JSON.parse(stored)
    }
  } catch (error) {
    console.warn('Failed to load vibration setting:', error)
  }
}

// Persist preference
watch(isVibrationEnabled, (newValue) => {
  localStorage.setItem(VIBRATION_KEY, JSON.stringify(newValue))
})
```

### Button Touch Feedback

```typescript
const handleTouchStart = (e: TouchEvent, action: string) => {
  e.preventDefault()

  // Visual feedback
  const button = e.target as HTMLElement
  button.classList.add('touch-pressed')

  // Haptic feedback
  vibratePattern(action)
}
```

**Visual + Haptic:**
```css
.control-button.touch-pressed {
  background: var(--theme-secondary);
  transform: translateY(2px) scale(0.98);
}

.control-button.touch-pressed::after {
  content: '';
  animation: ripple 0.3s ease-out;
}

@keyframes ripple {
  to {
    width: 100%;
    height: 100%;
    opacity: 0;
  }
}
```

### Browser Support Detection

```typescript
export const useVibration = () => {
  return {
    isVibrationSupported: 'vibrate' in navigator,
    vibrate: (pattern: number | number[]) => {
      if (isVibrationEnabled.value && 'vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    }
  }
}
```

**Browser Compatibility:**
- ✅ Chrome/Edge (Android)
- ✅ Firefox (Android)
- ✅ Samsung Internet
- ❌ Safari (iOS) - iOS blocks Vibration API
- ❌ Desktop browsers (no vibration hardware)

---

## Performance Optimization

### Mobile Hardware Constraints

Mobile devices have limited:
- CPU power (especially mid-range Android)
- Memory (1-4GB typical)
- GPU capabilities
- Battery life

### Rendering Optimization

**Grid-Based Rendering:**
```vue
<div
  class="game-board"
  :style="{
    gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
    gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`
  }"
>
  <div
    v-for="(cell, index) in renderBoard"
    :key="index"
    class="cell"
    :class="getCellClass(cell)"
  />
</div>
```

**Why CSS Grid?**
- Native browser optimization
- Hardware-accelerated
- No JavaScript layout calculations
- Efficient reflows

**Computed Board:**
```typescript
const renderBoard = computed(() => {
  const board = gameState.board.map(row => [...row])

  // Merge current piece into board (minimize DOM updates)
  if (currentPiece) {
    for (let y = 0; y < currentPiece.shape.length; y++) {
      for (let x = 0; x < currentPiece.shape[y].length; x++) {
        if (currentPiece.shape[y][x]) {
          board[boardY][boardX] = currentPiece.type
        }
      }
    }
  }

  return board.flat() // Single array for v-for
})
```

**Benefits:**
- Single reactive computation
- Minimizes Vue re-renders
- Flat array = efficient v-for iteration

### CSS Performance

```css
/* Minimal transitions for 60fps */
.cell {
  transition: background-color 0.1s ease;  /* Only animate color */
}

/* GPU-accelerated transforms */
.control-button:active {
  transform: translateY(2px) scale(0.98);  /* transform is cheap */
  /* Avoid: animating width, height, top, left (causes reflow) */
}

/* Will-change for animations */
.modal {
  animation: modalSlideIn 0.3s ease-out;
  will-change: transform, opacity;  /* Hint to browser */
}
```

**Performance Rules:**
- ✅ Transform, opacity (GPU-accelerated)
- ✅ Color changes (cheap)
- ❌ Width, height, margin (triggers reflow)
- ❌ Complex box-shadows (expensive)

### Touch Event Performance

```typescript
const handleTouchMove = (e: TouchEvent) => {
  if (!touchState.value.isDragging) return

  e.preventDefault() // Prevent scroll calculations

  const touch = e.touches[0]
  // Only update coordinates (no DOM manipulation)
  touchState.value.currentX = touch.clientX
  touchState.value.currentY = touch.clientY
}
```

**Optimization Techniques:**
- Prevent default to avoid scroll calculations
- Minimal work in touchmove (fires frequently)
- Actual gesture handling in touchend (fires once)

### Memory Management

```typescript
// Cleanup on component unmount
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('touchend', handleTouchEnd)
})
```

### Debouncing Resize Events

```typescript
let resizeTimeout: number

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout)
  resizeTimeout = setTimeout(() => {
    // Recalculate layout
  }, 150) // Wait for resize to finish
})
```

---

## Accessibility & Touch Targets

### WCAG 2.1 Touch Target Guidelines

**Minimum Size:** 44x44 CSS pixels (48x48 recommended)

```css
.control-button {
  width: 75px;
  height: 75px;
  /* Ensures comfortable touch even on small screens */
  min-width: 48px;  /* WCAG 2.1 AA minimum */
  min-height: 48px;
}

.action-button {
  min-width: 110px;
  min-height: 60px;
  /* Larger for important actions */
}

/* Even on tiny screens, maintain minimums */
@media (max-width: 320px) {
  .control-button {
    width: 62px;
    height: 62px;
    min-width: 48px;  /* Never go below WCAG minimum */
    min-height: 48px;
  }
}
```

### Touch Target Spacing

```css
.controls-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;  /* Spacing between targets */
}

.action-controls {
  display: flex;
  gap: 12px;  /* Prevents accidental adjacent taps */
}
```

**Why 12px gap?**
- Prevents fat-finger errors
- Clear visual separation
- Comfortable for thumbs

### Semantic HTML & ARIA

```vue
<div
  class="game-board-container"
  role="application"
  aria-label="Tetris game board. Tap to rotate, swipe to move pieces"
  tabindex="0"
>
  <div
    class="game-board"
    role="grid"
    aria-label="Game board with falling tetromino pieces"
  >
    <div
      v-for="(cell, index) in renderBoard"
      class="cell"
      role="gridcell"
      :aria-label="cell ? `${cell} piece` : 'empty cell'"
    />
  </div>
</div>
```

**ARIA Labels:**
- `role="application"` - Indicates custom controls
- `role="grid"` - Semantic grid structure
- `aria-label` - Screen reader descriptions
- `tabindex="0"` - Keyboard focusable

### Button Accessibility

```vue
<button
  class="control-button"
  @click="handleRotate"
  :disabled="!gameState.isPlaying"
  aria-label="Rotate piece"
  type="button"
  role="button"
  tabindex="0"
>↻</button>
```

**Accessibility Features:**
- `aria-label` - Clear action description
- `disabled` state - Prevents invalid actions
- `tabindex` - Keyboard navigation support
- Visual focus states (`:focus-visible`)

### Focus Management

```css
.control-button:focus-visible {
  outline: 3px solid var(--theme-accent);
  outline-offset: 2px;
}

/* Don't show focus on mouse clicks (only keyboard) */
.control-button:focus:not(:focus-visible) {
  outline: none;
}
```

### High Contrast Support

```css
@media (prefers-contrast: high) {
  .control-button {
    border-width: 4px;  /* Thicker borders */
  }

  .piece-i {
    background: #00ffff;
    border: 2px solid #000;  /* Clear piece boundaries */
  }
}
```

---

## Testing on Real Devices

### Why Real Devices Matter

Emulators/simulators **cannot** test:
- Touch gesture accuracy
- Vibration patterns
- Performance on low-end hardware
- Network conditions (3G/4G)
- Battery impact
- Actual screen sizes

### Device Testing Matrix

**Minimum Test Devices:**

| Device | Screen | OS | Why Important |
|--------|--------|-----|---------------|
| iPhone SE | 4.7" (375x667) | iOS 15+ | Small screen, compact layout |
| iPhone 13 | 6.1" (390x844) | iOS 16+ | Standard iPhone |
| Samsung Galaxy S21 | 6.2" (360x800) | Android 12+ | Standard Android |
| Pixel 4a | 5.8" (393x851) | Android 13+ | Mid-range performance |
| iPad Mini | 8.3" (744x1133) | iPadOS 16+ | Tablet layout |

### Remote Debugging Setup

**Android (Chrome DevTools):**
```bash
# 1. Enable USB debugging on device
# Settings > Developer Options > USB Debugging

# 2. Connect device via USB

# 3. Open Chrome DevTools
chrome://inspect/#devices

# 4. Click "Inspect" on your device
```

**iOS (Safari Web Inspector):**
```bash
# 1. Enable Web Inspector on device
# Settings > Safari > Advanced > Web Inspector

# 2. Connect iPhone via USB

# 3. Open Safari on Mac
# Develop > [Your iPhone] > [Website]
```

### Testing Checklist

**Touch Controls:**
- [ ] Tap gesture registers reliably
- [ ] Swipe direction detected correctly
- [ ] No false positives from shaky hands
- [ ] Hard drop vs soft drop distinguishable
- [ ] Touch works with screen protector
- [ ] No palm rejection issues

**Layout:**
- [ ] Side-by-side layout fits screen
- [ ] No horizontal scrolling
- [ ] Controls don't overlap game board
- [ ] Text remains readable
- [ ] All buttons reachable with thumb
- [ ] Works in portrait and landscape

**Performance:**
- [ ] 60fps during gameplay
- [ ] No dropped frames when clearing lines
- [ ] Touch response feels instant (<100ms)
- [ ] No lag during swipe gestures
- [ ] Battery drain acceptable (<10% per hour)

**Haptics:**
- [ ] Vibration patterns feel distinct
- [ ] Not too strong or weak
- [ ] Works with phone in silent mode
- [ ] User can disable vibration

**Network:**
- [ ] App loads on 3G connection
- [ ] Works offline (once cached)
- [ ] No loading delays during gameplay

### Performance Profiling

**Chrome DevTools Performance Tab:**
```javascript
// 1. Record gameplay session
// 2. Look for:
//    - Frame rate drops (should stay 60fps)
//    - Long tasks (>50ms warns, >100ms errors)
//    - Memory leaks (heap size growing)
```

**Lighthouse Mobile Audit:**
```bash
# Run Lighthouse in DevTools
# Mobile settings
# Check Performance score (target: 90+)
```

### Common Device-Specific Issues

**iOS Safari:**
- ❌ No Vibration API support
- ⚠️ 100vh includes address bar (use calc() carefully)
- ⚠️ Touch delay (use `touch-action: manipulation`)

**Android Chrome:**
- ⚠️ Pull-to-refresh conflicts (use `overscroll-behavior: none`)
- ⚠️ Address bar resize on scroll (test with and without)

**Tablet Testing:**
- ⚠️ Touch targets feel small (test with 768px+ breakpoint)
- ⚠️ Landscape orientation default

---

## PWA Configuration

### Progressive Web App Benefits

- **Install to Home Screen**: Fullscreen game experience
- **Offline Play**: No internet required after first load
- **Fast Loading**: Service Worker caching
- **Native Feel**: Removes browser chrome

### Web App Manifest

Create `public/manifest.json`:

```json
{
  "name": "Tetrys - Classic Block Puzzle",
  "short_name": "Tetrys",
  "description": "Classic Tetris game with modern touch controls",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#000000",
  "theme_color": "#00ff00",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ]
}
```

**Manifest Fields Explained:**
- `display: standalone` - Removes browser UI (fullscreen)
- `orientation: portrait` - Locks to portrait (best for Tetris)
- `theme_color` - Android status bar color
- `purpose: maskable` - Adaptive icons (Android)

### Link Manifest in HTML

```html
<!-- index.html -->
<head>
  <link rel="manifest" href="/manifest.json">

  <!-- iOS-specific meta tags -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Tetrys">
  <link rel="apple-touch-icon" href="/icons/icon-152x152.png">
</head>
```

### Service Worker for Caching

Create `public/service-worker.js`:

```javascript
const CACHE_NAME = 'tetrys-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
```

### Register Service Worker

```typescript
// src/main.ts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('SW registered:', registration)
      })
      .catch((error) => {
        console.error('SW registration failed:', error)
      })
  })
}
```

### Install Prompt

```typescript
// Capture install prompt event
let deferredPrompt: any

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  // Show custom install button
  showInstallButton.value = true
})

// Trigger install on button click
const installApp = async () => {
  if (!deferredPrompt) return

  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice

  if (outcome === 'accepted') {
    console.log('User accepted install')
  }

  deferredPrompt = null
  showInstallButton.value = false
}
```

### PWA Testing

**Chrome DevTools:**
```
Application Tab > Manifest
- Check manifest loads correctly
- Verify icons display
- Test "Add to Home Screen"

Application Tab > Service Workers
- Check service worker registered
- Test offline mode (toggle Offline)
```

**Lighthouse PWA Audit:**
- Run Lighthouse audit
- Check "Progressive Web App" section
- Fix any warnings/errors

---

## Offline Support

### Strategies

**1. Cache-First Strategy (Static Assets):**
```javascript
// Service Worker
self.addEventListener('fetch', (event) => {
  if (event.request.destination === 'image' ||
      event.request.destination === 'script' ||
      event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request)
      })
    )
  }
})
```

**2. Network-First Strategy (API Calls):**
```javascript
// For dynamic content (if you add online features later)
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone)
          })
          return response
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(event.request)
        })
    )
  }
})
```

### Offline Detection

```typescript
const isOnline = ref(navigator.onLine)

window.addEventListener('online', () => {
  isOnline.value = true
})

window.addEventListener('offline', () => {
  isOnline.value = false
})
```

### Offline UI Indicator

```vue
<template>
  <div v-if="!isOnline" class="offline-banner">
    ⚠️ You're offline. Game data won't sync.
  </div>
</template>

<style>
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #ff9800;
  color: #000;
  padding: 8px;
  text-align: center;
  font-weight: bold;
  z-index: 1000;
}
</style>
```

---

## Mobile Debugging

### Console Logging on Device

**Eruda (Mobile Console):**
```html
<!-- Add to index.html for development -->
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>
  if (window.location.hostname !== 'localhost') {
    eruda.init()
  }
</script>
```

**vConsole (Alternative):**
```bash
npm install vconsole

# src/main.ts
import VConsole from 'vconsole'

if (import.meta.env.DEV) {
  new VConsole()
}
```

### Remote Debugging Tools

**Chrome DevTools Remote Debugging:**
1. Connect Android device via USB
2. Enable USB debugging
3. Open `chrome://inspect`
4. Inspect device

**Safari Web Inspector (iOS):**
1. Enable Web Inspector on iPhone
2. Connect via USB
3. Safari > Develop > [Device] > [Page]

**Weinre (Wireless Remote Debugging):**
```bash
npm install -g weinre
weinre --boundHost -all-
# Add script to page
```

### Touch Event Debugging

```typescript
// Log all touch events
const debugTouch = ref(false)

if (debugTouch.value) {
  document.addEventListener('touchstart', (e) => {
    console.log('Touch start:', {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now()
    })
  })

  document.addEventListener('touchend', (e) => {
    console.log('Touch end:', {
      time: Date.now()
    })
  })
}
```

### Performance Monitoring

```typescript
// Measure frame rate
let frameCount = 0
let lastTime = performance.now()

function measureFPS() {
  frameCount++
  const now = performance.now()

  if (now >= lastTime + 1000) {
    const fps = Math.round((frameCount * 1000) / (now - lastTime))
    console.log('FPS:', fps)
    frameCount = 0
    lastTime = now
  }

  requestAnimationFrame(measureFPS)
}

if (import.meta.env.DEV) {
  measureFPS()
}
```

---

## Common Issues & Solutions

### Issue: Double-Tap Zoom

**Problem:** iOS Safari zooms on double-tap

**Solution:**
```css
* {
  touch-action: manipulation; /* Disables double-tap zoom */
}
```

```javascript
// Prevent double-tap zoom via JavaScript
let lastTouchEnd = 0
document.addEventListener('touchend', (e) => {
  const now = Date.now()
  if (now - lastTouchEnd <= 300) {
    e.preventDefault()
  }
  lastTouchEnd = now
}, false)
```

### Issue: Pull-to-Refresh Interference

**Problem:** Swiping down triggers browser refresh

**Solution:**
```css
body {
  overscroll-behavior: none; /* Disable pull-to-refresh */
}

.game-board-container {
  touch-action: none; /* Disable all browser gestures */
}
```

### Issue: Address Bar Resize

**Problem:** Mobile address bar hides/shows, changing viewport height

**Solution:**
```css
/* Use CSS custom property for real viewport height */
:root {
  --vh: 1vh;
}

.game-board-container {
  height: calc(var(--vh, 1vh) * 100 - 180px);
}
```

```javascript
// Update --vh on resize
function setVH() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
}

window.addEventListener('resize', setVH)
setVH()
```

### Issue: Text Selection on Long Press

**Problem:** Long-pressing buttons selects text

**Solution:**
```css
* {
  user-select: none;
  -webkit-user-select: none;
}
```

### Issue: Context Menu on Long Press

**Problem:** Long-pressing opens context menu

**Solution:**
```javascript
document.addEventListener('contextmenu', (e) => {
  if (e.target.closest('.control-button')) {
    e.preventDefault()
  }
})
```

### Issue: Vibration Not Working on iOS

**Problem:** iOS blocks Vibration API

**Solution:**
```typescript
// Detect and disable on iOS
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

if (isIOS) {
  console.warn('Vibration not supported on iOS')
  // Hide vibration settings
  showVibrationSettings.value = false
}
```

### Issue: Slow Performance on Low-End Devices

**Problem:** Frame drops on budget Android phones

**Solution:**
```typescript
// Reduce animation complexity
const isLowEndDevice = () => {
  return navigator.hardwareConcurrency <= 4 &&
         navigator.deviceMemory <= 2
}

if (isLowEndDevice()) {
  // Disable expensive animations
  disableParticleEffects.value = true
  reducedMotion.value = true
}
```

### Issue: Landscape Mode Not Working

**Problem:** Game doesn't adapt to landscape orientation

**Solution:**
```css
@media (orientation: landscape) and (max-height: 500px) {
  .game-board-container {
    max-width: calc(100vw - 200px);
    height: calc(100vh - 120px);
  }

  .control-button {
    width: 48px;
    height: 48px;
  }
}
```

---

## Best Practices

### Mobile Game Development Checklist

**Design:**
- [ ] Mobile-first approach (design for small screens)
- [ ] Side-by-side layout for maximum vertical space
- [ ] Touch targets ≥48x48px (WCAG compliance)
- [ ] Clear visual feedback for all interactions
- [ ] Support both portrait and landscape

**Touch Controls:**
- [ ] Intuitive gesture system (tap, swipe)
- [ ] Fallback button controls for accessibility
- [ ] Prevent browser interference (zoom, refresh, context menu)
- [ ] Touch state management (start, move, end, cancel)
- [ ] Debounce rapid touches

**Haptics:**
- [ ] Action-specific vibration patterns
- [ ] User preference toggle
- [ ] Browser support detection
- [ ] Fallback for iOS (no vibration)

**Performance:**
- [ ] 60fps during gameplay
- [ ] Minimal DOM manipulations (use computed)
- [ ] GPU-accelerated transforms
- [ ] No long tasks (>50ms)
- [ ] Memory leak prevention

**Accessibility:**
- [ ] WCAG 2.1 AA compliance
- [ ] Semantic HTML and ARIA labels
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] High contrast mode support
- [ ] Screen reader compatibility

**Testing:**
- [ ] Test on real iOS and Android devices
- [ ] Test on low-end and high-end devices
- [ ] Test in portrait and landscape
- [ ] Test offline functionality
- [ ] Test with slow 3G network
- [ ] Remote debugging setup

**PWA:**
- [ ] Web App Manifest configured
- [ ] Service Worker for offline caching
- [ ] Install prompt implemented
- [ ] App icons (72px to 512px)
- [ ] iOS meta tags for home screen

### Code Organization

```
src/
├── components/
│   ├── GameBoard.vue          # Touch gesture handling
│   ├── GameControls.vue       # Button controls
│   └── MobileLayout.vue       # Responsive layout
├── composables/
│   ├── useVibration.ts        # Haptic feedback
│   ├── useTouchGestures.ts    # Gesture recognition
│   └── useResponsive.ts       # Breakpoint utilities
└── utils/
    ├── touchUtils.ts          # Touch helpers
    └── performanceUtils.ts    # Performance monitoring
```

### Performance Budgets

Set and enforce performance targets:

```typescript
const PERFORMANCE_BUDGETS = {
  fps: 60,                    // Target frame rate
  touchResponse: 100,         // Max touch-to-action delay (ms)
  initialLoad: 3000,          // Max first load time (ms)
  maxBundleSize: 500,         // Max JavaScript bundle (KB)
  maxMemory: 50 * 1024 * 1024 // Max memory usage (50MB)
}
```

### Testing Strategy

**Automated Tests:**
```typescript
// Vitest example
describe('Touch Gestures', () => {
  it('should detect tap gesture', () => {
    const touchStart = { clientX: 100, clientY: 100, time: 0 }
    const touchEnd = { clientX: 105, clientY: 105, time: 150 }

    const gesture = detectGesture(touchStart, touchEnd)
    expect(gesture.type).toBe('tap')
  })

  it('should detect swipe right', () => {
    const touchStart = { clientX: 100, clientY: 100, time: 0 }
    const touchEnd = { clientX: 200, clientY: 105, time: 200 }

    const gesture = detectGesture(touchStart, touchEnd)
    expect(gesture.type).toBe('swipe-right')
  })
})
```

**Manual Test Script:**
```
1. Portrait Mode:
   - [ ] Tap to rotate works
   - [ ] Swipe left/right moves piece
   - [ ] Swipe down soft drops
   - [ ] Long swipe down hard drops
   - [ ] No scrolling during swipes

2. Landscape Mode:
   - [ ] Layout adapts correctly
   - [ ] Controls remain usable
   - [ ] Game board maximizes space

3. Performance:
   - [ ] 60fps during active gameplay
   - [ ] Smooth transitions
   - [ ] No stuttering on piece movement

4. Offline:
   - [ ] Game loads from cache
   - [ ] Fully playable offline
   - [ ] No errors in console
```

---

## Additional Resources

### Documentation
- [MDN Touch Events Guide](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Web Vibration API](https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API)
- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Tools
- [Chrome DevTools Mobile Emulation](https://developer.chrome.com/docs/devtools/device-mode/)
- [Lighthouse Performance Audit](https://developers.google.com/web/tools/lighthouse)
- [WebPageTest Mobile Testing](https://www.webpagetest.org/)
- [BrowserStack Real Device Testing](https://www.browserstack.com/)

### Libraries
- [Hammer.js](https://hammerjs.github.io/) - Advanced touch gestures
- [FastClick](https://github.com/ftlabs/fastclick) - Remove click delays (legacy)
- [Workbox](https://developers.google.com/web/tools/workbox) - Service Worker toolkit

---

## Conclusion

Mobile development for Tetrys focuses on:

1. **Touch-First Design**: Intuitive gestures with button fallbacks
2. **Responsive Layouts**: Adapts to all screen sizes and orientations
3. **Haptic Feedback**: Rich tactile feedback for immersive gameplay
4. **Performance**: 60fps on low-end devices
5. **Accessibility**: WCAG compliant touch targets and keyboard support
6. **PWA Capabilities**: Offline play and installable experience

By following these practices, Tetrys delivers a polished mobile gaming experience that rivals native apps while remaining accessible and performant across diverse devices and network conditions.
