import mongoose, { Schema } from 'mongoose'
import { config } from '../config/index.js'
import type {
  User,
  Course,
  Material,
  Assignment,
  Submission,
  Doubt,
  Announcement,
  Leaderboard,
  ChatClearMarker,
  AgentRun,
  AgentStep,
  ApprovalRequest,
  AgentPolicy,
  AgentMemory,
  Notification,
} from '../types/index.js'

// ---------------------------------------------------------------------------
// Mongoose Schemas (Matching domain types exactly)
// ---------------------------------------------------------------------------
const UserSchema = new Schema<User>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['student', 'professor', 'administrator'] },
    profile: {
      department: String,
      studentNumber: String,
      avatarHue: Number,
    },
    createdAt: { type: String, required: true },
  },
  { collection: 'users', timestamps: false }
)

const CourseSchema = new Schema<Course>(
  {
    id: { type: String, required: true, unique: true, index: true },
    code: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    enrollmentCode: { type: String, required: true, unique: true, index: true },
    professorId: { type: String, required: true, index: true },
    studentIds: [{ type: String }],
    department: String,
    term: String,
    hue: Number,
    leaderboardWeights: {
      assignments: { type: Number, default: 0.5 },
      projects: { type: Number, default: 0.3 },
      doubts: { type: Number, default: 0.2 },
    },
    createdAt: { type: String, required: true },
  },
  { collection: 'courses', timestamps: false }
)

const MaterialSchema = new Schema<Material>(
  {
    id: { type: String, required: true, unique: true, index: true },
    courseId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    type: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    mimeType: { type: String, required: true },
    uploaderId: { type: String, required: true },
    indexing: {
      status: { type: String, default: 'indexed' },
      chunkCount: { type: Number, default: 0 },
      chunkSize: { type: Number, default: 800 },
      topics: [{ type: String }],
      lastIndexedAt: String,
    },
    createdAt: { type: String, required: true },
  },
  { collection: 'materials', timestamps: false }
)

const AssignmentSchema = new Schema<Assignment>(
  {
    id: { type: String, required: true, unique: true, index: true },
    courseId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    classification: { type: String, default: 'assignment' },
    dueDate: { type: String, required: true },
    maxMarks: { type: Number, default: 100 },
    rubricCriteria: [
      {
        id: String,
        name: String,
        description: String,
        maxScore: Number,
      },
    ],
    createdAt: { type: String, required: true },
  },
  { collection: 'assignments', timestamps: false }
)

const SubmissionSchema = new Schema<Submission>(
  {
    id: { type: String, required: true, unique: true, index: true },
    assignmentId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSize: { type: Number, required: true },
    extractedTextStatus: { type: String, default: 'extracted' },
    evaluationStatus: { type: String, default: 'graded' },
    marks: { type: Number, default: null },
    feedback: String,
    professorNotes: String,
    overriddenByProfessor: { type: Boolean, default: false },
    mistakes: [{ type: String }],
    suggestions: [{ type: String }],
    confidence: Number,
    aiEvaluation: Schema.Types.Mixed,
    submittedAt: { type: String, required: true },
    isLate: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
  },
  { collection: 'submissions', timestamps: false }
)

const DoubtSchema = new Schema<Doubt>(
  {
    id: { type: String, required: true, unique: true, index: true },
    courseId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    citations: [
      {
        materialId: String,
        materialTitle: String,
        pageNumber: Number,
        snippet: String,
        similarity: Number,
      },
    ],
    quality: {
      score: Number,
      clarity: Number,
      specificity: Number,
      effort: Number,
      feedback: String,
    },
    createdAt: { type: String, required: true },
  },
  { collection: 'doubts', timestamps: false }
)

const AnnouncementSchema = new Schema<Announcement>(
  {
    id: { type: String, required: true, unique: true, index: true },
    courseId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    pinned: { type: Boolean, default: false },
    linkedAssignmentId: String,
    comments: [
      {
        id: String,
        announcementId: String,
        userId: String,
        authorName: String,
        authorRole: String,
        content: String,
        createdAt: String,
      },
    ],
    createdAt: { type: String, required: true },
  },
  { collection: 'announcements', timestamps: false }
)

