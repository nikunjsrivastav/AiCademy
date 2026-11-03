/** MSW browser worker. Started from main.tsx only when VITE_USE_MOCKS is not "false". */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMockWorker(): Promise<void> {
  await worker.start({
    onUnhandledRequest(request, print) {
      // Only warn about unmocked API calls; ignore Vite assets, fonts, etc.
      if (new URL(request.url).pathname.startsWith('/api')) print.warning()
    },
    quiet: true,
  })
}
