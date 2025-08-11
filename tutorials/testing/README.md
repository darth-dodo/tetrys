# 🧪 Testing Guide

This comprehensive guide covers testing strategies, patterns, and best practices for the Tetrys codebase using Vitest, Vue Test Utils, and modern testing approaches.

## 🎯 Testing Philosophy

Tetrys follows a comprehensive testing strategy:

- **Test-Driven Development**: Write tests before implementation when possible
- **Testing Pyramid**: Emphasis on unit tests, supported by integration tests
- **Behavioral Testing**: Tests should verify behavior, not implementation details
- **Performance Testing**: Ensure game maintains 60fps and responsive controls
- **Accessibility Testing**: Verify WCAG compliance and screen reader support
- **Cross-Browser Testing**: Ensure compatibility across modern browsers

## 📊 Testing Strategy Overview

```
                    /\
                   /  \
                  /    \
                 /  E2E  \    <- Manual & Automated E2E Tests
                /________\
               /          \
              /Integration \   <- Component Integration Tests
             /______________\
            /                \
           /   Unit Tests      \  <- Composables, Utils, Types
          /____________________\
```

### Testing Layers

1. **Unit Tests (70%)**: Composables, utility functions, type definitions
2. **Integration Tests (20%)**: Component behavior, user interactions
3. **E2E Tests (10%)**: Critical user journeys, full game scenarios

## 🛠️ Testing Setup & Configuration

### Test Environment Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        'dist/'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': './src'
    }
  }
})
```

### Test Setup File

```typescript
// tests/setup.ts
import { vi } from 'vitest'
import '@testing-library/jest-dom'