// Prevent Mongoose model overwrite errors in hot-reloading
export const UserModel = mongoose.models.User || mongoose.model<User>('User', UserSchema)
export const CourseModel = mongoose.models.Course || mongoose.model<Course>('Course', CourseSchema)
export const MaterialModel = mongoose.models.Material || mongoose.model<Material>('Material', MaterialSchema)
export const AssignmentModel = mongoose.models.Assignment || mongoose.model<Assignment>('Assignment', AssignmentSchema)
export const SubmissionModel = mongoose.models.Submission || mongoose.model<Submission>('Submission', SubmissionSchema)
export const DoubtModel = mongoose.models.Doubt || mongoose.model<Doubt>('Doubt', DoubtSchema)
export const AnnouncementModel = mongoose.models.Announcement || mongoose.model<Announcement>('Announcement', AnnouncementSchema)

// ---------------------------------------------------------------------------
// Singleton Mongo Connection Manager (Serverless-Safe, Never Buffers)
// ---------------------------------------------------------------------------
mongoose.set('bufferCommands', false)

let lastMongoError: string | null = null
let connectionPromise: Promise<typeof mongoose> | null = null

export async function getMongoStatus() {
  const isConnected = Number(mongoose.connection.readyState) === 1
  let counts = { users: 0, courses: 0, materials: 0, assignments: 0 }
  if (isConnected) {
    try {
      const [u, c, m, a] = await Promise.all([
        UserModel.countDocuments(),
        CourseModel.countDocuments(),
        MaterialModel.countDocuments(),
        AssignmentModel.countDocuments(),
      ])
      counts = { users: u, courses: c, materials: m, assignments: a }
    } catch {}
  }
  return {
    connected: isConnected,
    readyState: mongoose.connection.readyState,
    configured: !!config.mongoUri,
    maskedUri: config.mongoUri ? config.mongoUri.replace(/:([^@]+)@/, ':****@') : 'not set',
    lastError: lastMongoError,
    documents: counts,
  }
}

export function getLastMongoError(): string | null {
  return lastMongoError
}

export async function ensureConnected(): Promise<boolean> {
  if (Number(mongoose.connection.readyState) === 1) return true
  if (!config.mongoUri) return false

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
    }).then((m) => {
      lastMongoError = null
      console.log('[Database] Connected to MongoDB Atlas successfully')
      return m
    }).catch((err) => {
      connectionPromise = null
      lastMongoError = err?.message || String(err)
      console.warn('[Database] MongoDB Atlas connection error:', lastMongoError)
      return mongoose
    })
  }

  await connectionPromise
  return Number(mongoose.connection.readyState) === 1
}

// ---------------------------------------------------------------------------
// Database Store
// ---------------------------------------------------------------------------
export class DatabaseStore {
  users: Map<string, User> = new Map()
  courses: Map<string, Course> = new Map()
  materials: Map<string, Material> = new Map()
  assignments: Map<string, Assignment> = new Map()
  submissions: Map<string, Submission> = new Map()
  doubts: Map<string, Doubt> = new Map()
  announcements: Map<string, Announcement> = new Map()
  leaderboards: Map<string, Leaderboard> = new Map()
  chatClearMarkers: Map<string, ChatClearMarker> = new Map()
  agentRuns: Map<string, AgentRun> = new Map()
  agentSteps: Map<string, AgentStep[]> = new Map()
  approvals: Map<string, ApprovalRequest> = new Map()
  agentPolicies: Map<string, AgentPolicy> = new Map()
  agentMemories: Map<string, AgentMemory> = new Map()
  notifications: Map<string, Notification> = new Map()

  constructor() {
    ensureConnected().then(() => this.hydrateCaches()).catch(() => {})
  }

