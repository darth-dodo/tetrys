export interface ThemeColors {
  background: string
  surface: string
  primary: string
  secondary: string
  accent: string
  text: string
  textSecondary: string
  border: string
  pieces: {
    I: string
    O: string
    T: string
    S: string
    Z: string
    J: string
    L: string
  }
}

export interface Theme {
  id: string
  name: string
  description: string
  colors: ThemeColors
  effects?: {
    glow?: boolean
    shadows?: boolean
    animations?: boolean
  }
}

export const themes: Record<string, Theme> = {
  retro: {
    id: 'retro',
    name: 'Retro Terminal',
    description: 'Classic green terminal aesthetic',
    colors: {
      background: '#000000',
      surface: '#111111',
      primary: '#00ff00',
      secondary: '#008800',
      accent: '#ffff00',
      text: '#ffffff',
      textSecondary: '#cccccc',
      border: '#00ff00',
      pieces: {
        I: '#00ffff',
        O: '#ffff00',
        T: '#ff00ff',
        S: '#00ff00',
        Z: '#ff0000',
        J: '#0000ff',
        L: '#ff8000'
      }
    },
    effects: {
      glow: true,
      shadows: false,
      animations: true
    }
  },
  
  neon: {
    id: 'neon',
    name: 'Neon Nights',
    description: 'Cyberpunk neon glow theme',
    colors: {
      background: '#0a0a0f',
      surface: '#1a1a2e',
      primary: '#ff006e',
      secondary: '#ff7d00',
      accent: '#00f5ff',
      text: '#ffffff',
      textSecondary: '#b8b8ff',
      border: '#ff006e',
      pieces: {
        I: '#00f5ff',
        O: '#ffff00',
        T: '#ff006e',
        S: '#00ff88',
        Z: '#ff4757',
        J: '#5865f2',
        L: '#ff7d00'
      }
    },
    effects: {
      glow: true,
      shadows: true,
      animations: true
    }
  },

  classic: {
    id: 'classic',
    name: 'Classic Tetris',
    description: 'Traditional Tetris colors',
    colors: {
      background: '#222222',
      surface: '#333333',
      primary: '#4a90e2',
      secondary: '#357abd',
      accent: '#f5a623',
      text: '#ffffff',
      textSecondary: '#cccccc',
      border: '#666666',
      pieces: {
        I: '#00bcd4',
        O: '#ffc107',
        T: '#9c27b0',
        S: '#4caf50',
        Z: '#f44336',
        J: '#3f51b5',
        L: '#ff9800'
      }
    },
    effects: {
      glow: false,
      shadows: true,
      animations: false
    }
  },

  ocean: {
    id: 'ocean',
    name: 'Deep Ocean',
    description: 'Calming underwater theme',
    colors: {
      background: '#001a2e',
      surface: '#002d4a',
      primary: '#0077be',
      secondary: '#005691',
      accent: '#00d4ff',
      text: '#ffffff',
      textSecondary: '#a8daff',
      border: '#0099cc',
      pieces: {
        I: '#00e6ff',
        O: '#ffd700',
        T: '#8a2be2',
        S: '#00ff7f',
        Z: '#ff6b6b',
        J: '#4169e1',
        L: '#ff8c00'
      }
    },
    effects: {
      glow: false,
      shadows: true,
      animations: true
    }
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset Vibes',
    description: 'Warm sunset gradient theme',
    colors: {
      background: '#2d1b4e',
      surface: '#4a2c6b',
      primary: '#ff6b9d',
      secondary: '#e55d87',
      accent: '#ffd93d',
      text: '#ffffff',
      textSecondary: '#f0c4d8',
      border: '#ff6b9d',
      pieces: {
        I: '#00d2ff',
        O: '#ffd93d',
        T: '#ff6b9d',
        S: '#4ecdc4',
        Z: '#ff5722',
        J: '#673ab7',
        L: '#ff9800'
      }
    },
    effects: {
      glow: true,
      shadows: true,
      animations: true
    }
  },

  minimal: {
    id: 'minimal',
    name: 'Minimal White',
    description: 'Clean minimal design',
    colors: {
      background: '#ffffff',
      surface: '#f8f9fa',
      primary: '#343a40',
      secondary: '#6c757d',
      accent: '#007bff',
      text: '#212529',
      textSecondary: '#6c757d',
      border: '#dee2e6',
      pieces: {
        I: '#17a2b8',
        O: '#ffc107',
        T: '#6f42c1',
        S: '#28a745',
        Z: '#dc3545',
        J: '#007bff',
        L: '#fd7e14'
      }
    },
    effects: {
      glow: false,
      shadows: false,
      animations: false
    }
  },

  matrix: {
    id: 'matrix',
    name: 'Matrix Code',
    description: 'Digital rain matrix theme',
    colors: {
      background: '#000000',
      surface: '#001100',
      primary: '#00ff41',
      secondary: '#00cc33',
      accent: '#ffffff',
      text: '#00ff41',
      textSecondary: '#00cc33',
      border: '#008822',
      pieces: {
        I: '#00ff88',
        O: '#88ff00',
        T: '#44ff44',
        S: '#00ff44',
        Z: '#ff4400',
        J: '#0088ff',
        L: '#ffaa00'
      }
    },
    effects: {
      glow: true,
      shadows: false,
      animations: true
    }
  },

  gameboy: {
    id: 'gameboy',
    name: 'Game Boy',
    description: 'Classic Game Boy green screen',
    colors: {
      background: '#8bac0f',
      surface: '#9bbc0f',
      primary: '#306230',
      secondary: '#0f380f',
      accent: '#0f380f',
      text: '#0f380f',
      textSecondary: '#306230',
      border: '#0f380f',
      pieces: {
        I: '#0f380f',
        O: '#306230',
        T: '#0f380f',
        S: '#306230',
        Z: '#0f380f',
        J: '#306230',
        L: '#0f380f'
      }
    },
    effects: {
      glow: false,
      shadows: false,
      animations: false
    }
  }
}

export type ThemeId = keyof typeof themes