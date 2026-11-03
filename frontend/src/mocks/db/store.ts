/**
 * In-memory mock database persisted to localStorage (decision D15).
 * TODO(backend): replaced by MongoDB (ROADMAP Phase 1).
 */
import { createSeed, SEED_VERSION, type MockDb } from './seed'

const STORAGE_KEY = 'aicademy.mockdb'

let current: MockDb | null = null

function load(): MockDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb
      if (parsed.version === SEED_VERSION) return parsed
    }
  } catch {
    // Corrupt or unavailable storage: fall through to a fresh seed.
  }
  const seeded = createSeed()
  persist(seeded)
  return seeded
}

function persist(db: MockDb): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Storage full or blocked: keep working in memory.
  }
}

/** Current database (lazily loaded). */
export function getDb(): MockDb {
  if (!current) current = load()
  return current
}

/** Persist after any mutation. */
export function saveDb(): void {
  if (current) persist(current)
}

/** Restore the seed ("Reset demo data"). */
export function resetDb(): MockDb {
  current = createSeed()
  persist(current)
  return current
}

let idCounter = 0
/** Unique id with a readable prefix, e.g. newId('crs') → "crs_lq3k9a_1". */
export function newId(prefix: string): string {
  idCounter += 1
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}`
}
