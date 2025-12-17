<template>
  <Transition name="achievement-slide">
    <div
      v-if="visible && currentAchievement"
      class="achievement-notification"
      role="alert"
      aria-live="polite"
      aria-atomic="true"
      :aria-label="`Achievement unlocked: ${currentAchievement.name}. ${queueCount > 1 ? `${currentIndex} of ${queueCount}` : ''}`"
      tabindex="0"
      :class="[
        `rarity-${currentAchievement.rarity}`,
        { 'is-paused': isPaused, 'is-swiping': isSwiping }
      ]"
      @click="dismissNotification"
      @keydown.esc="dismissNotification"
      @keydown.enter="dismissNotification"
      @keydown.space.prevent="dismissNotification"
      @mouseenter="pauseNotification"
      @mouseleave="resumeNotification"
      @focusin="pauseNotification"
      @focusout="resumeNotification"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
      :style="swipeStyle"
    >
      <!-- Queue indicator -->
      <div v-if="queueCount > 1" class="queue-indicator">
        {{ currentIndex }} of {{ queueCount }}
      </div>

      <!-- Confetti for legendary -->
      <div v-if="currentAchievement.rarity === 'legendary'" class="confetti-container">
        <div v-for="i in 20" :key="i" class="confetti" :style="getConfettiStyle(i)"></div>
      </div>

      <div class="achievement-content">
        <div class="achievement-icon" :class="{ 'legendary-icon': currentAchievement.rarity === 'legendary' }">
          {{ currentAchievement.icon }}
        </div>
        <div class="achievement-info">
          <div class="achievement-label">Achievement Unlocked!</div>
          <div class="achievement-name">{{ currentAchievement.name }}</div>
          <div class="achievement-description">{{ currentAchievement.description }}</div>
        </div>
        <div class="achievement-rarity" :class="currentAchievement.rarity">
          {{ currentAchievement.rarity }}
        </div>
      </div>

      <!-- Dismiss hint -->
      <div class="dismiss-hint">
        <span class="dismiss-text">{{ isMobile ? 'Tap or swipe to dismiss' : 'Click to dismiss' }}</span>
      </div>

      <div class="achievement-progress-bar">
        <div class="progress-fill" :class="{ paused: isPaused }" :style="progressStyle"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useAchievements } from '../composables/useAchievements'
import { useAudio } from '../composables/useAudio'
import type { Achievement } from '../types/achievements'

const { getNextNotification, pendingNotifications } = useAchievements()
const { playSound } = useAudio()

const visible = ref(false)
const currentAchievement = ref<Achievement | null>(null)
const prefersReducedMotion = ref(false)
const isPaused = ref(false)
const isMobile = ref(false)
const currentIndex = ref(1)
const totalShown = ref(0)

// Swipe handling
const isSwiping = ref(false)
const swipeStartX = ref(0)
const swipeCurrentX = ref(0)
const swipeThreshold = 100 // pixels to trigger dismiss

const DISPLAY_DURATION = 4000 // 4 seconds
const PROGRESS_UPDATE_INTERVAL = 50 // Update progress every 50ms

// Timeout and interval tracking
let displayTimeout: ReturnType<typeof setTimeout> | null = null
let transitionTimeout: ReturnType<typeof setTimeout> | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null
let remainingTime = DISPLAY_DURATION
const progressPercent = ref(100)

// Computed properties
const queueCount = computed(() => pendingNotifications.value.length + (visible.value ? 1 : 0))

const swipeStyle = computed(() => {
  if (!isSwiping.value) return {}
  const deltaX = swipeCurrentX.value - swipeStartX.value
  return {
    transform: `translateX(${deltaX}px)`,
    opacity: Math.max(0.3, 1 - Math.abs(deltaX) / (swipeThreshold * 2))
  }
})

const progressStyle = computed(() => ({
  width: `${progressPercent.value}%`
}))

// Get random confetti style
const getConfettiStyle = (index: number) => {
  const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#fff', '#ef4444', '#8b5cf6']
  const color = colors[index % colors.length]
  const left = Math.random() * 100
  const delay = Math.random() * 0.5
  const duration = 1 + Math.random() * 1
  const size = 4 + Math.random() * 6

  return {
    '--confetti-color': color,
    '--confetti-left': `${left}%`,
    '--confetti-delay': `${delay}s`,
    '--confetti-duration': `${duration}s`,
    '--confetti-size': `${size}px`
  }
}

// Play achievement sound based on rarity
const playAchievementSound = (rarity: string) => {
  // Map rarity to available sounds: 'move' | 'rotate' | 'drop' | 'line' | 'gameover'
  switch (rarity) {
    case 'legendary':
    case 'epic':
      playSound('line') // Use line clear sound for rare achievements
      break
    case 'rare':
      playSound('rotate')
      break
    default:
      playSound('drop') // Subtle sound for common
  }
}

