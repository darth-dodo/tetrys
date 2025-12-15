import { ref, computed, onMounted, onUnmounted } from 'vue'

interface AudioSettings {
  musicEnabled: boolean
  soundEnabled: boolean
  musicVolume: number
  soundVolume: number
  currentTrack: string
}

const AUDIO_STORAGE_KEY = 'tetrys-audio-settings'
const DEFAULT_SETTINGS: AudioSettings = {
  musicEnabled: false,
  soundEnabled: true,
  musicVolume: 0.3,
  soundVolume: 0.7,
  currentTrack: 'tetris'
}

// Audio context and nodes
let audioContext: AudioContext | null = null
let musicGainNode: GainNode | null = null
let soundGainNode: GainNode | null = null

// Audio settings
const settings = ref<AudioSettings>({ ...DEFAULT_SETTINGS })

// Music Scheduler for precise Web Audio timing
class MusicScheduler {
  private scheduleAheadTime = 0.1 // Schedule 100ms ahead
  private schedulerTimer: number | null = null
  private nextNoteTime = 0
  private currentNoteIndex = 0
  private isPlaying = false
  private currentTrackId: string

  constructor(trackId: string) {
    this.currentTrackId = trackId
  }

  start() {
    if (!audioContext || this.isPlaying) return

    this.isPlaying = true
    this.nextNoteTime = audioContext.currentTime
    this.scheduleNotes()
  }

  stop() {
    this.isPlaying = false
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer)
      this.schedulerTimer = null
    }
    this.currentNoteIndex = 0
  }

  pause() {
    this.isPlaying = false
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer)
      this.schedulerTimer = null
    }
  }

  resume() {
    if (!audioContext || this.isPlaying) return

    this.isPlaying = true
    this.nextNoteTime = audioContext.currentTime
    this.scheduleNotes()
  }

  switchTrack(trackId: string) {
    const wasPlaying = this.isPlaying
    this.stop()
    this.currentTrackId = trackId
    if (wasPlaying) {
      this.start()
    }
  }

  private scheduleNotes() {
    if (!audioContext || !musicGainNode || !this.isPlaying) return

    const track = musicTracks[this.currentTrackId as keyof typeof musicTracks] || musicTracks.tetris

    // Schedule all notes that fall within the lookahead window
    while (this.nextNoteTime < audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(track[this.currentNoteIndex])
      this.advanceNote(track)
    }

    // Schedule next scheduling check
    this.schedulerTimer = window.setTimeout(() => {
      this.scheduleNotes()
    }, 25) // Check every 25ms
  }

  private scheduleNote(note: { freq: number; duration: number }) {
    if (!audioContext || !musicGainNode) return

    const oscillator = audioContext.createOscillator()
    const envelope = audioContext.createGain()

    oscillator.type = 'square'
    oscillator.frequency.setValueAtTime(note.freq, this.nextNoteTime)

    // ADSR envelope
    envelope.gain.setValueAtTime(0, this.nextNoteTime)
    envelope.gain.linearRampToValueAtTime(0.1, this.nextNoteTime + 0.01)
    envelope.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + note.duration - 0.01)

    oscillator.connect(envelope)
    envelope.connect(musicGainNode)

    oscillator.start(this.nextNoteTime)
    oscillator.stop(this.nextNoteTime + note.duration)
  }

  private advanceNote(track: { freq: number; duration: number }[]) {
    const note = track[this.currentNoteIndex]
    this.nextNoteTime += note.duration
    this.currentNoteIndex = (this.currentNoteIndex + 1) % track.length
  }

  getPlayingState() {
    return this.isPlaying
  }
}

// Global music scheduler instance
let musicScheduler: MusicScheduler | null = null