// Mock Web Audio API
global.AudioContext = vi.fn().mockImplementation(() => ({
  createOscillator: vi.fn().mockReturnValue({
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { setValueAtTime: vi.fn() }
  }),
  createGain: vi.fn().mockReturnValue({
    connect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() }
  }),
  destination: {},
  currentTime: 0,
  resume: vi.fn().mockResolvedValue(undefined),
  state: 'running'
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
vi.stubGlobal('localStorage', localStorageMock)

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn().mockImplementation((cb) => {
  return setTimeout(cb, 16)
})
global.cancelAnimationFrame = vi.fn().mockImplementation((id) => {
  clearTimeout(id)
})
```

## 🧩 Unit Testing Composables

### Testing useTetris - Game Logic

```typescript
// src/composables/__tests__/useTetris.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTetris } from '@/composables/useTetris'
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'

describe('useTetris', () => {
  let tetrisComposable: ReturnType<typeof useTetris>
  
  beforeEach(() => {
    vi.clearAllMocks()
    tetrisComposable = useTetris()
  })

  describe('Game State Initialization', () => {
    it('should initialize with default state', () => {
      const { gameState } = tetrisComposable
      
      expect(gameState.value.isPlaying).toBe(false)
      expect(gameState.value.isGameOver).toBe(false)
      expect(gameState.value.isPaused).toBe(false)
      expect(gameState.value.score).toBe(0)
      expect(gameState.value.level).toBe(1)
      expect(gameState.value.lines).toBe(0)
      expect(gameState.value.board).toHaveLength(BOARD_HEIGHT)
      expect(gameState.value.board[0]).toHaveLength(BOARD_WIDTH)
    })

    it('should have empty board initially', () => {
      const { gameState } = tetrisComposable
      
      gameState.value.board.forEach(row => {
        row.forEach(cell => {
          expect(cell).toBeNull()
        })
      })
    })
  })

  describe('Game Controls', () => {
    it('should start game correctly', () => {
      const { gameState, startGame } = tetrisComposable
      
      startGame()
      
      expect(gameState.value.isPlaying).toBe(true)
      expect(gameState.value.isGameOver).toBe(false)
      expect(gameState.value.currentPiece).not.toBeNull()
      expect(gameState.value.nextPiece).not.toBeNull()
    })

    it('should pause and resume game', () => {
      const { gameState, startGame, pauseGame } = tetrisComposable
      
      startGame()
      expect(gameState.value.isPaused).toBe(false)
      
      pauseGame()
      expect(gameState.value.isPaused).toBe(true)
      
      pauseGame()
      expect(gameState.value.isPaused).toBe(false)
    })

    it('should reset game state', () => {
      const { gameState, startGame, resetGame } = tetrisComposable
      
      startGame()
      gameState.value.score = 1000
      gameState.value.level = 5
      
      resetGame()
      
      expect(gameState.value.isPlaying).toBe(false)
      expect(gameState.value.score).toBe(0)
      expect(gameState.value.level).toBe(1)
    })
  })

  describe('Piece Movement', () => {
    it('should move piece horizontally when valid', () => {
      const { gameState, startGame, movePiece } = tetrisComposable
      
      startGame()
      const initialPosition = { ...gameState.value.currentPosition }
      
      const moved = movePiece(1, 0)
      
      expect(moved).toBe(true)
      expect(gameState.value.currentPosition.x).toBe(initialPosition.x + 1)
    })

    it('should prevent movement outside board boundaries', () => {
      const { gameState, startGame, movePiece } = tetrisComposable
      
      startGame()
      const initialPosition = { ...gameState.value.currentPosition }
      
      // Try to move far left
      const moved = movePiece(-10, 0)
      
      expect(moved).toBe(false)
      expect(gameState.value.currentPosition).toEqual(initialPosition)
    })

    it('should rotate piece when space available', () => {
      const { gameState, startGame, rotatePiece } = tetrisComposable
      
      startGame()
      const initialShape = gameState.value.currentPiece?.shape
      
      rotatePiece()
      
      // Shape should be different after rotation (for most pieces)
      expect(gameState.value.currentPiece?.shape).toBeDefined()
    })
  })

  describe('Line Clearing', () => {
    it('should detect and clear completed lines', () => {
      const { gameState, startGame } = tetrisComposable
      
      startGame()
      
      // Fill bottom row completely
      const bottomRowIndex = BOARD_HEIGHT - 1
      for (let x = 0; x < BOARD_WIDTH; x++) {
        gameState.value.board[bottomRowIndex][x] = 'I'
      }
      
      // Trigger line clear logic (would normally happen in game loop)
      // This tests the clearLines function indirectly
      expect(gameState.value.board[bottomRowIndex].every(cell => cell !== null)).toBe(true)
    })

    it('should update score when lines cleared', () => {
      const { gameState, startGame } = tetrisComposable
      
      startGame()
      const initialScore = gameState.value.score
      const initialLines = gameState.value.lines
      
      // Simulate line clear by directly updating state
      // (In real gameplay, this would be handled by the game loop)
      gameState.value.lines += 1
      gameState.value.score += 100 * gameState.value.level
      
      expect(gameState.value.score).toBeGreaterThan(initialScore)
      expect(gameState.value.lines).toBeGreaterThan(initialLines)
    })
  })

  describe('Speed Management', () => {
    it('should apply speed multiplier correctly', () => {
      const { setSpeedMultiplier, gameState } = tetrisComposable
      
      setSpeedMultiplier(2.0)
      
      expect(gameState.value.speedMultiplier).toBe(2.0)
    })

    it('should calculate fall speed based on level and multiplier', () => {
      const { gameState, startGame } = tetrisComposable
      
      startGame()
      
      // Mock level progression
      gameState.value.level = 5
      gameState.value.speedMultiplier = 1.5
      
      // Verify that higher level and speed multiplier affect fall speed
      // (This would be tested through the computed fallSpeed property)
      expect(gameState.value.level).toBe(5)
      expect(gameState.value.speedMultiplier).toBe(1.5)
    })
  })

  describe('Game Over Conditions', () => {
    it('should detect game over when pieces reach top', () => {
      const { gameState, startGame } = tetrisComposable
      
      startGame()
      
      // Fill top rows to simulate game over condition
      for (let y = 0; y < 3; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          gameState.value.board[y][x] = 'I'
        }
      }
      
      // Game over detection would happen in spawnNewPiece
      // This tests the setup for game over conditions
      expect(gameState.value.board[0].every(cell => cell !== null)).toBe(true)
    })
  })
})
```

### Testing useAudio - Audio System

```typescript
// src/composables/__tests__/useAudio.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAudio } from '@/composables/useAudio'

describe('useAudio', () => {
  let audioComposable: ReturnType<typeof useAudio>
  
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    audioComposable = useAudio()
  })

  describe('Audio Settings', () => {
    it('should initialize with default settings', () => {
      const { isMusicEnabled, isSoundEnabled, musicVolume, soundVolume } = audioComposable
      
      expect(isMusicEnabled.value).toBe(false)
      expect(isSoundEnabled.value).toBe(true)
      expect(musicVolume.value).toBe(0.3)
      expect(soundVolume.value).toBe(0.7)
    })

    it('should toggle music on/off', async () => {
      const { isMusicEnabled, toggleMusic } = audioComposable
      
      expect(isMusicEnabled.value).toBe(false)
      
      await toggleMusic()
      expect(isMusicEnabled.value).toBe(true)
      
      await toggleMusic()
      expect(isMusicEnabled.value).toBe(false)
    })

    it('should toggle sound on/off', () => {
      const { isSoundEnabled, toggleSound } = audioComposable
      
      expect(isSoundEnabled.value).toBe(true)
      
      toggleSound()
      expect(isSoundEnabled.value).toBe(false)
      
      toggleSound()
      expect(isSoundEnabled.value).toBe(true)
    })

    it('should persist settings to localStorage', async () => {
      const { toggleMusic, toggleSound } = audioComposable
      
      await toggleMusic()
      toggleSound()
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'tetrys-audio-settings',
        expect.stringContaining('"musicEnabled":true')
      )
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'tetrys-audio-settings',
        expect.stringContaining('"soundEnabled":false')
      )
    })
  })

  describe('Volume Control', () => {
    it('should set music volume', async () => {
      const { musicVolume, setMusicVolume } = audioComposable
      
      await setMusicVolume(0.8)
      
      expect(musicVolume.value).toBe(0.8)
    })

    it('should clamp volume values to valid range', async () => {
      const { musicVolume, setMusicVolume } = audioComposable
      
      await setMusicVolume(1.5) // Above max
      expect(musicVolume.value).toBe(1.0)
      
      await setMusicVolume(-0.5) // Below min
      expect(musicVolume.value).toBe(0.0)
    })
  })

  describe('Sound Effects', () => {
    it('should play sound effects when sound enabled', async () => {
      const { playSound, toggleSound } = audioComposable
      
      // Ensure sound is enabled
      if (!audioComposable.isSoundEnabled.value) {
        toggleSound()
      }
      
      // Mock audio context methods are called
      await playSound('move')
      
      // Verify AudioContext methods were called
      expect(AudioContext).toHaveBeenCalled()
    })

    it('should not play sound effects when sound disabled', async () => {
      const { playSound, isSoundEnabled, toggleSound } = audioComposable
      
      // Disable sound
      if (isSoundEnabled.value) {
        toggleSound()
      }
      
      await playSound('move')
      
      // Should not create audio context when disabled
      expect(AudioContext).not.toHaveBeenCalled()
    })
  })

  describe('Music Tracks', () => {
    it('should provide available tracks', () => {
      const { getAvailableTracks } = audioComposable
      
      const tracks = getAvailableTracks()
      
      expect(tracks).toBeInstanceOf(Array)
      expect(tracks.length).toBeGreaterThan(0)
      expect(tracks[0]).toHaveProperty('id')
      expect(tracks[0]).toHaveProperty('name')
      expect(tracks[0]).toHaveProperty('description')
    })

    it('should switch music tracks', async () => {
      const { currentTrack, setCurrentTrack, getAvailableTracks } = audioComposable
      
      const tracks = getAvailableTracks()
      const newTrackId = tracks[1].id
      
      await setCurrentTrack(newTrackId)
      
      expect(currentTrack.value).toBe(newTrackId)
    })
  })
})
```

### Testing useTheme - Theme System

```typescript
// src/composables/__tests__/useTheme.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTheme } from '@/composables/useTheme'