// Start progress countdown
const startProgress = () => {
  remainingTime = DISPLAY_DURATION
  progressPercent.value = 100

  progressInterval = setInterval(() => {
    if (!isPaused.value) {
      remainingTime -= PROGRESS_UPDATE_INTERVAL
      progressPercent.value = (remainingTime / DISPLAY_DURATION) * 100

      if (remainingTime <= 0) {
        clearInterval(progressInterval!)
        dismissNotification()
      }
    }
  }, PROGRESS_UPDATE_INTERVAL)
}

// Pause notification
const pauseNotification = () => {
  if (prefersReducedMotion.value) return
  isPaused.value = true
  if (displayTimeout) {
    clearTimeout(displayTimeout)
    displayTimeout = null
  }
}

// Resume notification
const resumeNotification = () => {
  isPaused.value = false
}

// Touch handlers for swipe
const handleTouchStart = (e: TouchEvent) => {
  swipeStartX.value = e.touches[0].clientX
  swipeCurrentX.value = e.touches[0].clientX
  isSwiping.value = true
}

const handleTouchMove = (e: TouchEvent) => {
  if (!isSwiping.value) return
  swipeCurrentX.value = e.touches[0].clientX
}

const handleTouchEnd = () => {
  if (!isSwiping.value) return

  const deltaX = swipeCurrentX.value - swipeStartX.value
  if (Math.abs(deltaX) > swipeThreshold) {
    dismissNotification()
  }

  isSwiping.value = false
  swipeStartX.value = 0
  swipeCurrentX.value = 0
}

// Dismiss current notification
const dismissNotification = () => {
  if (displayTimeout) clearTimeout(displayTimeout)
  if (transitionTimeout) clearTimeout(transitionTimeout)
  if (progressInterval) clearInterval(progressInterval)

  visible.value = false
  isPaused.value = false
  const transitionTime = prefersReducedMotion.value ? 0 : 300
  transitionTimeout = setTimeout(showNext, transitionTime)
}

// Show next achievement notification
const showNext = () => {
  const next = getNextNotification()
  if (!next) {
    visible.value = false
    currentAchievement.value = null
    totalShown.value = 0
    currentIndex.value = 1
    return
  }

  totalShown.value++
  currentIndex.value = totalShown.value
  currentAchievement.value = next
  visible.value = true
  isPaused.value = false

  // Play sound effect
  playAchievementSound(next.rarity)

  // Start progress tracking
  startProgress()
}

// Watch for new achievements
watch(
  () => pendingNotifications.value.length,
  (newLength) => {
    if (newLength > 0 && !visible.value) {
      totalShown.value = 0
      showNext()
    }
  }
)

onMounted(() => {
  // Detect mobile
  isMobile.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0

  // Set up reduced motion detection
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion.value = mediaQuery.matches

  mediaQuery.addEventListener('change', (e) => {
    prefersReducedMotion.value = e.matches
  })

  // Start showing notifications
  if (pendingNotifications.value.length > 0) {
    showNext()
  }
})

onUnmounted(() => {
  if (displayTimeout) clearTimeout(displayTimeout)
  if (transitionTimeout) clearTimeout(transitionTimeout)
  if (progressInterval) clearInterval(progressInterval)
})
</script>

<style scoped>
.achievement-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  width: 360px;
  background: linear-gradient(135deg, var(--theme-surface, #1a1a1a) 0%, #2a2a2a 100%);
  border: 3px solid var(--theme-border, #00ff00);
  border-radius: 12px;
  padding: 16px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 20px var(--theme-glow, rgba(0, 255, 0, 0.3));
  overflow: hidden;
  cursor: pointer;
  user-select: none;
  transition: transform 0.1s ease, opacity 0.1s ease;
}

.achievement-notification:hover {
  transform: scale(1.02);
}

.achievement-notification:active {
  transform: scale(0.98);
}

.achievement-notification.is-swiping {
  transition: none;
}

.achievement-notification.is-paused {
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 30px var(--theme-glow, rgba(0, 255, 0, 0.5)),
    inset 0 0 20px rgba(255, 255, 255, 0.05);
}

/* Queue indicator */
.queue-indicator {
  position: absolute;
  top: 8px;
  left: 12px;
  font-size: 10px;
  font-weight: 600;
  color: var(--theme-text-secondary, #888);
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 8px;
  border-radius: 10px;
  letter-spacing: 0.5px;
}

/* Confetti container */
.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti {
  position: absolute;
  top: -10px;
  left: var(--confetti-left);
  width: var(--confetti-size);
  height: var(--confetti-size);
  background: var(--confetti-color);
  animation: confetti-fall var(--confetti-duration) ease-out var(--confetti-delay) forwards;
  opacity: 0;
  border-radius: 2px;
}

@keyframes confetti-fall {
  0% {
    opacity: 1;
    transform: translateY(0) rotate(0deg);
  }
  100% {
    opacity: 0;
    transform: translateY(150px) rotate(720deg);
  }
}

.achievement-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  position: relative;
}

.achievement-icon {
  font-size: 48px;
  line-height: 1;
  flex-shrink: 0;
  animation: icon-bounce 0.6s ease-out;
}

.achievement-icon.legendary-icon {
  animation: icon-bounce 0.6s ease-out, legendary-pulse 1.5s ease-in-out infinite;
}

@keyframes legendary-pulse {
  0%, 100% {
    filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.8));
    transform: scale(1);
  }
  50% {
    filter: drop-shadow(0 0 16px rgba(245, 158, 11, 1));
    transform: scale(1.1);
  }
}