// Music tracks definitions
const musicTracks = {
  tetris: [
    { freq: 329.63, duration: 0.4 }, // E4
    { freq: 246.94, duration: 0.2 }, // B3
    { freq: 261.63, duration: 0.2 }, // C4
    { freq: 293.66, duration: 0.4 }, // D4
    { freq: 261.63, duration: 0.2 }, // C4
    { freq: 246.94, duration: 0.2 }, // B3
    { freq: 220.00, duration: 0.4 }, // A3
    { freq: 220.00, duration: 0.2 }, // A3
    { freq: 261.63, duration: 0.2 }, // C4
    { freq: 329.63, duration: 0.4 }, // E4
    { freq: 293.66, duration: 0.2 }, // D4
    { freq: 261.63, duration: 0.2 }, // C4
    { freq: 246.94, duration: 0.6 }, // B3
    { freq: 261.63, duration: 0.2 }, // C4
    { freq: 293.66, duration: 0.4 }, // D4
    { freq: 329.63, duration: 0.4 }, // E4
    { freq: 261.63, duration: 0.4 }, // C4
    { freq: 220.00, duration: 0.4 }, // A3
    { freq: 220.00, duration: 0.4 }  // A3
  ],
  arcade: [
    { freq: 261.63, duration: 0.3 }, // C4
    { freq: 329.63, duration: 0.3 }, // E4
    { freq: 392.00, duration: 0.3 }, // G4
    { freq: 523.25, duration: 0.3 }, // C5
    { freq: 392.00, duration: 0.3 }, // G4
    { freq: 329.63, duration: 0.3 }, // E4
    { freq: 293.66, duration: 0.6 }, // D4
    { freq: 246.94, duration: 0.3 }, // B3
    { freq: 293.66, duration: 0.3 }, // D4
    { freq: 329.63, duration: 0.6 }, // E4
  ],
  chill: [
    { freq: 220.00, duration: 1.0 }, // A3
    { freq: 261.63, duration: 0.5 }, // C4
    { freq: 293.66, duration: 0.5 }, // D4
    { freq: 329.63, duration: 1.0 }, // E4
    { freq: 293.66, duration: 0.5 }, // D4
    { freq: 261.63, duration: 0.5 }, // C4
    { freq: 246.94, duration: 1.0 }, // B3
    { freq: 220.00, duration: 0.5 }, // A3
    { freq: 196.00, duration: 0.5 }, // G3
    { freq: 220.00, duration: 1.0 }, // A3
    { freq: 246.94, duration: 0.5 }, // B3
    { freq: 261.63, duration: 0.5 }, // C4
    { freq: 293.66, duration: 1.5 }, // D4
    { freq: 261.63, duration: 0.5 }, // C4
    { freq: 220.00, duration: 1.0 }, // A3
    { freq: 196.00, duration: 1.0 }, // G3
  ],
  retro: [
    { freq: 261.63, duration: 0.3 }, // C4
    { freq: 329.63, duration: 0.3 }, // E4
    { freq: 392.00, duration: 0.3 }, // G4
    { freq: 329.63, duration: 0.3 }, // E4
    { freq: 349.23, duration: 0.6 }, // F4
    { freq: 293.66, duration: 0.3 }, // D4
    { freq: 349.23, duration: 0.3 }, // F4
    { freq: 392.00, duration: 0.6 }, // G4
    { freq: 440.00, duration: 0.3 }, // A4
    { freq: 392.00, duration: 0.3 }, // G4
    { freq: 349.23, duration: 0.3 }, // F4
    { freq: 329.63, duration: 0.3 }, // E4
    { freq: 293.66, duration: 0.6 }, // D4
    { freq: 261.63, duration: 0.3 }, // C4
    { freq: 220.00, duration: 0.3 }, // A3
    { freq: 246.94, duration: 0.6 }, // B3
    { freq: 261.63, duration: 0.6 }, // C4
    { freq: 196.00, duration: 0.3 }, // G3
    { freq: 220.00, duration: 0.3 }, // A3
    { freq: 246.94, duration: 0.3 }, // B3
  ]
}

