/**
 * Mock database shape + seed data. TODO(backend): replaced by MongoDB models in ROADMAP Phase 1.
 * Seed is deterministic; dates are relative to the moment the seed is first created (decision D15).
 * Later milestones extend `createSeed()` with courses, materials, assignments, agent runs, etc.
 */
import type {
  Announcement,
  Assignment,
  ChatClearMarker,
  Comment,
  Course,
  Doubt,
  Leaderboard,
  Material,
  Notification,
  Submission,
  User,
} from '@/types/domain'
import type {
  AgentMemory,
  AgentPolicy,
  AgentRun,
  AgentStep,
  ApprovalRequest,
} from '@/types/agents'

/** Server-side user record. `passwordHash` never leaves the mock layer. */
export interface MockUserRecord extends User {
  /** TODO(backend): bcryptjs hash. The mock stores "mock$<password>" and is NOT secure. */
  passwordHash: string
}

export interface MockDb {
  version: number
  users: MockUserRecord[]
  courses: Course[]
  materials: Material[]
  assignments: Assignment[]
  submissions: Submission[]
  doubts: Doubt[]
  announcements: Announcement[]
  comments: Comment[]
  leaderboards: Leaderboard[]
  chatClearMarkers: ChatClearMarker[]
  notifications: Notification[]
  // EXTENSION (B4)
  agentRuns: AgentRun[]
  agentSteps: AgentStep[]
  approvals: ApprovalRequest[]
  memories: AgentMemory[]
  policies: AgentPolicy[]
}

/** Bump when the seed shape changes so browsers re-seed automatically. */
export const SEED_VERSION = 4

/** Demo-only password for every seeded account. Never a real credential. */
export const DEMO_PASSWORD = 'demo1234'

export function mockHash(password: string): string {
  return `mock$${password}`
}

export function daysFromNow(days: number, hour = 23, minute = 59): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

function user(
  id: string,
  name: string,
  email: string,
  role: User['role'],
  profile: User['profile'],
  createdDaysAgo: number,
): MockUserRecord {
  return {
    id,
    name,
    email,
    role,
    profile,
    createdAt: daysFromNow(-createdDaysAgo, 9, 0),
    passwordHash: mockHash(DEMO_PASSWORD),
  }
}

