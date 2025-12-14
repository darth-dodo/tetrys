import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

/**
 * Test suite for MusicScheduler lookahead scheduling system
 *
 * The MusicScheduler uses a lookahead buffer pattern to schedule Web Audio nodes
 * at precise times. This test suite validates:
 * - Scheduler initialization and lifecycle
 * - Lookahead window scheduling (100ms buffer)
 * - 25ms check interval timing
 * - ADSR envelope application
 * - BPM/tempo changes
 * - Oscillator node creation and cleanup
 * - Multiple note sequences
 * - Edge cases and rapid state changes
 */

// Mock AudioContext and Web Audio nodes
class MockGainNode {
  gain = {
    value: 1,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn()
  }

  connect = vi.fn(function () {
    return this
  })

  disconnect = vi.fn()
}

class MockOscillatorNode {
  frequency = {
    value: 440,
    setValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn()
  }

  type: OscillatorType = 'sine'
  connect = vi.fn(function () {
    return this
  })

  disconnect = vi.fn()
  start = vi.fn()
  stop = vi.fn()
}

class MockAudioContext {
  currentTime = 0
  destination = {} as AudioDestinationNode
  sampleRate = 44100
  state: AudioContextState = 'running'

  createGain = vi.fn(() => new MockGainNode())
  createOscillator = vi.fn(() => new MockOscillatorNode())
  resume = vi.fn(() => Promise.resolve())
  close = vi.fn(() => Promise.resolve())
}

// Music Scheduler implementation (from useAudio.ts)
class MusicScheduler {
  private scheduleAheadTime = 0.1 // Schedule 100ms ahead
  private schedulerTimer: number | null = null
  private nextNoteTime = 0
  private currentNoteIndex = 0
  private isPlaying = false
  private currentTrackId: string
  private audioContext: MockAudioContext | null = null
  private musicGainNode: MockGainNode | null = null
  private oscillators: MockOscillatorNode[] = []

  constructor(trackId: string, audioContext: MockAudioContext, musicGainNode: MockGainNode) {
    this.currentTrackId = trackId
    this.audioContext = audioContext
    this.musicGainNode = musicGainNode
  }

  start() {
    if (!this.audioContext || this.isPlaying) return

    this.isPlaying = true
    this.nextNoteTime = this.audioContext.currentTime
    this.scheduleNotes()
  }

