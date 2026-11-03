import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { USE_MOCKS } from './config'
import './index.css'
import App from './App'

async function prepareApp() {
  if (USE_MOCKS) {
    const { startMockWorker } = await import('./mocks/browser')
    await startMockWorker()
  }
}

prepareApp().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