export function createSeed(): MockDb {
  const users: MockUserRecord[] = [
    user('u_admin', 'Ada Okafor', 'admin@aicademy.dev', 'administrator', { department: 'IT Services', avatarHue: 200 }, 400),
    user('u_prof_rao', 'Dr. Priya Rao', 'prof.rao@aicademy.dev', 'professor', { department: 'Computer Science', bio: 'Databases and data systems.', avatarHue: 280 }, 380),
    user('u_prof_chen', 'Dr. Wei Chen', 'prof.chen@aicademy.dev', 'professor', { department: 'Computer Science', bio: 'Algorithms and machine learning.', avatarHue: 160 }, 370),
    user('u_s1', 'Aarav Sharma', 'student1@aicademy.dev', 'student', { studentNumber: 'S2026-001', department: 'Computer Science', avatarHue: 25 }, 60),
    user('u_s2', 'Maya Lopez', 'student2@aicademy.dev', 'student', { studentNumber: 'S2026-002', department: 'Computer Science', avatarHue: 330 }, 60),
    user('u_s3', 'Kenji Tanaka', 'student3@aicademy.dev', 'student', { studentNumber: 'S2026-003', department: 'Computer Science', avatarHue: 210 }, 59),
    user('u_s4', 'Zara Ahmed', 'student4@aicademy.dev', 'student', { studentNumber: 'S2026-004', department: 'Data Science', avatarHue: 140 }, 58),
    user('u_s5', "Liam O'Brien", 'student5@aicademy.dev', 'student', { studentNumber: 'S2026-005', department: 'Computer Science', avatarHue: 45 }, 58),
    user('u_s6', 'Sofia Rossi', 'student6@aicademy.dev', 'student', { studentNumber: 'S2026-006', department: 'Data Science', avatarHue: 300 }, 57),
    user('u_s7', 'Noah Kim', 'student7@aicademy.dev', 'student', { studentNumber: 'S2026-007', department: 'Computer Science', avatarHue: 190 }, 57),
    user('u_s8', 'Fatima Bello', 'student8@aicademy.dev', 'student', { studentNumber: 'S2026-008', department: 'Mathematics', avatarHue: 95 }, 56),
  ]

  const courses: Course[] = [
    {
      id: 'crs_cs301',
      code: 'CS301',
      name: 'Database Systems',
      description: 'Relational data model, relational algebra, SQL query optimization, normal forms, B+ tree indexing, transaction management, concurrency control, and ACID isolation.',
      department: 'Computer Science',
      term: 'Fall 2026',
      enrollmentCode: 'DB301X',
      professorId: 'u_prof_rao',
      studentIds: ['u_s1', 'u_s2', 'u_s3', 'u_s4'],
      hue: 240,
      createdAt: daysFromNow(-50, 9, 0),
      leaderboardWeights: { assignments: 0.5, projects: 0.3, doubts: 0.2 },
    },
    {
      id: 'crs_cs220',
      code: 'CS220',
      name: 'Data Structures & Algorithms',
      description: 'Asymptotic analysis, balanced BSTs, graph algorithms (Dijkstra, Bellman-Ford, Kruskal), dynamic programming, divide-and-conquer, greedy heuristics, and amortized bounds.',
      department: 'Computer Science',
      term: 'Fall 2026',
      enrollmentCode: 'DSA220',
      professorId: 'u_prof_rao',
      studentIds: ['u_s1', 'u_s3', 'u_s5', 'u_s7', 'u_s8'],
      hue: 160,
      createdAt: daysFromNow(-52, 10, 0),
      leaderboardWeights: { assignments: 0.5, projects: 0.3, doubts: 0.2 },
    },
    {
      id: 'crs_ai410',
      code: 'AI410',
      name: 'Machine Learning & Autonomous Agents',
      description: 'Statistical learning theory, deep representations, self-attention and transformer architectures, reinforcement learning from human feedback, and autonomous multi-agent systems.',
      department: 'Computer Science',
      term: 'Fall 2026',
      enrollmentCode: 'ML410A',
      professorId: 'u_prof_chen',
      studentIds: ['u_s1', 'u_s2', 'u_s4', 'u_s5', 'u_s6', 'u_s7'],
      hue: 280,
      createdAt: daysFromNow(-48, 11, 0),
      leaderboardWeights: { assignments: 0.45, projects: 0.35, doubts: 0.2 },
    },
  ]

  const materials: Material[] = [
    // CS301 Materials
    {
      id: 'mat_cs301_01',
      courseId: 'crs_cs301',
      title: 'Lecture 1: Relational Model & Algebra',
      description: 'Mathematical foundations of relational calculus, projection, selection, cartesian product, joins, and relational completeness.',
      type: 'pdf',
      fileName: 'CS301_Lec01_Relational_Algebra.pdf',
      fileSize: 2_450_000,
      mimeType: 'application/pdf',
      fileUrl: '/mock-files/CS301_Lec01_Relational_Algebra.pdf',
      uploadedBy: 'u_prof_rao',
      createdAt: daysFromNow(-45, 14, 0),
      updatedAt: daysFromNow(-45, 14, 0),
      indexing: {
        status: 'indexed',
        chunkCount: 38,
        topics: ['Relational Algebra', 'Tuple Calculus', 'Set Operations'],
        lastIndexedAt: daysFromNow(-45, 14, 5),
      },
    },
    {
      id: 'mat_cs301_02',
      courseId: 'crs_cs301',
      title: 'Lecture 2: SQL Query Execution & Indexing',
      description: 'B+ Tree internal structure, node splits, index clustering, cost estimation, and sequential scan vs index scan trade-offs.',
      type: 'pdf',
      fileName: 'CS301_Lec02_BTree_Indexing.pdf',
      fileSize: 3_120_000,
      mimeType: 'application/pdf',
      fileUrl: '/mock-files/CS301_Lec02_BTree_Indexing.pdf',
      uploadedBy: 'u_prof_rao',
      createdAt: daysFromNow(-38, 16, 0),
      updatedAt: daysFromNow(-38, 16, 0),
      indexing: {
        status: 'indexed',
        chunkCount: 46,
        topics: ['B+ Trees', 'Clustered Indexes', 'Cost Models'],
        lastIndexedAt: daysFromNow(-38, 16, 8),
      },
    },
    {
      id: 'mat_cs301_03',
      courseId: 'crs_cs301',
      title: 'Lecture 3: Normalization & Functional Dependencies',
      description: '1NF, 2NF, 3NF, BCNF decomposition algorithms, lossless-join decomposition, and dependency preservation proofs.',
      type: 'slides',
      fileName: 'CS301_Lec03_Normalization.pptx',
      fileSize: 4_850_000,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileUrl: '/mock-files/CS301_Lec03_Normalization.pptx',
      uploadedBy: 'u_prof_rao',
      createdAt: daysFromNow(-30, 11, 0),
      updatedAt: daysFromNow(-30, 11, 0),
      indexing: {
        status: 'indexed',
        chunkCount: 52,
        topics: ['BCNF', '3NF', 'Functional Dependencies', 'Armstrong Axioms'],
        lastIndexedAt: daysFromNow(-30, 11, 10),
      },
    },
    {
      id: 'mat_cs301_04',
      courseId: 'crs_cs301',
      title: 'Lecture 4: Transactions, Concurrency & 2PL',
      description: 'Conflict serializability, precedence graphs, Strict Two-Phase Locking, deadlock detection algorithms, and recovery protocols.',
      type: 'document',
      fileName: 'CS301_Lec04_Transactions_ACID.docx',
      fileSize: 1_280_000,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileUrl: '/mock-files/CS301_Lec04_Transactions_ACID.docx',
      uploadedBy: 'u_prof_rao',
      createdAt: daysFromNow(-20, 10, 0),
      updatedAt: daysFromNow(-20, 10, 0),
      indexing: {
        status: 'indexed',
        chunkCount: 29,
        topics: ['2PL', 'Conflict Serializability', 'WAL Protocol', 'ACID'],
        lastIndexedAt: daysFromNow(-20, 10, 5),
      },
    },

    // CS220 Materials
    {
      id: 'mat_cs220_01',
      courseId: 'crs_cs220',
      title: 'Lecture 1: Asymptotic Analysis & Master Theorem',
      description: 'Big-O, Omega, Theta notations, recurrence relations, Master Method, and recursion tree visual proofs.',
      type: 'pdf',
      fileName: 'CS220_Lec01_Asymptotic_Analysis.pdf',
      fileSize: 1_850_000,
      mimeType: 'application/pdf',
      fileUrl: '/mock-files/CS220_Lec01_Asymptotic_Analysis.pdf',
      uploadedBy: 'u_prof_rao',
      createdAt: daysFromNow(-48, 15, 0),
      updatedAt: daysFromNow(-48, 15, 0),
      indexing: {
        status: 'indexed',
        chunkCount: 32,
        topics: ['Master Theorem', 'Recurrence Trees', 'Big-O'],
        lastIndexedAt: daysFromNow(-48, 15, 6),
      },
    },
    {
      id: 'mat_cs220_02',
      courseId: 'crs_cs220',
      title: 'Lecture 2: Graph Algorithms & Shortest Paths',
      description: 'Breadth-first search, depth-first search, Dijkstra with binary heaps, Bellman-Ford, and negative cycle detection.',
      type: 'pdf',
      fileName: 'CS220_Lec02_Graph_Algorithms.pdf',
      fileSize: 3_400_000,
      mimeType: 'application/pdf',
      fileUrl: '/mock-files/CS220_Lec02_Graph_Algorithms.pdf',
      uploadedBy: 'u_prof_rao',
      createdAt: daysFromNow(-35, 12, 0),
      updatedAt: daysFromNow(-35, 12, 0),
      indexing: {
        status: 'indexed',
        chunkCount: 44,
        topics: ['Dijkstra', 'Shortest Paths', 'Priority Queues'],
        lastIndexedAt: daysFromNow(-35, 12, 7),
      },
    },
    {
      id: 'mat_cs220_03',
      courseId: 'crs_cs220',
      title: 'Lecture 3: Dynamic Programming Fundamentals',
      description: 'Optimal substructure, overlapping subproblems, memoization vs bottom-up tabulation, 0/1 Knapsack, and Edit Distance.',
      type: 'notes',
      fileName: 'CS220_Lec03_Dynamic_Programming.md',
      fileSize: 420_000,
      mimeType: 'text/markdown',
      fileUrl: '/mock-files/CS220_Lec03_Dynamic_Programming.md',
      uploadedBy: 'u_prof_rao',
      createdAt: daysFromNow(-25, 9, 0),
      updatedAt: daysFromNow(-25, 9, 0),
      indexing: {
        status: 'indexed',
        chunkCount: 22,
        topics: ['Dynamic Programming', 'Memoization', 'Knapsack'],
        lastIndexedAt: daysFromNow(-25, 9, 4),
      },
    },

    // AI410 Materials
    {
      id: 'mat_ai410_01',
      courseId: 'crs_ai410',
      title: 'Lecture 1: Foundations of Statistical Learning',
      description: 'Bias-variance decomposition, empirical risk minimization, gradient descent variants, and regularized loss landscapes.',
      type: 'pdf',
      fileName: 'AI410_Lec01_Statistical_Learning.pdf',
      fileSize: 2_950_000,
      mimeType: 'application/pdf',
      fileUrl: '/mock-files/AI410_Lec01_Statistical_Learning.pdf',
      uploadedBy: 'u_prof_chen',
      createdAt: daysFromNow(-42, 11, 0),
      updatedAt: daysFromNow(-42, 11, 0),
      indexing: {
        status: 'indexed',
        chunkCount: 41,
        topics: ['Loss Functions', 'Bias-Variance', 'Gradient Descent'],
        lastIndexedAt: daysFromNow(-42, 11, 8),
      },
    },
    {
      id: 'mat_ai410_02',
      courseId: 'crs_ai410',
      title: 'Lecture 2: Transformer Architectures & Self-Attention',
      description: 'Scaled dot-product attention, multi-head projections, positional encodings, decoder-only causal masking, and flash attention.',
      type: 'pdf',
      fileName: 'AI410_Lec02_Transformers.pdf',
      fileSize: 5_200_000,
      mimeType: 'application/pdf',
      fileUrl: '/mock-files/AI410_Lec02_Transformers.pdf',
      uploadedBy: 'u_prof_chen',
      createdAt: daysFromNow(-32, 14, 0),
      updatedAt: daysFromNow(-32, 14, 0),
      indexing: {
        status: 'indexed',
        chunkCount: 65,
        topics: ['Self-Attention', 'Transformers', 'Positional Encoding', 'KV Cache'],
        lastIndexedAt: daysFromNow(-32, 14, 12),
      },
    },
    {
      id: 'mat_ai410_03',
      courseId: 'crs_ai410',
      title: 'Lecture 3: Autonomous Agent Architectures & Tool Use',
      description: 'ReAct pattern, plan-and-solve loops, reflective evaluation, tool schema bindings, vector retrieval augmentations, and safety guardrails.',
      type: 'slides',
      fileName: 'AI410_Lec03_Agentic_AI.pptx',
      fileSize: 6_450_000,
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      fileUrl: '/mock-files/AI410_Lec03_Agentic_AI.pptx',
      uploadedBy: 'u_prof_chen',
      createdAt: daysFromNow(-18, 17, 0),
      updatedAt: daysFromNow(-18, 17, 0),
      indexing: {
        status: 'indexed',
        chunkCount: 58,
        topics: ['ReAct Loop', 'Tool Calling', 'Vector RAG', 'Human-in-the-Loop'],
        lastIndexedAt: daysFromNow(-18, 17, 9),
      },
    },
  ]

  const defaultEnabledAgents = {
    orchestrator: true,
    ingestion: true,
    tutor: true,
    question_quality: true,
    grader: true,
    insights: true,
    study_coach: true,
  }

  const policies: AgentPolicy[] = courses.map((c) => ({
    courseId: c.id,
    enabledAgents: { ...defaultEnabledAgents },
    autoPublish: false,
    confidenceThreshold: 0.75,
    dailyTokenBudget: 500000,
    tokensUsedToday: 42350,
    updatedAt: daysFromNow(-10, 10, 0),
    updatedBy: c.professorId,
  }))

  const assignments: Assignment[] = [
    {
      id: 'asg_cs301_01',
      courseId: 'crs_cs301',
      title: 'Assignment 1: Relational Normalization & SQL Tuning',
      description: 'Decompose relation schemas into Boyce-Codd Normal Form and optimize nested correlated subqueries using indexing strategies.',
      maxMarks: 100,
      classification: 'assignment',
      dueDate: daysFromNow(5, 23, 59),
      createdBy: 'u_prof_rao',
      createdAt: daysFromNow(-14, 10, 0),
      updatedAt: daysFromNow(-14, 10, 0),
      topics: ['Normalization', 'BCNF', 'Query Plans', 'B-Tree Indexes'],
      rubric: [
        {
          id: 'crit_norm',
          title: 'Relational Schema Formulation & BCNF Proof',
          description: 'Identify functional dependencies, compute minimal cover, and prove lossless BCNF decomposition.',
          maxMarks: 40,
        },
        {
          id: 'crit_perf',
          title: 'Query Plan Optimization & Index Strategy',
          description: 'Analyze EXPLAIN plan output, identify full-table scans, and create appropriate composite indexes.',
          maxMarks: 40,
        },
        {
          id: 'crit_code',
          title: 'Documentation & Code Quality',
          description: 'Provide clear analytical reasoning and well-formatted SQL scripts with edge case analysis.',
          maxMarks: 20,
        },
      ],
    },
    {
      id: 'asg_cs301_02',
      courseId: 'crs_cs301',
      title: 'Term Project: Storage Engine & Buffer Pool Manager',
      description: 'Implement a disk-backed page-oriented storage manager with LRU-K buffer replacement and write-ahead logging (WAL).',
      maxMarks: 100,
      classification: 'project',
      dueDate: daysFromNow(26, 23, 59),
      createdBy: 'u_prof_rao',
      createdAt: daysFromNow(-10, 9, 0),
      updatedAt: daysFromNow(-10, 9, 0),
      topics: ['Buffer Pool', 'LRU-K', 'Page Layout', 'WAL'],
      rubric: [
        {
          id: 'crit_buf',
          title: 'Buffer Pool Eviction & Page Management',
          description: 'Correct thread-safe pinning/unpinning of frame pages and LRU-K timestamp replacement.',
          maxMarks: 50,
        },
        {
          id: 'crit_crash',
          title: 'Crash Recovery & WAL Logging',
          description: 'Ensure ACID durability by verifying log record sequence numbers before disk flush.',
          maxMarks: 50,
        },
      ],
    },
    {
      id: 'asg_cs220_01',
      courseId: 'crs_cs220',
      title: 'Assignment 1: Shortest Paths on Dynamic Flow Networks',
      description: 'Implement Dijkstra with Fibonacci heaps and verify performance on large-scale sparse graphs.',
      maxMarks: 100,
      classification: 'assignment',
      dueDate: daysFromNow(3, 23, 59),
      createdBy: 'u_prof_rao',
      createdAt: daysFromNow(-12, 11, 0),
      updatedAt: daysFromNow(-12, 11, 0),
      topics: ['Dijkstra', 'Fibonacci Heap', 'Shortest Paths'],
      rubric: [
        {
          id: 'crit_g1',
          title: 'Algorithm Correctness & Complexity',
          description: 'Strict O(E + V log V) time complexity bound on directed weighted graphs.',
          maxMarks: 60,
        },
        {
          id: 'crit_g2',
          title: 'Empirical Profiling & Benchmarks',
          description: 'Benchmarking on 100k-vertex graphs with memory profiling analysis.',
          maxMarks: 40,
        },
      ],
    },
    {
      id: 'asg_ai410_01',
      courseId: 'crs_ai410',
      title: 'Project 1: Causal Decoder-Only Transformer Architecture',
      description: 'Construct a GPT-style autoregressive language model from tensor primitives, implementing scaled multi-head dot product attention.',
      maxMarks: 100,
      classification: 'project',
      dueDate: daysFromNow(18, 23, 59),
      createdBy: 'u_prof_chen',
      createdAt: daysFromNow(-15, 14, 0),
      updatedAt: daysFromNow(-15, 14, 0),
      topics: ['Self-Attention', 'Causal Masking', 'Rotary Positional Embedding'],
      rubric: [
        {
          id: 'crit_t1',
          title: 'Attention Mechanism & Tensor Parallelism',
          description: 'Numerical stability in softmax scaling and efficient causal triangular masking.',
          maxMarks: 60,
        },
        {
          id: 'crit_t2',
          title: 'Training Convergence & Perplexity',
          description: 'Cross-entropy loss convergence on TinyStories dataset with learning rate warm-up.',
          maxMarks: 40,
        },
      ],
    },
  ]

  const submissions: Submission[] = [
    {
      id: 'sub_cs301_01',
      assignmentId: 'asg_cs301_01',
      courseId: 'crs_cs301',
      studentId: 'u_s1',
      fileUrl: '/mock-files/Aarav_Sharma_CS301_Asg1.pdf',
      fileName: 'Aarav_Sharma_CS301_Asg1.pdf',
      fileSize: 1_250_000,
      submittedAt: daysFromNow(-2, 14, 30),
      late: false,
      version: 1,
      extractionStatus: 'extracted',
      evaluationStatus: 'graded',
      marks: 94,
      feedback: 'Excellent BCNF derivation and thorough query plan analysis.',
      mistakes: ['Did not discuss worst-case time complexity of hash collisions in join algorithms.'],
      suggestions: ['Consider benchmarking partitioned B+ trees on SSD random read patterns.'],
      confidence: {
        score: 0.96,
        level: 'high',
        reasons: ['Complete mathematical rigor in BCNF proof', 'Optimal indexing strategy verified'],
      },
      aiEvaluation: {
        runId: 'run_seed_grader_1',
        criteria: [
          { criterionId: 'crit_norm', marks: 38, maxMarks: 40, feedback: 'Flawless BCNF decomposition.' },
          { criterionId: 'crit_perf', marks: 38, maxMarks: 40, feedback: 'Accurate EXPLAIN plan breakdown.' },
          { criterionId: 'crit_code', marks: 18, maxMarks: 20, feedback: 'Clean SQL script with inline documentation.' },
        ],
        totalMarks: 94,
        feedback: 'Exceptional work displaying deep grasp of query optimization.',
        mistakes: ['Did not discuss worst-case time complexity of hash collisions in join algorithms.'],
        suggestions: ['Consider benchmarking partitioned B+ trees on SSD random read patterns.'],
        confidence: { score: 0.96, level: 'high', reasons: ['High rubric alignment'] },
        flags: [],
        createdAt: daysFromNow(-2, 14, 32),
      },
      gradedBy: 'u_prof_rao',
      gradedAt: daysFromNow(-1, 11, 0),
    },
    {
      id: 'sub_cs301_02',
      assignmentId: 'asg_cs301_01',
      courseId: 'crs_cs301',
      studentId: 'u_s2',
      fileUrl: '/mock-files/Maya_Lopez_CS301_Asg1.pdf',
      fileName: 'Maya_Lopez_CS301_Asg1.pdf',
      fileSize: 980_000,
      submittedAt: daysFromNow(-1, 16, 15),
      late: false,
      version: 1,
      extractionStatus: 'extracted',
      evaluationStatus: 'awaiting_review',
      marks: null,
      feedback: null,
      mistakes: ['Missing functional dependency preservation proof for Relation R3.'],
      suggestions: ['Review minimal cover algorithm in Lecture 2 slide 14.'],
      confidence: {
        score: 0.78,
        level: 'medium',
        reasons: ['Borderline score on Criterion 1 normalization proof'],
      },
      aiEvaluation: {
        runId: 'run_seed_grader_2',
        criteria: [
          { criterionId: 'crit_norm', marks: 32, maxMarks: 40, feedback: 'Good start on BCNF but missed dependency preservation.' },
          { criterionId: 'crit_perf', marks: 36, maxMarks: 40, feedback: 'Index analysis is accurate.' },
          { criterionId: 'crit_code', marks: 17, maxMarks: 20, feedback: 'Clean presentation.' },
        ],
        totalMarks: 85,
        feedback: 'Provisional evaluation: Solid submission with minor mathematical gaps in decomposition proof.',
        mistakes: ['Missing functional dependency preservation proof for Relation R3.'],
        suggestions: ['Review minimal cover algorithm in Lecture 2 slide 14.'],
        confidence: { score: 0.78, level: 'medium', reasons: ['Borderline criterion 1 proof'] },
        flags: [],
        createdAt: daysFromNow(-1, 16, 17),
      },
    },
  ]

  return {
    version: SEED_VERSION,
    users,
    courses,
    materials,
    assignments,
    submissions,
    doubts: [],
    announcements: [],
    comments: [],
    leaderboards: [],
    chatClearMarkers: [],
    notifications: [],
    agentRuns: [],
    agentSteps: [],
    approvals: [],
    memories: [],
    policies,
  }
}

