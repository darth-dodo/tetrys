import { ref, computed, onMounted, onUnmounted } from 'vue'

interface AudioSettings {
  musicEnabled: boolean
  soundEnabled: boolean
  musicVolume: number
  soundVolume: number
}

const AUDIO_STORAGE_KEY = 'tetrees-audio-settings'
const DEFAULT_SETTINGS: AudioSettings = {
  musicEnabled: false,
  soundEnabled: true,
  musicVolume: 0.3,
  soundVolume: 0.7
}

// Audio context and nodes
let audioContext: AudioContext | null = null
let musicGainNode: GainNode | null = null
let soundGainNode: GainNode | null = null

// Audio settings
const settings = ref<AudioSettings>({ ...DEFAULT_SETTINGS })

export function useAudio() {
  // Initialize audio context
  const initAudioContext = async () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // Create gain nodes
      musicGainNode = audioContext.createGain()
      soundGainNode = audioContext.createGain()
      
      musicGainNode.connect(audioContext.destination)
      soundGainNode.connect(audioContext.destination)
      
      updateVolumes()
    }
    
    // Resume context if suspended
    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }
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
  
  // Background music generation (simple loop)
  let musicInterval: number | null = null
  const tetrisTheme = [
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
  ]
  
  let currentNoteIndex = 0
  let musicTimeout: number | null = null
  
  const playNextNote = () => {
    if (!settings.value.musicEnabled || !audioContext || !musicGainNode) return
    
    const note = tetrisTheme[currentNoteIndex]
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
    
    currentNoteIndex = (currentNoteIndex + 1) % tetrisTheme.length
    
    musicTimeout = window.setTimeout(playNextNote, note.duration * 1000)
  }
  
  const startMusic = async () => {
    await initAudioContext()
    if (settings.value.musicEnabled && !musicTimeout) {
      playNextNote()
    }
  }
  
  const stopMusic = () => {
    if (musicTimeout) {
      clearTimeout(musicTimeout)
      musicTimeout = null
    }
    currentNoteIndex = 0
  }
  
  // Sound effects
  const playSound = async (type: 'move' | 'rotate' | 'drop' | 'line' | 'gameover') => {
    if (!settings.value.soundEnabled) return
    
    await initAudioContext()
    
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
  
  const setMusicVolume = (volume: number) => {
    settings.value.musicVolume = Math.max(0, Math.min(1, volume))
    updateVolumes()
    saveSettings()
  }
  
  const setSoundVolume = (volume: number) => {
    settings.value.soundVolume = Math.max(0, Math.min(1, volume))
    updateVolumes()
    saveSettings()
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
    toggleMusic,
    
    // Sound effects
    playSound,
    toggleSound,
    
    // Volume controls
    setMusicVolume,
    setSoundVolume,
    
    // Computed properties
    isMusicEnabled: computed(() => settings.value.musicEnabled),
    isSoundEnabled: computed(() => settings.value.soundEnabled),
    musicVolume: computed(() => settings.value.musicVolume),
    soundVolume: computed(() => settings.value.soundVolume)
  }
}