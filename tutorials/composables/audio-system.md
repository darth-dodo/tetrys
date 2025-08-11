# 🎵 Audio System Deep Dive

The Tetrys audio system provides a comprehensive Web Audio API implementation with 8-bit sound effects and background music tracks.

## System Architecture

```
Web Audio API Context
├── Music Gain Node
│   ├── Background Music Tracks
│   ├── Note Sequencing
│   └── Volume Control
├── Sound Gain Node
│   ├── Sound Effects
│   ├── Procedural Generation
│   └── Volume Control
└── Settings Management
    ├── localStorage Persistence
    ├── User Interaction Handling
    └── Context State Management
```

## Core Components

### Audio Context Management
```typescript
let audioContext: AudioContext | null = null
let musicGainNode: GainNode | null = null
let soundGainNode: GainNode | null = null
```

### Settings Persistence
```typescript
interface AudioSettings {
  musicEnabled: boolean
  soundEnabled: boolean
  musicVolume: number
  soundVolume: number
  currentTrack: string
}
```

## Key Features

- **Web Audio API Integration**: Direct browser audio processing
- **Procedural Sound Generation**: 8-bit style effects using oscillators
- **Background Music System**: Note-based sequencing with multiple tracks
- **User Interaction Compliance**: Proper handling of browser audio policies
- **Volume Controls**: Individual music and sound effect volume
- **Track Selection**: Multiple background music themes

## Implementation Details

See [Composables Deep Dive](../composables/README.md#useaudio---audio-system-management) for complete implementation.