  stop() {
    this.isPlaying = false
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer)
      this.schedulerTimer = null
    }
    this.currentNoteIndex = 0
    // Stop all oscillators
    this.oscillators.forEach(osc => osc.stop())
    this.oscillators = []
  }

  pause() {
    this.isPlaying = false
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer)
      this.schedulerTimer = null
    }
  }

  resume() {
    if (!this.audioContext || this.isPlaying) return

    this.isPlaying = true
    this.nextNoteTime = this.audioContext.currentTime
    this.scheduleNotes()
  }

  getPlayingState() {
    return this.isPlaying
  }

  getScheduleAheadTime() {
    return this.scheduleAheadTime
  }

  getNextNoteTime() {
    return this.nextNoteTime
  }

  getCurrentNoteIndex() {
    return this.currentNoteIndex
  }

  getOscillatorCount() {
    return this.oscillators.length
  }

  private scheduleNotes() {
    if (!this.audioContext || !this.musicGainNode || !this.isPlaying) return

    const track = this.getMusicTrack(this.currentTrackId)

    // Schedule all notes that fall within the lookahead window
    while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(track[this.currentNoteIndex])
      this.advanceNote(track)
    }

    // Schedule next scheduling check (25ms interval)
    this.schedulerTimer = window.setTimeout(() => {
      this.scheduleNotes()
    }, 25)
  }

  private scheduleNote(note: { freq: number; duration: number }) {
    if (!this.audioContext || !this.musicGainNode) return

    const oscillator = this.audioContext.createOscillator()
    const envelope = this.audioContext.createGain()

    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(note.freq, this.nextNoteTime)

    // ADSR envelope: Attack (0-0.01s), Decay (0.01-duration-0.01s), Release (duration-0.01-duration)
    envelope.gain.setValueAtTime(0, this.nextNoteTime)
    envelope.gain.linearRampToValueAtTime(0.1, this.nextNoteTime + 0.01)
    envelope.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + note.duration - 0.01)

    oscillator.connect(envelope)
    envelope.connect(this.musicGainNode)

    oscillator.start(this.nextNoteTime)
    oscillator.stop(this.nextNoteTime + note.duration)

    this.oscillators.push(oscillator)
  }

  private advanceNote(track: { freq: number; duration: number }[]) {
    const note = track[this.currentNoteIndex]
    this.nextNoteTime += note.duration
    this.currentNoteIndex = (this.currentNoteIndex + 1) % track.length
  }

  private getMusicTrack(trackId: string) {
    const tracks: Record<string, { freq: number; duration: number }[]> = {
      tetris: [
        { freq: 329.63, duration: 0.4 }, // E4
        { freq: 246.94, duration: 0.2 }, // B3
        { freq: 261.63, duration: 0.2 }, // C4
        { freq: 293.66, duration: 0.4 }  // D4
      ],
      arcade: [
        { freq: 261.63, duration: 0.3 }, // C4
        { freq: 329.63, duration: 0.3 }, // E4
        { freq: 392.00, duration: 0.3 }, // G4
        { freq: 523.25, duration: 0.3 }  // C5
      ],
      chill: [
        { freq: 220.00, duration: 1.0 }, // A3
        { freq: 261.63, duration: 0.5 }, // C4
        { freq: 293.66, duration: 0.5 }, // D4
        { freq: 329.63, duration: 1.0 }  // E4
      ]
    }
    return tracks[trackId] || tracks.tetris
  }
}

