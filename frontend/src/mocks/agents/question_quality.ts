/**
 * EXTENSION: Question Quality Agent script from /docs/AGENTIC_DESIGN.md B1.4.
 * Evaluates student inquiries for clarity, specificity, and demonstrated effort.
 * Provides actionable coaching tips and updates the doubt record.
 */
import type { AgentScript } from './engine'
import { registerAgentScript } from './engine'
import { getDb, saveDb } from '../db/store'

export const questionQualityScript: AgentScript = async function* (input) {
  const question = input.question || ''
  const doubtId = input.doubtId

  // Step 1: Plan
  yield {
    type: 'plan',
    content: `Evaluating question quality across 3 dimensions: Clarity (syntax/structure), Specificity (context/examples), and Effort (prior attempts/research).`,
    autonomy: 'auto',
  }

  // Dimension scoring heuristic
  const length = question.trim().length
  const hasQuestionMark = question.includes('?')
  const hasCodeOrTechTerms = /bcnf|3nf|sql|join|index|query|tree|acid|hash/i.test(question)
  const showsAttempt = /tried|attempted|understood|confused between|why does/i.test(question)

  const clarity = Math.min(95, Math.max(55, 60 + (hasQuestionMark ? 15 : 0) + (length > 25 ? 15 : 0)))
  const specificity = Math.min(98, Math.max(50, 50 + (hasCodeOrTechTerms ? 35 : 10) + (length > 40 ? 10 : 0)))
  const effort = Math.min(96, Math.max(45, 50 + (showsAttempt ? 35 : 10)))

  const overallScore = Math.round((clarity * 0.3) + (specificity * 0.4) + (effort * 0.3))

  let tip = 'Try citing a specific lecture slide or error message next time to get an even sharper answer.'
  if (!showsAttempt) {
    tip = 'Great question! Mentioning what you have already tried or where you got stuck will earn higher question quality points.'
  } else if (!hasCodeOrTechTerms) {
    tip = 'Clear inquiry! Including the exact schema or technical definitions helps make the explanation more concrete.'
  }

  const qualityScore = {
    score: overallScore,
    clarity,
    specificity,
    effort,
    tip,
  }

  // Step 2: Reflection
  yield {
    type: 'reflection',
    content: `Calculated question quality score: ${overallScore}/100 (Clarity: ${clarity}, Specificity: ${specificity}, Effort: ${effort}). Coaching tip: "${tip}".`,
    autonomy: 'auto',
  }

  // Update doubt record if provided
  if (doubtId) {
    const db = getDb()
    const doubt = db.doubts.find((d) => d.id === doubtId)
    if (doubt) {
      doubt.qualityScore = qualityScore
      saveDb()
    }
  }

  return {
    doubtId,
    qualityScore,
  }
}

registerAgentScript('question_quality', questionQualityScript)
