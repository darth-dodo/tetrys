# 🧩 Component Architecture

The Tetrys component architecture follows Vue 3 best practices with clear separation of concerns and reusable patterns.

## Component Hierarchy

```
App.vue (Root Container)
├── Settings Components
│   ├── ThemeSelector.vue
│   ├── AudioControls.vue
│   └── SpeedControl.vue
├── Game Components
│   ├── GameBoard.vue
│   ├── GameControls.vue
│   ├── ScoreBoard.vue
│   └── NextPiece.vue
└── Layout Components
    ├── Header Navigation
    ├── Settings Panel
    └── Modal Overlays
```

## Architecture Patterns

### Container-Presentation Pattern
- **Container Components**: Manage state and business logic
- **Presentation Components**: Handle UI rendering and user interactions

### Props Interface Pattern
```typescript
interface Props {
  gameState: GameState
  options?: ComponentOptions
}

const props = defineProps<Props>()
```

### Event Emission Pattern
```typescript
interface Emits {
  update: [value: string]
  action: [type: ActionType, payload?: any]
}

const emit = defineEmits<Emits>()
```

## Responsive Design Patterns

### Mobile-First CSS
```css
/* Base: Mobile styles */
.component {
  flex-direction: column;
  padding: 10px;
}

/* Tablet enhancement */
@media (min-width: 768px) {
  .component {
    flex-direction: row;
    padding: 15px;
  }
}
```

### Touch Optimization
- Minimum 48px touch targets
- Touch-friendly button spacing
- Swipe gesture support
- Responsive control layouts

## Implementation Details

See [Vue Components Deep Dive](../components/README.md) for complete implementation examples.