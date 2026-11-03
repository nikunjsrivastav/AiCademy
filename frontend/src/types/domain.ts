/**
 * Domain types from /docs/ARCHITECTURE_SOURCE.md Section 4 (PDF).
 * Fields that go beyond the PDF are marked `EXTENSION` and documented in brain.md section 10.
 * These shapes are the API contract: the future Express backend must return exactly these payloads.
 */

export type ID = string
/** ISO-8601 timestamp string. */
export type ISODate = string

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
export type Role = 'student' | 'professor' | 'administrator'

export interface UserProfile {
  department?: string
  bio?: string
  /** University student number (students only). */
  studentNumber?: string
  /** Hue (0–360) used for the generated avatar. */
  avatarHue?: number
}

/** Public user shape. The password hash never leaves the server. */
export interface User {
  id: ID
  name: string
  email: string
  role: Role
  profile: UserProfile
  createdAt: ISODate
}

// ---------------------------------------------------------------------------
// Course
// ---------------------------------------------------------------------------
/** EXTENSION (decision D3): per-course leaderboard weights, summing to 1. */
export interface LeaderboardWeights {
  assignments: number
  projects: number
  doubts: number
}

export interface Course {
  id: ID
  /** Public course identifier, e.g. "CS301". */
  code: string
  name: string
  description: string
  enrollmentCode: string
  professorId: ID
  studentIds: ID[]
  createdAt: ISODate
  department?: string
  /** EXTENSION: display term, e.g. "Fall 2026". */
  term?: string
  /** EXTENSION: hue (0–360) used for the course color. */
  hue?: number
  /** EXTENSION (D3) */
  leaderboardWeights?: LeaderboardWeights
}

/** Enriched course model returned to views. */
export interface CourseWithDetails extends Course {
  professor?: Pick<User, 'id' | 'name' | 'email' | 'profile'>
  studentCount: number
  materialCount: number
  isEnrolled?: boolean
}

// ---------------------------------------------------------------------------
// Material
// ---------------------------------------------------------------------------
export type MaterialType = 'pdf' | 'slides' | 'document' | 'notes' | 'link'
export type IndexingStatus = 'pending' | 'indexing' | 'indexed' | 'failed' | 'stale'

/** Vector-indexing metadata (PDF: "vector-indexing metadata"). */
export interface MaterialIndexing {
  status: IndexingStatus
  chunkCount: number
  chunkSize?: number
  topics: string[]
  lastIndexedAt?: ISODate
  /** EXTENSION: AgentRun that last indexed this material. */
  lastRunId?: ID
  error?: string
}

export interface Material {
  id: ID
  courseId: ID
  title: string
  description: string
  type: MaterialType
  /** File location (local or mounted storage; object storage later). */
  fileUrl: string
  fileName: string
  fileSize: number
  mimeType: string
  pageCount?: number
  uploadedBy: ID
  createdAt: ISODate
  updatedAt: ISODate
  indexing: MaterialIndexing
}

// ---------------------------------------------------------------------------
// Assignment
// ---------------------------------------------------------------------------
export interface RubricCriterion {
  id: ID
  title: string
  description: string
  maxMarks: number
}

/** Decision D2: "project classification". */
export type AssignmentClassification = 'assignment' | 'project'

export interface Assignment {
  id: ID
  courseId: ID
  title: string
  description: string
  rubric: RubricCriterion[]
  maxMarks: number
  dueDate: ISODate
  classification: AssignmentClassification
  createdBy: ID
  createdAt: ISODate
  updatedAt: ISODate
  /** EXTENSION: topics covered, used by Insights and Study Coach agents. */
  topics?: string[]
}

// ---------------------------------------------------------------------------
// Submission
// ---------------------------------------------------------------------------
export type ExtractionStatus = 'pending' | 'extracted' | 'failed'
export type EvaluationStatus = 'pending' | 'evaluating' | 'awaiting_review' | 'graded' | 'failed'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface Confidence {
  /** 0–1 */
  score: number
  level: ConfidenceLevel
  reasons: string[]
}

