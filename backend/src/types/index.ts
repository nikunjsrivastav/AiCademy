export type Role = 'student' | 'professor' | 'administrator'

export interface UserProfile {
  department?: string
  bio?: string
  studentNumber?: string
  avatarHue?: number
}

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  role: Role
  profile: UserProfile
  createdAt: string
}

export interface LeaderboardWeights {
  assignments: number
  projects: number
  doubts: number
}

export interface Course {
  id: string
  code: string
  name: string
  description: string
  enrollmentCode: string
  professorId: string
  studentIds: string[]
  createdAt: string
  department?: string
  term?: string
  hue?: number
  leaderboardWeights?: LeaderboardWeights
}

export type MaterialType = 'pdf' | 'slides' | 'document' | 'notes' | 'link'
export type IndexingStatus = 'pending' | 'indexing' | 'indexed' | 'failed' | 'stale'

export interface MaterialIndexing {
  status: IndexingStatus
  chunkCount: number
  chunkSize?: number
  topics: string[]
  lastIndexedAt?: string
  lastRunId?: string
  error?: string
}

export interface Material {
  id: string
  courseId: string
  title: string
  description: string
  type: MaterialType
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  uploaderId: string
  indexing: MaterialIndexing
  createdAt: string
}

export type AssignmentClassification = 'assignment' | 'project'

export interface RubricCriterion {
  id: string
  name: string
  description?: string
  weight: number
  maxScore: number
}

export interface Assignment {
  id: string
  courseId: string
  title: string
  description: string
  classification: AssignmentClassification
  rubricCriteria: RubricCriterion[]
  maxMarks: number
  dueDate: string
  creatorId: string
  createdAt: string
}

export type EvaluationStatus = 'pending' | 'grading' | 'graded' | 'needs_review'

export interface CriterionScore {
  criterionId: string
  criterionName: string
  score: number
  maxScore: number
  reasoning: string
}

export interface AiEvaluation {
  marks: number
  maxMarks: number
  confidence: number
  reasoning: string
  criterionScores: CriterionScore[]
  mistakes: string[]
  suggestions: string[]
  promptInjectionSuspected?: boolean
  criticNotes?: string
  evaluatedAt: string
  topicIdentified?: string
  topicAlignment?: 'high' | 'moderate' | 'low' | 'off_topic'
}

export interface Submission {
  id: string
  assignmentId: string
  studentId: string
  courseId: string
  fileUrl: string
  fileName: string
  fileSize: number
  extractedTextStatus: 'extracted' | 'pending' | 'failed'
  evaluationStatus: EvaluationStatus
  marks: number | null
  feedback: string | null
  mistakes: string[]
  suggestions: string[]
  confidence: number | null
  aiEvaluation?: AiEvaluation
  overriddenByProfessor?: boolean
  professorNotes?: string
  submittedAt: string
  isLate?: boolean
  version: number
}

export interface SourceCitation {
  materialId: string
  materialTitle: string
  pageNumber?: number
  snippet: string
  similarity: number
}

export interface QuestionQuality {
  score: number
  clarity: number
  specificity: number
  effort: number
  feedback: string
}

export interface Doubt {
  id: string
  courseId: string
  studentId: string
  question: string
  answer: string
  citations: SourceCitation[]
  quality: QuestionQuality
  createdAt: string
}

export interface Comment {
  id: string
  announcementId: string
  userId: string
  authorName: string
  authorRole: Role
  content: string
  createdAt: string
}

export interface Announcement {
  id: string
  courseId: string
  authorId: string
  title: string
  content: string
  pinned?: boolean
  linkedAssignmentId?: string
  comments: Comment[]
  createdAt: string
}

export interface LeaderboardEntry {
  studentId: string
  studentName: string
  avatarHue?: number
  rank: number
  totalScore: number
  assignmentScore: number
  projectScore: number
  doubtScore: number
}

export interface Leaderboard {
  courseId: string
  updatedAt: string
  entries: LeaderboardEntry[]
}

export interface ChatClearMarker {
  id: string
  courseId: string
  studentId: string
  clearedAt: string
}

export type AgentName =
  | 'orchestrator'
  | 'ingestion'
  | 'grader'
  | 'tutor'
  | 'question_quality'
  | 'insights'
  | 'study_coach'

export type RunStatus = 'queued' | 'running' | 'waiting_for_approval' | 'succeeded' | 'failed' | 'cancelled'
export type StepKind = 'plan' | 'tool_call' | 'observation' | 'reflection' | 'final'

export interface AgentStep {
  id: string
  runId: string
  index: number
  kind: StepKind
  toolName?: string
  toolInput?: unknown
  toolOutput?: unknown
  content: string
  latencyMs: number
  tokensUsed?: number
  timestamp: string
}

export interface AgentRun {
  id: string
  agent: AgentName
  status: RunStatus
  trigger: string
  courseId: string
  userId: string
  startedAt: string
  finishedAt?: string
  summary?: string
  error?: string
  costEstimateCents?: number
  totalTokens?: number
}

export interface AgentRunWithSteps extends AgentRun {
  steps: AgentStep[]
}

export interface ApprovalRequest {
  id: string
  runId: string
  courseId: string
  agent: AgentName
  actionType: 'grade_publish' | 'announcement_publish' | 'policy_change'
  summary: string
  payload: Record<string, unknown>
  confidence: number
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  decidedAt?: string
  decidedBy?: string
  note?: string
}

export interface AgentPolicy {
  courseId: string
  autonomyLevel: 'full' | 'semi' | 'conservative'
  minConfidenceGrader: number
  minConfidenceTutor: number
  autoPublishAnnouncements: boolean
  dailyTokenBudget: number
  usedTokensToday: number
  activeAgents: Record<AgentName, boolean>
}

export interface AgentMemory {
  id: string
  courseId: string
  userId?: string
  key: string
  value: string
  category: 'learning_profile' | 'course_context' | 'grading_heuristic'
  createdAt: string
}

export interface Notification {
  id: string
  userId: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'alert'
  read: boolean
  createdAt: string
  link?: string
}

