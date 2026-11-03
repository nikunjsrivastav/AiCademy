/**
 * EXTENSION: useRunStream hook (decision D15).
 * Polls GET /api/agents/runs/:runId every ~400ms while status is queued or running.
 * TODO(agent-runtime): replaced by SSE stream in ROADMAP Phase 4.
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import type { AgentRunWithSteps } from '@/types/agents'
import { getAgentRunTrace } from '@/services/agents'

export function useRunStream(runId: string | null | undefined, pollIntervalMs = 400) {
  const [run, setRun] = useState<AgentRunWithSteps | null>(null)
  const [loading, setLoading] = useState<boolean>(Boolean(runId))
  const [error, setError] = useState<string | null>(null)
  const activePollRef = useRef<boolean>(true)

  const fetchTrace = useCallback(async () => {
    if (!runId) return
    try {
      const data = await getAgentRunTrace(runId)
      setRun(data)
      setError(null)
      setLoading(false)
      return data
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err))
      setLoading(false)
      return null
    }
  }, [runId])

  useEffect(() => {
    if (!runId) {
      setRun(null)
      setLoading(false)
      return
    }

    activePollRef.current = true
    setLoading(true)

    // Initial fetch
    fetchTrace()

    const interval = setInterval(async () => {
      if (!activePollRef.current) return
      const current = await fetchTrace()
      // Stop polling once run is terminal or waiting for approval
      if (
        current &&
        ['succeeded', 'failed', 'cancelled', 'waiting_for_approval'].includes(current.status)
      ) {
        clearInterval(interval)
      }
    }, pollIntervalMs)

    return () => {
      activePollRef.current = false
      clearInterval(interval)
    }
  }, [runId, pollIntervalMs, fetchTrace])

  return {
    run,
    loading,
    error,
    refetch: fetchTrace,
  }
}
