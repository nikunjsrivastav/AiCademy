import { describe, it, expect } from 'vitest'
import { app } from '../src/app.js'
import http from 'node:http'

function request(method: string, path: string, body?: any, token?: string): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app)
    const options: http.RequestOptions = {
      method,
      path,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }

    server.listen(0, () => {
      const addr = server.address() as any
      const port = addr.port

      const req = http.request(`http://localhost:${port}${path}`, options, (res) => {
        let raw = ''
        res.on('data', (chunk) => (raw += chunk))
        res.on('end', () => {
          server.close()
          let parsed: any = null
          try {
            parsed = JSON.parse(raw)
          } catch {
            parsed = raw
          }
          resolve({ status: res.statusCode || 500, body: parsed })
        })
      })

      req.on('error', (err) => {
        server.close()
        reject(err)
      })

      if (body) {
        req.write(JSON.stringify(body))
      }
      req.end()
    })
  })
}

describe('AiCademy Backend Express API Integration (Clean Unseeded MongoDB)', () => {
  let studentToken: string
  let profToken: string
  let courseId: string
  let enrollmentCode: string

  it('responds with 200 on /health', async () => {
    const res = await request('GET', '/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('registers a new professor account via /api/auth/register', async () => {
    const res = await request('POST', '/api/auth/register', {
      name: 'Dr. Priya Rao',
      email: 'prof.test@university.edu',
      password: 'password123',
      role: 'professor',
      department: 'Computer Science',
    })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.role).toBe('professor')
    profToken = res.body.token
  })

  it('registers a new student account via /api/auth/register', async () => {
    const res = await request('POST', '/api/auth/register', {
      name: 'Aarav Sharma',
      email: 'student.test@university.edu',
      password: 'password123',
      role: 'student',
      department: 'Computer Science',
      studentNumber: 'CS2026-001',
    })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.role).toBe('student')
    studentToken = res.body.token
  })

  it('authenticates registered student via /api/auth/login', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'student.test@university.edu',
      password: 'password123',
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('student.test@university.edu')
  })

  it('allows professor to create a course via /api/courses', async () => {
    const res = await request(
      'POST',
      '/api/courses',
      {
        code: 'CS301',
        name: 'Data Structures & Algorithms',
        description: 'Advanced data structures and algorithms.',
      },
      profToken
    )
    expect(res.status).toBe(201)
    expect(res.body.code).toBe('CS301')
    expect(res.body.enrollmentCode).toBeDefined()
    courseId = res.body.id
    enrollmentCode = res.body.enrollmentCode
  })

  it('allows student to enroll in course with enrollment code', async () => {
    const res = await request(
      'POST',
      `/api/courses/${courseId}/enroll`,
      { enrollmentCode },
      studentToken
    )
    expect(res.status).toBe(200)
    expect(res.body.isEnrolled).toBe(true)
  })

  it('handles RAG doubt inquiry with citations via /api/doubts/ask', async () => {
    const res = await request(
      'POST',
      '/api/doubts/ask',
      {
        courseId,
        question: 'What is the balance factor in AVL trees?',
      },
      studentToken
    )
    expect(res.status).toBe(201)
    expect(res.body.answer).toBeDefined()
    expect(res.body.quality.score).toBeGreaterThan(40)
  })

  it('allows professor to create an assignment with rubric via /api/assignments', async () => {
    const res = await request(
      'POST',
      '/api/assignments',
      {
        courseId,
        title: 'Assignment 1: AVL Trees',
        description: 'Implement AVL insertion and rotations.',
        classification: 'assignment',
        rubricCriteria: [
          { id: 'crit_correct', name: 'Correctness', weight: 50, maxScore: 50 },
          { id: 'crit_perf', name: 'Complexity', weight: 50, maxScore: 50 },
        ],
        maxMarks: 100,
        dueDate: new Date(Date.now() + 864000000).toISOString(),
      },
      profToken
    )
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Assignment 1: AVL Trees')
    const assignmentId = res.body.id

    // Test 1: Flawed submission
    const flawedRes = await request(
      'POST',
      `/api/submissions/${assignmentId}/upload`,
      {
        fileName: 'flawed_tree_solution.txt',
        submissionContent: 'class Node: pass\n# SyntaxError: incomplete implementation\n# TODO: fix broken recursion\ndef insert(): return null\n# RuntimeError: max recursion depth exceeded',
      },
      studentToken
    )
    expect(flawedRes.status).toBe(201)
    expect(flawedRes.body.marks).toBeLessThanOrEqual(55)
    expect(flawedRes.body.mistakes.length).toBeGreaterThan(0)

    // Test 2: Fine working submission
    const workingRes = await request(
      'POST',
      `/api/submissions/${assignmentId}/upload`,
      {
        fileName: 'verified_avl_tree.py',
        submissionContent: `"""
Complete AVL Tree Implementation with Balance Factor Invariants
Guarantees O(log N) insertion, deletion, and search bounds.
"""
class AVLNode:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None
        self.height = 1

class AVLTree:
    def get_height(self, node):
        return node.height if node else 0

    def get_balance(self, node):
        return self.get_height(node.left) - self.get_height(node.right) if node else 0

    def rotate_right(self, y):
        x = y.left
        T2 = x.right
        x.right = y
        y.left = T2
        y.height = 1 + max(self.get_height(y.left), self.get_height(y.right))
        x.height = 1 + max(self.get_height(x.left), self.get_height(x.right))
        return x

    def rotate_left(self, x):
        y = x.right
        T2 = y.left
        y.left = x
        x.right = T2
        x.height = 1 + max(self.get_height(x.left), self.get_height(x.right))
        y.height = 1 + max(self.get_height(y.left), self.get_height(y.right))
        return y

    def insert(self, root, key):
        if not root:
            return AVLNode(key)
        if key < root.key:
            root.left = self.insert(root.left, key)
        elif key > root.key:
            root.right = self.insert(root.right, key)
        else:
            return root

        root.height = 1 + max(self.get_height(root.left), self.get_height(root.right))
        balance = self.get_balance(root)

        # Left Left Case
        if balance > 1 and key < root.left.key:
            return self.rotate_right(root)
        # Right Right Case
        if balance < -1 and key > root.right.key:
            return self.rotate_left(root)
        # Left Right Case
        if balance > 1 and key > root.left.key:
            root.left = self.rotate_left(root.left)
            return self.rotate_right(root)
        # Right Left Case
        if balance < -1 and key < root.right.key:
            root.right = self.rotate_right(root.right)
            return self.rotate_left(root)
        return root
`,
      },
      studentToken
    )
    expect(workingRes.status).toBe(201)
    expect(workingRes.body.marks).toBeGreaterThanOrEqual(85)
    expect(workingRes.body.marks).toBeGreaterThan(flawedRes.body.marks)
  })

  it('extracts text and topics from text and document buffers via extractionService', async () => {
    const { extractTextFromBuffer, extractKeyTopics } = await import('../src/services/extractionService.js')
    const sampleBuffer = Buffer.from(
      '# Advanced Graph Neural Networks\nGraph convolution operations leverage spatial neighborhood aggregation to compute node embeddings with O(V + E) runtime complexity.'
    )
    const extracted = await extractTextFromBuffer(sampleBuffer, 'graph_neural_networks.txt', 'text/plain')
    expect(extracted.text).toContain('Graph convolution')
    expect(extracted.wordCount).toBeGreaterThan(10)
    expect(extracted.topics.length).toBeGreaterThan(0)
  })
})
