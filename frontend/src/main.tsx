import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { USE_MOCKS } from './config'
import './index.css'
import App from './App'

async function prepareApp() {
  if (USE_MOCKS) {
    const { startMockWorker } = await import('./mocks/browser')
    await startMockWorker()
  } else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    // Unregister any legacy mock service workers so they don't intercept API requests
    try {
      const registrations = await navigator.serviceWorker.getRegistrations()
      for (const reg of registrations) {
        await reg.unregister()
      }
    } catch (e) {
      console.warn('Failed to unregister legacy service worker:', e)
    }
  }
}

prepareApp().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