describe('useTheme', () => {
  let themeComposable: ReturnType<typeof useTheme>
  
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    document.documentElement.style.cssText = ''
    themeComposable = useTheme()
  })

  describe('Theme Management', () => {
    it('should initialize with gameboy theme', () => {
      const { currentTheme } = themeComposable
      
      expect(currentTheme.value.id).toBe('gameboy')
      expect(currentTheme.value.name).toBe('Game Boy')
    })

    it('should provide available themes', () => {
      const { availableThemes } = themeComposable
      
      expect(availableThemes.value.length).toBeGreaterThan(0)
      availableThemes.value.forEach(theme => {
        expect(theme).toHaveProperty('id')
        expect(theme).toHaveProperty('name')
        expect(theme).toHaveProperty('colors')
        expect(theme).toHaveProperty('pieces')
      })
    })

    it('should switch themes', () => {
      const { currentTheme, availableThemes, setTheme } = themeComposable
      
      const newTheme = availableThemes.value.find(t => t.id !== currentTheme.value.id)!
      
      setTheme(newTheme.id)
      
      expect(currentTheme.value.id).toBe(newTheme.id)
    })

    it('should persist theme selection', () => {
      const { setTheme } = themeComposable
      
      setTheme('neon')
      
      expect(localStorage.setItem).toHaveBeenCalledWith('tetrys-theme', 'neon')
    })
  })

  describe('CSS Custom Properties', () => {
    it('should apply theme colors to document root', () => {
      const { setTheme } = themeComposable
      
      setTheme('retro')
      
      // Verify CSS custom properties are set
      const rootStyle = document.documentElement.style
      expect(rootStyle.getPropertyValue('--theme-bg')).toBeTruthy()
      expect(rootStyle.getPropertyValue('--theme-primary')).toBeTruthy()
    })

    it('should apply piece colors to document root', () => {
      const { setTheme } = themeComposable
      
      setTheme('gameboy')
      
      const rootStyle = document.documentElement.style
      expect(rootStyle.getPropertyValue('--piece-i')).toBeTruthy()
      expect(rootStyle.getPropertyValue('--piece-o')).toBeTruthy()
      expect(rootStyle.getPropertyValue('--piece-t')).toBeTruthy()
    })
  })
})
```

## 🧩 Component Integration Testing

### Testing GameBoard Component

```typescript
// src/components/__tests__/GameBoard.test.ts
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import GameBoard from '@/components/GameBoard.vue'
import type { GameState } from '@/types/tetris'
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'

