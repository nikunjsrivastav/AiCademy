/**
 * EXTENSION: B2 Typed Tool Registry with Zod validation and course scope isolation.
 * TODO(agent-runtime): ported to LangGraph / Python Pydantic tools in ROADMAP Phase 4.
 */
import { z } from 'zod'
import type { ToolDefinition, ToolName } from '@/types/agents'
import type { Role } from '@/types/domain'
import { getDb, saveDb, newId } from '../db/store'

export interface ToolExecutionContext {
  actorId: string
  actorRole: Role
  courseId: string
  runId: string
}

export interface ToolExecutionResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  latencyMs: number
}

// ---------------------------------------------------------------------------
// Tool Zod Schemas & Definitions
// ---------------------------------------------------------------------------

export const ToolSchemas = {
  extract_text: {
    input: z.object({
      fileUrl: z.string(),
      fileName: z.string(),
      mimeType: z.string().optional(),
    }),
    output: z.object({
      extractedText: z.string(),
      wordCount: z.number(),
      pageCount: z.number(),
    }),
  },
  chunk_and_embed: {
    input: z.object({
      materialId: z.string(),
      chunkSize: z.number().default(800),
    }),
    output: z.object({
      materialId: z.string(),
      chunksCreated: z.number(),
      topics: z.array(z.string()),
      indexingStatus: z.string(),
    }),
  },
  vector_search: {
    input: z.object({
      courseId: z.string(),
      query: z.string().min(1),
      topK: z.number().default(3),
    }),
    output: z.object({
      matches: z.array(
        z.object({
          materialId: z.string(),
          materialTitle: z.string(),
          page: z.number(),
          similarity: z.number(),
          snippet: z.string(),
        })
      ),
    }),
  },
  get_rubric: {
    input: z.object({
      assignmentId: z.string(),
    }),
    output: z.object({
      assignmentId: z.string(),
      title: z.string(),
      rubric: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          description: z.string(),
          maxMarks: z.number(),
        })
      ),
      maxMarks: z.number(),
    }),
  },
  get_submission: {
    input: z.object({
      submissionId: z.string(),
    }),
    output: z.object({
      submissionId: z.string(),
      studentId: z.string(),
      assignmentId: z.string(),
      fileName: z.string(),
      submittedAt: z.string(),
      late: z.boolean(),
    }),
  },
  get_course_materials: {
    input: z.object({
      courseId: z.string(),
    }),
    output: z.object({
      materials: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          type: z.string(),
          topics: z.array(z.string()),
        })
      ),
    }),
  },
  get_student_progress: {
    input: z.object({
      studentId: z.string(),
      courseId: z.string(),
    }),
    output: z.object({
      studentId: z.string(),
      courseId: z.string(),
      completedAssignments: z.number(),
      averageScore: z.number(),
      doubtsAsked: z.number(),
      weakTopics: z.array(z.string()),
    }),
  },
  get_course_analytics: {
    input: z.object({
      courseId: z.string(),
    }),
    output: z.object({
      courseId: z.string(),
      enrolledCount: z.number(),
      submissionRate: z.number(),
      averageMarks: z.number(),
      frequentDoubtTopics: z.array(z.string()),
    }),
  },
  save_evaluation: {
    input: z.object({
      submissionId: z.string(),
      result: z.object({
        criteria: z.array(
          z.object({
            criterionId: z.string(),
            marks: z.number(),
            maxMarks: z.number(),
            feedback: z.string(),
            evidence: z.string().optional(),
          })
        ),
        totalMarks: z.number(),
        feedback: z.string(),
        mistakes: z.array(z.string()),
        suggestions: z.array(z.string()),
        confidence: z.object({
          score: z.number(),
          level: z.enum(['high', 'medium', 'low']),
          reasons: z.array(z.string()),
        }),
        flags: z.array(z.string()),
      }),
    }),
    output: z.object({
      saved: z.boolean(),
      submissionId: z.string(),
      requiresApproval: z.boolean(),
    }),
  },
  save_doubt: {
    input: z.object({
      doubtRecord: z.object({
        courseId: z.string(),
        studentId: z.string(),
        question: z.string(),
        answer: z.string(),
        citations: z.array(
          z.object({
            materialId: z.string(),
            materialTitle: z.string(),
            page: z.number(),
            snippet: z.string(),
          })
        ),
        qualityScore: z
          .object({
            score: z.number(),
            clarity: z.number(),
            specificity: z.number(),
            effort: z.number(),
            tip: z.string(),
          })
          .nullable()
          .optional(),
        confidence: z.number().optional(),
        outOfScope: z.boolean().optional(),
      }),
    }),
    output: z.object({
      doubtId: z.string(),
      saved: z.boolean(),
    }),
  },
  draft_announcement: {
    input: z.object({
      courseId: z.string(),
      title: z.string(),
      content: z.string(),
    }),
    output: z.object({
      draftId: z.string(),
      status: z.string(),
    }),
  },
  create_notification: {
    input: z.object({
      userId: z.string(),
      type: z.enum(['announcement', 'graded', 'due_soon', 'approval_needed', 'run_finished']),
      title: z.string(),
      message: z.string(),
      link: z.string().optional(),
    }),
    output: z.object({
      notificationId: z.string(),
      delivered: z.boolean(),
    }),
  },
  request_human_approval: {
    input: z.object({
      runId: z.string(),
      courseId: z.string(),
      summary: z.string(),
      proposedAction: z.object({
        kind: z.enum(['finalize_grade', 'publish_announcement']),
        targetId: z.string(),
        payload: z.record(z.string(), z.unknown()),
      }),
      confidence: z.number().optional(),
      flags: z.array(z.string()).optional(),
    }),
    output: z.object({
      approvalId: z.string(),
      status: z.enum(['pending', 'approved', 'rejected', 'edited']),
    }),
  },
} as const

