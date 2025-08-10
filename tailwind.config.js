/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'retro-green': '#39ff14',
        'retro-cyan': '#00ffff',
        'retro-purple': '#ff00ff',
        'retro-yellow': '#ffff00',
        'retro-red': '#ff0040',
        'retro-orange': '#ff8c00',
        'retro-blue': '#0080ff',
        'matrix-bg': '#0d1b2a',
        'matrix-border': '#1b263b'
      },
      fontFamily: {
        'retro': ['Courier New', 'monospace'],
        'pixel': ['Orbitron', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'fall': 'fall 1s linear forwards'
      },
      keyframes: {
        glow: {
          '0%': {
            textShadow: '0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor',
          },
          '100%': {
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor',
          }
        },
        fall: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    },
  },
  plugins: [],
}