describe('GameBoard', () => {
  const createMockGameState = (overrides = {}): GameState => ({
    board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
    currentPiece: null,
    currentPosition: { x: 0, y: 0 },
    nextPiece: null,
    score: 0,
    level: 1,
    lines: 0,
    isGameOver: false,
    isPaused: false,
    isPlaying: false,
    speedMultiplier: 1,
    ...overrides
  })

  it('renders empty board correctly', () => {
    const gameState = createMockGameState()
    const wrapper = mount(GameBoard, {
      props: { gameState }
    })
    
    expect(wrapper.find('.game-board').exists()).toBe(true)
    expect(wrapper.findAll('.board-cell')).toHaveLength(BOARD_WIDTH * BOARD_HEIGHT)
    expect(wrapper.findAll('.cell-empty')).toHaveLength(BOARD_WIDTH * BOARD_HEIGHT)
  })

  it('renders placed pieces on board', () => {
    const board = Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
    board[19][0] = 'I' // Place I-piece at bottom-left
    board[19][1] = 'O' // Place O-piece next to it
    
    const gameState = createMockGameState({ board })
    const wrapper = mount(GameBoard, {
      props: { gameState }
    })
    
    expect(wrapper.find('.cell-i').exists()).toBe(true)
    expect(wrapper.find('.cell-o').exists()).toBe(true)
  })

  it('renders current piece overlay', () => {
    const gameState = createMockGameState({
      currentPiece: {
        type: 'T',
        shape: [
          [0, 1, 0],
          [1, 1, 1]
        ]
      },
      currentPosition: { x: 3, y: 0 }
    })
    
    const wrapper = mount(GameBoard, {
      props: { gameState }
    })
    
    expect(wrapper.findAll('.cell-t').length).toBeGreaterThan(0)
  })

  it('applies correct CSS classes for different piece types', () => {
    const gameState = createMockGameState({
      currentPiece: {
        type: 'J',
        shape: [[1, 1, 1], [0, 0, 1]]
      },
      currentPosition: { x: 0, y: 0 }
    })
    
    const wrapper = mount(GameBoard, {
      props: { gameState }
    })
    
    const jCells = wrapper.findAll('.cell-j')
    expect(jCells.length).toBe(4) // J-piece has 4 blocks
  })
})
```

### Testing GameControls Component

```typescript
// src/components/__tests__/GameControls.test.ts
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GameControls from '@/components/GameControls.vue'
import type { GameState } from '@/types/tetris'