  async hydrateCaches() {
    if (Number(mongoose.connection.readyState) !== 1) return
    try {
      const [uList, cList, mList, aList, sList, dList, annList] = await Promise.all([
        UserModel.find().lean(),
        CourseModel.find().lean(),
        MaterialModel.find().lean(),
        AssignmentModel.find().lean(),
        SubmissionModel.find().lean(),
        DoubtModel.find().lean(),
        AnnouncementModel.find().lean(),
      ])

      uList.forEach((u: any) => this.users.set(u.id, u))
      cList.forEach((c: any) => this.courses.set(c.id, c))
      mList.forEach((m: any) => this.materials.set(m.id, m))
      aList.forEach((a: any) => this.assignments.set(a.id, a))
      sList.forEach((s: any) => this.submissions.set(s.id, s))
      dList.forEach((d: any) => this.doubts.set(d.id, d))
      annList.forEach((an: any) => this.announcements.set(an.id, an))
    } catch (err: any) {
      console.warn('[Database] Cache hydration error:', err?.message)
    }
  }

  // --- Safe Lookup Helpers (Fall back to MongoDB if not in memory) ---

  async getUser(id: string): Promise<User | undefined> {
    const mem = this.users.get(id)
    if (mem) return mem
    try {
      const ok = await ensureConnected()
      if (ok) {
        const doc = await UserModel.findOne({ id }).lean()
        if (doc) {
          this.users.set(doc.id, doc as any)
          return doc as any
        }
      }
    } catch (err: any) {
      console.warn('[Database] getUser query error:', err?.message)
    }
    return undefined
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    const lower = email.trim().toLowerCase()
    const mem = Array.from(this.users.values()).find((u) => u.email.toLowerCase() === lower)
    if (mem) return mem
    try {
      const ok = await ensureConnected()
      if (ok) {
        const doc = await UserModel.findOne({ email: lower }).lean()
        if (doc) {
          this.users.set(doc.id, doc as any)
          return doc as any
        }
      }
    } catch (err: any) {
      console.warn('[Database] findUserByEmail query error:', err?.message)
    }
    return undefined
  }

  async getCourse(id: string): Promise<Course | undefined> {
    const mem = this.courses.get(id)
    if (mem) return mem
    try {
      const ok = await ensureConnected()
      if (ok) {
        const doc = await CourseModel.findOne({ id }).lean()
        if (doc) {
          this.courses.set(doc.id, doc as any)
          return doc as any
        }
      }
    } catch (err: any) {
      console.warn('[Database] getCourse error:', err?.message)
    }
    return undefined
  }

  async getAllCourses(): Promise<Course[]> {
    try {
      const ok = await ensureConnected()
      if (ok) {
        const docs = await CourseModel.find().lean()
        docs.forEach((c: any) => this.courses.set(c.id, c))
        return docs as any
      }
    } catch (err: any) {
      console.warn('[Database] getAllCourses error:', err?.message)
    }
    return Array.from(this.courses.values())
  }

  // --- Persistence Helpers (Strict Writes to MongoDB Atlas) ---

