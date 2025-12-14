# Test Infrastructure

This directory contains the test infrastructure for the Tetrys project.

## Files

### `setup.ts`
Global test setup file that runs before all tests. Provides mocks for:
- **Web Audio API**: MockAudioContext, MockGainNode, MockOscillatorNode
- **localStorage**: Full localStorage implementation for testing
- **requestAnimationFrame/cancelAnimationFrame**: Animation frame mocking with manual triggers
- **HTMLMediaElement**: Mocked play(), pause(), and load() methods

### `helpers.ts`
Utility functions for creating test data and assertions:

#### Board Creation
- `createEmptyBoard()` - Creates empty 10x20 board
- `createBoardWithPieces(pieces)` - Creates board with pieces at specific positions
- `createBoardWithCompleteRow(y, type)` - Creates board with one complete row
- `createBoardWithCompleteRows(rows, type)` - Creates board with multiple complete rows
- `createBoardFromPattern(pattern, fillType)` - Creates board from ASCII pattern

#### localStorage Utilities
- `clearLocalStorage()` - Clears all localStorage data
- `setupLocalStorage(data)` - Sets up localStorage with mock data
- `getLocalStorageData<T>(key)` - Retrieves parsed data from localStorage

#### Board Analysis
- `countFilledCells(board)` - Counts non-null cells
- `isRowComplete(row)` - Checks if row is complete
- `getCompleteRows(board)` - Returns indices of complete rows
- `printBoard(board, label?)` - Prints board to console for debugging

## Usage Examples

### Basic Board Testing
```typescript
import { createEmptyBoard, createBoardWithPieces } from '@/__tests__/helpers'

it('should handle empty board', () => {
  const board = createEmptyBoard()
  expect(board[0][0]).toBeNull()
})

it('should place pieces', () => {
  const board = createBoardWithPieces([
    { type: 'I', x: 0, y: 19 },
    { type: 'O', x: 5, y: 18 }
  ])
  expect(board[19][0]).toBe('I')
})
```

### Pattern-Based Testing
```typescript
import { createBoardFromPattern } from '@/__tests__/helpers'

it('should detect collision', () => {
  const board = createBoardFromPattern([
    '..........',
    '..........',
    '....XX....',
    '....XX....'
  ], 'O')
  // Test collision logic
})
```

### localStorage Testing
```typescript
import { setupLocalStorage, getLocalStorageData, clearLocalStorage } from '@/__tests__/helpers'

beforeEach(() => {
  clearLocalStorage()
})

it('should save high score', () => {
  setupLocalStorage({ highScore: 1000 })
  const score = getLocalStorageData<number>('highScore')
  expect(score).toBe(1000)
})
```

### Audio Testing
```typescript
import { vi } from 'vitest'

it('should play sound', () => {
  const ctx = new AudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  expect(() => oscillator.start()).not.toThrow()
})
```

### Animation Frame Testing
```typescript
import { triggerAnimationFrame, getAnimationFrameCount } from '@/__tests__/setup'

it('should handle animation frames', () => {
  const callback = vi.fn()
  requestAnimationFrame(callback)

  triggerAnimationFrame(16.67)
  expect(callback).toHaveBeenCalledWith(16.67)
})
```

## Test Scripts

Run tests with the following commands:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run tests for CI (with verbose output)
npm run test:ci
```

## Coverage Configuration

Coverage is configured with v8 provider and requires 80% thresholds for:
- Lines
- Functions
- Branches
- Statements

Excluded from coverage:
- `node_modules/`
- `src/__tests__/`
- `**/*.d.ts`
- `**/*.config.*`
- `**/mockData`
- `dist/`

## Best Practices

1. **Always clear localStorage** in `beforeEach()` hooks
2. **Use pattern-based board creation** for complex scenarios
3. **Test audio without actual sound** using mocked AudioContext
4. **Verify animation frames** using triggerAnimationFrame helper
5. **Check immutability** by comparing original and modified boards
6. **Use descriptive test names** that explain the expected behavior
7. **Group related tests** using nested describe blocks
8. **Test edge cases** including out-of-bounds positions and empty boards