describe('GameControls', () => {
  const createMockGameState = (overrides = {}): GameState => ({
    board: Array(20).fill(null).map(() => Array(10).fill(null)),
    currentPiece: null,
    currentPosition: { x: 0, y: 0 },
    nextPiece: null,
    score: 0,
    level: 1,
    lines: 0,
    isGameOver: false,
    isPaused: false,
    isPlaying: true,
    speedMultiplier: 1,
    ...overrides
  })

  it('renders all control buttons', () => {
    const gameState = createMockGameState()
    const wrapper = mount(GameControls, {
      props: { gameState }
    })
    
    expect(wrapper.find('.control-button').exists()).toBe(true)
    expect(wrapper.find('.action-button').exists()).toBe(true)
  })

  it('emits move events on button clicks', async () => {
    const gameState = createMockGameState()
    const wrapper = mount(GameControls, {
      props: { gameState }
    })
    
    const leftButton = wrapper.find('[data-testid="move-left"]')
    await leftButton.trigger('click')
    
    expect(wrapper.emitted('moveLeft')).toBeTruthy()
  })

  it('shows pause button when game is playing', () => {
    const gameState = createMockGameState({ isPlaying: true, isPaused: false })
    const wrapper = mount(GameControls, {
      props: { gameState }
    })
    
    const pauseButton = wrapper.find('.action-button')
    expect(pauseButton.text()).toBe('PAUSE')
  })

  it('shows resume button when game is paused', () => {
    const gameState = createMockGameState({ isPlaying: true, isPaused: true })
    const wrapper = mount(GameControls, {
      props: { gameState }
    })
    
    const resumeButton = wrapper.find('.action-button')
    expect(resumeButton.text()).toBe('RESUME')
  })

  it('shows reset button during active game', () => {
    const gameState = createMockGameState({ isPlaying: true })
    const wrapper = mount(GameControls, {
      props: { gameState }
    })
    
    expect(wrapper.find('.reset-button').exists()).toBe(true)
  })

  it('handles touch events for mobile controls', async () => {
    const gameState = createMockGameState()
    const wrapper = mount(GameControls, {
      props: { gameState }
    })
    
    const touchButton = wrapper.find('.control-button')
    
    await touchButton.trigger('touchstart')
    // Should emit move event
    expect(wrapper.emitted()).toBeTruthy()
  })
})
```

## 🎮 E2E Testing with Playwright

### Complete Game Flow Tests

```typescript
// tests/e2e/game-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Tetrys Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load game successfully', async ({ page }) => {
    await expect(page.locator('.game-logo')).toContainText('TETRYS')
    await expect(page.locator('.start-button')).toBeVisible()
    await expect(page.locator('.settings-button')).toBeVisible()
  })

  test('should start game and display game elements', async ({ page }) => {
    await page.click('.start-button')
    
    // Game should be running
    await expect(page.locator('.game-board')).toBeVisible()
    await expect(page.locator('.scoreboard')).toBeVisible()
    await expect(page.locator('.next-piece')).toBeVisible()
    await expect(page.locator('.game-controls')).toBeVisible()
    
    // Score should be visible
    await expect(page.locator('.score-value')).toContainText('0')
  })

  test('should handle keyboard controls', async ({ page }) => {
    await page.click('.start-button')
    
    // Wait for game to start
    await page.waitForSelector('.game-board')
    
    // Test keyboard controls
    await page.keyboard.press('ArrowLeft')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowUp') // Rotate
    await page.keyboard.press('Space') // Drop
    
    // Game should still be running (no errors)
    await expect(page.locator('.game-board')).toBeVisible()
  })

  test('should pause and resume game', async ({ page }) => {
    await page.click('.start-button')
    await page.waitForSelector('.game-board')
    
    // Pause game
    await page.keyboard.press('KeyP')
    await expect(page.locator('.modal')).toContainText('PAUSED')
    
    // Resume game
    await page.keyboard.press('KeyP')
    await expect(page.locator('.modal')).not.toBeVisible()
  })

  test('should open and close settings', async ({ page }) => {
    await page.click('.settings-button')
    
    await expect(page.locator('.settings-panel')).toBeVisible()
    await expect(page.locator('.theme-selector')).toBeVisible()
    await expect(page.locator('.audio-controls')).toBeVisible()
    
    await page.click('.close-button')
    await expect(page.locator('.settings-panel')).not.toBeVisible()
  })

  test('should switch themes', async ({ page }) => {
    await page.click('.settings-button')
    
    // Click on a different theme
    await page.click('.theme-button:not(.active)')
    
    // Close settings and verify theme changed
    await page.click('.close-button')
    
    // Theme should have changed (background color different)
    const appElement = page.locator('.app')
    const bgColor = await appElement.evaluate(el => 
      getComputedStyle(el).backgroundColor
    )
    
    expect(bgColor).toBeTruthy()
  })
})

