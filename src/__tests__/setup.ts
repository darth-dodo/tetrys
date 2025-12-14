import { beforeEach, vi } from 'vitest'

// Mock Web Audio API
class MockAudioContext {
  destination = {}
  currentTime = 0
  sampleRate = 44100
  state: AudioContextState = 'suspended'

  createGain(): MockGainNode {
    return new MockGainNode()
  }

  createOscillator(): MockOscillatorNode {
    return new MockOscillatorNode()
  }

  resume(): Promise<void> {
    this.state = 'running'
    return Promise.resolve()
  }

  close(): Promise<void> {
    this.state = 'closed'
    return Promise.resolve()
  }
}

class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn()
  }

  connect(): MockGainNode {
    return this
  }

  disconnect(): void {}
}

class MockOscillatorNode {
  frequency = {
    value: 440,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn()
  }

  type: OscillatorType = 'sine'

  connect(): MockOscillatorNode {
    return this
  }

  disconnect(): void {}

  start(): void {}

  stop(): void {}
}

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string): string | null => {
      return store[key] || null
    },
    setItem: (key: string, value: string): void => {
      store[key] = value.toString()
    },
    removeItem: (key: string): void => {
      delete store[key]
    },
    clear: (): void => {
      store = {}
    },
    get length(): number {
      return Object.keys(store).length
    },
    key: (index: number): string | null => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
})()

// Mock requestAnimationFrame and cancelAnimationFrame
let animationFrameId = 0
const animationFrameCallbacks = new Map<number, FrameRequestCallback>()

const mockRequestAnimationFrame = (callback: FrameRequestCallback): number => {
  const id = ++animationFrameId
  animationFrameCallbacks.set(id, callback)
  return id
}

const mockCancelAnimationFrame = (id: number): void => {
  animationFrameCallbacks.delete(id)
}

// Setup global mocks
beforeEach(() => {
  // Reset localStorage
  localStorageMock.clear()

  // Reset animation frame callbacks
  animationFrameCallbacks.clear()
  animationFrameId = 0

  // Apply mocks
  global.AudioContext = MockAudioContext as any
  global.localStorage = localStorageMock as Storage
  global.requestAnimationFrame = mockRequestAnimationFrame
  global.cancelAnimationFrame = mockCancelAnimationFrame

  // Mock HTMLMediaElement methods
  window.HTMLMediaElement.prototype.load = vi.fn()
  window.HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  window.HTMLMediaElement.prototype.pause = vi.fn()
})

// Export helpers for tests to manually trigger animation frames
export const triggerAnimationFrame = (time = 0): void => {
  animationFrameCallbacks.forEach(callback => {
    callback(time)
  })
}

export const getAnimationFrameCount = (): number => {
  return animationFrameCallbacks.size
}
