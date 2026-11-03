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
// Mongoose Schemas (MongoDB Atlas)
// ---------------------------------------------------------------------------
const UserSchema = new Schema<User>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'professor', 'administrator'] },
  profile: {
    department: String,
    bio: String,
    studentNumber: String,
    avatarHue: Number,
  },
  createdAt: { type: String, required: true },
})

const CourseSchema = new Schema<Course>({
  id: { type: String, required: true, unique: true },
  code: { type: String, required: true, uppercase: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  enrollmentCode: { type: String, required: true, unique: true },
  professorId: { type: String, required: true },
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
})

const MaterialSchema = new Schema<Material>({
  id: { type: String, required: true, unique: true },
  courseId: { type: String, required: true },
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
})

const AssignmentSchema = new Schema<Assignment>({
  id: { type: String, required: true, unique: true },
  courseId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  classification: { type: String, default: 'assignment' },
  rubricCriteria: [
    {
      id: String,
      name: String,
      description: String,
      weight: Number,
      maxScore: Number,
    },
  ],
  maxMarks: { type: Number, default: 100 },
  dueDate: { type: String, required: true },
  creatorId: { type: String, required: true },
  createdAt: { type: String, required: true },
})

const SubmissionSchema = new Schema<Submission>({
  id: { type: String, required: true, unique: true },
  assignmentId: { type: String, required: true },
  studentId: { type: String, required: true },
  courseId: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  extractedTextStatus: { type: String, default: 'extracted' },
  evaluationStatus: { type: String, default: 'graded' },
  marks: { type: Number, default: null },
  feedback: { type: String, default: null },
  mistakes: [{ type: String }],
  suggestions: [{ type: String }],
  confidence: { type: Number, default: null },
  aiEvaluation: Schema.Types.Mixed,
  overriddenByProfessor: { type: Boolean, default: false },
  professorNotes: String,
  submittedAt: { type: String, required: true },
  isLate: { type: Boolean, default: false },
  version: { type: Number, default: 1 },
})

const DoubtSchema = new Schema<Doubt>({
  id: { type: String, required: true, unique: true },
  courseId: { type: String, required: true },
  studentId: { type: String, required: true },
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
})

const AnnouncementSchema = new Schema<Announcement>({
  id: { type: String, required: true, unique: true },
  courseId: { type: String, required: true },
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
})

export const UserModel = mongoose.models.User || mongoose.model<User>('User', UserSchema)
export const CourseModel = mongoose.models.Course || mongoose.model<Course>('Course', CourseSchema)
export const MaterialModel = mongoose.models.Material || mongoose.model<Material>('Material', MaterialSchema)
export const AssignmentModel = mongoose.models.Assignment || mongoose.model<Assignment>('Assignment', AssignmentSchema)
export const SubmissionModel = mongoose.models.Submission || mongoose.model<Submission>('Submission', SubmissionSchema)
export const DoubtModel = mongoose.models.Doubt || mongoose.model<Doubt>('Doubt', DoubtSchema)
export const AnnouncementModel = mongoose.models.Announcement || mongoose.model<Announcement>('Announcement', AnnouncementSchema)

// ---------------------------------------------------------------------------
// Store Architecture (Clean with NO Preseeding)
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

  isConnectedToMongo: boolean = false

  constructor() {
    this.initMongo()
  }

  async initMongo() {
    if (config.mongoUri) {
      try {
        await mongoose.connect(config.mongoUri, {
          serverSelectionTimeoutMS: 5000,
        })
        this.isConnectedToMongo = true
        console.log('[Database] Connected to MongoDB Atlas successfully (Clean unseeded database)')

        // Synchronize in-memory caches from MongoDB collections
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
      } catch (err) {
        console.warn('[Database] MongoDB connection failed or URI not ready, running in clean local mode:', err)
      }
    } else {
      console.log('[Database] No MONGODB_URI set — running in clean unseeded mode')
    }
  }

  // MongoDB persist helpers
  async saveUser(user: User) {
    this.users.set(user.id, user)
    if (this.isConnectedToMongo) {
      try {
        await UserModel.findOneAndUpdate({ id: user.id }, user, { upsert: true })
      } catch (err) {
        console.warn('[Database] Failed to persist user to MongoDB:', err)
      }
    }
  }

  async saveCourse(course: Course) {
    this.courses.set(course.id, course)
    if (this.isConnectedToMongo) {
      try {
        await CourseModel.findOneAndUpdate({ id: course.id }, course, { upsert: true })
      } catch (err) {
        console.warn('[Database] Failed to persist course to MongoDB:', err)
      }
    }
  }

  async saveMaterial(mat: Material) {
    this.materials.set(mat.id, mat)
    if (this.isConnectedToMongo) {
      try {
        await MaterialModel.findOneAndUpdate({ id: mat.id }, mat, { upsert: true })
      } catch (err) {
        console.warn('[Database] Failed to persist material to MongoDB:', err)
      }
    }
  }

  async deleteMaterial(id: string) {
    this.materials.delete(id)
    if (this.isConnectedToMongo) {
      try {
        await MaterialModel.deleteOne({ id })
      } catch (err) {
        console.warn('[Database] Failed to delete material from MongoDB:', err)
      }
    }
  }

  async saveAssignment(asg: Assignment) {
    this.assignments.set(asg.id, asg)
    if (this.isConnectedToMongo) {
      try {
        await AssignmentModel.findOneAndUpdate({ id: asg.id }, asg, { upsert: true })
      } catch (err) {
        console.warn('[Database] Failed to persist assignment to MongoDB:', err)
      }
    }
  }

  async deleteAssignment(id: string) {
    this.assignments.delete(id)
    if (this.isConnectedToMongo) {
      try {
        await AssignmentModel.deleteOne({ id })
      } catch (err) {
        console.warn('[Database] Failed to delete assignment from MongoDB:', err)
      }
    }
  }

  async saveSubmission(sub: Submission) {
    this.submissions.set(sub.id, sub)
    if (this.isConnectedToMongo) {
      try {
        await SubmissionModel.findOneAndUpdate({ id: sub.id }, sub, { upsert: true })
      } catch (err) {
        console.warn('[Database] Failed to persist submission to MongoDB:', err)
      }
    }
  }

  async saveDoubt(doubt: Doubt) {
    this.doubts.set(doubt.id, doubt)
    if (this.isConnectedToMongo) {
      try {
        await DoubtModel.findOneAndUpdate({ id: doubt.id }, doubt, { upsert: true })
      } catch (err) {
        console.warn('[Database] Failed to persist doubt to MongoDB:', err)
      }
    }
  }

  async saveAnnouncement(ann: Announcement) {
    this.announcements.set(ann.id, ann)
    if (this.isConnectedToMongo) {
      try {
        await AnnouncementModel.findOneAndUpdate({ id: ann.id }, ann, { upsert: true })
      } catch (err) {
        console.warn('[Database] Failed to persist announcement to MongoDB:', err)
      }
    }
  }
}

export const db = new DatabaseStore()
