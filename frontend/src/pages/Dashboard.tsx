import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import ResumeStrip from '../components/dashboard/ResumeStrip'
import ProjectCard from '../components/dashboard/ProjectCard'
import {
  useProjectStore,
  selectActiveProjects,
  selectTagList,
} from '../store/projectStore'
import type { Project } from '../types'
import styles from './Dashboard.module.css'

type SortKey = 'lastSession' | 'nameAsc' | 'nameDesc' | 'newest' | 'status'

const SORT_LABELS: Record<SortKey, string> = {
  lastSession: 'Last session',
  nameAsc:     'Name A → Z',
  nameDesc:    'Name Z → A',
  newest:      'Newest',
  status:      'Status',
}

const STATUS_ORDER: Record<string, number> = {
  active: 0, waiting: 1, paused: 2, completed: 3, archived: 4,
}

function sortProjects(projects: Project[], key: SortKey): Project[] {
  return [...projects].sort((a, b) => {
    switch (key) {
      case 'nameAsc':  return a.name.localeCompare(b.name)
      case 'nameDesc': return b.name.localeCompare(a.name)
      case 'newest':   return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'status':   return (STATUS_ORDER[a.status] ?? 5) - (STATUS_ORDER[b.status] ?? 5)
      default: {
        const ta = a.lastSessionAt ? new Date(a.lastSessionAt).getTime() : 0
        const tb = b.lastSessionAt ? new Date(b.lastSessionAt).getTime() : 0
        return tb - ta
      }
    }
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { projects, updateProject, deleteProject } = useProjectStore()
  const tagList = selectTagList(projects)
  const activeProjects = selectActiveProjects(projects)

  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<SortKey>('lastSession')
  const [sortOpen, setSortOpen] = useState(false)
  const [filterOpen, setFilterOpen] = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!sortOpen && !filterOpen) return
    const handler = (e: MouseEvent) => {
      if (sortOpen && sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false)
      if (filterOpen && filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen, filterOpen])

  const visibleProjects = useMemo(() => {
    const filtered = activeTags.length === 0
      ? projects
      : projects.filter(p => activeTags.some(t => p.tags?.includes(t)))
    return sortProjects(filtered, sortBy)
  }, [projects, activeTags, sortBy])

  const toggleTag = (tag: string) =>
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])

  const handleArchive = (id: string) => {
    const project = projects.find(p => p.id === id)
    if (!project) return
    updateProject(id, { status: project.status === 'archived' ? 'paused' : 'archived' })
  }

  const handleDelete = (id: string) => {
    const project = projects.find(p => p.id === id)
    if (!project) return
    if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) {
      deleteProject(id)
    }
  }

  return (
    <>
      <TopBar showBrand />

      <div className="page-scroll">

        {/* Resume strips */}
        <div className={styles.resumeStrips}>
          <div className={styles.stripsInner}>
            <div className={styles.stripsLabel}>Continue knitting</div>
            <div className={styles.stripsGrid}>
              {activeProjects.map((project) => (
                <ResumeStrip
                  key={project.id}
                  project={project}
                  onResume={() => navigate(`/project/${project.id}/knit`)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Project grid */}
        <div className={styles.projectsWrap}>
          <div className={styles.sectionHeader}>
            <span className="section-label">
              All Projects
              {activeTags.length > 0 && (
                <span className={styles.filterCount}>{visibleProjects.length}</span>
              )}
            </span>

            <div className={styles.headerActions}>
              {/* Filter button — always shown */}
              <div className={styles.filterWrap} ref={filterRef}>
                <button
                  className={`${styles.filterBtn}${activeTags.length > 0 ? ` ${styles.filterBtnActive}` : ''}`}
                  onClick={() => { setFilterOpen(o => !o); setSortOpen(false) }}
                >
                  Filter{activeTags.length > 0 ? ` · ${activeTags.length}` : ''}
                </button>
                {filterOpen && (
                  <div className={styles.filterDropdown}>
                    {tagList.length === 0 ? (
                      <div className={styles.filterEmpty}>
                        Add tags to projects to filter here
                      </div>
                    ) : (
                      <>
                        <div className={styles.filterDropdownInner}>
                          {tagList.map(tag => (
                            <button
                              key={tag}
                              className={`${styles.filterTagChip}${activeTags.includes(tag) ? ` ${styles.filterTagChipOn}` : ''}`}
                              onClick={() => toggleTag(tag)}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                        {activeTags.length > 0 && (
                          <button className={styles.filterClear} onClick={() => { setActiveTags([]); setFilterOpen(false) }}>
                            Clear filter
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Sort button */}
              <div className={styles.sortWrap} ref={sortRef}>
                <button className={styles.sortBtn} onClick={() => { setSortOpen(o => !o); setFilterOpen(false) }}>
                  {SORT_LABELS[sortBy]} ↕
                </button>
                {sortOpen && (
                  <div className={styles.sortDropdown}>
                    {(Object.keys(SORT_LABELS) as SortKey[]).map(key => (
                      <button
                        key={key}
                        className={`${styles.sortOption}${sortBy === key ? ` ${styles.sortOptionActive}` : ''}`}
                        onClick={() => { setSortBy(key); setSortOpen(false) }}
                      >
                        {SORT_LABELS[key]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={styles.projectGrid}>
            {visibleProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/project/${project.id}`)}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
            {visibleProjects.length === 0 && activeTags.length > 0 && (
              <div className={styles.emptyFilter}>
                No projects tagged {activeTags.join(', ')}
                <button className={styles.emptyFilterClear} onClick={() => setActiveTags([])}>Clear</button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* FAB */}
      <button
        className={styles.fab}
        onClick={() => navigate('/project/new')}
        aria-label="New project"
      >
        +
      </button>
    </>
  )
}