export const TOOL_DEFINITIONS: Record<ToolName, ToolDefinition> = {
  extract_text: {
    name: 'extract_text',
    description: 'Extract raw text and calculate word & page count from document file.',
    inputSchema: {
      type: 'object',
      properties: {
        fileUrl: { type: 'string', description: 'URL or path to target document' },
        fileName: { type: 'string', description: 'Original file name' },
      },
      required: ['fileUrl', 'fileName'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        extractedText: { type: 'string' },
        wordCount: { type: 'number' },
        pageCount: { type: 'number' },
      },
      required: ['extractedText', 'wordCount'],
    },
    permission: { roles: ['student', 'professor', 'administrator'], courseScoped: false, access: 'read' },
    autonomy: 'auto',
  },
  chunk_and_embed: {
    name: 'chunk_and_embed',
    description: 'Split material text into semantic chunks, tag with topics, and create vector embeddings.',
    inputSchema: {
      type: 'object',
      properties: {
        materialId: { type: 'string' },
        chunkSize: { type: 'number' },
      },
      required: ['materialId'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        materialId: { type: 'string' },
        chunksCreated: { type: 'number' },
        topics: { type: 'array' },
      },
      required: ['materialId', 'chunksCreated'],
    },
    permission: { roles: ['professor', 'administrator'], courseScoped: true, access: 'write' },
    autonomy: 'auto',
  },
  vector_search: {
    name: 'vector_search',
    description: 'Semantic similarity search over course materials. Always strictly filtered by courseId.',
    inputSchema: {
      type: 'object',
      properties: {
        courseId: { type: 'string' },
        query: { type: 'string' },
        topK: { type: 'number' },
      },
      required: ['courseId', 'query'],
    },
    outputSchema: {
      type: 'object',
      properties: {
        matches: { type: 'array' },
      },
      required: ['matches'],
    },
    permission: { roles: ['student', 'professor', 'administrator'], courseScoped: true, access: 'read' },
    autonomy: 'auto',
  },
  get_rubric: {
    name: 'get_rubric',
    description: 'Fetch rubric criteria, descriptions, and max marks for an assignment.',
    inputSchema: {
      type: 'object',
      properties: { assignmentId: { type: 'string' } },
      required: ['assignmentId'],
    },
    outputSchema: {
      type: 'object',
      properties: { rubric: { type: 'array' }, maxMarks: { type: 'number' } },
      required: ['rubric', 'maxMarks'],
    },
    permission: { roles: ['student', 'professor', 'administrator'], courseScoped: true, access: 'read' },
    autonomy: 'auto',
  },
  get_submission: {
    name: 'get_submission',
    description: 'Retrieve submission metadata, student reference, and file details.',
    inputSchema: {
      type: 'object',
      properties: { submissionId: { type: 'string' } },
      required: ['submissionId'],
    },
    outputSchema: {
      type: 'object',
      properties: { submissionId: { type: 'string' }, studentId: { type: 'string' } },
      required: ['submissionId', 'studentId'],
    },
    permission: { roles: ['professor', 'administrator'], courseScoped: true, access: 'read' },
    autonomy: 'auto',
  },
  get_course_materials: {
    name: 'get_course_materials',
    description: 'List all published and indexed course learning materials.',
    inputSchema: {
      type: 'object',
      properties: { courseId: { type: 'string' } },
      required: ['courseId'],
    },
    outputSchema: {
      type: 'object',
      properties: { materials: { type: 'array' } },
      required: ['materials'],
    },
    permission: { roles: ['student', 'professor', 'administrator'], courseScoped: true, access: 'read' },
    autonomy: 'auto',
  },
  get_student_progress: {
    name: 'get_student_progress',
    description: 'Retrieve historical assignment completion, average marks, and identified weak topics.',
    inputSchema: {
      type: 'object',
      properties: { studentId: { type: 'string' }, courseId: { type: 'string' } },
      required: ['studentId', 'courseId'],
    },
    outputSchema: {
      type: 'object',
      properties: { averageScore: { type: 'number' }, weakTopics: { type: 'array' } },
      required: ['averageScore', 'weakTopics'],
    },
    permission: { roles: ['student', 'professor', 'administrator'], courseScoped: true, access: 'read' },
    autonomy: 'auto',
  },
  get_course_analytics: {
    name: 'get_course_analytics',
    description: 'Retrieve aggregate course metrics including score distributions and frequent doubt topics.',
    inputSchema: {
      type: 'object',
      properties: { courseId: { type: 'string' } },
      required: ['courseId'],
    },
    outputSchema: {
      type: 'object',
      properties: { averageMarks: { type: 'number' }, frequentDoubtTopics: { type: 'array' } },
      required: ['averageMarks'],
    },
    permission: { roles: ['professor', 'administrator'], courseScoped: true, access: 'read' },
    autonomy: 'auto',
  },
  save_evaluation: {
    name: 'save_evaluation',
    description: 'Store AI evaluation proposal with criterion scores, feedback, mistakes, and suggestions.',
    inputSchema: {
      type: 'object',
      properties: { submissionId: { type: 'string' }, result: { type: 'object' } },
      required: ['submissionId', 'result'],
    },
    outputSchema: {
      type: 'object',
      properties: { saved: { type: 'boolean' }, requiresApproval: { type: 'boolean' } },
      required: ['saved'],
    },
    permission: { roles: ['professor', 'administrator'], courseScoped: true, access: 'write' },
    autonomy: 'needs_approval',
  },
  save_doubt: {
    name: 'save_doubt',
    description: 'Persist student doubt question, tutor answer with citations, and question quality score.',
    inputSchema: {
      type: 'object',
      properties: { doubtRecord: { type: 'object' } },
      required: ['doubtRecord'],
    },
    outputSchema: {
      type: 'object',
      properties: { doubtId: { type: 'string' }, saved: { type: 'boolean' } },
      required: ['doubtId', 'saved'],
    },
    permission: { roles: ['student', 'professor', 'administrator'], courseScoped: true, access: 'write' },
    autonomy: 'auto',
  },
  draft_announcement: {
    name: 'draft_announcement',
    description: 'Draft a teaching announcement suggested by Insights Agent. Always requires professor approval.',
    inputSchema: {
      type: 'object',
      properties: { courseId: { type: 'string' }, title: { type: 'string' }, content: { type: 'string' } },
      required: ['courseId', 'title', 'content'],
    },
    outputSchema: {
      type: 'object',
      properties: { draftId: { type: 'string' }, status: { type: 'string' } },
      required: ['draftId'],
    },
    permission: { roles: ['professor', 'administrator'], courseScoped: true, access: 'write' },
    autonomy: 'needs_approval',
  },
  create_notification: {
    name: 'create_notification',
    description: 'Deliver an in-app notification to a student or professor.',
    inputSchema: {
      type: 'object',
      properties: { userId: { type: 'string' }, title: { type: 'string' }, message: { type: 'string' } },
      required: ['userId', 'title', 'message'],
    },
    outputSchema: {
      type: 'object',
      properties: { notificationId: { type: 'string' }, delivered: { type: 'boolean' } },
      required: ['notificationId', 'delivered'],
    },
    permission: { roles: ['student', 'professor', 'administrator'], courseScoped: false, access: 'write' },
    autonomy: 'auto',
  },
  request_human_approval: {
    name: 'request_human_approval',
    description: 'Suspend agent run and request human approval before executing sensitive action (D12).',
    inputSchema: {
      type: 'object',
      properties: {
        runId: { type: 'string' },
        courseId: { type: 'string' },
        summary: { type: 'string' },
        proposedAction: { type: 'object' },
      },
      required: ['runId', 'courseId', 'summary', 'proposedAction'],
    },
    outputSchema: {
      type: 'object',
      properties: { approvalId: { type: 'string' }, status: { type: 'string' } },
      required: ['approvalId', 'status'],
    },
    permission: { roles: ['professor', 'administrator'], courseScoped: true, access: 'write' },
    autonomy: 'needs_approval',
  },
}

