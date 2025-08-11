# 📚 Tetrys Documentation Hub

Welcome to the comprehensive documentation for Tetrys, a modern Tetris implementation built with Vue 3, TypeScript, and cutting-edge web technologies.

## 🚀 Getting Started

New to Tetrys? Start here to get up and running quickly.

- [🚀 Getting Started Guide](./getting-started/README.md) - Setup, installation, and first steps
- [🏗️ Architecture Overview](./architecture/README.md) - High-level system design and patterns

## 📖 Core Guides

Deep dive into the major systems and patterns used in Tetrys.

### Vue 3 & Composition API
- [🧩 Vue Components Deep Dive](./components/README.md) - Component architecture and patterns
- [⚡ Composables Deep Dive](./composables/README.md) - Reactive state management with Vue 3

### System Architecture
- [🎵 Audio System](./composables/audio-system.md) - Web Audio API implementation
- [🎮 Game State Management](./composables/game-state.md) - Core game logic and state
- [🎨 Theme System](./composables/theme-system.md) - Dynamic theming with CSS custom properties
- [🧩 Component Architecture](./components/component-architecture.md) - Component design patterns

## 🔧 Development & Deployment

Guides for testing, building, and deploying Tetrys.

- [🧪 Testing Guide](./testing/README.md) - Comprehensive testing strategies
- [🚀 Deployment Guide](./deployment/README.md) - Platform-specific deployment instructions

## 🎯 Quick References

### Project Structure
```
tetrys/
├── src/
│   ├── components/        # Vue components
│   ├── composables/       # Composition functions
│   ├── types/            # TypeScript definitions
│   ├── App.vue           # Root component
│   └── main.ts           # Entry point
├── tutorials/            # Documentation (you are here!)
├── tests/               # Test suites
└── public/              # Static assets
```

### Key Technologies
- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** for build tooling
- **Vitest** for testing
- **Web Audio API** for sound
- **CSS Custom Properties** for theming

### Development Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production  
npm run test       # Run tests
npm run type-check # TypeScript checking
npm run lint       # Code linting
```

## 🎮 Game Features

### Core Gameplay
- Classic Tetris mechanics with modern enhancements
- 7 tetromino pieces with proper physics
- Line clearing and scoring system
- Progressive difficulty and speed control

### Visual Experience  
- 8 stunning themes (Game Boy, Retro, Neon, etc.)
- Smooth animations and transitions
- Mobile-first responsive design
- WCAG 2.1 AA accessibility compliance

### Audio System
- 8-bit sound effects for all game actions
- 4 background music tracks with seamless looping
- Individual volume controls for music and sound
- Web Audio API for high-performance audio

### Modern Features
- Persistent settings with localStorage
- Pause/resume with audio coordination
- In-game reset with confirmation modal
- Touch controls optimized for mobile

## 📱 Platform Support

### Desktop
- Keyboard controls (arrow keys, space, P for pause)
- Mouse interaction for settings and controls
- High-resolution displays supported
- All modern browsers (Chrome, Firefox, Safari, Edge)

### Mobile
- Touch-friendly controls with swipe gestures
- Responsive layout for phones and tablets
- Optimized for portrait and landscape orientations
- PWA-ready for app-like experience

## 🤝 Contributing

Interested in contributing to Tetrys? Here's how to get started:

1. **Read the docs** - Start with [Getting Started](./getting-started/README.md)
2. **Understand the architecture** - Review [Architecture Overview](./architecture/README.md)
3. **Set up development** - Follow the installation guide
4. **Run tests** - Ensure everything works with `npm test`
5. **Pick an issue** - Look for "good first issue" labels
6. **Follow patterns** - Use existing code patterns and conventions

### Development Guidelines
- Write tests for new features
- Follow TypeScript strict mode
- Maintain accessibility standards
- Test on multiple devices/browsers
- Use conventional commit messages

## 📊 Performance

Tetrys is built for performance with these targets:
- **60fps gameplay** on modern devices
- **<3s load time** on 3G networks
- **<100KB gzipped** bundle size
- **90+ Lighthouse scores** on all metrics
- **Mobile-optimized** rendering

## 🔮 Roadmap

Future enhancements planned for Tetrys:
- [ ] Multiplayer support with WebRTC
- [ ] Tournament mode with leaderboards
- [ ] Custom piece skins and themes
- [ ] Advanced statistics and analytics
- [ ] Social sharing integration
- [ ] Achievement system

## 📄 License

Tetrys is open source software licensed under the MIT License. See [LICENSE](../LICENSE) for details.

---

**Happy coding!** 🎮✨

*For questions, issues, or contributions, visit our [GitHub repository](https://github.com/darth-dodo/tetrys).*