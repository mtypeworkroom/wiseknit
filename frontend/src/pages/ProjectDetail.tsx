import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import type { Gauge, Yarn, Needle, NeedleType, YarnWeight, ProjectChart } from '../types'
import ChartEditModal from '../components/import/ChartEditModal'
import PDFViewer from '../components/reader/PDFViewer'
import PDFPagePicker, { type PageSelection } from '../components/import/PDFPagePicker'
import { loadPDF, saveImage } from '../store/imageStore'
import { ArchiveIcon, TrashIcon, FileIcon, ImageIcon, PencilIcon, BookOpenIcon, ChartGridIcon } from '../components/icons'
import { CATEGORY_GROUPS, ALL_CATEGORIES } from '../data/categories'
import styles from './ProjectDetail.module.css'


type EditingField = null | 'name' | 'category' | 'gauge' | 'yarn' | 'needle' | 'notes'

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
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [pdfPickerFile, setPdfPickerFile] = useState<File | null>(null)
  const [nameForm, setNameForm] = useState('')
  const [categoryForm, setCategoryForm] = useState('')
  const [notesForm, setNotesForm] = useState('')
  const [gaugeForm, setGaugeForm] = useState<Gauge>({ stitchesPer10cm: 0, rowsPer10cm: 0 })
  const [yarnForm, setYarnForm] = useState<Partial<Yarn>>({})
  const [needleForm, setNeedleForm] = useState<Partial<Needle>>({ sizeMm: 4.0, type: 'circular-fixed' })
  const [editModalChart, setEditModalChart] = useState<ProjectChart | null>(null)
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false)
  const knitDropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!chartDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (knitDropdownRef.current && !knitDropdownRef.current.contains(e.target as Node)) {
        setChartDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [chartDropdownOpen])

  const project = projects.find((p) => p.id === id)

  if (!project) {
    return (
      <div className="page-scroll no-top-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--ink-mid)' }}>Project not found</p>
      </div>
    )
  }

  const openEdit = (field: EditingField) => {
    if (field === 'name')     setNameForm(project.name)
    if (field === 'category') setCategoryForm(project.category ?? '')
    if (field === 'gauge')    setGaugeForm(project.gauge ?? { stitchesPer10cm: 0, rowsPer10cm: 0 })
    if (field === 'yarn')     setYarnForm(project.yarn ?? {})
    if (field === 'needle')   setNeedleForm(project.needle ?? { sizeMm: 4.0, type: 'circular-fixed' })
    if (field === 'notes')    setNotesForm(project.notes ?? '')
    setEditingField(field)
  }

  const saveNotes = () => {
    updateProject(project.id, { notes: notesForm.trim() || undefined })
    setEditingField(null)
  }

  const saveName = () => {
    if (nameForm.trim()) updateProject(project.id, { name: nameForm.trim() })
    setEditingField(null)
  }

  const saveCategory = () => {
    updateProject(project.id, { category: categoryForm.trim() || undefined })
    setEditingField(null)
  }

  const openPhotoPicker = async () => {
    if (!project?.pdfKey) return
    const ab = await loadPDF(project.pdfKey)
    if (!ab) return
    setPdfPickerFile(new File([ab], 'pattern.pdf', { type: 'application/pdf' }))
  }

  const handlePhotoPickerComplete = (selections: PageSelection[], _totalPages: number) => {
    setPdfPickerFile(null)
    const photoSel = selections.find(s => s.role === 'photo' && s.croppedBase64)
    if (!photoSel?.croppedBase64 || !project) return
    const photoKey = `photo-${project.id}`
    void saveImage(photoKey, photoSel.croppedBase64).then(() => {
      updateProject(project.id, { photoKey })
    })
  }

  const deleteChart = (chartId: string) => {
    if (!window.confirm('Remove this chart?')) return
    updateProject(project.id, { charts: (project.charts ?? []).filter(c => c.id !== chartId) })
  }

  const saveChartEdit = (chartId: string, updates: Partial<ProjectChart>) => {
    updateProject(project.id, {
      charts: (project.charts ?? []).map(c => c.id === chartId ? { ...c, ...updates } : c),
    })
    setEditModalChart(null)
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

  const charts = project.charts ?? []
  const activeChart = charts.find(c => c.id === project.activeChartId) ?? charts[0]

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
      {pdfViewerOpen && project.pdfKey && (
        <PDFViewer pdfKey={project.pdfKey} onClose={() => setPdfViewerOpen(false)} />
      )}

      {pdfPickerFile && (
        <PDFPagePicker
          file={pdfPickerFile}
          onComplete={handlePhotoPickerComplete}
          onCancel={() => setPdfPickerFile(null)}
        />
      )}

      {editModalChart && (
        <ChartEditModal
          chart={editModalChart}
          onSave={(updates) => saveChartEdit(editModalChart.id, updates)}
          onClose={() => setEditModalChart(null)}
        />
      )}

        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroInner}>
          <div className={styles.heroTop}>
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
                <div className={styles.knitSplitBtn} ref={knitDropdownRef}>
                  <button
                    className={styles.knitSplitMain}
                    onClick={() => navigate(`/project/${project.id}/knit`)}
                  >
                    ▶ {activeChart?.name ?? 'Knit'}
                  </button>
                  {charts.length > 1 && (
                    <button
                      className={styles.knitSplitChevron}
                      onClick={() => setChartDropdownOpen(o => !o)}
                    >
                      ▾
                    </button>
                  )}
                  {chartDropdownOpen && charts.length > 1 && (
                    <div className={styles.knitSplitDropdown}>
                      {charts.map(c => (
                        <button
                          key={c.id}
                          className={`${styles.knitDropdownItem}${c.id === (project.activeChartId ?? charts[0]?.id) ? ` ${styles.knitDropdownItemActive}` : ''}`}
                          onClick={() => {
                            updateProject(project.id, {
                              activeChartId: c.id,
                              totalRows: c.totalRows,
                              chartRepeatStartRow: c.repeatStartRow,
                              currentRow: Math.min(project.currentRow, c.totalRows),
                            })
                            setChartDropdownOpen(false)
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                className={styles.heroIconBtn}
                title={project.status === 'archived' ? 'Unarchive' : 'Archive'}
                onClick={() => updateProject(project.id, { status: project.status === 'archived' ? 'paused' : 'archived' })}
              >
                <ArchiveIcon size={14}/>
              </button>
              <button
                className={`${styles.heroIconBtn} ${styles.heroIconBtnDanger}`}
                title="Delete project"
                onClick={() => { if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) { deleteProject(project.id); navigate('/dashboard') } }}
              >
                <TrashIcon size={14}/>
              </button>
            </div>
          </div>

          {/* Compact metrics strip */}
          <div className={styles.metaStrip}>
            <span>Row {project.currentRow}/{activeChart?.totalRows ?? project.totalRows}</span>
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
              {project.pdfKey && (
                <div className={styles.pdfRow}>
                  <FileIcon size={14}/>
                  <span className={styles.pdfRowName}>Pattern PDF</span>
                  {project.pdfPageCount && (
                    <span className={styles.pdfRowMeta}>{project.pdfPageCount} pages</span>
                  )}
                  <button className={styles.addBtn} onClick={() => setPdfViewerOpen(true)} aria-label="Read PDF"><BookOpenIcon size={14}/></button>
                </div>
              )}
              {project.pdfKey && (
                <div className={styles.pdfRow}>
                  <ImageIcon size={14}/>
                  <span className={styles.pdfRowName}>Project Photo</span>
                  {project.photoKey && (
                    <span className={styles.pdfRowMeta}>set</span>
                  )}
                  <button className={styles.addBtn} onClick={openPhotoPicker} aria-label={project.photoKey ? 'Update photo' : 'Add photo'}>
                    {project.photoKey ? <PencilIcon size={14}/> : 'Add'}
                  </button>
                </div>
              )}
              {(project.charts?.length ?? 0) === 0 ? (
                <div className={styles.emptyState}>No charts yet</div>
              ) : (
                project.charts!.map(chart => (
                  <div key={chart.id} className={styles.chartRow}>
                    <ChartGridIcon size={14}/>
                    <span className={styles.chartRowName}>{chart.name}</span>
                    {chart.totalRows > 0 && (
                      <span className={styles.chartRowMeta}>{chart.totalRows}r</span>
                    )}
                    <div className={styles.chartRowActions}>
                      <button className={styles.addBtn} onClick={() => setEditModalChart(chart)} aria-label="Edit chart"><PencilIcon size={14}/></button>
                      <button className={styles.chartDeleteBtn} onClick={() => deleteChart(chart.id)}>
                        <TrashIcon size={12}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Project details */}
          <div className={styles.section}>
            <div className="section-label">Project Details</div>
            <div className="card">
              {/* Name */}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Name</span>
                <span className={styles.detailVal}>{project.name}</span>
                <button className={styles.addBtn} onClick={() => openEdit('name')} aria-label="Edit name"><PencilIcon size={14}/></button>
              </div>
              {editingField === 'name' && (
                <div className={styles.inlineForm}>
                  <label className={styles.inlineLabel} style={{ flex: 1 }}>
                    Name
                    <input type="text" className={styles.inlineInput} style={{ width: '100%' }}
                      value={nameForm} onChange={e => setNameForm(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveName()} />
                  </label>
                  <div className={styles.inlineActions}>
                    <button className={styles.inlineSave} onClick={saveName}>Save</button>
                    <button className={styles.inlineCancel} onClick={() => setEditingField(null)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Category */}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Category</span>
                <span className={styles.detailVal}>{project.category ?? <span className={styles.missing}>Not set</span>}</span>
                <button className={styles.addBtn} onClick={() => openEdit('category')} aria-label="Edit category">
                  {project.category ? <PencilIcon size={14}/> : 'Add'}
                </button>
              </div>
              {editingField === 'category' && (
                <div className={styles.inlineForm}>
                  <label className={styles.inlineLabel}>
                    Category
                    <select className={styles.inlineSelect}
                      value={categoryForm} onChange={e => setCategoryForm(e.target.value)}>
                      {categoryForm && !ALL_CATEGORIES.includes(categoryForm) && (
                        <option value={categoryForm}>{categoryForm}</option>
                      )}
                      {CATEGORY_GROUPS.map(({ group, options }) => (
                        <optgroup key={group} label={group}>
                          {options.map(o => <option key={o} value={o}>{o}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </label>
                  <div className={styles.inlineActions}>
                    <button className={styles.inlineSave} onClick={saveCategory}>Save</button>
                    <button className={styles.inlineCancel} onClick={() => setEditingField(null)}>Cancel</button>
                  </div>
                </div>
              )}
              {/* Needle */}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Needle</span>
                <span className={styles.detailVal}>
                  {project.needle
                    ? `${NEEDLE_SIZES.find(n => n.mm === project.needle!.sizeMm)?.label ?? `${project.needle.sizeMm}mm`} · ${project.needle.type.replace(/-/g, ' ')}`
                    : <span className={styles.missing}>Not recorded</span>}
                </span>
                <button className={styles.addBtn} onClick={() => openEdit('needle')} aria-label="Edit needle">
                  {project.needle ? <PencilIcon size={14}/> : 'Add'}
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
                <button className={styles.addBtn} onClick={() => openEdit('gauge')} aria-label="Edit gauge">
                  {project.gauge ? <PencilIcon size={14}/> : 'Add'}
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
                <button className={styles.addBtn} onClick={() => openEdit('yarn')} aria-label="Edit yarn">
                  {project.yarn?.name ? <PencilIcon size={14}/> : 'Add'}
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

          {/* Notes */}
          <div className={styles.section}>
            <div className={styles.sectionHeaderRow}>
              <div className="section-label">Notes</div>
              {editingField !== 'notes' && (
                <button className={styles.addBtn} onClick={() => openEdit('notes')} aria-label="Edit notes">
                  {project.notes ? <PencilIcon size={14}/> : 'Add'}
                </button>
              )}
            </div>
            <div className="card">
              {editingField === 'notes' ? (
                <div className={styles.inlineForm}>
                  <textarea
                    className={styles.notesTextarea}
                    value={notesForm}
                    onChange={e => setNotesForm(e.target.value)}
                    placeholder="Modifications, sizing notes, reminders…"
                    rows={5}
                    autoFocus
                  />
                  <div className={styles.inlineActions}>
                    <button className={styles.inlineSave} onClick={saveNotes}>Save</button>
                    <button className={styles.inlineCancel} onClick={() => setEditingField(null)}>Cancel</button>
                  </div>
                </div>
              ) : project.notes ? (
                <div className={styles.notes}>{project.notes}</div>
              ) : (
                <div className={styles.emptyState}>No notes yet</div>
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


        </div>
      </div>
  )
}

