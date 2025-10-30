import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { getCacheService } from './services/cacheService'

// Initialize cache service before mounting the app
async function initApp() {
  try {
    // Initialize IndexedDB cache service
    await getCacheService()
    console.log('✅ Cache service initialized successfully')
  } catch (error) {
    console.error('⚠️ Cache service initialization failed:', error)
    // Continue mounting app even if cache fails (will use network-only mode)
  }

  // Mount Vue app
  const app = createApp(App)
  app.mount('#app')
}

// Start app initialization
initApp()