.achievement-info {
  flex: 1;
  min-width: 0;
}

.achievement-label {
  color: var(--theme-primary, #00ff00);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
  text-shadow: 0 0 10px var(--theme-glow, rgba(0, 255, 0, 0.5));
}

.achievement-name {
  color: var(--theme-text, #fff);
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.achievement-description {
  color: var(--theme-text-secondary, #aaa);
  font-size: 13px;
  line-height: 1.4;
}

.achievement-rarity {
  position: absolute;
  top: -4px;
  right: -4px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
}

.achievement-rarity.common {
  background: rgba(156, 163, 175, 0.3);
  color: #9ca3af;
  border: 1px solid #9ca3af;
}

.achievement-rarity.rare {
  background: rgba(59, 130, 246, 0.3);
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.achievement-rarity.epic {
  background: rgba(168, 85, 247, 0.3);
  color: #a855f7;
  border: 1px solid #a855f7;
}

.achievement-rarity.legendary {
  background: rgba(245, 158, 11, 0.3);
  color: #f59e0b;
  border: 1px solid #f59e0b;
  animation: legendary-glow 2s ease-in-out infinite;
}

/* Dismiss hint */
.dismiss-hint {
  text-align: center;
  margin-top: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.achievement-notification:hover .dismiss-hint,
.achievement-notification:focus .dismiss-hint,
.achievement-notification.is-paused .dismiss-hint {
  opacity: 1;
}

.dismiss-text {
  font-size: 10px;
  color: var(--theme-text-secondary, #666);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.achievement-progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--theme-primary, #00ff00), var(--theme-secondary, #00ccff));
  transition: width 0.05s linear;
}

.progress-fill.paused {
  animation-play-state: paused;
  background: linear-gradient(90deg, var(--theme-secondary, #00ccff), var(--theme-primary, #00ff00));
}

/* Rarity-specific borders */
.rarity-common {
  border-color: #9ca3af;
}

.rarity-rare {
  border-color: #3b82f6;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(59, 130, 246, 0.3);
}

.rarity-epic {
  border-color: #a855f7;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 25px rgba(168, 85, 247, 0.4);
}

.rarity-legendary {
  border-color: #f59e0b;
  animation: legendary-border 2s ease-in-out infinite;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 30px rgba(245, 158, 11, 0.5);
}

/* Animations */
@keyframes achievement-slide-enter-active {
  from {
    transform: translateX(120%) scale(0.8);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes achievement-slide-leave-active {
  from {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateX(120%) scale(0.8);
    opacity: 0;
  }
}

.achievement-slide-enter-active {
  animation: achievement-slide-enter-active 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.achievement-slide-leave-active {
  animation: achievement-slide-leave-active 0.3s ease-in;
}

@keyframes icon-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  70% { transform: scale(0.9); }
  100% { transform: scale(1); }
}

@keyframes legendary-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(245, 158, 11, 0.8);
  }
}

@keyframes legendary-border {
  0%, 100% {
    border-color: #f59e0b;
  }
  50% {
    border-color: #fbbf24;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .achievement-notification {
    animation: none;
    transition: opacity 0.1s ease;
  }

  .achievement-notification:hover {
    transform: none;
  }

  .achievement-icon,
  .achievement-icon.legendary-icon {
    animation: none;
  }

  .achievement-slide-enter-active,
  .achievement-slide-leave-active {
    animation: none;
    transition: opacity 0.1s ease;
  }

  .confetti {
    display: none;
  }

  .rarity-legendary {
    animation: none;
  }

  @keyframes legendary-glow {
    0%, 100% {
      box-shadow: 0 0 10px rgba(245, 158, 11, 0.5);
    }
  }

  @keyframes legendary-border {
    0%, 100% {
      border-color: #f59e0b;
    }
  }
}

/* Mobile responsive */
@media (max-width: 480px) {
  .achievement-notification {
    top: 10px;
    right: 10px;
    left: 10px;
    width: auto;
    padding: 12px;
  }

  .achievement-icon {
    font-size: 36px;
  }

  .achievement-name {
    font-size: 16px;
  }

  .achievement-description {
    font-size: 12px;
  }

  .dismiss-hint {
    opacity: 0.7;
  }

  .queue-indicator {
    font-size: 9px;
  }
}

@media (max-height: 500px) and (orientation: landscape) {
  .achievement-notification {
    top: 10px;
    right: 10px;
    width: 300px;
    padding: 10px;
  }

  .achievement-icon {
    font-size: 32px;
  }

  .achievement-label {
    font-size: 10px;
  }

  .achievement-name {
    font-size: 14px;
  }

  .achievement-description {
    font-size: 11px;
  }
}
</style>
