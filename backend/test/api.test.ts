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

describe('AiCademy Backend Express API Integration', () => {
  let studentToken: string
  let profToken: string

  it('responds with 200 on /health', async () => {
    const res = await request('GET', '/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('authenticates seeded student via /api/auth/login', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'student1@aicademy.dev',
      password: 'demo1234',
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.role).toBe('student')
    studentToken = res.body.token
  })

  it('authenticates seeded professor via /api/auth/login', async () => {
    const res = await request('POST', '/api/auth/login', {
      email: 'prof.rao@aicademy.dev',
      password: 'demo1234',
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.role).toBe('professor')
    profToken = res.body.token
  })

  it('retrieves user profile via /api/auth/me', async () => {
    const res = await request('GET', '/api/auth/me', undefined, studentToken)
    expect(res.status).toBe(200)
    expect(res.body.user.email).toBe('student1@aicademy.dev')
  })

  it('lists courses enrolled by student via /api/courses', async () => {
    const res = await request('GET', '/api/courses', undefined, studentToken)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body)).toBe(true)
    expect(res.body.length).toBeGreaterThan(0)
    expect(res.body[0].code).toBe('CS301')
  })

  it('handles RAG doubt inquiry with grounded citations via /api/doubts/ask', async () => {
    const res = await request(
      'POST',
      '/api/doubts/ask',
      {
        courseId: 'course_cs301',
        question: 'What is the balance factor invariant in AVL trees?',
      },
      studentToken
    )
    expect(res.status).toBe(201)
    expect(res.body.answer).toContain('AVL')
    expect(res.body.quality.score).toBeGreaterThan(50)
  })

  it('allows professor to create an assignment with rubric via /api/assignments', async () => {
    const res = await request(
      'POST',
      '/api/assignments',
      {
        courseId: 'course_cs301',
        title: 'Assignment 2: Red-Black Tree Balancing',
        description: 'Implement insertion and recoloring for Red-Black trees.',
        classification: 'assignment',
        rubricCriteria: [
          { id: 'crit_recolor', name: 'Recoloring Invariant', weight: 50, maxScore: 50 },
          { id: 'crit_rotation', name: 'Rotations', weight: 50, maxScore: 50 },
        ],
        maxMarks: 100,
        dueDate: new Date(Date.now() + 864000000).toISOString(),
      },
      profToken
    )
    expect(res.status).toBe(201)
    expect(res.body.title).toBe('Assignment 2: Red-Black Tree Balancing')
  })
})

