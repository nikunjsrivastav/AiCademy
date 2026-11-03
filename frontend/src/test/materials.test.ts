import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from '@/mocks/handlers'
import * as authService from '@/services/auth'
import * as materialService from '@/services/materials'
import { tokenStorage } from '@/services/tokenStorage'
import { DEMO_PASSWORD } from '@/mocks/db/seed'

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  server.resetHandlers()
  tokenStorage.clear()
})
afterAll(() => server.close())

describe('Materials Service with MSW', () => {
  it('lists materials for an enrolled course with vector-indexing metadata', async () => {
    const loginRes = await authService.login({
      email: 'student1@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    const materials = await materialService.listCourseMaterials('crs_cs301')
    expect(materials.length).toBeGreaterThanOrEqual(4)

    const first = materials.find((m) => m.id === 'mat_cs301_01')
    expect(first).toBeDefined()
    expect(first?.title).toContain('Relational Model')
    expect(first?.indexing.status).toBe('indexed')
    expect(first?.indexing.chunkCount).toBe(38)
    expect(first?.indexing.topics).toContain('Relational Algebra')
  })

  it('allows a professor to upload new course material with validation and auto-indexing', async () => {
    const loginRes = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    const newMaterial = await materialService.uploadMaterial({
      courseId: 'crs_cs301',
      title: 'Lecture 5: Query Optimization and Statistics',
      description: 'System-R style cost estimation, selinger optimization, and cardinality histograms.',
      file: {
        name: 'CS301_Lec05_Optimization.pdf',
        size: 3_200_000,
        type: 'application/pdf',
      },
    })

    expect(newMaterial.id).toBeDefined()
    expect(newMaterial.courseId).toBe('crs_cs301')
    expect(newMaterial.type).toBe('pdf')
    expect(newMaterial.indexing.status).toBe('indexed')
    expect(newMaterial.indexing.chunkCount).toBeGreaterThan(10)
  })

  it('rejects uploads with unsupported file formats', async () => {
    const loginRes = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    await expect(
      materialService.uploadMaterial({
        courseId: 'crs_cs301',
        title: 'Dangerous Script',
        file: {
          name: 'malicious.exe',
          size: 10_000,
          type: 'application/x-msdownload',
        },
      }),
    ).rejects.toThrow('is not supported')
  })

  it('re-indexes course material via the Ingestion Agent trigger', async () => {
    const loginRes = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    const res = await materialService.reindexMaterial('mat_cs301_01')
    expect(res.message).toContain('Vector index successfully refreshed')
    expect(res.material.indexing.status).toBe('indexed')
  })

  it('deletes course material when requested by the owning professor', async () => {
    const loginRes = await authService.login({
      email: 'prof.rao@aicademy.dev',
      password: DEMO_PASSWORD,
    })
    tokenStorage.set(loginRes.token)

    const delRes = await materialService.deleteMaterial('mat_cs301_04')
    expect(delRes.success).toBe(true)

    const list = await materialService.listCourseMaterials('crs_cs301')
    expect(list.some((m) => m.id === 'mat_cs301_04')).toBe(false)
  })
})
