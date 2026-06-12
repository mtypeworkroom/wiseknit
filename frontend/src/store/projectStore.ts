import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, Session, FreeCounter } from '../types'
import { PLEIONE_PATTERN } from '../data/pleione'

interface ProjectStore {
  projects: Project[]
  sessions: Session[]
  activeProjectId: string | null
  setActiveProject: (id: string) => void
  addProject: (project: Project) => void
  updateProject: (id: string, updates: Partial<Project>) => void
  advanceRow: (id: string) => void
  addSession: (session: Session) => void
  deleteProject: (id: string) => void
  addCounter: (projectId: string, counter: Omit<FreeCounter, 'id' | 'value'>) => void
  deleteCounter: (projectId: string, counterId: string) => void
  stepCounter: (projectId: string, counterId: string, delta: 1 | -1) => void
}

const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-pleione',
    name: 'Pleione Tee',
    status: 'active',
    category: 'Sweater / Jumper',
    patternId: PLEIONE_PATTERN.id,
    currentRow: 1,
    totalRows: PLEIONE_PATTERN.totalRows,
    totalRowsWorked: 0,
    chartRepeatStartRow: 1,
    startedAt: '2026-05-12',
    lastSessionAt: '2026-05-23',
    createdAt: '2026-05-12',
    updatedAt: '2026-05-23',
    needle: { sizeMm: 3.75, type: 'circular-fixed', cableLength: 80 },
    yarn: {
      brand: 'Meadow Yarn',
      name: 'Windle Fingering',
      weight: 'fingering',
      colorway: 'Against the Stream of Time',
    },
  },
]

const MOCK_SESSIONS: Session[] = []

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      projects: MOCK_PROJECTS,
      sessions: MOCK_SESSIONS,
      activeProjectId: 'proj-pleione',

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
          projects: state.projects.map((p) => {
            if (p.id !== id) return p
            const chartRows = p.totalRows
            const repeatStart = p.chartRepeatStartRow ?? 1
            const isAtEnd = p.currentRow >= chartRows
            const nextRow = isAtEnd ? repeatStart : p.currentRow + 1
            const newTotalRowsWorked = (p.totalRowsWorked ?? 0) + 1
            const updatedCounters = (p.freeCounters ?? []).map(c => {
              if (!c.triggerEvery || c.triggerEvery < 1) return c
              if (newTotalRowsWorked % c.triggerEvery !== 0) return c
              const delta = c.countDown ? -1 : 1
              let newValue = c.value + delta
              if (c.resetAt !== undefined && c.resetAt > 0) {
                if (c.countDown && newValue <= 0) newValue = c.resetAt
                else if (!c.countDown && newValue >= c.resetAt) newValue = 0
              } else {
                newValue = Math.max(0, newValue)
              }
              return { ...c, value: newValue }
            })
            return {
              ...p,
              currentRow: nextRow,
              totalRowsWorked: newTotalRowsWorked,
              freeCounters: updatedCounters.length ? updatedCounters : p.freeCounters,
              updatedAt: new Date().toISOString(),
            }
          }),
        })),

      addSession: (session) =>
        set((state) => ({ sessions: [...state.sessions, session] })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          sessions: state.sessions.filter((s) => s.projectId !== id),
          activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
        })),

      addCounter: (projectId, counter) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            const newCounter: FreeCounter = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, value: 0, ...counter }
            return { ...p, freeCounters: [...(p.freeCounters ?? []), newCounter], updatedAt: new Date().toISOString() }
          }),
        })),

      deleteCounter: (projectId, counterId) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id !== projectId ? p : { ...p, freeCounters: (p.freeCounters ?? []).filter(c => c.id !== counterId), updatedAt: new Date().toISOString() }
          ),
        })),

      stepCounter: (projectId, counterId, delta) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id !== projectId) return p
            return {
              ...p,
              freeCounters: (p.freeCounters ?? []).map(c =>
                c.id !== counterId ? c : { ...c, value: Math.max(0, c.value + delta) }
              ),
              updatedAt: new Date().toISOString(),
            }
          }),
        })),
    }),
    { name: 'wiseknit-projects' }
  )
)

// Derived selectors
export const selectActiveProjects = (projects: Project[]) =>
  projects.filter((p) => p.status === 'active' || p.status === 'waiting')

export const selectTagList = (projects: Project[]): string[] =>
  [...new Set(projects.flatMap(p => p.tags ?? []))].sort()

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
