# Tetrys - Mobile Responsive Retro Tetris

A modern implementation of the classic Tetris game built with Vue 3, TypeScript, and modern web technologies. Features multiple themes, 8-bit audio system, mobile-first responsive design, and comprehensive game mechanics.

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-829%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-85.14%25-brightgreen)]()
[![Test Pass Rate](https://img.shields.io/badge/test%20pass%20rate-100%25-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue)]()
[![Vue](https://img.shields.io/badge/Vue-3.4+-green)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()
[![Achievements](https://img.shields.io/badge/achievements-74%20available-purple)]()

## 🎮 Features

### 🚀 Modern Web Technologies
- **Vue 3** with Composition API for reactive state management
- **TypeScript** for type safety and better developer experience
- **Vite** for lightning-fast development and optimized builds
- **Vitest** for comprehensive unit testing
- **ESLint + Prettier** for code quality and consistency

### 🎨 Visual Experience
- **8 Stunning Themes**: Classic (default), Retro, Neon, Ocean, Sunset, Minimal, Matrix, Game Boy
- **Mobile-First Layout**: Side-by-side design with game board left, info panel right
- **Optimized Screen Usage**: Dynamic viewport sizing for maximum gameplay area
- **Smooth Animations**: CSS transitions and transforms for polished UX
- **Accessibility**: WCAG 2.1 AA compliant with 56px+ touch targets

### 🎵 Audio System
- **8-bit Sound Effects**: Move, rotate, drop, line clear, and game over sounds
- **Background Music**: 4 different retro music tracks with seamless looping
- **Advanced Audio Controls**: Individual volume controls and track selection
- **Web Audio API**: High-performance audio with proper context management

### 🎯 Game Features
- **Classic Tetris Gameplay**: All 7 tetromino pieces with proper physics
- **Progressive Difficulty**: Speed increases with level progression
- **Scoring System**: Points based on lines cleared and level multiplier
- **Achievement System**: 74 achievements across 7 categories with animated notifications
- **Persistent Settings**: Theme, audio, and speed preferences saved locally
- **Pause/Resume**: Full game state management with audio coordination
- **In-Game Reset**: Instant game restart with confirmation modal

### 📱 Mobile Optimization
- **Side-by-Side Layout**: Game board left, compact info panel right for single-screen play
- **Enhanced Touch Controls**: 75x75px control buttons with rich haptic feedback
- **Contextual Vibration**: Different vibration patterns for each game action
- **Dynamic Sizing**: Viewport-based calculations for optimal screen space usage
- **Single-Screen Fit**: No scrolling required on any mobile device
- **Performance**: 60fps target with optimized rendering
- **PWA Ready**: Service worker and manifest for app-like experience

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+ or yarn 1.22+

### Installation
```bash
# Clone the repository
git clone https://github.com/darth-dodo/tetrys.git
cd tetrys

# Install dependencies
npm install

# Start development server
npm run dev

# Visit http://localhost:5173
```

### Build for Production
```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview

# Run all tests
npm run test

# Type check
npm run type-check
```

## 📚 Documentation

### Tutorials
- [🚀 Getting Started](./tutorials/getting-started/README.md)
- [🏗️ Architecture Overview](./tutorials/architecture/README.md)
- [🧩 Vue Components](./tutorials/components/README.md) 
- [⚡ Composables Deep Dive](./tutorials/composables/README.md)
- [🧪 Testing Guide](./tutorials/testing/README.md)
- [🚀 Deployment Guide](./tutorials/deployment/README.md)

### API Reference
- [Game State Management](./tutorials/composables/game-state.md)
- [Audio System](./tutorials/composables/audio-system.md)
- [Theme System](./tutorials/composables/theme-system.md)
- [Component Architecture](./tutorials/components/component-architecture.md)

## 🎮 Game Controls

### Desktop
- **←/→/↓**: Move piece left/right/down
- **↑**: Rotate piece clockwise
- **Space**: Hard drop piece
- **P**: Pause/resume game
- **R**: Reset current game

### Mobile
- **Game Board Touch**: Tap to rotate, swipe left/right to move, swipe down to drop
- **Control Buttons**: Enhanced 75x75px buttons with haptic feedback
- **Swipe Gestures**: Intuitive directional controls on game board
- **Vibration Feedback**: Contextual haptic patterns for different actions
- **Side Panel**: Compact score and next piece info on the right
- **Settings**: Access via gear icon in header

## 🏗️ Project Structure

```
tetrys/
├── src/
│   ├── components/          # Vue components
│   │   ├── AudioControls.vue    # Audio settings panel
│   │   ├── GameBoard.vue        # Main game board
│   │   ├── GameControls.vue     # Game action buttons
│   │   ├── NextPiece.vue        # Next piece preview
│   │   ├── ScoreBoard.vue       # Score and stats
│   │   ├── SpeedControl.vue     # Speed multiplier
│   │   └── ThemeSelector.vue    # Theme switcher
│   ├── composables/         # Vue composition functions
│   │   ├── useAudio.ts         # Audio system management
│   │   ├── useSpeed.ts         # Speed control logic
│   │   ├── useTetris.ts        # Core game logic
│   │   └── useTheme.ts         # Theme management
│   ├── types/               # TypeScript definitions
│   │   ├── tetris.ts           # Game state types
│   │   └── theme.ts            # Theme configuration
│   ├── App.vue              # Root component
│   ├── main.ts              # Application entry point
│   └── style.css            # Global styles
├── tutorials/               # Comprehensive documentation
├── public/                  # Static assets
├── dist/                    # Production build output
└── tests/                   # Test suites
```

## 🔌 Event-Driven Architecture

Tetrys uses an event-driven architecture with **mitt** as the event bus for decoupled communication between game logic and the achievement system.

### Event System Overview
The game uses a centralized event bus (`useGameBus()`) that enables components and composables to communicate without tight coupling. This promotes testability, maintainability, and extensibility.

### Available Events

**Game Events:**
- `game:started` - Fired when a new game begins
- `game:paused` - Fired when game is paused
- `game:over` - Fired when game ends
- `game:reset` - Fired when game is reset

**Gameplay Events:**
- `lines:cleared` - Payload: `{ count: number }` - Lines cleared in single action
- `score:updated` - Payload: `{ score: number }` - Current score value
- `level:up` - Payload: `{ level: number }` - New level reached
- `combo:updated` - Payload: `{ combo: number }` - Current combo count
- `time:tick` - Payload: `{ timeElapsed: number }` - Game time in seconds

**Achievement Events:**
- `achievement:unlocked` - Payload: `{ achievement: Achievement }` - New achievement unlocked

### How to Subscribe

```typescript
import { useGameBus } from '@/composables/useGameBus'

const gameBus = useGameBus()

// Subscribe to an event
gameBus.on('lines:cleared', (data) => {
  console.log(`Cleared ${data.count} lines!`)
})

// Emit an event
gameBus.emit('score:updated', { score: 1000 })
```

### Benefits
- **Decoupling**: Game logic and achievements don't directly depend on each other
- **Testability**: Easy to mock events in unit tests
- **Extensibility**: Add new listeners without modifying existing code
- **Type Safety**: TypeScript ensures event payload type correctness

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🚀 Deployment

### Netlify (Recommended)
```bash
# Build and deploy to Netlify
npm run build
# Upload dist/ folder to Netlify

# Or use Netlify CLI
netlify deploy --prod --dir=dist
```

### Other Platforms
- **Vercel**: Connect GitHub repository for automatic deployments
- **GitHub Pages**: Use GitHub Actions workflow
- **Docker**: Dockerfile included for containerized deployments

See [Deployment Guide](./tutorials/deployment/README.md) for detailed instructions.

## 🎨 Customization

### Adding New Themes
```typescript
// src/types/theme.ts
export const customTheme: Theme = {
  id: 'custom',
  name: 'Custom Theme',
  colors: {
    bg: '#your-bg-color',
    surface: '#your-surface-color',
    // ... more colors
  }
}
```

### Custom Audio Tracks
```typescript
// src/composables/useAudio.ts
const musicTracks = {
  custom: [
    { freq: 440, duration: 0.5 },
    // ... your custom notes
  ]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode
- Write tests for new features
- Use conventional commit messages
- Ensure accessibility compliance
- Test on multiple devices/browsers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tetris**: Original game created by Alexey Pajitnov
- **Vue.js**: Reactive frontend framework
- **TypeScript**: Type safety and developer experience
- **Web Audio API**: High-performance audio processing
- **Modern Web Standards**: PWA, Accessibility, Performance

## 📊 Performance

- **Lighthouse Score**: 95+ on all metrics
- **Bundle Size**: <100KB gzipped
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <2.5s
- **Mobile Performance**: 60fps on modern devices

## 🐛 Known Issues

- Safari audio context may require user interaction
- IE11 not supported (modern browsers only)
- Some older Android devices may experience reduced performance

## 🔮 Roadmap

- [x] Achievement system (74 achievements with notifications) ✨
- [ ] Multiplayer support with WebRTC
- [ ] Tournament mode with leaderboards
- [ ] Custom piece skins
- [ ] Advanced statistics and analytics
- [ ] Social sharing integration

---

**Made with ❤️ by the Tetrys team**

*Tetrys - Where classic gameplay meets modern technology*