import mitt from 'mitt'
import type { GameBusEvents } from '@/types/events'

// Create singleton event bus
const gameBus = mitt<GameBusEvents>()

// Development mode: log all events
if (import.meta.env.DEV) {
  gameBus.on('*', (type, event) => {
    console.log(`[GameBus] ${String(type)}`, event)
  })
}

export function useGameBus() {
  return gameBus
}

// Export bus instance for testing
export { gameBus }