export function useAudio() {
  // Initialize audio context
  const initAudioContext = async (): Promise<boolean> => {
    if (!audioContext) {
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

        // Create gain nodes
        musicGainNode = audioContext.createGain()
        soundGainNode = audioContext.createGain()

        musicGainNode.connect(audioContext.destination)
        soundGainNode.connect(audioContext.destination)

        updateVolumes()
      } catch (error) {
        console.warn('Failed to initialize audio context:', error)
        return false
      }
    }

    // Resume if suspended
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
      } catch (error) {
        console.warn('Failed to resume audio context:', error)
        return false
      }
    }

    return audioContext.state === 'running'
  }

  // Ensure audio context is running (for user interaction)
  const ensureAudioContextRunning = async (): Promise<boolean> => {
    if (!audioContext) {
      return await initAudioContext()
    }

    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
      } catch (error) {
        console.warn('Failed to resume audio context:', error)
        return false
      }
    }

    return audioContext.state === 'running'
  }

  const updateVolumes = () => {
    if (musicGainNode) {
      musicGainNode.gain.value = settings.value.musicEnabled ? settings.value.musicVolume : 0
    }
    if (soundGainNode) {
      soundGainNode.gain.value = settings.value.soundEnabled ? settings.value.soundVolume : 0
    }
  }

  // Sound effects
  const createBeep = (frequency: number, duration: number, type: OscillatorType = 'square') => {
    if (!audioContext || !soundGainNode) return

    const oscillator = audioContext.createOscillator()
    const envelope = audioContext.createGain()

    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)

    envelope.gain.setValueAtTime(0, audioContext.currentTime)
    envelope.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
    envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)

    oscillator.connect(envelope)
    envelope.connect(soundGainNode)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  }

  const createChord = (frequencies: number[], duration: number) => {
    frequencies.forEach(freq => createBeep(freq, duration, 'square'))
  }

  // Music controls
  const startMusic = async () => {
    if (!settings.value.musicEnabled) return

    const initialized = await initAudioContext()
    if (!initialized) {
      console.warn('Could not initialize audio context for music')
      return
    }

    if (!musicScheduler) {
      musicScheduler = new MusicScheduler(settings.value.currentTrack)
    }

    musicScheduler.start()
  }

  const stopMusic = () => {
    if (musicScheduler) {
      musicScheduler.stop()
    }
  }

  const pauseMusic = () => {
    if (musicScheduler) {
      musicScheduler.pause()
    }
  }

  const resumeMusic = async () => {
    if (!settings.value.musicEnabled) return

    const initialized = await initAudioContext()
    if (!initialized) {
      console.warn('Could not initialize audio context for resuming music')
      return
    }

    if (musicScheduler) {
      musicScheduler.resume()
    } else {
      await startMusic()
    }
  }

  // Sound effects
  const playSound = async (type: 'move' | 'rotate' | 'drop' | 'line' | 'gameover') => {
    if (!settings.value.soundEnabled) return

    const isRunning = await ensureAudioContextRunning()
    if (!isRunning) {
      await initAudioContext()
    }

    switch (type) {
      case 'move':
        createBeep(220, 0.1, 'square')
        break
      case 'rotate':
        createBeep(330, 0.15, 'triangle')
        break
      case 'drop':
        createBeep(110, 0.2, 'sawtooth')
        break
      case 'line':
        createChord([440, 550, 660], 0.3)
        break
      case 'gameover':
        setTimeout(() => createBeep(220, 0.3, 'square'), 0)
        setTimeout(() => createBeep(196, 0.3, 'square'), 300)
        setTimeout(() => createBeep(174, 0.5, 'square'), 600)
        break
    }
  }

  // Settings management
  const toggleMusic = async () => {
    await ensureAudioContextRunning()

    settings.value.musicEnabled = !settings.value.musicEnabled

    if (settings.value.musicEnabled) {
      await startMusic()
    } else {
      stopMusic()
    }

    updateVolumes()
    saveSettings()
  }

  const toggleSound = () => {
    settings.value.soundEnabled = !settings.value.soundEnabled
    updateVolumes()
    saveSettings()
  }

  const setMusicVolume = async (volume: number) => {
    await ensureAudioContextRunning()

    settings.value.musicVolume = Math.max(0, Math.min(1, volume))
    updateVolumes()
    saveSettings()
  }

  const setSoundVolume = async (volume: number) => {
    await ensureAudioContextRunning()

    settings.value.soundVolume = Math.max(0, Math.min(1, volume))
    updateVolumes()
    saveSettings()
  }

  const setCurrentTrack = async (trackId: string) => {
    await ensureAudioContextRunning()

    settings.value.currentTrack = trackId

    if (musicScheduler) {
      musicScheduler.switchTrack(trackId)
    }

    saveSettings()
  }

  const getAvailableTracks = () => {
    return [
      { id: 'tetris', name: 'Classic Tetris', description: 'Original game theme' },
      { id: 'arcade', name: 'Arcade Beat', description: 'Fast-paced arcade style' },
      { id: 'chill', name: 'Chill Vibes', description: 'Relaxing ambient theme' },
      { id: 'retro', name: 'Retro Wave', description: '8-bit nostalgic sound' }
    ]
  }

  const saveSettings = () => {
    localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings.value))
  }

  const loadSettings = () => {
    const saved = localStorage.getItem(AUDIO_STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        settings.value = { ...DEFAULT_SETTINGS, ...parsed }
      } catch (e) {
        settings.value = { ...DEFAULT_SETTINGS }
      }
    } else {
      // Reset to defaults if no saved settings
      settings.value = { ...DEFAULT_SETTINGS }
    }
  }

  // Cleanup
  const cleanup = () => {
    stopMusic()
    if (audioContext) {
      audioContext.close()
      audioContext = null
      musicGainNode = null
      soundGainNode = null
    }
    musicScheduler = null
  }

  // Load settings on mount
  onMounted(() => {
    loadSettings()
    updateVolumes()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    // State
    settings: computed(() => settings.value),

    // Music controls
    startMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    toggleMusic,
    setCurrentTrack,
    getAvailableTracks,

    // Sound effects
    playSound,
    toggleSound,

    // Volume controls
    setMusicVolume,
    setSoundVolume,

    // Audio context management
    ensureAudioContextRunning,

    // Computed properties
    isMusicEnabled: computed(() => settings.value.musicEnabled),
    isSoundEnabled: computed(() => settings.value.soundEnabled),
    musicVolume: computed(() => settings.value.musicVolume),
    soundVolume: computed(() => settings.value.soundVolume),
    isMusicPlaying: computed(() => musicScheduler?.getPlayingState() ?? false),
    currentTrack: computed(() => settings.value.currentTrack)
  }
}
