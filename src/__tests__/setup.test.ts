import { describe, it, expect, vi } from 'vitest'
import { triggerAnimationFrame, getAnimationFrameCount } from './setup'

describe('Test Setup', () => {
  describe('AudioContext Mock', () => {
    it('should provide mocked AudioContext', () => {
      const ctx = new AudioContext()
      expect(ctx).toBeDefined()
      expect(ctx.destination).toBeDefined()
      expect(ctx.currentTime).toBe(0)
      expect(ctx.sampleRate).toBe(44100)
    })

    it('should create gain nodes', () => {
      const ctx = new AudioContext()
      const gainNode = ctx.createGain()
      expect(gainNode).toBeDefined()
      expect(gainNode.gain.value).toBe(1)
    })

    it('should create oscillator nodes', () => {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      expect(osc).toBeDefined()
      expect(osc.frequency.value).toBe(440)
      expect(osc.type).toBe('sine')
    })

    it('should allow gain nodes to connect', () => {
      const ctx = new AudioContext()
      const gainNode = ctx.createGain()
      const result = gainNode.connect(gainNode)
      expect(result).toBe(gainNode)
    })

    it('should allow oscillators to connect', () => {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const result = osc.connect(osc)
      expect(result).toBe(osc)
    })
  })

  describe('localStorage Mock', () => {
    it('should store and retrieve items', () => {
      localStorage.setItem('test', 'value')
      expect(localStorage.getItem('test')).toBe('value')
    })

    it('should return null for non-existent items', () => {
      expect(localStorage.getItem('nonExistent')).toBeNull()
    })

    it('should remove items', () => {
      localStorage.setItem('test', 'value')
      localStorage.removeItem('test')
      expect(localStorage.getItem('test')).toBeNull()
    })

    it('should clear all items', () => {
      localStorage.setItem('test1', 'value1')
      localStorage.setItem('test2', 'value2')
      localStorage.clear()
      expect(localStorage.length).toBe(0)
    })

    it('should track length correctly', () => {
      localStorage.clear()
      expect(localStorage.length).toBe(0)
      localStorage.setItem('test', 'value')
      expect(localStorage.length).toBe(1)
    })

    it('should return key by index', () => {
      localStorage.clear()
      localStorage.setItem('test', 'value')
      expect(localStorage.key(0)).toBe('test')
    })
  })

  describe('requestAnimationFrame Mock', () => {
    it('should return unique frame IDs', () => {
      const id1 = requestAnimationFrame(() => {})
      const id2 = requestAnimationFrame(() => {})
      expect(id1).not.toBe(id2)
    })

    it('should register callbacks', () => {
      const callback = vi.fn()
      requestAnimationFrame(callback)
      expect(getAnimationFrameCount()).toBeGreaterThan(0)
    })

    it('should trigger registered callbacks', () => {
      const callback = vi.fn()
      requestAnimationFrame(callback)
      triggerAnimationFrame(100)
      expect(callback).toHaveBeenCalledWith(100)
    })

    it('should cancel animation frames', () => {
      const callback = vi.fn()
      const id = requestAnimationFrame(callback)
      cancelAnimationFrame(id)
      triggerAnimationFrame()
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('HTMLMediaElement Mock', () => {
    it('should mock play method', async () => {
      const audio = document.createElement('audio')
      const result = audio.play()
      expect(result).toBeInstanceOf(Promise)
      await expect(result).resolves.toBeUndefined()
    })

    it('should mock pause method', () => {
      const audio = document.createElement('audio')
      expect(() => audio.pause()).not.toThrow()
    })

    it('should mock load method', () => {
      const audio = document.createElement('audio')
      expect(() => audio.load()).not.toThrow()
    })
  })
})