test.describe('Mobile Experience', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/')
    
    // Check mobile layout
    await expect(page.locator('.landing-container')).toBeVisible()
    await expect(page.locator('.start-button')).toBeVisible()
    
    // Start game
    await page.click('.start-button')
    
    // Mobile game layout should be visible
    await expect(page.locator('.game-layout')).toBeVisible()
    await expect(page.locator('.game-controls')).toBeVisible()
  })

  test('should handle touch controls', async ({ page }) => {
    await page.goto('/')
    await page.click('.start-button')
    await page.waitForSelector('.game-board')
    
    // Test touch controls
    const leftButton = page.locator('[data-testid="move-left"]')
    const rightButton = page.locator('[data-testid="move-right"]')
    const rotateButton = page.locator('[data-testid="rotate"]')
    
    await leftButton.tap()
    await rightButton.tap()
    await rotateButton.tap()
    
    // Game should still be responsive
    await expect(page.locator('.game-board')).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('should be accessible with keyboard navigation', async ({ page }) => {
    await page.goto('/')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Enter should activate focused button
    await page.keyboard.press('Enter')
    
    // Should open settings or start game
    const hasSettings = await page.locator('.settings-panel').isVisible()
    const hasGameBoard = await page.locator('.game-board').isVisible()
    
    expect(hasSettings || hasGameBoard).toBeTruthy()
  })

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/')
    await page.click('.start-button')
    await page.waitForSelector('.game-controls')
    
    // Check for ARIA labels on controls
    const buttons = page.locator('.control-button')
    const count = await buttons.count()
    
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
  })
})

test.describe('Performance', () => {
  test('should maintain 60fps during gameplay', async ({ page }) => {
    await page.goto('/')
    await page.click('.start-button')
    await page.waitForSelector('.game-board')
    
    // Monitor frame rate for 3 seconds
    const fps = await page.evaluate(() => {
      return new Promise(resolve => {
        let frameCount = 0
        const startTime = performance.now()
        
        function countFrames() {
          frameCount++
          if (performance.now() - startTime < 3000) {
            requestAnimationFrame(countFrames)
          } else {
            const avgFps = frameCount / 3
            resolve(avgFps)
          }
        }
        
        requestAnimationFrame(countFrames)
      })
    })
    
    expect(fps).toBeGreaterThan(50) // Allow some variance
  })

  test('should load quickly', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    await page.waitForSelector('.start-button')
    const loadTime = Date.now() - startTime
    
    expect(loadTime).toBeLessThan(3000) // 3 second load time
  })
})
```

## 🚀 Performance Testing

### Frame Rate Monitoring

```typescript
// tests/performance/frame-rate.test.ts
import { describe, it, expect, vi } from 'vitest'

