/**
 * EXTENSION: Orchestrator Agent script from /docs/AGENTIC_DESIGN.md B1.1.
 * Routes events to specialist agents, enforces policies, and coordinates multi-agent pipelines.
 */
import type { AgentScript } from './engine'
import { registerAgentScript } from './engine'

export const orchestratorScript: AgentScript = async function* (input, ctx) {
  const event = input.event || 'user_request'
  const payload = input.payload || {}

  // Step 1: Plan
  yield {
    type: 'plan',
    content: `Received event '${event}' for course ${ctx.courseId}. Analyzing routing table, course autonomy policies, and specialist prerequisites.`,
    autonomy: 'auto',
  }

  switch (event) {
    case 'material.uploaded':
    case 'material.reindexed': {
      yield {
        type: 'reflection',
        content: `Event '${event}' mapped to Ingestion Agent. File '${payload.fileName || 'unknown'}'. Dispatching async ingestion pipeline.`,
        autonomy: 'auto',
      }
      return {
        routedTo: 'ingestion',
        status: 'dispatched',
        event,
      }
    }

    case 'submission.created': {
      yield {
        type: 'reflection',
        content: `New student submission received for assignment ${payload.assignmentId}. Routing to Grader Agent for rubric-based evaluation. Note: marks require human approval before release.`,
        autonomy: 'needs_approval',
      }
      return {
        routedTo: 'grader',
        status: 'dispatched',
        event,
      }
    }

    case 'doubt.asked': {
      yield {
        type: 'reflection',
        content: `Doubt received from student. Coordinating pipeline: 1) Tutor Agent retrieves course context and answers with citations, 2) Question Quality Agent evaluates clarity and provides coaching feedback.`,
        autonomy: 'auto',
      }
      return {
        routedTo: ['tutor', 'question_quality'],
        status: 'dispatched',
        event,
      }
    }

    case 'weekly.tick': {
      yield {
        type: 'reflection',
        content: `Weekly schedule tick triggered. Dispatching Insights Agent to aggregate course analytics and Study Coach Agent to generate personalized student nudges.`,
        autonomy: 'auto',
      }
      return {
        routedTo: ['insights', 'study_coach'],
        status: 'dispatched',
        event,
      }
    }

    case 'deadline.approaching': {
      yield {
        type: 'reflection',
        content: `Upcoming deadline detected for course ${ctx.courseId}. Dispatching Study Coach Agent to notify students with incomplete submissions.`,
        autonomy: 'auto',
      }
      return {
        routedTo: 'study_coach',
        status: 'dispatched',
        event,
      }
    }

    default: {
      yield {
        type: 'reflection',
        content: `Generic task received: "${input.description || 'Custom command'}". Directing execution with standard guardrails.`,
        autonomy: 'auto',
      }
      return {
        routedTo: 'orchestrator',
        status: 'completed',
        event,
      }
    }
  }
}

registerAgentScript('orchestrator', orchestratorScript)
