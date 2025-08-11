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

// Music state tracking
let isMusicPlaying = false
let isAudioContextInitialized = false
let initializationInProgress = false

// Track-specific note positions to preserve playback position
const trackPositions: Record<string, number> = {
  tetris: 0,
  arcade: 0,
  chill: 0,
  retro: 0
}

// Audio settings
const settings = ref<AudioSettings>({ ...DEFAULT_SETTINGS })

export function useAudio() {
  // Enhanced audio context initialization with user interaction handling
  const initAudioContext = async (): Promise<boolean> => {
    // Prevent concurrent initialization attempts
    if (initializationInProgress) {
      // Wait for ongoing initialization to complete
      let attempts = 0
      while (initializationInProgress && attempts < 50) { // Max 5 seconds wait
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      return isAudioContextInitialized
    }

    if (!audioContext) {
      initializationInProgress = true
      try {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        // Create gain nodes
        musicGainNode = audioContext.createGain()
        soundGainNode = audioContext.createGain()
        
        musicGainNode.connect(audioContext.destination)
        soundGainNode.connect(audioContext.destination)
        
        // Add state change listener
        audioContext.addEventListener('statechange', () => {
          console.log('Audio context state:', audioContext?.state)
          if (audioContext?.state === 'running' && isMusicPlaying && settings.value.musicEnabled) {
            // Resume music if it was playing
            playNextNote()
          }
        })
        
        updateVolumes()
        isAudioContextInitialized = true
        initializationInProgress = false
      } catch (error) {
        console.warn('Failed to initialize audio context:', error)
        initializationInProgress = false
        return false
      }
    }
    
    // Always try to resume context if suspended
    if (audioContext && audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
        console.log('Audio context resumed, state:', audioContext.state)
        // Check if resume was successful
        return audioContext.state !== 'suspended'
      } catch (error) {
        console.warn('Failed to resume audio context:', error)
        return false
      }
    }
    
    return isAudioContextInitialized
  }
  
  // Ensure audio context resumes on user interaction
  const ensureAudioContextRunning = async (): Promise<boolean> => {
    if (!audioContext) {
      return await initAudioContext()
    }
    
    if (audioContext.state === 'suspended') {
      try {
        await audioContext.resume()
        console.log('Audio context resumed on interaction, state:', audioContext.state)
        return audioContext.state !== 'suspended'
      } catch (error) {
        console.warn('Failed to resume audio context on interaction:', error)
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
  
  // 8-bit style sound generation
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
  
  // Background music themes
  let musicInterval: number | null = null
  
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
  
  let currentNoteIndex = 0
  let musicTimeout: number | null = null
  let currentTrackId = 'tetris'
  
  const playNextNote = () => {
    if (!settings.value.musicEnabled || !audioContext || !musicGainNode || !isMusicPlaying) {
      return
    }
    
    // Check if audio context is suspended
    if (audioContext.state === 'suspended') {
      audioContext.resume().then(() => {
        if (isMusicPlaying && settings.value.musicEnabled) {
          playNextNote()
        }
      }).catch(error => {
        console.warn('Failed to resume audio context:', error)
      })
      return
    }
    
    if (audioContext.state !== 'running') {
      return
    }
    
    try {
      const currentTrack = musicTracks[settings.value.currentTrack as keyof typeof musicTracks] || musicTracks.tetris
      const note = currentTrack[currentNoteIndex]
      const oscillator = audioContext.createOscillator()
      const envelope = audioContext.createGain()
      
      oscillator.type = 'square'
      oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime)
      
      envelope.gain.setValueAtTime(0, audioContext.currentTime)
      envelope.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
      envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + note.duration - 0.01)
      
      oscillator.connect(envelope)
      envelope.connect(musicGainNode)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + note.duration)
      
      currentNoteIndex = (currentNoteIndex + 1) % currentTrack.length
      
      // Schedule next note
      if (isMusicPlaying && settings.value.musicEnabled) {
        musicTimeout = window.setTimeout(playNextNote, note.duration * 1000)
      }
    } catch (error) {
      console.warn('Error playing note:', error)
      // Retry after a short delay
      if (isMusicPlaying && settings.value.musicEnabled) {
        musicTimeout = window.setTimeout(playNextNote, 500)
      }
    }
  }
  
  const startMusic = async () => {
    if (!settings.value.musicEnabled) return
    
    const initialized = await initAudioContext()
    if (!initialized) {
      console.warn('Could not initialize audio context for music')
      return
    }
    
    if (!isMusicPlaying) {
      isMusicPlaying = true
      if (!musicTimeout) {
        playNextNote()
      }
    }
  }
  
  const stopMusic = () => {
    isMusicPlaying = false
    if (musicTimeout) {
      clearTimeout(musicTimeout)
      musicTimeout = null
    }
    // Save current position for the current track
    trackPositions[currentTrackId] = currentNoteIndex
    currentNoteIndex = 0
  }
  
  // Add pause music function (separate from stop)
  const pauseMusic = () => {
    isMusicPlaying = false
    if (musicTimeout) {
      clearTimeout(musicTimeout)
      musicTimeout = null
    }
    // Don't reset currentNoteIndex on pause so music resumes from where it left off
  }
  
  const resumeMusic = async () => {
    if (settings.value.musicEnabled) {
      const initialized = await initAudioContext()
      if (!initialized) {
        console.warn('Could not initialize audio context for resuming music')
        return
      }
      
      isMusicPlaying = true
      if (!musicTimeout) {
        playNextNote()
      }
    }
  }
  
  // Sound effects
  const playSound = async (type: 'move' | 'rotate' | 'drop' | 'line' | 'gameover') => {
    if (!settings.value.soundEnabled) return
    
    // Ensure audio context is running
    const isRunning = await ensureAudioContextRunning()
    if (!isRunning) {
      const initialized = await initAudioContext()
      if (!initialized) {
        console.warn('Could not initialize audio context for sound effects')
        return
      }
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
    // Ensure audio context is running from user interaction
    await ensureAudioContextRunning()
    
    settings.value.musicEnabled = !settings.value.musicEnabled
    
    if (settings.value.musicEnabled) {
      // Ensure audio context is initialized before starting music
      const initialized = await initAudioContext()
      if (initialized) {
        await startMusic()
      } else {
        console.warn('Could not initialize audio context, music toggle failed')
        // Revert the setting change
        settings.value.musicEnabled = false
      }
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
    // Ensure audio context is running from user interaction
    await ensureAudioContextRunning()
    
    settings.value.musicVolume = Math.max(0, Math.min(1, volume))
    updateVolumes()
    saveSettings()
  }
  
  const setSoundVolume = async (volume: number) => {
    // Ensure audio context is running from user interaction
    await ensureAudioContextRunning()
    
    settings.value.soundVolume = Math.max(0, Math.min(1, volume))
    updateVolumes()
    saveSettings()
  }
  
  const setCurrentTrack = async (trackId: string) => {
    // Ensure audio context is running from user interaction
    await ensureAudioContextRunning()
    
    // Save current position for the current track
    trackPositions[currentTrackId] = currentNoteIndex
    
    const wasPlaying = isMusicPlaying && settings.value.musicEnabled
    
    // Stop current music if playing
    if (wasPlaying) {
      isMusicPlaying = false
      if (musicTimeout) {
        clearTimeout(musicTimeout)
        musicTimeout = null
      }
    }
    
    // Switch to new track
    settings.value.currentTrack = trackId
    currentTrackId = trackId
    
    // Restore position for the new track (or start from beginning if never played)
    currentNoteIndex = trackPositions[trackId] || 0
    
    saveSettings()
    
    // Restart music if it was playing
    if (wasPlaying) {
      const initialized = await initAudioContext()
      if (initialized) {
        isMusicPlaying = true
        playNextNote()
      } else {
        console.warn('Could not initialize audio context for track change')
      }
    }
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
  }
  
  // Load settings on mount
  onMounted(() => {
    loadSettings()
    currentTrackId = settings.value.currentTrack
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
    isMusicPlaying: computed(() => isMusicPlaying),
    currentTrack: computed(() => settings.value.currentTrack)
  }
}