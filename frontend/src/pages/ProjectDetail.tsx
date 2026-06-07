import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import type { Gauge, Yarn, Needle, NeedleType, YarnWeight } from '../types'
import styles from './ProjectDetail.module.css'

type EditingField = null | 'gauge' | 'yarn' | 'needle'

const NEEDLE_SIZES: { label: string; mm: number }[] = [
  { label: 'US 0000 (1.25mm)', mm: 1.25 },
  { label: 'US 000 (1.5mm)',   mm: 1.5  },
  { label: 'US 00 (1.75mm)',   mm: 1.75 },
  { label: 'US 0 (2.0mm)',     mm: 2.0  },
  { label: 'US 1 (2.25mm)',    mm: 2.25 },
  { label: 'US 2 (2.75mm)',    mm: 2.75 },
  { label: 'US 3 (3.25mm)',    mm: 3.25 },
  { label: 'US 4 (3.5mm)',     mm: 3.5  },
  { label: 'US 5 (3.75mm)',    mm: 3.75 },
  { label: 'US 6 (4.0mm)',     mm: 4.0  },
  { label: 'US 7 (4.5mm)',     mm: 4.5  },
  { label: 'US 8 (5.0mm)',     mm: 5.0  },
  { label: 'US 9 (5.5mm)',     mm: 5.5  },
  { label: 'US 10 (6.0mm)',    mm: 6.0  },
  { label: 'US 10.5 (6.5mm)', mm: 6.5  },
  { label: 'US 11 (8.0mm)',    mm: 8.0  },
  { label: 'US 13 (9.0mm)',    mm: 9.0  },
  { label: 'US 15 (10.0mm)',   mm: 10.0 },
  { label: 'US 17 (12.0mm)',   mm: 12.0 },
  { label: 'US 19 (15.0mm)',   mm: 15.0 },
  { label: 'US 35 (19.0mm)',   mm: 19.0 },
  { label: 'US 50 (25.0mm)',   mm: 25.0 },
]

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, sessions, deleteProject, updateProject } = useProjectStore()

  const [editingField, setEditingField] = useState<EditingField>(null)
  const [gaugeForm, setGaugeForm] = useState<Gauge>({ stitchesPer10cm: 0, rowsPer10cm: 0 })
  const [yarnForm, setYarnForm] = useState<Partial<Yarn>>({})
  const [needleForm, setNeedleForm] = useState<Partial<Needle>>({ sizeMm: 4.0, type: 'circular-fixed' })

  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <div className="page-scroll no-top-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--ink-mid)' }}>Project not found</p>
      </div>
    )
  }

  const openEdit = (field: EditingField) => {
    if (field === 'gauge')  setGaugeForm(project.gauge ?? { stitchesPer10cm: 0, rowsPer10cm: 0 })
    if (field === 'yarn')   setYarnForm(project.yarn ?? {})
    if (field === 'needle') setNeedleForm(project.needle ?? { sizeMm: 4.0, type: 'circular-fixed' })
    setEditingField(field)
  }

  const saveGauge = () => {
    updateProject(project.id, { gauge: gaugeForm })
    setEditingField(null)
  }

  const saveYarn = () => {
    updateProject(project.id, { yarn: yarnForm as Yarn })
    setEditingField(null)
  }

  const saveNeedle = () => {
    if (needleForm.sizeMm && needleForm.type) {
      updateProject(project.id, { needle: needleForm as Needle })
    }
    setEditingField(null)
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
    <div className="page-scroll no-top-nav">

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroInner}>
          <button className={styles.heroBackBtn} onClick={() => navigate('/dashboard')}>
            ← Projects
          </button>
          <div className={styles.heroTop}>
            <div className={styles.heroIcon}>🧶</div>
            <div className={styles.heroMeta}>
              <div className={styles.heroName}>{project.name}</div>
              <div className={styles.heroBadgeRow}>
                <span className={`${styles.badge} ${styles[`badge_${project.status}`]}`}>
                  {{ active: 'Active', paused: 'Paused', waiting: 'Draft', completed: 'Done', archived: 'Archived' }[project.status] ?? project.status}
                </span>
                {project.startedAt && (
                  <span className={styles.heroStartDate}>Started {formatDate(project.startedAt)}</span>
                )}
              </div>
            </div>
            <div className={styles.heroActions}>
              {project.status === 'waiting' ? (
                <button className={styles.heroResumeBtn} onClick={() => navigate(`/project/${project.id}/setup`)}>
                  ✎ Setup
                </button>
              ) : (
                <button className={styles.heroResumeBtn} onClick={() => navigate(`/project/${project.id}/knit`)}>
                  ▶ Knit
                </button>
              )}
              <button className={styles.heroIconBtn} title="Archive project">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
              </button>
              <button
                className={`${styles.heroIconBtn} ${styles.heroIconBtnDanger}`}
                title="Delete project"
                onClick={() => { if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) { deleteProject(project.id); navigate('/dashboard') } }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Compact metrics strip */}
          <div className={styles.metaStrip}>
            <span>Row {project.currentRow}/{project.totalRows}</span>
            <span className={styles.metaDot}>·</span>
            <span>{rowsWorked} rows worked</span>
            <span className={styles.metaDot}>·</span>
            <span>{projectSessions.length} sessions</span>
            <span className={styles.metaDot}>·</span>
            <span>{totalHours}h</span>
          </div>
          </div>
        </div>

        <div className={styles.content}>

          {/* Pattern */}
          <div className={styles.section}>
            <div className="section-label">Pattern</div>
            <div className="card">
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Charts</span>
                <span className={styles.detailVal}>
                  {(project.charts?.length ?? 0) > 0
                    ? `${project.charts!.length} chart${project.charts!.length !== 1 ? 's' : ''} · ${project.totalRows} rows`
                    : <span className={styles.missing}>No charts set up</span>}
                </span>
                <button className={styles.addBtn} onClick={() => navigate(`/project/${project.id}/setup`)}>
                  Edit setup
                </button>
              </div>
            </div>
          </div>

          {/* Project details */}
          <div className={styles.section}>
            <div className="section-label">Project Details</div>
            <div className="card">
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Category</span>
                <span className={styles.detailVal}>{project.category ?? '—'}</span>
              </div>
              {/* Needle */}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Needle</span>
                <span className={styles.detailVal}>
                  {project.needle
                    ? `${NEEDLE_SIZES.find(n => n.mm === project.needle!.sizeMm)?.label ?? `${project.needle.sizeMm}mm`} · ${project.needle.type.replace(/-/g, ' ')}`
                    : <span className={styles.missing}>Not recorded</span>}
                </span>
                <button className={styles.addBtn} onClick={() => openEdit('needle')}>
                  {project.needle ? 'Edit' : 'Add'}
                </button>
              </div>
              {editingField === 'needle' && (
                <div className={styles.inlineForm}>
                  <select
                    className={styles.inlineSelect}
                    value={needleForm.sizeMm}
                    onChange={e => setNeedleForm(f => ({ ...f, sizeMm: parseFloat(e.target.value) }))}
                  >
                    {NEEDLE_SIZES.map(n => (
                      <option key={n.mm} value={n.mm}>{n.label}</option>
                    ))}
                  </select>
                  <select
                    className={styles.inlineSelect}
                    value={needleForm.type}
                    onChange={e => setNeedleForm(f => ({ ...f, type: e.target.value as NeedleType }))}
                  >
                    {(['circular-fixed','circular-interchangeable','straight','dpn','magic-loop'] as NeedleType[]).map(t => (
                      <option key={t} value={t}>{t.replace(/-/g, ' ')}</option>
                    ))}
                  </select>
                  <div className={styles.inlineActions}>
                    <button className={styles.inlineSave} onClick={saveNeedle}>Save</button>
                    <button className={styles.inlineCancel} onClick={() => setEditingField(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Gauge */}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Gauge</span>
                <span className={styles.detailVal}>
                  {project.gauge
                    ? `${project.gauge.stitchesPer10cm} sts / ${project.gauge.rowsPer10cm} rows per 10cm`
                    : <span className={styles.missing}>Not recorded</span>}
                </span>
                <button className={styles.addBtn} onClick={() => openEdit('gauge')}>
                  {project.gauge ? 'Edit' : 'Add'}
                </button>
              </div>
              {editingField === 'gauge' && (
                <div className={styles.inlineForm}>
                  <label className={styles.inlineLabel}>
                    Sts / 10cm
                    <input
                      type="number"
                      className={styles.inlineInput}
                      value={gaugeForm.stitchesPer10cm || ''}
                      onChange={e => setGaugeForm(f => ({ ...f, stitchesPer10cm: parseFloat(e.target.value) || 0 }))}
                    />
                  </label>
                  <label className={styles.inlineLabel}>
                    Rows / 10cm
                    <input
                      type="number"
                      className={styles.inlineInput}
                      value={gaugeForm.rowsPer10cm || ''}
                      onChange={e => setGaugeForm(f => ({ ...f, rowsPer10cm: parseFloat(e.target.value) || 0 }))}
                    />
                  </label>
                  <div className={styles.inlineActions}>
                    <button className={styles.inlineSave} onClick={saveGauge}>Save</button>
                    <button className={styles.inlineCancel} onClick={() => setEditingField(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Yarn */}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Yarn</span>
                <span className={styles.detailVal}>
                  {project.yarn?.name
                    ? `${project.yarn.brand ?? ''} ${project.yarn.name}`.trim()
                    : <span className={styles.missing}>Not recorded</span>}
                </span>
                <button className={styles.addBtn} onClick={() => openEdit('yarn')}>
                  {project.yarn?.name ? 'Edit' : 'Add'}
                </button>
              </div>
              {editingField === 'yarn' && (
                <div className={styles.inlineForm}>
                  <label className={styles.inlineLabel}>
                    Brand
                    <input
                      type="text"
                      className={styles.inlineInput}
                      value={yarnForm.brand ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, brand: e.target.value }))}
                    />
                  </label>
                  <label className={styles.inlineLabel}>
                    Name
                    <input
                      type="text"
                      className={styles.inlineInput}
                      value={yarnForm.name ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, name: e.target.value }))}
                    />
                  </label>
                  <label className={styles.inlineLabel}>
                    Colorway
                    <input
                      type="text"
                      className={styles.inlineInput}
                      value={yarnForm.colorway ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, colorway: e.target.value }))}
                    />
                  </label>
                  <label className={styles.inlineLabel}>
                    Weight
                    <select
                      className={styles.inlineSelect}
                      value={yarnForm.weight ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, weight: e.target.value as YarnWeight || undefined }))}
                    >
                      <option value="">— select —</option>
                      {(['lace','fingering','sport','dk','worsted','aran','bulky','super-bulky'] as YarnWeight[]).map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </label>
                  <div className={styles.inlineActions}>
                    <button className={styles.inlineSave} onClick={saveYarn}>Save</button>
                    <button className={styles.inlineCancel} onClick={() => setEditingField(null)}>Cancel</button>
                  </div>
                </div>
              )}
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


        </div>
      </div>
  )
}

