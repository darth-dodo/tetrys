<template>
  <Transition name="achievement-slide">
    <div 
      v-if="visible && currentAchievement"
      class="achievement-notification"
      role="alert"
      aria-live="polite"
      :class="`rarity-${currentAchievement.rarity}`"
    >
      <div class="achievement-content">
        <div class="achievement-icon">{{ currentAchievement.icon }}</div>
        <div class="achievement-info">
          <div class="achievement-label">Achievement Unlocked!</div>
          <div class="achievement-name">{{ currentAchievement.name }}</div>
          <div class="achievement-description">{{ currentAchievement.description }}</div>
        </div>
        <div class="achievement-rarity" :class="currentAchievement.rarity">
          {{ currentAchievement.rarity }}
        </div>
      </div>
      <div class="achievement-progress-bar">
        <div class="progress-fill"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useAchievements } from '../composables/useAchievements'
import type { Achievement } from '../types/achievements'

const { getNextNotification, pendingNotifications } = useAchievements()

const visible = ref(false)
const currentAchievement = ref<Achievement | null>(null)
const DISPLAY_DURATION = 4000 // 4 seconds

// Show next achievement notification
const showNext = () => {
  const next = getNextNotification()
  if (!next) {
    visible.value = false
    currentAchievement.value = null
    return
  }

  currentAchievement.value = next
  visible.value = true

  // Auto-hide after duration
  setTimeout(() => {
    visible.value = false
    // Show next after transition completes
    setTimeout(showNext, 300)
  }, DISPLAY_DURATION)
}

// Watch for new achievements
watch(
  () => pendingNotifications.value.length,
  (newLength) => {
    if (newLength > 0 && !visible.value) {
      showNext()
    }
  }
)

onMounted(() => {
  if (pendingNotifications.value.length > 0) {
    showNext()
  }
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
  animation: progress-countdown 4s linear forwards;
}

/* Rarity-specific borders */
.rarity-common {
  border-color: #9ca3af;
}

.rarity-rare {
  border-color: #3b82f6;
}

.rarity-epic {
  border-color: #a855f7;
}

.rarity-legendary {
  border-color: #f59e0b;
  animation: legendary-border 2s ease-in-out infinite;
}

/* Animations */
@keyframes achievement-slide-enter-active {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes achievement-slide-leave-active {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}

.achievement-slide-enter-active {
  animation: achievement-slide-enter-active 0.3s ease-out;
}

.achievement-slide-leave-active {
  animation: achievement-slide-leave-active 0.3s ease-in;
}

@keyframes icon-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

@keyframes progress-countdown {
  from { width: 100%; }
  to { width: 0%; }
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
