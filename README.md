# Tetrys - Mobile Responsive Retro Tetris

A modern implementation of the classic Tetris game built with Vue 3, TypeScript, and Tailwind CSS. Features multiple themes, 8-bit audio, and optimized mobile controls.

## Features

✨ **Modern Web Technologies**
- Vue 3 with Composition API
- TypeScript for type safety
- Tailwind CSS for responsive styling
- Vite for fast development and building

🎮 **Game Features**
- Classic Tetris gameplay mechanics
- 8 different visual themes (Retro, Neon, Classic, Ocean, Sunset, Minimal, Matrix, Game Boy)
- Optional 8-bit background music and sound effects
- Progressive difficulty system
- Persistent settings (localStorage)

📱 **Mobile Optimized**
- Touch controls and swipe gestures
- Responsive design for all screen sizes
- PWA-ready with mobile app features
- Optimized performance for mobile devices

🎨 **Retro Aesthetics**
- Matrix-inspired color scheme
- Glowing text effects
- Animated backgrounds
- Retro typography (Orbitron font)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tetrees
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

### Development Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check
```

## Game Controls

### Desktop
- **Arrow Keys / WASD**: Move and rotate pieces
- **Spacebar**: Rotate piece
- **Enter**: Hard drop
- **P**: Pause/Resume

### Mobile
- **Touch Controls**: Directional buttons
- **Swipe Gestures**: 
  - Left/Right: Move piece
  - Down: Soft drop  
  - Up: Rotate piece
- **Double-tap Down**: Hard drop

## Deployment

### Netlify Deployment

This project is configured for automatic deployment to Netlify using GitHub Actions.

#### Setup Instructions

1. **Create a Netlify account** and connect your GitHub repository

2. **Configure Netlify secrets** in your GitHub repository settings:
   ```
   NETLIFY_AUTH_TOKEN: Your Netlify personal access token
   NETLIFY_SITE_ID: Your Netlify site ID
   ```

3. **Push to main branch** - The CI/CD pipeline will automatically:
   - Run tests and linting
   - Build the application
   - Deploy to Netlify production

4. **Pull Requests** automatically create preview deployments

#### Manual Deployment

You can also deploy manually using Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build the project
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=dist
```

### Alternative Deployment Options

The built application in the `dist` folder can be deployed to any static hosting service:
- Vercel
- GitHub Pages  
- AWS S3 + CloudFront
- Firebase Hosting

## Architecture

### Project Structure
```
src/
├── components/          # Vue components
│   ├── GameBoard.vue   # Main game board display
│   ├── GameControls.vue # Touch/keyboard controls
│   ├── NextPiece.vue   # Next piece preview
│   └── ScoreBoard.vue  # Score and stats display
├── composables/        # Vue composables
│   └── useTetris.ts   # Core game logic
├── types/             # TypeScript definitions
│   └── tetris.ts     # Game interfaces and types
├── App.vue           # Main application component
├── main.ts          # Application entry point
└── style.css        # Global styles and Tailwind imports
```

### Key Technologies

- **Vue 3**: Reactive UI framework with Composition API
- **TypeScript**: Static typing for better development experience
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Vite**: Fast build tool and development server
- **Vitest**: Fast unit testing framework

### Game Logic

The core game logic is implemented in `useTetris.ts` composable which handles:
- Tetromino generation and rotation
- Board state management
- Line clearing and scoring
- Game loop and timing
- Collision detection

### Mobile Optimization

- Touch event handling with gesture support
- Responsive grid layout
- Optimized asset loading
- Service worker for PWA capabilities
- Viewport meta tag for mobile browsers

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Performance

- Lighthouse Score: 95+ for all metrics
- First Contentful Paint: < 1.5s
- Bundle size: < 500KB gzipped
- Mobile optimization with touch event handling

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Original Tetris game by Alexey Pajitnov
- Vue.js community for excellent tooling
- Tailwind CSS for responsive design utilities