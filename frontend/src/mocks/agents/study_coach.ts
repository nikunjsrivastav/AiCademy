/**
 * EXTENSION: Study Coach Agent script from /docs/AGENTIC_DESIGN.md B1.7.
 * Student-facing proactive coach: analyzes deadlines, weak topics, and study pacing,
 * then generates actionable multi-step study plans and notifications.
 */
import type { AgentScript } from './engine'
import { registerAgentScript } from './engine'

export const studyCoachScript: AgentScript = async function* (input, ctx) {
  const studentId = input.studentId || ctx.actorId

  // Step 1: Plan
  yield {
    type: 'plan',
    content: `Scanning upcoming deadlines, historical quiz performance, and weak topic clusters for student ${studentId} in course ${ctx.courseId}.`,
    autonomy: 'auto',
  }

  // Step 2: Tool call (get_student_progress)
  yield {
    type: 'tool_call',
    content: `Retrieving student completion history and concept retention metrics.`,
    toolName: 'get_student_progress',
    input: {
      studentId,
      courseId: ctx.courseId,
    },
    autonomy: 'auto',
  }

  // Step 3: Reflection & Nudge Formulation
  yield {
    type: 'reflection',
    content: `Identified 1 active assignment due in 3 days. Diagnostic traces indicate lower confidence in SQL Subqueries and Index Tuning. Synthesizing personalized 3-step mastery sprint.`,
    autonomy: 'auto',
  }

  const studyPlan = {
    courseId: ctx.courseId,
    title: '3-Day Mastery Sprint: Index Optimization & Subqueries',
    deadline: 'In 3 days',
    focusTopic: 'Index Tuning & Subqueries',
    steps: [
      {
        order: 1,
        title: 'Review Lecture 3: B-Tree Indexing Deep Dive',
        durationMinutes: 25,
        materialId: 'mat_cs301_03',
        description: 'Focus on clustered vs non-clustered indexing and composite key ordering.',
      },
      {
        order: 2,
        title: 'Solve Practice Queries 4 through 8',
        durationMinutes: 40,
        materialId: 'mat_cs301_01',
        description: 'Examine query plans using EXPLAIN ANALYZE for correlated subqueries.',
      },
      {
        order: 3,
        title: 'Submit Assignment Draft for Early Agent Verification',
        durationMinutes: 30,
        description: 'Ensure all rubric criteria have matching explanatory comments in the submission.',
      },
    ],
  }

  // Step 4: Tool call (create_notification)
  yield {
    type: 'tool_call',
    content: `Sending proactive study plan notification to student.`,
    toolName: 'create_notification',
    input: {
      userId: studentId,
      type: 'due_soon',
      title: 'Personalized Study Plan Ready',
      message: 'Your 3-day sprint for the upcoming assignment is ready in the Study Coach panel.',
      link: `/s/courses/${ctx.courseId}`,
    },
    autonomy: 'auto',
  }

  return studyPlan
}

registerAgentScript('study_coach', studyCoachScript)