export interface CriterionScore {
  criterionId: ID
  marks: number
  maxMarks: number
  feedback: string
  evidence?: string
}

/** EXTENSION (decision D9): the AI's proposal, kept separate from the professor-approved `marks`. */
export interface AIEvaluation {
  runId?: ID
  marks?: number
  criteria?: CriterionScore[]
  totalMarks: number
  feedback: string
  mistakes: string[]
  suggestions: string[]
  confidence: Confidence | number
  /** e.g. "possible_prompt_injection", "borderline" */
  flags?: string[]
  createdAt?: ISODate
  topicIdentified?: string
  topicAlignment?: 'high' | 'moderate' | 'low' | 'off_topic'
}

export interface Submission {
  id: ID
  assignmentId: ID
  courseId: ID
  studentId: ID
  fileUrl: string
  fileName: string
  fileSize: number
  submittedAt: ISODate
  /** Decision D8 */
  late: boolean
  /** Decision D8: increments on resubmission. */
  version: number
  extractionStatus: ExtractionStatus
  evaluationStatus: EvaluationStatus
  /** Final, professor-approved marks. null until approved (decision D12). */
  marks: number | null
  feedback: string | null
  mistakes: string[]
  suggestions: string[]
  confidence: Confidence | null
  /** EXTENSION (D9) */
  aiEvaluation?: AIEvaluation | null
  gradedBy?: ID
  gradedAt?: ISODate
}

// ---------------------------------------------------------------------------
// Doubt
// ---------------------------------------------------------------------------
export interface Citation {
  materialId: ID
  materialTitle: string
  page: number
  snippet: string
}

export interface QualityScore {
  /** 0–100 */
  score: number
  clarity: number
  specificity: number
  effort: number
  tip: string
}

export interface Doubt {
  id: ID
  courseId: ID
  studentId: ID
  sessionId?: ID
  question: string
  answer: string
  citations: Citation[]
  qualityScore: QualityScore | null
  createdAt: ISODate
  /** EXTENSION: tutor confidence 0–1. */
  confidence?: number
  /** EXTENSION: the tutor declined to answer (out of scope / low confidence). */
  outOfScope?: boolean
  /** EXTENSION: tutor AgentRun id. */
  runId?: ID
}

// ---------------------------------------------------------------------------
// Announcement and Comment
// ---------------------------------------------------------------------------
export interface Comment {
  id: ID
  announcementId: ID
  userId: ID
  text: string
  createdAt: ISODate
  updatedAt: ISODate
}

/** Comment with its author embedded (decision D7: comments come embedded in GET announcements). */
export interface CommentWithAuthor extends Comment {
  author: Pick<User, 'id' | 'name' | 'role' | 'profile'>
}

export interface Announcement {
  id: ID
  courseId: ID
  authorId: ID
  content: string
  /** Optional links to assignments or projects. */
  linkedAssignmentIds: ID[]
  createdAt: ISODate
  updatedAt: ISODate
  /** EXTENSION */
  title?: string
  /** EXTENSION: drafted by the Insights Agent and approved by a professor. */
  aiGenerated?: boolean
  /** Decision D7 */
  comments?: CommentWithAuthor[]
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------
export interface LeaderboardEntry {
  studentId: ID
  rank: number
  /** Normalized 0–100 components (decision D3). */
  assignmentScore: number
  projectScore: number
  doubtScore: number
  total: number
}

export interface Leaderboard {
  id: ID
  courseId: ID
  entries: LeaderboardEntry[]
  weights: LeaderboardWeights
  computedAt: ISODate
}

// ---------------------------------------------------------------------------
// Chat-clear marker
// ---------------------------------------------------------------------------
export interface ChatClearMarker {
  id: ID
  studentId: ID
  courseId: ID
  clearedAt: ISODate
}

// ---------------------------------------------------------------------------
// EXTENSION: Notification (decision D7)
// ---------------------------------------------------------------------------
export type NotificationType =
  | 'announcement'
  | 'graded'
  | 'due_soon'
  | 'approval_needed'
  | 'run_finished'

export interface Notification {
  id: ID
  userId: ID
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  createdAt: ISODate
}
