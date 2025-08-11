# 🎨 Theme System Deep Dive

The Tetrys theme system provides dynamic CSS custom property management with 8 built-in themes and extensible architecture.

## Theme Architecture

```
Theme System
├── Theme Definitions
│   ├── Color Schemes
│   ├── Piece Colors
│   └── Visual Effects
├── CSS Custom Properties
│   ├── Dynamic Application
│   ├── Real-time Updates
│   └── Document Root Styling
└── Persistence Layer
    ├── localStorage Integration
    ├── Theme Restoration
    └── User Preferences
```

## Theme Structure

```typescript
interface Theme {
  id: string
  name: string
  colors: {
    bg: string              // Background
    surface: string         // Surface/card background
    primary: string         // Primary accent
    secondary: string       // Secondary accent
    accent: string          // Highlight color
    text: string           // Primary text
    textSecondary: string  // Secondary text
    border: string         // Border color
    glow?: string          // CSS glow effects
  }
  pieces: {
    I: string             // Cyan piece
    O: string             // Yellow piece
    T: string             // Purple piece
    S: string             // Green piece
    Z: string             // Red piece
    J: string             // Blue piece
    L: string             // Orange piece
  }
}
```

## Available Themes

1. **Game Boy**: Authentic handheld gaming experience
2. **Retro**: Classic 80s gaming aesthetic
3. **Neon**: Cyberpunk-inspired bright colors
4. **Classic**: Traditional Tetris colors
5. **Ocean**: Calming blue-green palette
6. **Sunset**: Warm orange-pink gradient
7. **Minimal**: Clean monochromatic design
8. **Matrix**: Green-on-black terminal style

## Dynamic CSS Integration

```css
:root {
  --theme-bg: #0f380f;
  --theme-primary: #9bbc0f;
  --piece-i: #8bac0f;
  /* ...more variables */
}

.game-board {
  background: var(--theme-bg);
  border: 2px solid var(--theme-primary);
}
```

## Implementation Details

See [Composables Deep Dive](../composables/README.md#usetheme---dynamic-theme-system) for complete implementation.