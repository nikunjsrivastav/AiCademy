/**
 * EXTENSION: Insights Agent script from /docs/AGENTIC_DESIGN.md B1.6.
 * Periodically aggregates learning data, identifies curriculum friction points,
 * and proposes targeted teaching interventions with draft announcements (requires approval).
 */
import type { AgentScript } from './engine'
import { registerAgentScript } from './engine'

export const insightsScript: AgentScript = async function* (_input, ctx) {
  // Step 1: Plan
  yield {
    type: 'plan',
    content: `Initiating teaching copilot scan for course ${ctx.courseId}. Aggregating recent submission mark distributions, topic error clusters, and doubt patterns.`,
    autonomy: 'auto',
  }

  // Step 2: Tool call (get_course_analytics)
  yield {
    type: 'tool_call',
    content: `Retrieving course analytics and doubt trends.`,
    toolName: 'get_course_analytics',
    input: { courseId: ctx.courseId },
    autonomy: 'auto',
  }

  // Step 3: Reflection & Pattern Synthesis
  yield {
    type: 'reflection',
    content: `Analysis complete: 42% of student questions this week relate to "Boyce-Codd Normal Form" and "Lossless Decomposition". Average score on Assignment 1 Criterion 2 (Functional Dependencies) dropped 18% compared to historical baseline. Recommendation: schedule a targeted 30-minute revision lab.`,
    autonomy: 'auto',
  }

  // Step 4: Tool call (draft_announcement)
  const title = 'Optional Revision Session: BCNF & Normalization'
  const content =
    'Based on recent questions, we will hold a 30-minute interactive review on BCNF decomposition and lossless joins this Thursday at 4 PM in Lab 3 or online. Bring your schema examples!'

  yield {
    type: 'tool_call',
    content: `Drafting suggested announcement for professor approval.`,
    toolName: 'draft_announcement',
    input: {
      courseId: ctx.courseId,
      title,
      content,
    },
    autonomy: 'needs_approval',
  }

  // Step 5: Request approval
  yield {
    type: 'tool_call',
    content: `Posting draft announcement to Approval Queue. Requires professor review before publishing to class.`,
    toolName: 'request_human_approval',
    input: {
      runId: ctx.runId,
      courseId: ctx.courseId,
      summary: `Publish revision lab announcement: "${title}"`,
      proposedAction: {
        kind: 'publish_announcement',
        targetId: ctx.courseId,
        payload: { title, content },
      },
      confidence: 0.95,
    },
    autonomy: 'needs_approval',
    requiresApproval: true,
  }

  return {
    frictionTopic: 'BCNF & Normalization',
    affectedPercentage: 42,
    suggestedAction: 'Host revision session',
    draftAnnouncement: { title, content },
  }
}

registerAgentScript('insights', insightsScript)
