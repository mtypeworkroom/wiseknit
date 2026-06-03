import { useNavigate, useParams } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import { useProjectStore } from '../store/projectStore'
import styles from './ProjectDetail.module.css'

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, sessions } = useProjectStore()

  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <>
        <TopBar title="Project" showBack backTo="/dashboard" />
        <div className="page-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'var(--ink-mid)' }}>Project not found</p>
        </div>
      </>
    )
  }

  const rowsWorked = project.totalRowsWorked ?? 0
  const projectSessions = sessions
    .filter((s) => s.projectId === id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const totalMinutes = projectSessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const totalHours = (totalMinutes / 60).toFixed(1)

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <>
      <TopBar
        title={project.name}
        showBack
        backTo="/dashboard"
        rightContent={
          <button className={styles.editBtn}>Edit</button>
        }
      />

      <div className="page-scroll">

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div className={styles.heroIcon}>🧶</div>
            <div className={styles.heroMeta}>
              <div className={styles.heroName}>{project.name}</div>
              <div className={styles.heroSub}>
                {project.category ?? 'Project'} · Started{' '}
                {project.startedAt ? formatDate(project.startedAt) : '—'}
              </div>
            </div>
            <span className={`${styles.badge} ${styles[`badge_${project.status}`]}`}>
              {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
            </span>
          </div>

          {/* Row info — no progress bar */}
          <div className={styles.heroProgress}>
            <div className={styles.progRow}>
              <span className={styles.progLabel}>Chart row {project.currentRow} of {project.totalRows}</span>
              <span className={styles.progPct}>{rowsWorked} rows worked</span>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.heroStats}>
            <div className={styles.hstat}>
              <div className={styles.hstatVal}>{rowsWorked}</div>
              <div className={styles.hstatLbl}>Rows worked</div>
            </div>
            <div className={styles.hstat}>
              <div className={styles.hstatVal}>{projectSessions.length}</div>
              <div className={styles.hstatLbl}>Sessions</div>
            </div>
            <div className={styles.hstat}>
              <div className={styles.hstatVal}>{totalHours}h</div>
              <div className={styles.hstatLbl}>Time spent</div>
            </div>
            <div className={styles.hstat}>
              <div className={styles.hstatVal}>{project.currentRow}/{project.totalRows}</div>
              <div className={styles.hstatLbl}>Chart row</div>
            </div>
          </div>

          {/* Resume button */}
          <button
            className={styles.resumeBtn}
            onClick={() => navigate(`/project/${project.id}/knit`)}
          >
            ▶ Resume Knitting — Row {project.currentRow}
          </button>
        </div>

        <div className={styles.content}>

          {/* Pattern */}
          <div className={styles.section}>
            <div className="section-label">Pattern</div>
            <div className="card">
              <div className={styles.patternRow}>
                <div className={styles.patternIcon}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-text)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div>
                  <div className={styles.patternName}>{project.name}.pdf</div>
                  <div className={styles.patternMeta}>
                    {project.totalRows} rows · Imported
                  </div>
                </div>
                <span className={styles.arrow}>›</span>
              </div>
            </div>
          </div>

          {/* Project details */}
          <div className={styles.section}>
            <div className="section-label">Project Details</div>
            <div className="card">
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Needle</span>
                <span className={styles.detailVal}>
                  {project.needle
                    ? `${project.needle.sizeMm}mm · ${project.needle.type.replace(/-/g, ' ')}`
                    : <span className={styles.missing}>Not recorded</span>}
                </span>
                {!project.needle && <button className={styles.addBtn}>Add</button>}
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Gauge</span>
                <span className={styles.detailVal}>
                  {project.gauge
                    ? `${project.gauge.stitchesPer10cm} sts / ${project.gauge.rowsPer10cm} rows per 10cm`
                    : <span className={styles.missing}>Not recorded</span>}
                </span>
                {!project.gauge && <button className={styles.addBtn}>Add</button>}
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Yarn</span>
                <span className={styles.detailVal}>
                  {project.yarn?.name
                    ? `${project.yarn.brand} ${project.yarn.name}`
                    : <span className={styles.missing}>Not recorded</span>}
                </span>
                {!project.yarn && <button className={styles.addBtn}>Add</button>}
              </div>
            </div>
          </div>

          {/* Session history */}
          <div className={styles.section}>
            <div className="section-label">Session History</div>
            <div className="card">
              {projectSessions.length === 0 ? (
                <div className={styles.emptyState}>No sessions yet</div>
              ) : (
                projectSessions.map((session) => (
                  <div key={session.id} className={styles.sessionRow}>
                    <span className={styles.sessDate}>{formatDate(session.date)}</span>
                    <span className={styles.sessRows}>
                      Rows {session.startRow}–{session.endRow}{' '}
                      <span className={styles.sessRowsAdded}>+{session.rowsCompleted}</span>
                    </span>
                    <span className={styles.sessDuration}>{formatDuration(session.durationMinutes)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div className={styles.section}>
            <div className="section-label">Notes</div>
            <div className="card">
              {project.notes ? (
                <div className={styles.notes}>{project.notes}</div>
              ) : (
                <div className={styles.emptyState}>No notes yet — tap Edit to add some</div>
              )}
            </div>
          </div>

          {/* Danger zone */}
          <div className={styles.section}>
            <div className="card">
              <div className={styles.dangerRow}>
                <span className={styles.dangerLabel}>Archive Project</span>
              </div>
              <div className={`${styles.dangerRow} ${styles.borderTop}`}>
                <span className={styles.dangerLabel}>Delete Project</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
