import bcrypt from 'bcryptjs'
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
    this.seed()
  }

  seed() {
    const salt = bcrypt.genSaltSync(10)
    const passwordHash = bcrypt.hashSync('demo1234', salt)
    const now = new Date().toISOString()

    // Users
    const seedUsers: User[] = [
      {
        id: 'user_admin',
        name: 'Ada Okafor',
        email: 'admin@aicademy.dev',
        passwordHash,
        role: 'administrator',
        profile: { department: 'Information Technology', bio: 'Platform Systems Administrator', avatarHue: 200 },
        createdAt: now,
      },
      {
        id: 'user_prof_rao',
        name: 'Dr. Priya Rao',
        email: 'prof.rao@aicademy.dev',
        passwordHash,
        role: 'professor',
        profile: { department: 'Computer Science', bio: 'Professor of Algorithms & Data Structures', avatarHue: 280 },
        createdAt: now,
      },
      {
        id: 'user_prof_chen',
        name: 'Dr. Wei Chen',
        email: 'prof.chen@aicademy.dev',
        passwordHash,
        role: 'professor',
        profile: { department: 'Computer Science', bio: 'Associate Professor of Computer Architecture', avatarHue: 160 },
        createdAt: now,
      },
      {
        id: 'user_student1',
        name: 'Aarav Sharma',
        email: 'student1@aicademy.dev',
        passwordHash,
        role: 'student',
        profile: { department: 'Computer Science', studentNumber: 'CS2026-001', avatarHue: 25 },
        createdAt: now,
      },
      {
        id: 'user_student2',
        name: 'Maya Lopez',
        email: 'student2@aicademy.dev',
        passwordHash,
        role: 'student',
        profile: { department: 'Computer Science', studentNumber: 'CS2026-002', avatarHue: 330 },
        createdAt: now,
      },
      {
        id: 'user_student3',
        name: 'Kenji Tanaka',
        email: 'student3@aicademy.dev',
        passwordHash,
        role: 'student',
        profile: { department: 'Computer Science', studentNumber: 'CS2026-003', avatarHue: 210 },
        createdAt: now,
      },
      {
        id: 'user_student4',
        name: 'Zara Ahmed',
        email: 'student4@aicademy.dev',
        passwordHash,
        role: 'student',
        profile: { department: 'Data Science', studentNumber: 'DS2026-004', avatarHue: 140 },
        createdAt: now,
      },
      {
        id: 'user_student5',
        name: "Liam O'Brien",
        email: 'student5@aicademy.dev',
        passwordHash,
        role: 'student',
        profile: { department: 'Computer Science', studentNumber: 'CS2026-005', avatarHue: 45 },
        createdAt: now,
      },
      {
        id: 'user_student6',
        name: 'Sofia Rossi',
        email: 'student6@aicademy.dev',
        passwordHash,
        role: 'student',
        profile: { department: 'Data Science', studentNumber: 'DS2026-006', avatarHue: 300 },
        createdAt: now,
      },
      {
        id: 'user_student7',
        name: 'Noah Kim',
        email: 'student7@aicademy.dev',
        passwordHash,
        role: 'student',
        profile: { department: 'Computer Science', studentNumber: 'CS2026-007', avatarHue: 190 },
        createdAt: now,
      },
      {
        id: 'user_student8',
        name: 'Fatima Bello',
        email: 'student8@aicademy.dev',
        passwordHash,
        role: 'student',
        profile: { department: 'Mathematics', studentNumber: 'MATH2026-008', avatarHue: 95 },
        createdAt: now,
      },
    ]
    seedUsers.forEach((u) => this.users.set(u.id, u))

    // Courses
    const seedCourses: Course[] = [
      {
        id: 'course_cs301',
        code: 'CS301',
        name: 'Data Structures & Algorithms',
        description: 'Advanced data structures, asymptotic complexity, graphs, and dynamic programming.',
        enrollmentCode: 'DSA301',
        professorId: 'user_prof_rao',
        studentIds: ['user_student1', 'user_student2', 'user_student3', 'user_student4'],
        createdAt: now,
        department: 'Computer Science',
        term: 'Fall 2026',
        hue: 240,
        leaderboardWeights: { assignments: 0.5, projects: 0.3, doubts: 0.2 },
      },
      {
        id: 'course_cs220',
        code: 'CS220',
        name: 'Computer Architecture & Systems',
        description: 'Instruction set architectures, pipelining, cache hierarchies, and assembly programming.',
        enrollmentCode: 'SYS220',
        professorId: 'user_prof_chen',
        studentIds: ['user_student1', 'user_student3', 'user_student5'],
        createdAt: now,
        department: 'Computer Science',
        term: 'Fall 2026',
        hue: 160,
        leaderboardWeights: { assignments: 0.5, projects: 0.3, doubts: 0.2 },
      },
      {
        id: 'course_ai410',
        code: 'AI410',
        name: 'Introduction to Artificial Intelligence',
        description: 'Autonomous agents, search algorithms, heuristic reasoning, and neural architectures.',
        enrollmentCode: 'ART410',
        professorId: 'user_prof_rao',
        studentIds: ['user_student1', 'user_student2', 'user_student4', 'user_student6'],
        createdAt: now,
        department: 'Computer Science',
        term: 'Fall 2026',
        hue: 280,
        leaderboardWeights: { assignments: 0.5, projects: 0.3, doubts: 0.2 },
      },
    ]
    seedCourses.forEach((c) => this.courses.set(c.id, c))

    // Materials
    const seedMaterials: Material[] = [
      {
        id: 'mat_cs301_trees',
        courseId: 'course_cs301',
        title: 'AVL & Red-Black Balanced Trees',
        description: 'Self-balancing binary search trees and tree rotation mechanics.',
        type: 'pdf',
        fileUrl: '/uploads/materials/balanced_trees.pdf',
        fileName: 'balanced_trees.pdf',
        fileSize: 2048576,
        mimeType: 'application/pdf',
        uploaderId: 'user_prof_rao',
        indexing: {
          status: 'indexed',
          chunkCount: 24,
          chunkSize: 800,
          topics: ['Binary Trees', 'AVL Rotations', 'Red-Black Balancing'],
          lastIndexedAt: now,
        },
        createdAt: now,
      },
      {
        id: 'mat_cs301_graphs',
        courseId: 'course_cs301',
        title: 'Graph Traversal & Shortest Path Algorithms',
        description: 'BFS, DFS, Dijkstra, Bellman-Ford, and A* pathfinding techniques.',
        type: 'slides',
        fileUrl: '/uploads/materials/graph_algorithms.pptx',
        fileName: 'graph_algorithms.pptx',
        fileSize: 4194304,
        mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        uploaderId: 'user_prof_rao',
        indexing: {
          status: 'indexed',
          chunkCount: 36,
          chunkSize: 800,
          topics: ['Graphs', 'Dijkstra', 'Breadth-First Search'],
          lastIndexedAt: now,
        },
        createdAt: now,
      },
      {
        id: 'mat_cs220_mips',
        courseId: 'course_cs220',
        title: 'MIPS Instruction Pipeline & Hazards',
        description: '5-stage pipeline, structural, data, and control hazard mitigation.',
        type: 'pdf',
        fileUrl: '/uploads/materials/pipelining_hazards.pdf',
        fileName: 'pipelining_hazards.pdf',
        fileSize: 3145728,
        mimeType: 'application/pdf',
        uploaderId: 'user_prof_chen',
        indexing: {
          status: 'indexed',
          chunkCount: 28,
          chunkSize: 800,
          topics: ['Pipelines', 'Forwarding', 'Branch Prediction'],
          lastIndexedAt: now,
        },
        createdAt: now,
      },
    ]
    seedMaterials.forEach((m) => this.materials.set(m.id, m))

    // Assignments
    const seedAssignments: Assignment[] = [
      {
        id: 'asg_cs301_avl',
        courseId: 'course_cs301',
        title: 'Assignment 1: AVL Tree Implementation with Rebalancing',
        description: 'Implement an AVL tree supporting insert, delete, and left/right rotations in O(log N).',
        classification: 'assignment',
        rubricCriteria: [
          { id: 'crit_correct', name: 'Correctness & Invariant Validation', weight: 40, maxScore: 40 },
          { id: 'crit_complexity', name: 'Time Complexity Compliance (O(log N))', weight: 30, maxScore: 30 },
          { id: 'crit_code_style', name: 'Code Style & Memory Cleanliness', weight: 30, maxScore: 30 },
        ],
        maxMarks: 100,
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        creatorId: 'user_prof_rao',
        createdAt: now,
      },
      {
        id: 'asg_cs301_proj',
        courseId: 'course_cs301',
        title: 'Midterm Project: High-Performance Graph Engine',
        description: 'Build a memory-efficient graph routing engine for transit navigation.',
        classification: 'project',
        rubricCriteria: [
          { id: 'crit_routing', name: 'Routing Accuracy & Heuristics', weight: 50, maxScore: 50 },
          { id: 'crit_perf', name: 'Benchmark Latency (<5ms)', weight: 30, maxScore: 30 },
          { id: 'crit_docs', name: 'Technical Architecture Report', weight: 20, maxScore: 20 },
        ],
        maxMarks: 100,
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
        creatorId: 'user_prof_rao',
        createdAt: now,
      },
    ]
    seedAssignments.forEach((a) => this.assignments.set(a.id, a))

    // Submissions
    const seedSubmissions: Submission[] = [
      {
        id: 'sub_student1_avl',
        assignmentId: 'asg_cs301_avl',
        studentId: 'user_student1',
        courseId: 'course_cs301',
        fileUrl: '/uploads/submissions/aarav_avl_tree.zip',
        fileName: 'aarav_avl_tree.zip',
        fileSize: 45056,
        extractedTextStatus: 'extracted',
        evaluationStatus: 'graded',
        marks: 94,
        feedback: 'Exceptional AVL tree implementation. Rotations maintain the balancing invariant cleanly.',
        mistakes: ['Missing boundary check on null node deletion in helper method'],
        suggestions: ['Consider inline balance factor tracking to eliminate depth re-computations'],
        confidence: 0.92,
        aiEvaluation: {
          marks: 94,
          maxMarks: 100,
          confidence: 0.92,
          reasoning: 'Clean tree rotations, full compliance with O(log N) depth invariants.',
          criterionScores: [
            { criterionId: 'crit_correct', criterionName: 'Correctness', score: 38, maxScore: 40, reasoning: 'All test assertions passed.' },
            { criterionId: 'crit_complexity', criterionName: 'Time Complexity', score: 29, maxScore: 30, reasoning: 'O(log N) operations verified.' },
            { criterionId: 'crit_code_style', criterionName: 'Code Style', score: 27, maxScore: 30, reasoning: 'Clean structure and comments.' },
          ],
          mistakes: ['Edge case deletion on leaf null pointers handled redundantly'],
          suggestions: ['Add automated fuzz tests for randomized insertion orders'],
          evaluatedAt: now,
        },
        submittedAt: new Date(Date.now() - 86400000).toISOString(),
        version: 1,
      },
    ]
    seedSubmissions.forEach((s) => this.submissions.set(s.id, s))

    // Announcements
    const seedAnnouncements: Announcement[] = [
      {
        id: 'ann_cs301_welcome',
        courseId: 'course_cs301',
        authorId: 'user_prof_rao',
        title: 'Welcome to CS301: Data Structures & Algorithms',
        content: 'Welcome everyone! Please review the AVL balanced trees reading before Wednesday lecture.',
        pinned: true,
        comments: [
          {
            id: 'comm_1',
            announcementId: 'ann_cs301_welcome',
            userId: 'user_student1',
            authorName: 'Aarav Sharma',
            authorRole: 'student',
            content: 'Looking forward to the course, Professor! Are the slides downloadable?',
            createdAt: now,
          },
        ],
        createdAt: now,
      },
    ]
    seedAnnouncements.forEach((a) => this.announcements.set(a.id, a))

    // Agent Policy
    const defaultPolicy: AgentPolicy = {
      courseId: 'course_cs301',
      autonomyLevel: 'semi',
      minConfidenceGrader: 0.75,
      minConfidenceTutor: 0.6,
      autoPublishAnnouncements: false,
      dailyTokenBudget: 250000,
      usedTokensToday: 42350,
      activeAgents: {
        orchestrator: true,
        ingestion: true,
        grader: true,
        tutor: true,
        question_quality: true,
        insights: true,
        study_coach: true,
      },
    }
    this.agentPolicies.set('course_cs301', defaultPolicy)
    this.agentPolicies.set('course_cs220', { ...defaultPolicy, courseId: 'course_cs220' })
    this.agentPolicies.set('course_ai410', { ...defaultPolicy, courseId: 'course_ai410' })

    // Notifications
    const seedNotifs: Notification[] = [
      {
        id: 'notif_1',
        userId: 'user_student1',
        title: 'Assignment Graded',
        message: 'Your submission for AVL Tree Implementation received 94/100.',
        type: 'success',
        read: false,
        createdAt: now,
        link: '/s/courses/course_cs301',
      },
      {
        id: 'notif_2',
        userId: 'user_prof_rao',
        title: 'New Student Submission',
        message: 'Aarav Sharma submitted AVL Tree Implementation for review.',
        type: 'info',
        read: false,
        createdAt: now,
        link: '/p/courses/course_cs301',
      },
    ]
    seedNotifs.forEach((n) => this.notifications.set(n.id, n))
  }
}

export const db = new DatabaseStore()