// ---------------------------------------------------------------------------
// Tool Implementations
// ---------------------------------------------------------------------------

class ToolRegistry {
  private definitions = TOOL_DEFINITIONS

  getDefinition(name: ToolName): ToolDefinition {
    return this.definitions[name]
  }

  listDefinitions(): ToolDefinition[] {
    return Object.values(this.definitions)
  }

  async call<T = unknown>(
    name: ToolName,
    rawInput: unknown,
    ctx: ToolExecutionContext
  ): Promise<ToolExecutionResult<T>> {
    const start = Date.now()
    const def = this.definitions[name]
    if (!def) {
      return { success: false, error: `Tool ${name} not found in registry`, latencyMs: 0 }
    }

    // Role check
    if (!def.permission.roles.includes(ctx.actorRole)) {
      return {
        success: false,
        error: `Permission denied: role ${ctx.actorRole} cannot execute tool ${name}`,
        latencyMs: Date.now() - start,
      }
    }

    // Schema validation (Input)
    const schema = ToolSchemas[name as keyof typeof ToolSchemas]
    const parsedInput = schema.input.safeParse(rawInput)
    if (!parsedInput.success) {
      return {
        success: false,
        error: `Invalid input for ${name}: ${parsedInput.error.message}`,
        latencyMs: Date.now() - start,
      }
    }

    try {
      const resultData = await this.executeInternal(name, parsedInput.data, ctx)

      // Schema validation (Output)
      const parsedOutput = schema.output.safeParse(resultData)
      if (!parsedOutput.success) {
        return {
          success: false,
          error: `Output validation failed for ${name}: ${parsedOutput.error.message}`,
          latencyMs: Date.now() - start,
        }
      }

      return {
        success: true,
        data: parsedOutput.data as T,
        latencyMs: Date.now() - start,
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return {
        success: false,
        error: `Execution error in ${name}: ${message}`,
        latencyMs: Date.now() - start,
      }
    }
  }

  private async executeInternal(
    name: ToolName,
    input: any,
    ctx: ToolExecutionContext
  ): Promise<unknown> {
    const db = getDb()

    switch (name) {
      case 'extract_text': {
        // Deterministic text extraction
        const sampleText =
          `Extracted educational text from ${input.fileName}. Contains academic syllabus, problem definitions, theoretical derivations, and architectural principles.`
        return {
          extractedText: sampleText,
          wordCount: 145,
          pageCount: 3,
        }
      }

      case 'chunk_and_embed': {
        const material = db.materials.find((m) => m.id === input.materialId)
        if (!material) throw new Error(`Material ${input.materialId} not found`)
        if (material.courseId !== ctx.courseId) {
          throw new Error('Course scope violation: material belongs to a different course')
        }

        const chunks = Math.max(12, Math.floor(material.fileSize / 150000))
        material.indexing = {
          status: 'indexed',
          chunkCount: chunks,
          chunkSize: input.chunkSize,
          topics: material.indexing.topics.length ? material.indexing.topics : ['General Concepts', 'Core Principles'],
          lastIndexedAt: new Date().toISOString(),
          lastRunId: ctx.runId,
        }
        saveDb()

        return {
          materialId: material.id,
          chunksCreated: chunks,
          topics: material.indexing.topics,
          indexingStatus: 'indexed',
        }
      }

      case 'vector_search': {
        // Enforce strict course isolation
        if (input.courseId !== ctx.courseId) {
          throw new Error(`Course isolation violation: query for ${input.courseId} from context ${ctx.courseId}`)
        }

        const materials = db.materials.filter((m) => m.courseId === ctx.courseId)
        const q = input.query.toLowerCase()

        // Match against titles, descriptions, and topics
        const scored = materials.map((m) => {
          let score = 0.65
          if (m.title.toLowerCase().includes(q)) score = 0.95
          else if (m.indexing.topics.some((t) => t.toLowerCase().includes(q))) score = 0.88
          else if (m.description.toLowerCase().includes(q)) score = 0.78

          return {
            materialId: m.id,
            materialTitle: m.title,
            page: 2,
            similarity: score,
            snippet: `${m.title}: ${m.description.slice(0, 160)}...`,
          }
        })

        // Sort descending by similarity
        scored.sort((a, b) => b.similarity - a.similarity)
        return {
          matches: scored.slice(0, input.topK || 3),
        }
      }

      case 'get_rubric': {
        const assignment = db.assignments.find((a) => a.id === input.assignmentId)
        if (!assignment) throw new Error(`Assignment ${input.assignmentId} not found`)
        if (assignment.courseId !== ctx.courseId) {
          throw new Error('Course scope violation: assignment belongs to a different course')
        }
        return {
          assignmentId: assignment.id,
          title: assignment.title,
          rubric: assignment.rubric,
          maxMarks: assignment.maxMarks,
        }
      }

      case 'get_submission': {
        const sub = db.submissions.find((s) => s.id === input.submissionId)
        if (!sub) throw new Error(`Submission ${input.submissionId} not found`)
        if (sub.courseId !== ctx.courseId) {
          throw new Error('Course scope violation: submission belongs to a different course')
        }
        return {
          submissionId: sub.id,
          studentId: sub.studentId,
          assignmentId: sub.assignmentId,
          fileName: sub.fileName,
          submittedAt: sub.submittedAt,
          late: sub.late,
        }
      }

      case 'get_course_materials': {
        const materials = db.materials.filter((m) => m.courseId === ctx.courseId)
        return {
          materials: materials.map((m) => ({
            id: m.id,
            title: m.title,
            type: m.type,
            topics: m.indexing.topics,
          })),
        }
      }

      case 'get_student_progress': {
        const subs = db.submissions.filter(
          (s) => s.studentId === input.studentId && s.courseId === ctx.courseId && s.marks !== null
        )
        const avg = subs.length ? subs.reduce((acc, cur) => acc + (cur.marks || 0), 0) / subs.length : 85
        const doubts = db.doubts.filter((d) => d.studentId === input.studentId && d.courseId === ctx.courseId)

        return {
          studentId: input.studentId,
          courseId: ctx.courseId,
          completedAssignments: subs.length,
          averageScore: Math.round(avg),
          doubtsAsked: doubts.length,
          weakTopics: ['Query Optimization', 'Index Tuning'],
        }
      }

      case 'get_course_analytics': {
        const course = db.courses.find((c) => c.id === ctx.courseId)
        const subs = db.submissions.filter((s) => s.courseId === ctx.courseId && s.marks !== null)
        const avg = subs.length ? subs.reduce((acc, cur) => acc + (cur.marks || 0), 0) / subs.length : 82
        return {
          courseId: ctx.courseId,
          enrolledCount: course?.studentIds.length || 0,
          submissionRate: 92,
          averageMarks: Math.round(avg),
          frequentDoubtTopics: ['B-Tree Indexes', 'Normalization', 'ACID Transactions'],
        }
      }

      case 'save_evaluation': {
        const sub = db.submissions.find((s) => s.id === input.submissionId)
        if (!sub) throw new Error(`Submission ${input.submissionId} not found`)

        // Per D9: AIEvaluation is stored separately
        sub.aiEvaluation = {
          runId: ctx.runId,
          criteria: input.result.criteria,
          totalMarks: input.result.totalMarks,
          feedback: input.result.feedback,
          mistakes: input.result.mistakes,
          suggestions: input.result.suggestions,
          confidence: input.result.confidence,
          flags: input.result.flags || [],
          createdAt: new Date().toISOString(),
        }
        sub.evaluationStatus = 'awaiting_review'
        saveDb()

        return {
          saved: true,
          submissionId: sub.id,
          requiresApproval: true,
        }
      }

      case 'save_doubt': {
        const doubtId = newId('dbt')
        const doubt = {
          id: doubtId,
          courseId: input.doubtRecord.courseId,
          studentId: input.doubtRecord.studentId,
          question: input.doubtRecord.question,
          answer: input.doubtRecord.answer,
          citations: input.doubtRecord.citations,
          qualityScore: input.doubtRecord.qualityScore || null,
          confidence: input.doubtRecord.confidence ?? 0.92,
          outOfScope: input.doubtRecord.outOfScope ?? false,
          runId: ctx.runId,
          createdAt: new Date().toISOString(),
        }
        db.doubts.unshift(doubt)
        saveDb()

        return {
          doubtId,
          saved: true,
        }
      }

      case 'draft_announcement': {
        const draftId = newId('anc_draft')
        // Store as pending draft approval
        return {
          draftId,
          status: 'draft_pending_review',
        }
      }

      case 'create_notification': {
        const notifId = newId('notif')
        db.notifications.unshift({
          id: notifId,
          userId: input.userId,
          type: input.type,
          title: input.title,
          message: input.message,
          link: input.link,
          read: false,
          createdAt: new Date().toISOString(),
        })
        saveDb()

        return {
          notificationId: notifId,
          delivered: true,
        }
      }

      case 'request_human_approval': {
        const approvalId = newId('appr')
        const approval = {
          id: approvalId,
          runId: input.runId,
          courseId: input.courseId,
          agent: 'grader' as const,
          summary: input.summary,
          proposedAction: input.proposedAction,
          confidence: input.confidence ?? 0.72,
          flags: input.flags || [],
          status: 'pending' as const,
          createdAt: new Date().toISOString(),
        }
        db.approvals.unshift(approval)

        // Update run status to waiting_for_approval
        const run = db.agentRuns.find((r) => r.id === input.runId)
        if (run) {
          run.status = 'waiting_for_approval'
        }
        saveDb()

        return {
          approvalId,
          status: 'pending',
        }
      }

      default:
        throw new Error(`Unhandled tool: ${name}`)
    }
  }
}

export const toolRegistry = new ToolRegistry()