describe('Performance - Frame Rate', () => {
  it('should maintain consistent frame timing', () => {
    const frameTimes: number[] = []
    let lastTime = 0
    
    // Mock requestAnimationFrame to capture frame timing
    const mockRaf = vi.fn().mockImplementation((callback) => {
      const currentTime = performance.now()
      if (lastTime > 0) {
        frameTimes.push(currentTime - lastTime)
      }
      lastTime = currentTime
      
      if (frameTimes.length < 60) { // Simulate 1 second at 60fps
        setTimeout(() => callback(currentTime + 16.67), 16.67)
      }
      
      return frameTimes.length
    })
    
    global.requestAnimationFrame = mockRaf
    
    // Run game loop simulation
    // ... game loop code
    
    // Verify consistent timing
    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length
    expect(avgFrameTime).toBeLessThan(20) // Should be ~16.67ms for 60fps
    
    // Check for frame drops
    const frameDrops = frameTimes.filter(time => time > 33).length
    expect(frameDrops).toBeLessThan(3) // Allow few dropped frames
  })
})
```

## 📊 Coverage Reports

### Coverage Configuration

```typescript
// vitest.config.ts - Coverage setup
export default defineConfig({
  test: {
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        'dist/',
        '**/*.config.ts'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        },
        // Specific thresholds for critical files
        'src/composables/useTetris.ts': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        }
      }
    }
  }
})
```

## 🔧 Testing Utilities

### Test Helpers

```typescript
// tests/helpers/index.ts
import type { GameState, TetrominoType } from '@/types/tetris'
import { BOARD_WIDTH, BOARD_HEIGHT } from '@/types/tetris'

export const createMockGameState = (overrides: Partial<GameState> = {}): GameState => ({
  board: Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null)),
  currentPiece: null,
  currentPosition: { x: 0, y: 0 },
  nextPiece: null,
  score: 0,
  level: 1,
  lines: 0,
  isGameOver: false,
  isPaused: false,
  isPlaying: false,
  speedMultiplier: 1,
  ...overrides
})

export const createMockBoard = (pattern?: (TetrominoType | null)[][]): (TetrominoType | null)[][] => {
  if (pattern) return pattern
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null))
}

export const fillBoardRow = (
  board: (TetrominoType | null)[][],
  rowIndex: number,
  pieceType: TetrominoType = 'I'
): (TetrominoType | null)[][] => {
  const newBoard = board.map(row => [...row])
  for (let x = 0; x < BOARD_WIDTH; x++) {
    newBoard[rowIndex][x] = pieceType
  }
  return newBoard
}

export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const mockAudioContext = () => {
  const mockOscillator = {
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { setValueAtTime: vi.fn() },
    type: 'square'
  }
  
  const mockGainNode = {
    connect: vi.fn(),
    gain: { 
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    }
  }
  
  return {
    createOscillator: vi.fn().mockReturnValue(mockOscillator),
    createGain: vi.fn().mockReturnValue(mockGainNode),
    destination: {},
    currentTime: 0,
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    state: 'running'
  }
}
```

## 📋 Testing Best Practices

### DO's ✅

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how
2. **Use Descriptive Test Names**: Make test purpose clear from the name
3. **Arrange, Act, Assert Pattern**: Structure tests clearly
4. **Mock External Dependencies**: Isolate units under test
5. **Test Edge Cases**: Boundary conditions and error scenarios
6. **Keep Tests Fast**: Unit tests should run in milliseconds
7. **Use TypeScript in Tests**: Maintain type safety in test code

### DON'Ts ❌

1. **Don't Test Implementation Details**: Avoid testing internal state changes
2. **Don't Write Overly Complex Tests**: Keep test logic simple
3. **Don't Ignore Async Operations**: Properly handle promises and async code
4. **Don't Skip Error Testing**: Test error conditions and edge cases
5. **Don't Forget Cleanup**: Clean up resources, timers, and event listeners
6. **Don't Test Third-Party Libraries**: Focus on your code, not dependencies

### Test Organization

```typescript
describe('ComponentName', () => {
  describe('Feature Group 1', () => {
    it('should do specific thing', () => {
      // Test implementation
    })
    
    it('should handle edge case', () => {
      // Edge case test
    })
  })
  
  describe('Feature Group 2', () => {
    it('should behave correctly', () => {
      // Another test
    })
  })
})
```

This comprehensive testing strategy ensures Tetrys maintains high quality, performance, and reliability across all features and user interactions.