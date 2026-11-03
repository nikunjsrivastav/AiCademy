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
  })
})
