# 🎮 Game State Management

The Tetrys game state system manages all game logic, piece movement, collision detection, and scoring using Vue 3's reactivity system.

## Game State Structure

```typescript
interface GameState {
  // Board representation
  board: (TetrominoType | null)[][]      // 20x10 grid
  
  // Active piece state  
  currentPiece: TetrominoShape | null    // Currently falling piece
  currentPosition: Position              // Current piece position
  nextPiece: TetrominoShape | null      // Preview piece
  
  // Game progression
  score: number                         // Current score
  level: number                         // Current level
  lines: number                         // Lines cleared
  
  // Game control flags
  isGameOver: boolean                   // Game over state
  isPaused: boolean                     // Pause state
  isPlaying: boolean                    // Active game state
  speedMultiplier: number               // Speed adjustment
}
```

## Core Systems

### Game Loop Management
- **requestAnimationFrame**: Smooth 60fps game loop
- **Time-based Updates**: Consistent piece falling speed
- **State Coordination**: Pause/resume functionality

### Collision Detection
- **Boundary Checking**: Prevent pieces from moving outside board
- **Piece Collision**: Detect collisions with placed pieces
- **Valid Position Testing**: Ensure moves are legal

### Scoring Algorithm
- **Line Clear Scoring**: Points based on lines cleared simultaneously
- **Level Progression**: Increasing difficulty and speed
- **Score Multipliers**: Level-based scoring bonuses

## Implementation Details

See [Composables Deep Dive](../composables/README.md#usetetris---core-game-logic) for complete implementation.