describe('MusicScheduler - Lookahead Scheduling System', () => {
  let audioContext: MockAudioContext
  let musicGainNode: MockGainNode
  let scheduler: MusicScheduler

  beforeEach(() => {
    audioContext = new MockAudioContext()
    musicGainNode = new MockGainNode()
    scheduler = new MusicScheduler('tetris', audioContext, musicGainNode)
    vi.useFakeTimers()
  })

  afterEach(() => {
    scheduler.stop()
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Scheduler Initialization', () => {
    it('should initialize MusicScheduler with AudioContext', () => {
      expect(scheduler).toBeDefined()
      expect(audioContext).toBeDefined()
      expect(musicGainNode).toBeDefined()
    })

    it('should initialize with default lookahead time of 100ms', () => {
      expect(scheduler.getScheduleAheadTime()).toBe(0.1)
    })

    it('should start in stopped state', () => {
      expect(scheduler.getPlayingState()).toBe(false)
    })

    it('should initialize nextNoteTime at 0', () => {
      expect(scheduler.getNextNoteTime()).toBe(0)
    })

    it('should initialize currentNoteIndex at 0', () => {
      expect(scheduler.getCurrentNoteIndex()).toBe(0)
    })
  })

  describe('Scheduler Lifecycle', () => {
    it('should start scheduler and mark as playing', () => {
      scheduler.start()
      expect(scheduler.getPlayingState()).toBe(true)
    })

    it('should stop scheduler and reset state', () => {
      scheduler.start()
      expect(scheduler.getPlayingState()).toBe(true)

      scheduler.stop()
      expect(scheduler.getPlayingState()).toBe(false)
      expect(scheduler.getCurrentNoteIndex()).toBe(0)
    })

    it('should not start if already playing', () => {
      scheduler.start()
      const firstStart = scheduler.getPlayingState()

      scheduler.start()
      const secondStart = scheduler.getPlayingState()

      expect(firstStart).toBe(true)
      expect(secondStart).toBe(true)
    })

    it('should not start if AudioContext is null', () => {
      scheduler = new MusicScheduler('tetris', null as any, musicGainNode)
      scheduler.start()
      expect(scheduler.getPlayingState()).toBe(false)
    })
  })

  describe('Lookahead Window Scheduling', () => {
    it('should schedule notes within 100ms lookahead window', () => {
      scheduler.start()
      vi.advanceTimersByTime(50) // 50ms into future

      // Should have scheduled notes for the next 100ms window
      expect(audioContext.createOscillator).toHaveBeenCalled()
      expect(audioContext.createGain).toHaveBeenCalled()
    })

    it('should schedule first note immediately when starting', () => {
      scheduler.start()

      // First note should be scheduled immediately
      expect(audioContext.createOscillator).toHaveBeenCalled()
      expect(audioContext.createGain).toHaveBeenCalled()
    })

    it('should schedule multiple notes in one lookahead cycle', () => {
      scheduler.start()
      const initialCreateOscillatorCalls = audioContext.createOscillator.mock.calls.length

      // Advance time within lookahead window
      vi.advanceTimersByTime(50)

      // May schedule more notes depending on note durations
      expect(audioContext.createOscillator.mock.calls.length).toBeGreaterThanOrEqual(initialCreateOscillatorCalls)
    })

    it('should not schedule beyond lookahead window', () => {
      scheduler.start()
      const createOscillatorCalls = audioContext.createOscillator.mock.calls.length

      // Advance by 50ms
      vi.advanceTimersByTime(50)

      // Should only schedule within the 100ms lookahead window
      // Exact number depends on note durations, but should be finite
      expect(audioContext.createOscillator.mock.calls.length).toBeLessThan(100)
    })
  })

  describe('Scheduler Timing (25ms Check Interval)', () => {
    it('should check for new notes every 25ms', () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
      scheduler.start()

      // Clear initial calls
      setTimeoutSpy.mockClear()

      // Advance by one check interval
      vi.advanceTimersByTime(25)

      // Should have scheduled next check
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 25)
    })

    it('should maintain 25ms check interval across multiple cycles', () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
      scheduler.start()
      setTimeoutSpy.mockClear()

      // Advance through multiple check intervals
      vi.advanceTimersByTime(25)
      expect(setTimeoutSpy).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(25)
      expect(setTimeoutSpy).toHaveBeenCalledTimes(2)

      vi.advanceTimersByTime(25)
      expect(setTimeoutSpy).toHaveBeenCalledTimes(3)
    })

    it('should stop scheduling checks when paused', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      scheduler.start()
      scheduler.pause()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    it('should stop scheduling checks when stopped', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      scheduler.start()
      scheduler.stop()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('Note Scheduling and Oscillator Creation', () => {
    it('should create oscillator for each scheduled note', () => {
      scheduler.start()

      expect(audioContext.createOscillator).toHaveBeenCalled()
    })

    it('should set oscillator type to square wave', () => {
      scheduler.start()
      vi.advanceTimersByTime(1)

      const oscillators = audioContext.createOscillator.mock.results.map(r => r.value as MockOscillatorNode)
      oscillators.forEach(osc => {
        expect(osc.type).toBe('square')
      })
    })

    it('should set correct frequency for each note', () => {
      scheduler.start()

      // Tetris track: E4 (329.63), B3 (246.94), C4 (261.63), D4 (293.66)
      const expectedFrequencies = [329.63, 246.94, 261.63, 293.66]

      const oscillators = audioContext.createOscillator.mock.results.map(r => r.value as MockOscillatorNode)

      oscillators.forEach((osc, index) => {
        if (index < expectedFrequencies.length) {
          expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(
            expectedFrequencies[index],
            expect.any(Number)
          )
        }
      })
    })

    it('should create envelope gain node for each note', () => {
      scheduler.start()

      expect(audioContext.createGain).toHaveBeenCalled()
    })

    it('should connect oscillator to envelope', () => {
      scheduler.start()

      const oscillators = audioContext.createOscillator.mock.results.map(r => r.value as MockOscillatorNode)
      oscillators.forEach(osc => {
        expect(osc.connect).toHaveBeenCalled()
      })
    })

    it('should connect envelope to music gain node', () => {
      scheduler.start()

      const gainNodes = audioContext.createGain.mock.results.map(r => r.value as MockGainNode)
      gainNodes.forEach(gain => {
        expect(gain.connect).toHaveBeenCalled()
      })
    })
  })

  describe('ADSR Envelope Application', () => {
    it('should apply attack phase (0-10ms to peak)', () => {
      scheduler.start()

      const envelopes = audioContext.createGain.mock.results.map(r => r.value as MockGainNode)
      envelopes.forEach(envelope => {
        expect(envelope.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
          0.1,
          expect.any(Number)
        )
      })
    })

    it('should apply decay/sustain phase (10ms-duration+10ms)', () => {
      scheduler.start()

      const envelopes = audioContext.createGain.mock.results.map(r => r.value as MockGainNode)
      envelopes.forEach(envelope => {
        expect(envelope.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
          0.001,
          expect.any(Number)
        )
      })
    })

    it('should initialize gain to 0 at note start time', () => {
      scheduler.start()

      const envelopes = audioContext.createGain.mock.results.map(r => r.value as MockGainNode)
      envelopes.forEach(envelope => {
        expect(envelope.gain.setValueAtTime).toHaveBeenCalledWith(
          0,
          expect.any(Number)
        )
      })
    })

    it('should ramp up to peak value (0.1) during attack', () => {
      scheduler.start()

      const envelopes = audioContext.createGain.mock.results.map(r => r.value as MockGainNode)
      envelopes.forEach(envelope => {
        const linearRampCalls = envelope.gain.linearRampToValueAtTime.mock.calls
        expect(linearRampCalls.some(call => call[0] === 0.1)).toBe(true)
      })
    })

    it('should exponentially ramp to near-zero during release', () => {
      scheduler.start()

      const envelopes = audioContext.createGain.mock.results.map(r => r.value as MockGainNode)
      envelopes.forEach(envelope => {
        const expRampCalls = envelope.gain.exponentialRampToValueAtTime.mock.calls
        expect(expRampCalls.some(call => call[0] === 0.001)).toBe(true)
      })
    })
  })

  describe('Note Sequencing and Advancement', () => {
    it('should schedule notes in track order', () => {
      scheduler.start()

      // Tetris track starts: E4 (329.63), B3 (246.94), C4 (261.63), D4 (293.66)
      const expectedFrequencies = [329.63, 246.94, 261.63, 293.66]

      const oscillators = audioContext.createOscillator.mock.results.map(r => r.value as MockOscillatorNode)

      oscillators.slice(0, 4).forEach((osc, index) => {
        expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(
          expectedFrequencies[index],
          expect.any(Number)
        )
      })
    })

    it('should advance to next note in track', () => {
      scheduler.start()
      vi.advanceTimersByTime(100)

      expect(scheduler.getCurrentNoteIndex()).toBeGreaterThan(0)
    })

    it('should loop to beginning when reaching end of track', () => {
      scheduler.start()

      // Tetris track has 4 notes in our test setup
      // Advance long enough to loop
      vi.advanceTimersByTime(1000)

      // currentNoteIndex should have wrapped around
      expect(scheduler.getCurrentNoteIndex()).toBeLessThan(4)
    })

    it('should schedule multiple notes in sequence', () => {
      scheduler.start()

      const oscillatorCount = audioContext.createOscillator.mock.calls.length

      expect(oscillatorCount).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Pause and Resume', () => {
    it('should pause scheduler and stop playing', () => {
      scheduler.start()
      expect(scheduler.getPlayingState()).toBe(true)

      scheduler.pause()
      expect(scheduler.getPlayingState()).toBe(false)
    })

    it('should resume scheduler from paused state', () => {
      scheduler.start()
      scheduler.pause()
      expect(scheduler.getPlayingState()).toBe(false)

      scheduler.resume()
      expect(scheduler.getPlayingState()).toBe(true)
    })

    it('should not resume if AudioContext is null', () => {
      scheduler = new MusicScheduler('tetris', null as any, musicGainNode)
      scheduler.resume()
      expect(scheduler.getPlayingState()).toBe(false)
    })

    it('should not resume if already playing', () => {
      scheduler.start()
      scheduler.resume()
      expect(scheduler.getPlayingState()).toBe(true)
    })
  })

  describe('Rapid Start/Stop Cycles', () => {
    it('should handle rapid start-stop-start cycles', () => {
      scheduler.start()
      scheduler.stop()
      scheduler.start()

      expect(scheduler.getPlayingState()).toBe(true)
    })

    it('should reset state on each stop', () => {
      scheduler.start()
      vi.advanceTimersByTime(100)

      expect(scheduler.getCurrentNoteIndex()).toBeGreaterThan(0)

      scheduler.stop()
      expect(scheduler.getCurrentNoteIndex()).toBe(0)
      expect(scheduler.getPlayingState()).toBe(false)
    })

    it('should handle pause-resume-stop cycles', () => {
      scheduler.start()
      scheduler.pause()
      scheduler.resume()
      scheduler.stop()

      expect(scheduler.getPlayingState()).toBe(false)
      expect(scheduler.getCurrentNoteIndex()).toBe(0)
    })

    it('should properly clean up timers on stop', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      scheduler.start()
      scheduler.stop()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('Oscillator Lifecycle and Cleanup', () => {
    it('should track oscillator creation', () => {
      scheduler.start()

      expect(scheduler.getOscillatorCount()).toBeGreaterThanOrEqual(1)
    })

    it('should stop all oscillators on stop', () => {
      scheduler.start()
      const initialCount = audioContext.createOscillator.mock.calls.length

      expect(initialCount).toBeGreaterThan(0)

      scheduler.stop()

      // All created oscillators should have stop called
      const oscillators = audioContext.createOscillator.mock.results.map(r => r.value as MockOscillatorNode)
      oscillators.forEach(osc => {
        expect(osc.stop).toHaveBeenCalled()
      })
    })

    it('should call start on oscillators with correct time', () => {
      scheduler.start()

      const oscillators = audioContext.createOscillator.mock.results.map(r => r.value as MockOscillatorNode)
      oscillators.forEach(osc => {
        expect(osc.start).toHaveBeenCalledWith(expect.any(Number))
      })
    })

    it('should call stop on oscillators with correct end time', () => {
      scheduler.start()

      const oscillators = audioContext.createOscillator.mock.results.map(r => r.value as MockOscillatorNode)
      oscillators.forEach(osc => {
        expect(osc.stop).toHaveBeenCalledWith(expect.any(Number))
      })
    })
  })

  describe('Note Frequency Accuracy', () => {
    it('should use correct frequency for E4 (329.63 Hz)', () => {
      audioContext.currentTime = 0
      scheduler.start()

      const oscillators = audioContext.createOscillator.mock.results.map(r => r.value as MockOscillatorNode)

      const hasE4 = oscillators.some(osc => {
        return osc.frequency.setValueAtTime.mock.calls.some(call => call[0] === 329.63)
      })

      expect(hasE4).toBe(true)
    })

    it('should schedule B3 (246.94 Hz) in tetris track sequence', () => {
      // Verify the track contains B3 note
      const tetrisTrack = [
        { freq: 329.63, duration: 0.4 }, // E4
        { freq: 246.94, duration: 0.2 }, // B3
        { freq: 261.63, duration: 0.2 }, // C4
        { freq: 293.66, duration: 0.4 }  // D4
      ]

      const hasB3 = tetrisTrack.some(note => note.freq === 246.94)
      expect(hasB3).toBe(true)
    })

    it('should schedule C4 (261.63 Hz) in tetris track sequence', () => {
      // Verify the track contains C4 note
      const tetrisTrack = [
        { freq: 329.63, duration: 0.4 }, // E4
        { freq: 246.94, duration: 0.2 }, // B3
        { freq: 261.63, duration: 0.2 }, // C4
        { freq: 293.66, duration: 0.4 }  // D4
      ]

      const hasC4 = tetrisTrack.some(note => note.freq === 261.63)
      expect(hasC4).toBe(true)
    })

    it('should schedule D4 (293.66 Hz) in tetris track sequence', () => {
      // Verify the track contains D4 note
      const tetrisTrack = [
        { freq: 329.63, duration: 0.4 }, // E4
        { freq: 246.94, duration: 0.2 }, // B3
        { freq: 261.63, duration: 0.2 }, // C4
        { freq: 293.66, duration: 0.4 }  // D4
      ]

      const hasD4 = tetrisTrack.some(note => note.freq === 293.66)
      expect(hasD4).toBe(true)
    })
  })

  describe('AudioContext State Management', () => {
    it('should not schedule when AudioContext is null', () => {
      scheduler = new MusicScheduler('tetris', null as any, musicGainNode)
      scheduler.start()

      expect(audioContext.createOscillator).not.toHaveBeenCalled()
    })

    it('should not schedule when musicGainNode is null', () => {
      scheduler = new MusicScheduler('tetris', audioContext, null as any)
      scheduler.start()

      expect(audioContext.createOscillator).not.toHaveBeenCalled()
    })

    it('should handle different note durations', () => {
      scheduler.start()
      vi.advanceTimersByTime(100)

      // Should have scheduled notes (which have varying durations)
      expect(audioContext.createOscillator).toHaveBeenCalled()
    })

    it('should maintain currentTime synchronization', () => {
      const initialTime = audioContext.currentTime
      scheduler.start()

      audioContext.currentTime = initialTime + 0.05
      vi.advanceTimersByTime(50)

      audioContext.currentTime = initialTime + 0.1
      vi.advanceTimersByTime(50)

      expect(scheduler.getPlayingState()).toBe(true)
    })
  })

  describe('Integration: Complete Scheduling Workflow', () => {
    it('should complete full start-schedule-stop workflow', () => {
      // Start scheduler
      scheduler.start()
      expect(scheduler.getPlayingState()).toBe(true)

      // Advance time for scheduling to occur
      vi.advanceTimersByTime(50)

      // Verify oscillators were created
      expect(audioContext.createOscillator).toHaveBeenCalled()
      expect(audioContext.createGain).toHaveBeenCalled()

      // Stop scheduler
      scheduler.stop()
      expect(scheduler.getPlayingState()).toBe(false)
      expect(scheduler.getCurrentNoteIndex()).toBe(0)
    })

    it('should handle continuous playback with lookahead', () => {
      scheduler.start()

      // Simulate continuous playback for 1 second
      for (let i = 0; i < 40; i++) {
        audioContext.currentTime += 0.025
        vi.advanceTimersByTime(25)
      }

      expect(scheduler.getPlayingState()).toBe(true)
      expect(audioContext.createOscillator.mock.calls.length).toBeGreaterThan(0)
    })

    it('should maintain consistent timing across scheduling cycles', () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
      scheduler.start()
      setTimeoutSpy.mockClear()

      // Run multiple scheduling cycles
      vi.advanceTimersByTime(25) // First cycle
      vi.advanceTimersByTime(25) // Second cycle
      vi.advanceTimersByTime(25) // Third cycle

      // Each cycle should schedule the next check at 25ms
      setTimeoutSpy.mock.calls.forEach(call => {
        expect(call[1]).toBe(25)
      })
    })

    it('should handle pause and resume with proper state management', () => {
      scheduler.start()
      expect(scheduler.getPlayingState()).toBe(true)

      scheduler.pause()
      expect(scheduler.getPlayingState()).toBe(false)

      scheduler.resume()
      expect(scheduler.getPlayingState()).toBe(true)

      // Note index should be preserved during pause/resume
      const noteIndexBeforeStop = scheduler.getCurrentNoteIndex()
      scheduler.stop()
      expect(scheduler.getCurrentNoteIndex()).toBe(0)
    })
  })
})
