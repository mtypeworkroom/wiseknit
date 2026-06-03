import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Session } from '../types'

interface ProjectStore {
  projects: Project[]
  sessions: Session[]
  activeProjectId: string | null
  setActiveProject: (id: string) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  advanceRow: (id: string) => void
  addSession: (session: Session) => void
}

// Mock data to get us started
const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'Cabled Aran Pullover',
    status: 'active',
    category: 'Sweater / Jumper',
    currentRow: 14,
    totalRows: 40,
    startedAt: '2026-05-12',
    lastSessionAt: '2026-05-23',
    createdAt: '2026-05-12',
    updatedAt: '2026-05-23',
    needle: { sizeMm: 4, type: 'circular-fixed', cableLength: 80 },
  },
  {
    id: 'proj-2',
    name: 'Stranded Mittens — Nordic',
    status: 'active',
    category: 'Mittens / Gloves',
    currentRow: 38,
    totalRows: 64,
    startedAt: '2026-04-20',
    lastSessionAt: '2026-05-19',
    createdAt: '2026-04-20',
    updatedAt: '2026-05-19',
    needle: { sizeMm: 2.5, type: 'dpn' },
  },
  {
    id: 'proj-3',
    name: 'Brioche Cowl',
    status: 'waiting',
    category: 'Cowl / Scarf',
    currentRow: 0,
    totalRows: 28,
    createdAt: '2026-05-01',
    updatedAt: '2026-05-01',
    needle: { sizeMm: 4, type: 'circular-fixed', cableLength: 40 },
  },
]

const MOCK_SESSIONS: Session[] = [
  {
    id: 'sess-1',
    projectId: 'proj-1',
    startRow: 10,
    endRow: 14,
    rowsCompleted: 5,
    durationMinutes: 80,
    date: '2026-05-23',
  },
  {
    id: 'sess-2',
    projectId: 'proj-1',
    startRow: 5,
    endRow: 9,
    rowsCompleted: 5,
    durationMinutes: 95,
    date: '2026-05-19',
  },
  {
    id: 'sess-3',
    projectId: 'proj-2',
    startRow: 28,
    endRow: 38,
    rowsCompleted: 10,
    durationMinutes: 150,
    date: '2026-05-19',
  },
]

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: MOCK_PROJECTS,
      sessions: MOCK_SESSIONS,
      activeProjectId: 'proj-1',

      setActiveProject: (id) => set({ activeProjectId: id }),

      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),

      updateProject: (id, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
        })),

      advanceRow: (id) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id && p.currentRow < p.totalRows
              ? { ...p, currentRow: p.currentRow + 1, updatedAt: new Date().toISOString() }
              : p
          ),
        })),

      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),
    }),
    {
      name: 'wiseknit-projects',
    }
  )
)

// Selectors
export const selectActiveProjects = (projects: Project[]) =>
  projects.filter((p) => p.status === 'active' || p.status === 'waiting')

export const selectProgressPct = (project: Project) =>
  project.totalRows > 0
    ? Math.round((project.currentRow / project.totalRows) * 100)
    : 0

export const selectLastSessionLabel = (project: Project): string => {
  if (!project.lastSessionAt) return '—'
  const days = Math.floor(
    (Date.now() - new Date(project.lastSessionAt).getTime()) / (1000 * 60 * 60 * 24)
  )
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}
