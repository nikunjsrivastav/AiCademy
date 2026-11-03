/**
 * Mock price and token estimation table (decision D14).
 * All dollar figures are estimates and labeled "estimated" in the UI.
 * TODO(backend): replaced by real token counts from AI service in ROADMAP Phase 2.
 */
import type { TokenUsage } from '@/types/agents'

export const PRICING = {
  // Estimated rates per 1,000 tokens
  promptPer1k: 0.0015,
  completionPer1k: 0.002,
}

export function estimateTokenUsage(promptText: string, completionText: string): TokenUsage {
  // Rough rule of thumb: ~4 characters per token
  const promptTokens = Math.max(12, Math.ceil(promptText.length / 4))
  const completionTokens = Math.max(8, Math.ceil(completionText.length / 4))
  const totalTokens = promptTokens + completionTokens
  const cost =
    (promptTokens / 1000) * PRICING.promptPer1k +
    (completionTokens / 1000) * PRICING.completionPer1k

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    estimatedCostUsd: Number(cost.toFixed(6)),
  }
}

export function addTokenUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
    estimatedCostUsd: Number((a.estimatedCostUsd + b.estimatedCostUsd).toFixed(6)),
  }
}
