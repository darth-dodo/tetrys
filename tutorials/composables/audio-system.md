# 🎵 Audio System Deep Dive: Web Audio API Engineering

A comprehensive technical exploration of Tetrys's professional-grade audio system, built on the Web Audio API with lookahead scheduling, ADSR envelopes, and procedural sound generation.

## Table of Contents

1. [Web Audio API Architecture](#web-audio-api-architecture)
2. [MusicScheduler: Lookahead Scheduling](#musicscheduler-lookahead-scheduling)
3. [ADSR Envelopes](#adsr-envelopes)
4. [Procedural Sound Generation](#procedural-sound-generation)
5. [Music Track System](#music-track-system)
6. [Browser Compatibility](#browser-compatibility)
7. [Performance Optimization](#performance-optimization)
8. [Best Practices](#best-practices)

---

## Web Audio API Architecture

### Core Concept: Signal Flow Graph

The Web Audio API operates on a **signal flow graph** model where audio nodes are connected to process and route audio signals:

```
┌─────────────────────────────────────────────────────────────┐
│                    AudioContext                             │
│  (Main audio processing graph - 44.1kHz or 48kHz)          │
└─────────────────────────────────────────────────────────────┘
                           │
            ┌──────────────┴───────────────┐
            │                              │
    ┌───────▼────────┐           ┌────────▼────────┐
    │  musicGainNode │           │ soundGainNode   │
    │  (vol: 0.3)    │           │  (vol: 0.7)     │
    └───────┬────────┘           └────────┬────────┘
            │                              │
    ┌───────▼────────────┐        ┌────────▼──────────────┐
    │  Music Oscillators │        │  Sound Oscillators    │
    │  → Envelope Nodes  │        │  → Envelope Nodes     │
    └────────────────────┘        └───────────────────────┘
            │                              │
            └──────────────┬───────────────┘
                           │
                   ┌───────▼────────┐
                   │  destination   │
                   │ (audio output) │
                   └────────────────┘
```

### AudioContext Lifecycle

The AudioContext is the central hub for all Web Audio operations:

```typescript
// Initialize with browser compatibility fallback
audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

// Create gain nodes for independent volume control
musicGainNode = audioContext.createGain()
soundGainNode = audioContext.createGain()

// Connect to output (speakers/headphones)
musicGainNode.connect(audioContext.destination)
soundGainNode.connect(audioContext.destination)
```

**Key Properties:**
- **currentTime**: High-precision clock (not affected by JavaScript event loop delays)
- **sampleRate**: Usually 44.1kHz or 48kHz (matches device hardware)
- **state**: `suspended`, `running`, or `closed`

### Browser Autoplay Policies

Modern browsers prevent audio from playing without user interaction to improve user experience:

```typescript
const ensureAudioContextRunning = async (): Promise<boolean> => {
  if (!audioContext) {
    return await initAudioContext()
  }

  // Check if context is suspended (browser autoplay policy)
  if (audioContext.state === 'suspended') {
    try {
      await audioContext.resume()  // Requires user gesture
    } catch (error) {
      console.warn('Failed to resume audio context:', error)
      return false
    }
  }

  return audioContext.state === 'running'
}
```

**Compliance Strategy:**
1. Initialize context lazily (on first user interaction)
2. Check `state` before playing audio
3. Call `resume()` after user gestures (clicks, key presses)
4. Provide visual feedback when audio is blocked

### Dual Gain Node Architecture

Separate gain nodes enable independent volume control for music and sound effects:

```typescript
const updateVolumes = () => {
  if (musicGainNode) {
    // Apply volume or mute completely
    musicGainNode.gain.value = settings.value.musicEnabled
      ? settings.value.musicVolume  // 0.0 to 1.0
      : 0
  }
  if (soundGainNode) {
    soundGainNode.gain.value = settings.value.soundEnabled
      ? settings.value.soundVolume
      : 0
  }
}
```

**Why Separate Gain Nodes?**
- Music and sound effects have different purposes
- Users may want to disable music but keep sound effects
- Enables different volume levels for background vs foreground audio
- Simplifies muting individual audio categories

**Signal Routing Example:**
```
Oscillator (440Hz square wave)
  → Envelope Gain (ADSR shaping)
    → Category Gain (music or sound)
      → Destination (speakers)

Each → represents a .connect() call
```

---

## MusicScheduler: Lookahead Scheduling

### The JavaScript Timing Problem

JavaScript's `setTimeout` and `setInterval` are **not precise enough** for musical timing:

```javascript
// WRONG: This will drift and sound uneven
setInterval(() => {
  playNote()
}, 250)  // Tries to play every 250ms but actual timing varies
```

**Why setTimeout Fails:**
- Event loop delays (garbage collection, other tasks)
- Timer resolution limited to ~4ms in most browsers
- Cumulative drift over time destroys musical rhythm

### The Solution: Web Audio Lookahead Scheduling

The `MusicScheduler` class uses a **hybrid approach**:

1. JavaScript timer checks **frequently** (every 25ms)
2. Schedules notes using **Web Audio's high-precision clock**
3. Looks ahead to schedule notes before they're needed

```typescript
class MusicScheduler {
  private scheduleAheadTime = 0.1  // 100ms lookahead window
  private schedulerTimer: number | null = null
  private nextNoteTime = 0         // Web Audio time (high precision)
  private currentNoteIndex = 0
  private isPlaying = false

  private scheduleNotes() {
    if (!audioContext || !musicGainNode || !this.isPlaying) return

    const track = musicTracks[this.currentTrackId]

    // Schedule all notes within the lookahead window
    while (this.nextNoteTime < audioContext.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(track[this.currentNoteIndex])
      this.advanceNote(track)
    }

    // Check again in 25ms (fast enough to catch all notes)
    this.schedulerTimer = window.setTimeout(() => {
      this.scheduleNotes()
    }, 25)
  }
}
```

### How Lookahead Scheduling Works

**Timeline Visualization:**

```
Time →
audioContext.currentTime = 10.000s
scheduleAheadTime = 0.100s (100ms)

Current window: [10.000s to 10.100s]

JavaScript checks: every 25ms
┌─────┬─────┬─────┬─────┐
│ 0ms │ 25ms│ 50ms│ 75ms│ (setTimeout calls)
└─────┴─────┴─────┴─────┘

Web Audio schedules: precise to microseconds
├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤ (actual note timings)
```

**Step-by-Step Example:**

```
t=0.000s: Start music
  - nextNoteTime = 0.000s
  - currentTime = 0.000s
  - Window: [0.000s to 0.100s]

  Schedule:
  - Note 0 at 0.000s (E4, 0.4s duration)
  - Note 1 at 0.400s (B3, 0.2s duration) ← OUTSIDE window
  - Stop (note would be at 0.400s > 0.100s)

t=0.025s: Timer fires
  - nextNoteTime = 0.400s (after note 0)
  - currentTime = 0.025s
  - Window: [0.025s to 0.125s]
  - No notes to schedule (next is at 0.400s)

t=0.350s: Timer fires
  - currentTime = 0.350s
  - Window: [0.350s to 0.450s]

  Schedule:
  - Note 1 at 0.400s (B3, 0.2s)
  - Note 2 at 0.600s (C4, 0.2s) ← OUTSIDE window
  - Stop

Result: Perfectly timed notes, no drift
```

### The Critical Numbers

**scheduleAheadTime = 0.1 (100ms)**
- Large enough to buffer against JavaScript delays
- Small enough to allow dynamic tempo changes
- Typical range: 50-200ms

**Check interval = 25ms**
- 4x per second ensures catching all notes
- Fast enough: shortest note is 200ms (0.2s duration)
- Balance between precision and CPU usage

**Why This Works:**
```
Shortest note duration: 200ms
Check interval: 25ms
Checks per note: 200ms / 25ms = 8 checks

Even if 2-3 checks are delayed, we still catch the note
```

### Track Switching Without Gaps

```typescript
switchTrack(trackId: string) {
  const wasPlaying = this.isPlaying
  this.stop()  // Clear timers, reset index
  this.currentTrackId = trackId
  if (wasPlaying) {
    this.start()  // Restart with new track immediately
  }
}
```

No silence gap because:
1. `stop()` clears scheduled notes but not currently playing ones
2. `start()` immediately schedules new notes
3. Web Audio clock is continuous (no reset)

---

## ADSR Envelopes

### What is ADSR?

ADSR (Attack-Decay-Sustain-Release) shapes the **amplitude over time** to make sounds more natural:

```
Amplitude
1.0 │    ╱╲
    │   ╱  ╲___________
0.7 │  ╱       sustain ╲
    │ ╱                 ╲
0.0 │╱___________________╲____
    │ A  D   S          R
    └────────────────────────→ Time

A = Attack:  0 → peak (fast rise)
D = Decay:   peak → sustain (drop)
S = Sustain: constant level (hold)
R = Release: sustain → 0 (fade out)
```

### Music Note ADSR Implementation

```typescript
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
```

**Breakdown:**

```typescript
// 1. ATTACK: 0 → 0.1 over 10ms (linear)
envelope.gain.setValueAtTime(0, this.nextNoteTime)
envelope.gain.linearRampToValueAtTime(0.1, this.nextNoteTime + 0.01)

// 2. DECAY + RELEASE: 0.1 → 0.001 over remaining time (exponential)
envelope.gain.exponentialRampToValueAtTime(
  0.001,  // Near-zero (can't use 0 with exponential)
  this.nextNoteTime + note.duration - 0.01
)

// Note: Sustain is skipped for percussive 8-bit sound
```

### Linear vs Exponential Ramps

**Linear Ramp** (attack):
```
Volume
0.10 │         ╱
     │        ╱
     │       ╱
     │      ╱
     │     ╱
0.00 │────╱
     └───────────→ Time
     0ms    10ms

Change rate: constant
Best for: Fast attacks
```

**Exponential Ramp** (decay/release):
```
Volume
0.10 │╲
     │ ╲___
     │     ╲___
     │         ╲____
     │              ╲____
0.00 │___________________╲
     └───────────────────→ Time
     0ms              400ms

Change rate: proportional to current value
Best for: Natural-sounding fades
```

**Why Exponential for Decay?**
- Human hearing perceives volume logarithmically
- Exponential decay sounds more natural
- Mimics physical instruments (string vibrations, air columns)

### Sound Effect ADSR

Sound effects use a similar pattern but different parameters:

```typescript
const createBeep = (frequency: number, duration: number, type: OscillatorType = 'square') => {
  const oscillator = audioContext.createOscillator()
  const envelope = audioContext.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)

  // Snappier envelope for game sounds
  envelope.gain.setValueAtTime(0, audioContext.currentTime)
  envelope.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)  // Attack: 10ms
  envelope.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)  // Release

  oscillator.connect(envelope)
  envelope.connect(soundGainNode)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + duration)
}
```

**Differences from Music:**
- Higher peak volume (0.3 vs 0.1) for audibility
- Immediate playback (`currentTime` vs scheduled time)
- Variable oscillator types for different sounds

---

## Procedural Sound Generation

### Oscillator Types and Their Characteristics

The Web Audio API provides five oscillator waveforms:

```
SQUARE WAVE (type: 'square')
  1 │ ┌─┐   ┌─┐   ┌─┐
    │ │ │   │ │   │ │
  0 │─┘ └───┘ └───┘ └───
    └───────────────────→
Harmonics: Odd only (1, 3, 5, 7...)
Sound: Hollow, clarinet-like, retro games
Used in: Move sounds, music notes

TRIANGLE WAVE (type: 'triangle')
  1 │   ╱╲   ╱╲   ╱╲
    │  ╱  ╲ ╱  ╲ ╱  ╲
  0 │ ╱    ╳    ╳    ╲
    │      ╱    ╱
 -1 │
    └───────────────────→
Harmonics: Odd only, weaker than square
Sound: Mellow, flute-like
Used in: Rotate sounds

SAWTOOTH WAVE (type: 'sawtooth')
  1 │ ╱│ ╱│ ╱│
    │╱ │╱ │╱ │
  0 │  ╱  ╱  ╱
    │
 -1 │
    └───────────────────→
Harmonics: All (1, 2, 3, 4...)
Sound: Bright, buzzy, brass-like
Used in: Drop sounds (harsh impact)

SINE WAVE (type: 'sine')
  1 │   ╭─╮   ╭─╮
    │  ╱   ╲ ╱   ╲
  0 │─╯     ╳     ╰─
    │      ╱ ╲
 -1 │     ╰───╯
    └───────────────────→
Harmonics: None (pure tone)
Sound: Clean, pure, electronic
Used in: Minimal/ambient sounds
```

### Frequency-Based Sound Effects

Each game action uses a specific frequency and oscillator type:

```typescript
const playSound = async (type: 'move' | 'rotate' | 'drop' | 'line' | 'gameover') => {
  switch (type) {
    case 'move':
      createBeep(220, 0.1, 'square')
      // A3 note, short duration, hollow sound
      break

    case 'rotate':
      createBeep(330, 0.15, 'triangle')
      // E4 note, slightly longer, softer sound
      break

    case 'drop':
      createBeep(110, 0.2, 'sawtooth')
      // A2 note, low frequency, harsh impact
      break

    case 'line':
      createChord([440, 550, 660], 0.3)
      // A4, C#5, E5 (A major chord)
      break

    case 'gameover':
      // Descending sequence (sad trombone effect)
      setTimeout(() => createBeep(220, 0.3, 'square'), 0)    // A3
      setTimeout(() => createBeep(196, 0.3, 'square'), 300)  // G3
      setTimeout(() => createBeep(174, 0.5, 'square'), 600)  // F3
      break
  }
}
```

**Sound Design Rationale:**

| Sound | Frequency | Type | Duration | Purpose |
|-------|-----------|------|----------|---------|
| Move | 220 Hz (A3) | Square | 100ms | Quick acknowledgment |
| Rotate | 330 Hz (E4) | Triangle | 150ms | Distinct from move |
| Drop | 110 Hz (A2) | Sawtooth | 200ms | Heavy impact feel |
| Line Clear | 440/550/660 Hz | Square | 300ms | Rewarding chord |
| Game Over | 220→196→174 Hz | Square | 1100ms | Descending sadness |

### Chord Generation

Multiple oscillators playing simultaneously create chords:

```typescript
const createChord = (frequencies: number[], duration: number) => {
  frequencies.forEach(freq => createBeep(freq, duration, 'square'))
}

// Example: A major chord
createChord([440, 550, 660], 0.3)
// Simultaneously creates:
// - 440 Hz (A4) - root note
// - 550 Hz (C#5) - major third
// - 660 Hz (E5) - perfect fifth
```

**How It Works:**
1. Each `createBeep` creates an independent oscillator
2. All oscillators connect to the same `soundGainNode`
3. Web Audio mixes them automatically (additive synthesis)
4. Result: Rich, harmonious sound

**Additive Synthesis Diagram:**
```
Osc 440Hz ──┐
            ├─→ soundGainNode → destination
Osc 550Hz ──┤
            │
Osc 660Hz ──┘

Output waveform is sum of all oscillators
```

### Game Over Sequence with setTimeout Staggering

The game over sound uses **setTimeout** (not Web Audio scheduling) for dramatic effect:

```typescript
case 'gameover':
  setTimeout(() => createBeep(220, 0.3, 'square'), 0)    // Immediate
  setTimeout(() => createBeep(196, 0.3, 'square'), 300)  // 300ms later
  setTimeout(() => createBeep(174, 0.5, 'square'), 600)  // 600ms later
  break
```

**Why setTimeout Here?**
- Timing precision doesn't matter (not musical rhythm)
- Want asynchronous triggering (non-blocking)
- Each note is independent (not part of continuous music)
- Simpler than Web Audio scheduling for one-off sequences

**Musical Theory:**
```
220 Hz (A3) → 196 Hz (G3) → 174 Hz (F3)
    ↓ -11%      ↓ -11%
   Descending minor seconds (sad/ominous)
```

---

## Music Track System

### Note Representation

Each musical note is a simple object:

```typescript
interface Note {
  freq: number    // Frequency in Hertz (Hz)
  duration: number // Duration in seconds
}

// Example: E4 quarter note at moderate tempo
{ freq: 329.63, duration: 0.4 }
```

### Musical Note Frequencies

The system uses **equal temperament tuning** (12-tone scale):

```typescript
// Common notes used in tracks
const noteFrequencies = {
  'G3': 196.00,
  'A3': 220.00,
  'B3': 246.94,
  'C4': 261.63,  // Middle C
  'D4': 293.66,
  'E4': 329.63,
  'F4': 349.23,
  'G4': 392.00,
  'A4': 440.00,  // Concert pitch
  'B4': 493.88,
  'C5': 523.25,
  'D5': 587.33,
  'E5': 659.25
}
```

**Frequency Calculation:**
```
f = 440 × 2^((n - 49) / 12)

Where:
- 440 Hz is A4 (49th key on piano)
- n is the key number
- Each semitone is 2^(1/12) ≈ 1.059463

Example: E4 (4 semitones below A4)
f = 440 × 2^((44 - 49) / 12)
f = 440 × 2^(-5/12)
f = 440 × 0.749
f ≈ 329.63 Hz ✓
```

### Built-in Music Tracks

#### 1. Tetris Theme (Classic)

```typescript
tetris: [
  { freq: 329.63, duration: 0.4 }, // E4
  { freq: 246.94, duration: 0.2 }, // B3
  { freq: 261.63, duration: 0.2 }, // C4
  { freq: 293.66, duration: 0.4 }, // D4
  { freq: 261.63, duration: 0.2 }, // C4
  { freq: 246.94, duration: 0.2 }, // B3
  { freq: 220.00, duration: 0.4 }, // A3
  // ... 19 notes total
]
```

**Characteristics:**
- Recognizable melody from original game
- Mix of quarter notes (0.4s) and eighth notes (0.2s)
- Range: A3 (220 Hz) to E4 (329.63 Hz)
- Tempo: ≈120 BPM

**Musical Structure:**
```
E4 B3 C4 | D4 C4 B3 | A3 A3 C4 | E4 D4 C4 |
B3 . C4  | D4 . .   | E4 . .   | C4 . .  |
A3 . .   | A3 . .   |
```

#### 2. Arcade Beat (Fast-Paced)

```typescript
arcade: [
  { freq: 261.63, duration: 0.3 }, // C4
  { freq: 329.63, duration: 0.3 }, // E4
  { freq: 392.00, duration: 0.3 }, // G4
  { freq: 523.25, duration: 0.3 }, // C5
  { freq: 392.00, duration: 0.3 }, // G4
  { freq: 329.63, duration: 0.3 }, // E4
  { freq: 293.66, duration: 0.6 }, // D4
  // ... 10 notes total
]
```

**Characteristics:**
- Upward arpeggios (C major scale)
- Uniform eighth notes (0.3s) for driving rhythm
- Occasional half notes (0.6s) for emphasis
- Range: B3 (246.94 Hz) to C5 (523.25 Hz)
- Tempo: ≈150 BPM

#### 3. Chill Vibes (Ambient)

```typescript
chill: [
  { freq: 220.00, duration: 1.0 }, // A3
  { freq: 261.63, duration: 0.5 }, // C4
  { freq: 293.66, duration: 0.5 }, // D4
  { freq: 329.63, duration: 1.0 }, // E4
  // ... 16 notes total
]
```

**Characteristics:**
- Slow, flowing melody
- Whole notes (1.0s) and half notes (0.5s)
- Gentle chord progressions (Am - C - Dm)
- Range: G3 (196 Hz) to E4 (329.63 Hz)
- Tempo: ≈60 BPM

#### 4. Retro Wave (8-bit Nostalgia)

```typescript
retro: [
  { freq: 261.63, duration: 0.3 }, // C4
  { freq: 329.63, duration: 0.3 }, // E4
  { freq: 392.00, duration: 0.3 }, // G4
  { freq: 329.63, duration: 0.3 }, // E4
  { freq: 349.23, duration: 0.6 }, // F4
  // ... 20 notes total
]
```

**Characteristics:**
- Mix of arpeggios and scalar passages
- Varied rhythms (0.3s and 0.6s durations)
- Classic C major tonality
- Range: G3 (196 Hz) to A4 (440 Hz)
- Tempo: ≈140 BPM

### Track Metadata

```typescript
const getAvailableTracks = () => {
  return [
    {
      id: 'tetris',
      name: 'Classic Tetris',
      description: 'Original game theme'
    },
    {
      id: 'arcade',
      name: 'Arcade Beat',
      description: 'Fast-paced arcade style'
    },
    {
      id: 'chill',
      name: 'Chill Vibes',
      description: 'Relaxing ambient theme'
    },
    {
      id: 'retro',
      name: 'Retro Wave',
      description: '8-bit nostalgic sound'
    }
  ]
}
```

---

## Browser Compatibility

### webkitAudioContext Fallback

Safari (especially older versions) uses a prefixed API:

```typescript
audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
```

**Compatibility Table:**

| Browser | AudioContext | webkitAudioContext |
|---------|--------------|-------------------|
| Chrome 35+ | ✓ | ✓ (legacy) |
| Firefox 25+ | ✓ | ✗ |
| Safari 14.1+ | ✓ | ✓ (legacy) |
| Safari 6-14 | ✗ | ✓ |
| Edge 79+ | ✓ | ✗ |

### Suspended State Handling

All modern browsers start AudioContext in `suspended` state:

```typescript
if (audioContext.state === 'suspended') {
  await audioContext.resume()
}
```

**AudioContext States:**

```
┌──────────┐
│ suspended│ ← Initial state (autoplay policy)
└────┬─────┘
     │ .resume()
     ↓
┌──────────┐
│  running │ ← Active audio processing
└────┬─────┘
     │ .suspend() or .close()
     ↓
┌──────────┐
│  closed  │ ← Permanent (cannot restart)
└──────────┘
```

### User Interaction Requirements

**Autoplay Policy Compliance:**

```typescript
// ❌ WRONG: Trying to play audio on page load
onMounted(() => {
  startMusic()  // Will fail - no user interaction
})

// ✓ CORRECT: Wait for user gesture
const handleUserClick = async () => {
  await ensureAudioContextRunning()  // Resume if needed
  await startMusic()  // Now allowed
}
```

**Detecting Autoplay Blocks:**

```typescript
const initAudioContext = async (): Promise<boolean> => {
  try {
    audioContext = new AudioContext()

    if (audioContext.state === 'suspended') {
      await audioContext.resume()
    }

    return audioContext.state === 'running'  // Returns false if blocked
  } catch (error) {
    console.warn('Audio blocked by browser:', error)
    return false
  }
}
```

**Best Practices:**
1. Show "enable audio" button if blocked
2. Provide visual feedback (icon states)
3. Retry after user interaction
4. Gracefully degrade (game works without audio)

---

## Performance Optimization

### Memory Management

Each oscillator is a **one-shot object** that should be garbage collected:

```typescript
const oscillator = audioContext.createOscillator()
oscillator.start(audioContext.currentTime)
oscillator.stop(audioContext.currentTime + duration)

// After stop(), oscillator becomes eligible for GC
// No manual cleanup needed
```

**Why This Works:**
- Oscillators disconnect automatically after `stop()`
- No references held after function returns
- Web Audio API manages internal cleanup

### CPU Usage Optimization

**Efficient Scheduling:**
```typescript
// ✓ Schedule multiple notes in one pass
while (this.nextNoteTime < audioContext.currentTime + this.scheduleAheadTime) {
  this.scheduleNote(track[this.currentNoteIndex])
  this.advanceNote(track)
}

// ❌ Don't schedule one note per timer callback
setTimeout(() => {
  this.scheduleNote(track[this.currentNoteIndex])
  setTimeout(() => {
    this.scheduleNote(track[this.currentNoteIndex + 1])
    // ...recursive madness
  }, 25)
}, 25)
```

**Timer Frequency Trade-offs:**

| Check Interval | CPU Usage | Timing Precision | Notes |
|----------------|-----------|------------------|-------|
| 10ms | High | Excellent | Overkill for most music |
| 25ms | Low | Very Good | Sweet spot (Tetrys choice) |
| 50ms | Very Low | Good | Acceptable for slow tempos |
| 100ms | Minimal | Poor | May miss fast notes |

### Gain Node Reuse

```typescript
// ✓ Create gain nodes once
musicGainNode = audioContext.createGain()
soundGainNode = audioContext.createGain()

// Reuse for all sounds
oscillator.connect(envelope)
envelope.connect(musicGainNode)  // Same node for all music notes
```

**Benefits:**
- Reduces node creation overhead
- Consistent volume control
- Easier to implement global mute

---

## Best Practices

### 1. Always Check Context State

```typescript
if (!audioContext || audioContext.state !== 'running') {
  await ensureAudioContextRunning()
}
```

### 2. Use High-Precision Timing

```typescript
// ✓ Use audioContext.currentTime
oscillator.start(audioContext.currentTime + 0.1)

// ❌ Don't use Date.now() or performance.now()
oscillator.start((Date.now() / 1000) + 0.1)  // Will drift
```

### 3. Implement Exponential Ramps Correctly

```typescript
// ✓ Use small value instead of 0
envelope.gain.exponentialRampToValueAtTime(0.001, endTime)

// ❌ exponentialRampToValueAtTime(0, ...) throws error
// (Cannot ramp exponentially to zero)
```

### 4. Clean Up on Unmount

```typescript
onUnmounted(() => {
  stopMusic()
  if (audioContext) {
    audioContext.close()  // Free resources
    audioContext = null
  }
})
```

### 5. Persist Settings

```typescript
const saveSettings = () => {
  localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings.value))
}

// Save after any change
const toggleMusic = async () => {
  settings.value.musicEnabled = !settings.value.musicEnabled
  saveSettings()  // Persist immediately
}
```

### 6. Provide User Control

```typescript
// Individual controls for music and sound
toggleMusic()    // Background music on/off
toggleSound()    // Sound effects on/off
setMusicVolume() // 0.0 to 1.0
setSoundVolume() // 0.0 to 1.0
```

### 7. Handle Edge Cases

```typescript
// Check for existence before operations
if (!musicScheduler) {
  musicScheduler = new MusicScheduler(settings.value.currentTrack)
}

// Validate volume ranges
settings.value.musicVolume = Math.max(0, Math.min(1, volume))
```

### 8. Use TypeScript for Type Safety

```typescript
// Define clear interfaces
interface Note {
  freq: number
  duration: number
}

// Type-safe function signatures
const createBeep = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'square'
): void => {
  // Implementation
}
```

---

## Advanced Topics

### Custom Waveforms

The Web Audio API supports **PeriodicWave** for custom waveforms:

```typescript
const createCustomWaveform = () => {
  const real = new Float32Array([0, 0.5, 0.3, 0.1])
  const imag = new Float32Array([0, 0, 0, 0])

  const wave = audioContext.createPeriodicWave(real, imag)
  oscillator.setPeriodicWave(wave)
}
```

### Stereo Panning

Add spatial positioning with `StereoPannerNode`:

```typescript
const panner = audioContext.createStereoPanner()
panner.pan.value = -1  // Left (-1) to Right (1)

oscillator.connect(envelope)
envelope.connect(panner)
panner.connect(musicGainNode)
```

### Dynamic Volume Changes

Animate volume changes smoothly:

```typescript
const fadeOutMusic = (duration: number) => {
  if (!musicGainNode) return

  const currentTime = audioContext.currentTime
  musicGainNode.gain.linearRampToValueAtTime(
    0,
    currentTime + duration
  )
}
```

### Audio Analysis

Use `AnalyserNode` for visualizations:

```typescript
const analyser = audioContext.createAnalyser()
analyser.fftSize = 2048

musicGainNode.connect(analyser)
analyser.connect(audioContext.destination)

const dataArray = new Uint8Array(analyser.frequencyBinCount)
analyser.getByteFrequencyData(dataArray)  // Get frequency data
```

---

## Summary

The Tetrys audio system demonstrates professional Web Audio API engineering:

1. **Robust Architecture**: Dual gain nodes, proper lifecycle management, browser compatibility
2. **Precise Timing**: Lookahead scheduling eliminates JavaScript timing issues
3. **Musical Quality**: ADSR envelopes, multiple tracks, chord generation
4. **User Experience**: Autoplay compliance, persistent settings, individual controls
5. **Performance**: Efficient node reuse, garbage collection, optimized scheduling

**Key Takeaways:**
- Use Web Audio's high-precision clock for timing
- Implement lookahead scheduling for musical rhythm
- Shape sounds with ADSR envelopes
- Handle browser autoplay policies correctly
- Provide granular user controls

**Resources:**
- [Web Audio API Specification](https://www.w3.org/TR/webaudio/)
- [MDN Web Audio Guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
- [Implementation: useAudio.ts](../../src/composables/useAudio.ts)