  async saveUser(user: User) {
    this.users.set(user.id, user)
    this.users.set(user.email.toLowerCase(), user)
    try {
      const ok = await ensureConnected()
      if (ok) {
        await UserModel.findOneAndUpdate(
          { id: user.id },
          user,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        console.log(`[Database] User successfully persisted to Atlas: ${user.email} (${user.id})`)
      } else if (config.mongoUri) {
        throw new Error(`Cannot connect to MongoDB Atlas (${lastMongoError || 'Timeout'}). Check Atlas Network Access (whitelist 0.0.0.0/0).`)
      } else {
        console.warn(`[Database] WARNING: Not connected to Atlas! User cached in memory only: ${user.email}`)
      }
    } catch (err: any) {
      console.error('[Database] Critical saveUser error in Atlas:', err?.message)
      throw new Error(`Failed to persist user in MongoDB Atlas: ${err?.message}`)
    }
  }

  async saveCourse(course: Course) {
    this.courses.set(course.id, course)
    try {
      const ok = await ensureConnected()
      if (ok) {
        await CourseModel.findOneAndUpdate(
          { id: course.id },
          course,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        console.log(`[Database] Course successfully persisted to Atlas: ${course.code} (${course.id})`)
      } else if (config.mongoUri) {
        throw new Error(`Cannot connect to MongoDB Atlas (${lastMongoError || 'Timeout'}). Check Atlas Network Access (whitelist 0.0.0.0/0).`)
      }
    } catch (err: any) {
      console.error('[Database] Critical saveCourse error in Atlas:', err?.message)
      throw new Error(`Failed to persist course in MongoDB Atlas: ${err?.message}`)
    }
  }

  async getMaterialsByCourse(courseId: string): Promise<Material[]> {
    try {
      const ok = await ensureConnected()
      if (ok) {
        const docs = await MaterialModel.find({ courseId }).lean()
        docs.forEach((m: any) => this.materials.set(m.id, m))
        return docs as any
      }
    } catch (err: any) {
      console.warn('[Database] getMaterialsByCourse error:', err?.message)
    }
    return Array.from(this.materials.values()).filter((m) => m.courseId === courseId)
  }

  async getAssignmentsByCourse(courseId: string): Promise<Assignment[]> {
    try {
      const ok = await ensureConnected()
      if (ok) {
        const docs = await AssignmentModel.find({ courseId }).lean()
        docs.forEach((a: any) => this.assignments.set(a.id, a))
        return docs as any
      }
    } catch (err: any) {
      console.warn('[Database] getAssignmentsByCourse error:', err?.message)
    }
    return Array.from(this.assignments.values()).filter((a) => a.courseId === courseId)
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    try {
      const ok = await ensureConnected()
      if (ok) {
        const docs = await SubmissionModel.find({ assignmentId }).lean()
        docs.forEach((s: any) => this.submissions.set(s.id, s))
        return docs as any
      }
    } catch (err: any) {
      console.warn('[Database] getSubmissionsByAssignment error:', err?.message)
    }
    return Array.from(this.submissions.values()).filter((s) => s.assignmentId === assignmentId)
  }

  async saveMaterial(mat: Material) {
    this.materials.set(mat.id, mat)
    try {
      const ok = await ensureConnected()
      if (ok) {
        await MaterialModel.findOneAndUpdate(
          { id: mat.id },
          mat,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      }
    } catch (err: any) {
      console.warn('[Database] saveMaterial error:', err?.message)
    }
  }

  async deleteMaterial(id: string) {
    this.materials.delete(id)
    try {
      const ok = await ensureConnected()
      if (ok) {
        await MaterialModel.deleteOne({ id })
      }
    } catch (err: any) {
      console.warn('[Database] deleteMaterial error:', err?.message)
    }
  }

  async saveAssignment(asg: Assignment) {
    this.assignments.set(asg.id, asg)
    try {
      const ok = await ensureConnected()
      if (ok) {
        await AssignmentModel.findOneAndUpdate(
          { id: asg.id },
          asg,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      }
    } catch (err: any) {
      console.warn('[Database] saveAssignment error:', err?.message)
    }
  }

  async deleteAssignment(id: string) {
    this.assignments.delete(id)
    try {
      const ok = await ensureConnected()
      if (ok) {
        await AssignmentModel.deleteOne({ id })
      }
    } catch (err: any) {
      console.warn('[Database] deleteAssignment error:', err?.message)
    }
  }

  async saveSubmission(sub: Submission) {
    this.submissions.set(sub.id, sub)
    try {
      const ok = await ensureConnected()
      if (ok) {
        await SubmissionModel.findOneAndUpdate(
          { id: sub.id },
          sub,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      }
    } catch (err: any) {
      console.warn('[Database] saveSubmission error:', err?.message)
    }
  }

  async saveDoubt(doubt: Doubt) {
    this.doubts.set(doubt.id, doubt)
    try {
      const ok = await ensureConnected()
      if (ok) {
        await DoubtModel.findOneAndUpdate(
          { id: doubt.id },
          doubt,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      }
    } catch (err: any) {
      console.warn('[Database] saveDoubt error:', err?.message)
    }
  }

  async saveAnnouncement(ann: Announcement) {
    this.announcements.set(ann.id, ann)
    try {
      const ok = await ensureConnected()
      if (ok) {
        await AnnouncementModel.findOneAndUpdate(
          { id: ann.id },
          ann,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
      }
    } catch (err: any) {
      console.warn('[Database] saveAnnouncement error:', err?.message)
    }
  }
}

export const db = new DatabaseStore()
