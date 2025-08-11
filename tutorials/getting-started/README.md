# 🚀 Getting Started with Tetrys

Welcome to Tetrys! This guide will help you set up the development environment, understand the project structure, and start contributing to this modern Tetris implementation.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 9+** or **yarn 1.22+** - Package manager
- **Git** - Version control system
- **VS Code** (recommended) - Code editor

### Recommended VS Code Extensions
```json
{
  "recommendations": [
    "vue.volar",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
# Using SSH (recommended)
git clone git@github.com:darth-dodo/tetrys.git
cd tetrys

# Or using HTTPS
git clone https://github.com/darth-dodo/tetrys.git
cd tetrys
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Or using yarn
yarn install
```

### 3. Start Development Server
```bash
npm run dev
# or
yarn dev
```

Visit [http://localhost:5173](http://localhost:5173) to see the game running!

## 🎮 First Run Experience

When you first run Tetrys, you'll see:

1. **Landing Page**: Game logo with start button and settings
2. **Default Theme**: Game Boy theme for authentic retro feel
3. **Audio Disabled**: Audio is disabled by default (enable in settings)
4. **Responsive Layout**: Optimized for your screen size

### Testing the Game
1. Click **"START GAME"** to begin
2. Use arrow keys (desktop) or swipe gestures (mobile)
3. Try the **⚙️ SETTINGS** button to explore themes and audio
4. Press **P** to pause/resume or use the pause button

## 🏗️ Project Structure Deep Dive

```
tetrys/
├── 📁 src/                     # Source code
│   ├── 📄 App.vue             # Root component
│   ├── 📄 main.ts             # Application entry point
│   ├── 📄 style.css           # Global styles
│   ├── 📁 components/         # Vue components
│   ├── 📁 composables/        # Composition functions
│   └── 📁 types/              # TypeScript definitions
├── 📁 public/                 # Static assets
├── 📁 tutorials/              # Documentation
├── 📁 tests/                  # Test suites
├── 📄 package.json            # Dependencies & scripts
├── 📄 vite.config.ts          # Build configuration
├── 📄 tsconfig.json           # TypeScript configuration
└── 📄 netlify.toml            # Deployment configuration
```

## 🔧 Development Scripts

### Core Commands
```bash
# Development server (hot reload)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### Code Quality
```bash
# Type checking
npm run type-check

# Linting (auto-fix)
npm run lint

# Format code with Prettier
npm run format
```

## 🎯 Your First Change

Let's make your first contribution by adding a custom theme!

### 1. Understand the Theme System
Navigate to `src/types/theme.ts` to see how themes are defined:

```typescript
export interface Theme {
  id: string
  name: string
  colors: {
    bg: string
    surface: string
    primary: string
    // ... more colors
  }
}
```

### 2. Add a New Theme
Add this theme to the `themes` object in `src/types/theme.ts`:

```typescript
export const themes: Record<ThemeId, Theme> = {
  // ... existing themes
  custom: {
    id: 'custom',
    name: 'My Custom Theme',
    colors: {
      bg: '#1a1a2e',
      surface: '#16213e',
      primary: '#0f4c75',
      secondary: '#3282b8',
      accent: '#bbe1fa',
      text: '#ffffff',
      textSecondary: '#b0b0b0',
      border: '#3282b8',
      glow: '0 0 20px rgba(50, 130, 184, 0.5)'
    },
    pieces: {
      I: '#00bcd4',
      O: '#ffeb3b',
      T: '#9c27b0',
      S: '#4caf50',
      Z: '#f44336',
      J: '#2196f3',
      L: '#ff9800'
    }
  }
}
```

### 3. Update Theme Type
Add 'custom' to the `ThemeId` type:

```typescript
export type ThemeId = 'retro' | 'neon' | 'classic' | 'ocean' | 
                      'sunset' | 'minimal' | 'matrix' | 'gameboy' | 'custom'
```

### 4. Test Your Changes
1. Run `npm run dev`
2. Open settings in the game
3. Look for your "My Custom Theme" in the theme selector!

## 📱 Mobile Development

### Testing on Mobile Devices
```bash
# Start dev server with network access
npm run dev -- --host

# Your local IP will be shown, e.g.:
# ➜  Network: http://192.168.1.100:5173/
```

Access this URL on your mobile device to test touch controls.

### Mobile-First Approach
The codebase follows mobile-first responsive design:

1. **Base styles**: Optimized for mobile (375px+)
2. **Tablet breakpoint**: `@media (min-width: 768px)`  
3. **Desktop breakpoint**: `@media (min-width: 1024px)`

## 🧪 Testing Your Changes

### Running Tests
```bash
# Run all tests once
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

### Writing Your First Test
Create `src/components/__tests__/MyComponent.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MyComponent from '../MyComponent.vue'

describe('MyComponent', () => {
  it('renders correctly', () => {
    const wrapper = mount(MyComponent)
    expect(wrapper.text()).toContain('Expected text')
  })
})
```

## 🚨 Common Issues & Solutions

### Port Already in Use
```bash
# Kill process on port 5173
npx kill-port 5173

# Or use a different port
npm run dev -- --port 3000
```

### TypeScript Errors
```bash
# Clear cache and restart TypeScript
npm run type-check

# In VS Code: Ctrl/Cmd + Shift + P
# "TypeScript: Restart TS Server"
```

### Audio Not Working
The Web Audio API requires user interaction:
1. Enable audio in settings
2. Interact with the page first (click/tap)
3. Check browser console for audio errors

### Build Failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## 📚 Next Steps

Now that you have Tetrys running, explore these guides:

1. **[Architecture Overview](../architecture/README.md)** - Understanding the system design
2. **[Components Guide](../components/README.md)** - Vue component architecture  
3. **[Composables Deep Dive](../composables/README.md)** - Reactive state management
4. **[Testing Guide](../testing/README.md)** - Comprehensive testing strategies

## 🤝 Contributing Guidelines

### Before You Commit
1. **Run tests**: `npm run test`
2. **Type check**: `npm run type-check`  
3. **Lint code**: `npm run lint`
4. **Test on mobile**: Verify responsive design
5. **Test audio**: Ensure audio system works

### Commit Message Format
```
type(scope): description

feat(audio): add new music track selection
fix(theme): resolve gameboy theme contrast issues
docs(tutorial): update getting started guide
test(composables): add useTetris unit tests
```

## 🆘 Getting Help

- **Issues**: [GitHub Issues](https://github.com/darth-dodo/tetrys/issues)
- **Discussions**: [GitHub Discussions](https://github.com/darth-dodo/tetrys/discussions)
- **Documentation**: Browse the `tutorials/` directory

## 🎉 Congratulations!

You're now ready to develop with Tetrys! The game combines classic Tetris gameplay with modern web technologies, providing a great learning experience for Vue 3, TypeScript, and responsive design.

Happy coding! 🚀