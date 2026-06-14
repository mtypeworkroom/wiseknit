import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectStore, selectTagList } from '../store/projectStore'
import type { Gauge, Yarn, Needle, NeedleType, YarnWeight, ProjectChart, PdfSection, PdfReadingRect, ProjectKeyImage } from '../types'
import ChartEditModal from '../components/import/ChartEditModal'
import ShapingStepsModal from '../components/shaping/ShapingStepsModal'
import PDFViewer from '../components/reader/PDFViewer'
import PDFPagePicker, { type PageSelection } from '../components/import/PDFPagePicker'
import { loadPDF, saveImage, deleteImage } from '../store/imageStore'
import { ArchiveIcon, TrashIcon, FileIcon, ImageIcon, PencilIcon, BookOpenIcon, BookmarkIcon, ChartGridIcon, PlusIcon, RepeatIcon, HashIcon, InfoIcon } from '../components/icons'
import { CATEGORY_GROUPS, ALL_CATEGORIES } from '../data/categories'
import ColorPicker from '../components/ColorPicker'
import styles from './ProjectDetail.module.css'


type EditingField = null | 'name' | 'category' | 'designer' | 'gauge' | 'yarn' | 'needle' | 'notes' | 'tags'

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

function textColorForBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#1a1a1a' : '#ffffff'
}

function CounterFormPanel({
  name, color, triggerEvery, resetAt, countDown,
  onNameChange, onColorChange, onTriggerEveryChange, onResetAtChange, onCountDownChange,
  onConfirm, onCancel, confirmLabel, extraActions,
}: {
  name: string
  color: string
  triggerEvery: string
  resetAt: string
  countDown: boolean
  onNameChange: (v: string) => void
  onColorChange: (v: string) => void
  onTriggerEveryChange: (v: string) => void
  onResetAtChange: (v: string) => void
  onCountDownChange: (v: boolean) => void
  onConfirm: () => void
  onCancel: () => void
  confirmLabel: string
  extraActions?: React.ReactNode
}) {
  return (
    <div className={styles.counterPanel}>
      <div className={styles.counterPanelRow}>
        <ColorPicker value={color} onChange={onColorChange} />
        <input
          className={styles.counterNameInput}
          type="text"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') onConfirm() }}
          placeholder="Counter name…"
          autoFocus
        />
        <button className={styles.inlineSave} disabled={!name.trim()} onClick={onConfirm}>{confirmLabel}</button>
        <button className={styles.inlineCancel} onClick={onCancel}>Cancel</button>
      </div>
      <div className={styles.counterLinkedRow}>
        <span className={styles.counterLinkedLabel}>Auto every</span>
        <input
          className={styles.counterLinkedInput}
          type="number" min="1" value={triggerEvery}
          onChange={e => onTriggerEveryChange(e.target.value)}
          placeholder="—"
        />
        <span className={styles.counterLinkedLabel}>rows &nbsp; Reset at</span>
        <input
          className={styles.counterLinkedInput}
          type="number" min="1" value={resetAt}
          onChange={e => onResetAtChange(e.target.value)}
          placeholder="—"
        />
        <label className={styles.counterLinkedCheck}>
          <input type="checkbox" checked={countDown} onChange={e => onCountDownChange(e.target.checked)} />
          Count down
        </label>
      </div>
      {extraActions && <div className={styles.counterPanelActions}>{extraActions}</div>}
    </div>
  )
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, sessions, deleteProject, updateProject, addCounter, deleteCounter } = useProjectStore()
  const tagList = selectTagList(projects)

  const [editingField, setEditingField] = useState<EditingField>(null)
  const [pdfViewerOpen, setPdfViewerOpen] = useState(false)
  const [pdfInitialPage, setPdfInitialPage] = useState(1)
  const [pdfActiveSection, setPdfActiveSection] = useState<PdfSection | undefined>(undefined)
  const [pdfActiveSectionIdx, setPdfActiveSectionIdx] = useState<number | null>(null)
  const [pdfPickerFile, setPdfPickerFile] = useState<File | null>(null)
  const [nameForm, setNameForm] = useState('')
  const [categoryForm, setCategoryForm] = useState('')
  const [designerForm, setDesignerForm] = useState('')
  const [notesForm, setNotesForm] = useState('')
  const [tagsForm, setTagsForm] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [gaugeForm, setGaugeForm] = useState<Gauge>({ stitchesPer10cm: 0, rowsPer10cm: 0 })
  const [yarnForm, setYarnForm] = useState<Partial<Yarn>>({})
  const [needleForm, setNeedleForm] = useState<Partial<Needle>>({ sizeMm: 4.0, type: 'circular-fixed' })
  const [chipMenuId, setChipMenuId] = useState<string | 'add' | null>(null)
  const [chipEditName, setChipEditName] = useState('')
  const [chipEditColor, setChipEditColor] = useState('#3CCFEF')
  const [chipEditTriggerEvery, setChipEditTriggerEvery] = useState('')
  const [chipEditResetAt, setChipEditResetAt] = useState('')
  const [chipEditCountDown, setChipEditCountDown] = useState(false)
  const [editModalChart, setEditModalChart] = useState<ProjectChart | null>(null)
  const [shapingModalChart, setShapingModalChart] = useState<ProjectChart | null>(null)
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
    if (field === 'designer') setDesignerForm(project.designer ?? '')
    if (field === 'gauge')    setGaugeForm(project.gauge ?? { stitchesPer10cm: 0, rowsPer10cm: 0 })
    if (field === 'yarn')     setYarnForm(project.yarn ?? {})
    if (field === 'needle')   setNeedleForm(project.needle ?? { sizeMm: 4.0, type: 'circular-fixed' })
    if (field === 'notes')    setNotesForm(project.notes ?? '')
    if (field === 'tags')     { setTagsForm([...(project.tags ?? [])]); setTagInput('') }
    setEditingField(field)
  }

  const saveNotes = () => {
    updateProject(project.id, { notes: notesForm.trim() || undefined })
    setEditingField(null)
  }

  const addTagFromInput = (currentForm = tagsForm) => {
    const parts = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    const newTags = parts.filter(t => !currentForm.includes(t))
    if (newTags.length) setTagsForm([...currentForm, ...newTags])
    setTagInput('')
    return newTags.length ? [...currentForm, ...newTags] : currentForm
  }

  const saveTags = () => {
    const parts = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    const finalTags = [...new Set([...tagsForm, ...parts.filter(t => !tagsForm.includes(t))])]
    updateProject(project.id, { tags: finalTags.length > 0 ? finalTags : undefined })
    setEditingField(null)
    setTagInput('')
  }

  const saveName = () => {
    if (nameForm.trim()) updateProject(project.id, { name: nameForm.trim() })
    setEditingField(null)
  }

  const saveDesigner = () => {
    updateProject(project.id, { designer: designerForm.trim() || undefined })
    setEditingField(null)
  }

  const saveCategory = () => {
    updateProject(project.id, { category: categoryForm.trim() || undefined })
    setEditingField(null)
  }

  const openPdfAt = (page: number, section?: PdfSection, sectionIdx?: number) => {
    setPdfInitialPage(page)
    setPdfActiveSection(section)
    setPdfActiveSectionIdx(sectionIdx ?? null)
    setPdfViewerOpen(true)
  }

  const handleSaveSection = (label: string, page: number, markXPct?: number, markYPct?: number) => {
    const existing = project.pdfSections ?? []
    updateProject(project.id, {
      pdfSections: [...existing, { label, page, markXPct, markYPct }].sort((a, b) => a.page - b.page),
    })
  }

  const handleSaveReadingRect = (page: number, x1Pct: number, y1Pct: number, x2Pct: number, y2Pct: number, color: string) => {
    const newRect: PdfReadingRect = { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, page, x1Pct, y1Pct, x2Pct, y2Pct, color }
    if (pdfActiveSectionIdx != null && project.pdfSections) {
      const sections = project.pdfSections.map((s, i) =>
        i === pdfActiveSectionIdx ? { ...s, readingRects: [...(s.readingRects ?? []), newRect] } : s
      )
      updateProject(project.id, { pdfSections: sections })
      setPdfActiveSection(sections[pdfActiveSectionIdx])
    } else {
      updateProject(project.id, { readingRects: [...(project.readingRects ?? []), newRect] })
    }
  }

  const handleRemoveReadingRect = (id: string) => {
    if (pdfActiveSectionIdx != null && project.pdfSections) {
      const sections = project.pdfSections.map((s, i) =>
        i === pdfActiveSectionIdx ? { ...s, readingRects: (s.readingRects ?? []).filter(r => r.id !== id) } : s
      )
      updateProject(project.id, { pdfSections: sections })
      setPdfActiveSection(sections[pdfActiveSectionIdx])
    } else {
      updateProject(project.id, { readingRects: (project.readingRects ?? []).filter(r => r.id !== id) })
    }
  }

  const removeSection = (idx: number) => {
    const updated = (project.pdfSections ?? []).filter((_, i) => i !== idx)
    updateProject(project.id, { pdfSections: updated })
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

  const removeKey = async (keyId: string) => {
    if (!window.confirm('Remove this stitch key?')) return
    const key = project.keyImages?.find(k => k.id === keyId)
    if (key) await deleteImage(key.imageKey).catch(() => {})
    updateProject(project.id, {
      keyImages: (project.keyImages ?? []).filter(k => k.id !== keyId),
    })
  }

  const removePhoto = async () => {
    if (!project.photoKey) return
    await deleteImage(project.photoKey).catch(() => {})
    updateProject(project.id, { photoKey: undefined, photo: undefined })
  }


  const saveChartEdit = (chartId: string, updates: Partial<ProjectChart>) => {
    updateProject(project.id, {
      charts: (project.charts ?? []).map(c => {
        if (c.id !== chartId) return c
        const merged = { ...c, ...updates }
        // Remove optional boolean flags that were cleared (undefined = off)
        if (!merged.countBy2) delete merged.countBy2
        return merged
      }),
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
        <PDFViewer
          pdfKey={project.pdfKey}
          initialPage={pdfInitialPage}
          activeSection={pdfActiveSection}
          extraRects={pdfActiveSectionIdx == null ? project.readingRects : undefined}
          bracketPos={project.bracketPos}
          onSaveSection={handleSaveSection}
          onSaveReadingRect={handleSaveReadingRect}
          onRemoveReadingRect={handleRemoveReadingRect}
          onSaveBracket={pos => updateProject(project.id, { bracketPos: pos })}
          onClose={() => setPdfViewerOpen(false)}
        />
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

      {shapingModalChart && (
        <ShapingStepsModal
          chart={shapingModalChart}
          onSave={steps => {
            updateProject(project.id, {
              charts: (project.charts ?? []).map(c =>
                c.id === shapingModalChart.id ? { ...c, intervalSteps: steps.length > 0 ? steps : undefined } : c
              ),
            })
            setShapingModalChart(null)
          }}
          onClose={() => setShapingModalChart(null)}
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
            <div className={styles.sectionHeaderRow}>
              <div className="section-label">Pattern</div>
              <div className={styles.sectionHeaderActions}>
                {project.pdfKey && project.pdfPageCount && (
                  <span className={styles.sectionHeaderMeta}>{project.pdfPageCount}p</span>
                )}
                {project.pdfKey && (
                  <button className={styles.addBtn} onClick={() => openPdfAt(1)} aria-label="Read PDF"><BookOpenIcon size={14}/></button>
                )}
              </div>
            </div>
            <div className="card">
              {project.pdfKey && (
                <div className={styles.actionPillsRow}>
                  <button className={styles.iconPill} onClick={() => openPdfAt(1)} aria-label="Add bookmark">
                    <BookmarkIcon size={11}/><span>+</span>
                  </button>
                  <button className={styles.iconPill} onClick={openPhotoPicker} aria-label="Add photo">
                    <ImageIcon size={11}/><span>+</span>
                  </button>
                  <button className={styles.iconPill} onClick={() => navigate(`/project/${project.id}/setup?step=3&picker=true`)} aria-label="Add stitch key">
                    <InfoIcon size={11}/><span>+</span>
                  </button>
                  <button
                    className={styles.iconPill}
                    onClick={() => {
                      setChipMenuId(chipMenuId === 'add' ? null : 'add')
                      setChipEditName('')
                      setChipEditColor('#3CCFEF')
                      setChipEditTriggerEvery('')
                      setChipEditResetAt('')
                      setChipEditCountDown(false)
                    }}
                    aria-label="Add counter"
                  >
                    <HashIcon size={11}/><span>+</span>
                  </button>
                </div>
              )}
              {project.pdfKey && (project.pdfSections?.length ?? 0) > 0 && (
                <div className={styles.sectionChips}>
                  <BookmarkIcon size={13} className={styles.chipsRowIcon}/>
                  <div className={styles.chipsWrap}>
                    {project.pdfSections!.map((s, i) => (
                      <span key={i} className={styles.sectionChip}>
                        <button className={styles.sectionChipLabel} onClick={() => openPdfAt(s.page, s, i)}>{s.label}</button>
                        <button className={styles.sectionChipRemove} onClick={() => removeSection(i)} aria-label={`Remove ${s.label}`}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {project.pdfKey && project.photoKey && (
                <div className={styles.sectionChips}>
                  <ImageIcon size={13} className={styles.chipsRowIcon}/>
                  <div className={styles.chipsWrap}>
                    <span className={styles.sectionChip}>
                      <button className={styles.sectionChipLabel} onClick={openPhotoPicker}>Project Photo</button>
                      <button className={styles.sectionChipRemove} onClick={removePhoto} aria-label="Remove photo">✕</button>
                    </span>
                  </div>
                </div>
              )}
              {project.pdfKey && (project.keyImages ?? []).length > 0 && (
                <div className={styles.sectionChips}>
                  <InfoIcon size={13} className={styles.chipsRowIcon}/>
                  <div className={styles.chipsWrap}>
                    {(project.keyImages ?? []).map((key: ProjectKeyImage) => (
                      <span key={key.id} className={styles.sectionChip}>
                        <span className={styles.keyChipLabel}>{key.name}</span>
                        <button className={styles.sectionChipRemove} onClick={() => removeKey(key.id)} aria-label={`Remove ${key.name}`}>✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {(project.freeCounters?.length ?? 0) > 0 && (
                <div className={styles.sectionChips}>
                  <HashIcon size={13} className={styles.chipsRowIcon}/>
                  <div className={styles.chipsWrap}>
                    {project.freeCounters!.map(counter => (
                      <span
                        key={counter.id}
                        className={`${styles.sectionChip} ${styles.counterChipWrapper} ${chipMenuId === counter.id ? styles.counterChipActive : ''}`}
                        style={{ background: counter.color ?? '#3CCFEF', color: textColorForBg(counter.color ?? '#3CCFEF'), border: 'none' }}
                      >
                        <button
                          className={styles.counterChipBody}
                          onClick={() => {
                            if (chipMenuId === counter.id) { setChipMenuId(null) }
                            else {
                              setChipMenuId(counter.id)
                              setChipEditName(counter.name)
                              setChipEditColor(counter.color ?? COUNTER_PALETTE[0])
                              setChipEditTriggerEvery(counter.triggerEvery ? String(counter.triggerEvery) : '')
                              setChipEditResetAt(counter.resetAt ? String(counter.resetAt) : '')
                              setChipEditCountDown(counter.countDown ?? false)
                            }
                          }}
                        >
                          <span className={styles.counterChipName}>{counter.name}</span>
                          <span className={styles.counterChipValue}>{counter.value}</span>
                          {counter.triggerEvery && <span className={styles.counterChipLinked}>÷{counter.triggerEvery}</span>}
                        </button>
                        <button
                          className={styles.sectionChipRemove}
                          style={{ color: 'inherit' }}
                          onClick={() => { deleteCounter(project.id, counter.id); if (chipMenuId === counter.id) setChipMenuId(null) }}
                          aria-label={`Remove ${counter.name}`}
                        >✕</button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {/* Action panel — edit/reset/delete for selected chip */}
              {chipMenuId && chipMenuId !== 'add' && (
                <CounterFormPanel
                  name={chipEditName}
                  color={chipEditColor}
                  triggerEvery={chipEditTriggerEvery}
                  resetAt={chipEditResetAt}
                  countDown={chipEditCountDown}
                  onNameChange={setChipEditName}
                  onColorChange={setChipEditColor}
                  onTriggerEveryChange={setChipEditTriggerEvery}
                  onResetAtChange={setChipEditResetAt}
                  onCountDownChange={setChipEditCountDown}
                  confirmLabel="Save"
                  onConfirm={() => {
                    if (!chipEditName.trim()) return
                    const te = parseInt(chipEditTriggerEvery)
                    const ra = parseInt(chipEditResetAt)
                    updateProject(project.id, {
                      freeCounters: (project.freeCounters ?? []).map(c =>
                        c.id === chipMenuId ? {
                          ...c,
                          name: chipEditName.trim(),
                          color: chipEditColor,
                          triggerEvery: te > 0 ? te : undefined,
                          resetAt: ra > 0 ? ra : undefined,
                          countDown: chipEditCountDown || undefined,
                        } : c
                      ),
                    })
                    setChipMenuId(null)
                  }}
                  onCancel={() => setChipMenuId(null)}
                  extraActions={
                    <>
                      <button
                        className={styles.inlineCancel}
                        onClick={() => {
                          updateProject(project.id, {
                            freeCounters: (project.freeCounters ?? []).map(c =>
                              c.id === chipMenuId ? { ...c, value: 0 } : c
                            ),
                          })
                          setChipMenuId(null)
                        }}
                      >Reset to 0</button>
                      <button
                        className={styles.counterDeleteBtn}
                        onClick={() => { deleteCounter(project.id, chipMenuId); setChipMenuId(null) }}
                      >
                        <TrashIcon size={12}/> Delete
                      </button>
                    </>
                  }
                />
              )}
              {/* Add form */}
              {chipMenuId === 'add' && (
                <CounterFormPanel
                  name={chipEditName}
                  color={chipEditColor}
                  triggerEvery={chipEditTriggerEvery}
                  resetAt={chipEditResetAt}
                  countDown={chipEditCountDown}
                  onNameChange={setChipEditName}
                  onColorChange={setChipEditColor}
                  onTriggerEveryChange={setChipEditTriggerEvery}
                  onResetAtChange={setChipEditResetAt}
                  onCountDownChange={setChipEditCountDown}
                  confirmLabel="Add"
                  onConfirm={() => {
                    if (!chipEditName.trim()) return
                    const te = parseInt(chipEditTriggerEvery)
                    const ra = parseInt(chipEditResetAt)
                    addCounter(project.id, {
                      name: chipEditName.trim(),
                      color: chipEditColor,
                      triggerEvery: te > 0 ? te : undefined,
                      resetAt: ra > 0 ? ra : undefined,
                      countDown: chipEditCountDown || undefined,
                    })
                    setChipEditName('')
                    setChipMenuId(null)
                  }}
                  onCancel={() => setChipMenuId(null)}
                />
              )}
              <div className={styles.sectionDivider}>
                <ChartGridIcon size={11}/>Charts
                <button className={styles.chartDeleteBtn} onClick={() => navigate(`/project/${project.id}/setup?step=3&picker=true`)} aria-label="Add chart" style={{ marginLeft: 'auto', color: 'var(--accent)', opacity: 1, fontSize: 16, fontWeight: 300, lineHeight: 1 }}>+</button>
              </div>
              {(project.charts?.length ?? 0) === 0 ? (
                <div className={styles.emptyState}>No charts yet — use + above to import</div>
              ) : (
                project.charts!.map(chart => (
                  <div key={chart.id} className={styles.chartRow}>
                    <ChartGridIcon size={14}/>
                    <span className={styles.chartRowName}>{chart.name}</span>
                    {chart.totalRows > 0 && (
                      <span className={styles.chartRowMeta}>{chart.totalRows}r</span>
                    )}
                    <div className={styles.chartRowActions}>
                      <button className={styles.addBtn} onClick={() => setShapingModalChart(chart)} aria-label="Interval steps"><RepeatIcon style={{ width: 14, height: 18 }}/></button>
                      <button className={styles.addBtn} onClick={() => setEditModalChart(chart)} aria-label="Edit chart"><PencilIcon size={14}/></button>
                      <button className={styles.chartDeleteBtn} onClick={() => deleteChart(chart.id)} aria-label="Remove chart">✕</button>
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

              {/* Designer */}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Designer</span>
                <span className={styles.detailVal}>{project.designer ?? <span className={styles.missing}>Not recorded</span>}</span>
                <button className={styles.addBtn} onClick={() => openEdit('designer')} aria-label="Edit designer">
                  {project.designer ? <PencilIcon size={14}/> : 'Add'}
                </button>
              </div>
              {editingField === 'designer' && (
                <div className={styles.inlineForm}>
                  <label className={styles.inlineLabel} style={{ flex: 1 }}>
                    Designer
                    <input type="text" className={styles.inlineInput} style={{ width: '100%' }}
                      value={designerForm} onChange={e => setDesignerForm(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveDesigner()}
                      placeholder="e.g. Audrey Borrego, self-designed…" />
                  </label>
                  <div className={styles.inlineActions}>
                    <button className={styles.inlineSave} onClick={saveDesigner}>Save</button>
                    <button className={styles.inlineCancel} onClick={() => setEditingField(null)}>Cancel</button>
                  </div>
                </div>
              )}
              {/* Needle */}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Needle</span>
                <span className={styles.detailVal}>
                  {project.needle
                    ? [
                        NEEDLE_SIZES.find(n => n.mm === project.needle!.sizeMm)?.label ?? `${project.needle.sizeMm}mm`,
                        project.needle.type.replace(/-/g, ' '),
                        project.needle.cableLength ? `${project.needle.cableLength}cm cable` : null,
                      ].filter(Boolean).join(' · ')
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
                  <select
                    className={styles.inlineSelect}
                    value={needleForm.cableLength ?? ''}
                    onChange={e => setNeedleForm(f => ({ ...f, cableLength: e.target.value ? parseInt(e.target.value) : undefined }))}
                  >
                    <option value="">No cable</option>
                    {[40, 60, 80, 100, 120].map(l => <option key={l} value={l}>{l}cm cable</option>)}
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
                  {project.yarn
                    ? [
                        [project.yarn.brand, project.yarn.name].filter(Boolean).join(' ') || undefined,
                        project.yarn.weight,
                        project.yarn.colorway,
                      ].filter(Boolean).join(' · ')
                    : <span className={styles.missing}>Not recorded</span>}
                </span>
                <button className={styles.addBtn} onClick={() => openEdit('yarn')} aria-label="Edit yarn">
                  {project.yarn ? <PencilIcon size={14}/> : 'Add'}
                </button>
              </div>
              {editingField === 'yarn' && (
                <div className={styles.inlineForm}>
                  <label className={styles.inlineLabel}>
                    Brand
                    <input type="text" className={styles.inlineInput}
                      value={yarnForm.brand ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, brand: e.target.value }))} />
                  </label>
                  <label className={styles.inlineLabel}>
                    Name
                    <input type="text" className={styles.inlineInput}
                      value={yarnForm.name ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, name: e.target.value }))} />
                  </label>
                  <label className={styles.inlineLabel}>
                    Weight
                    <select className={styles.inlineSelect}
                      value={yarnForm.weight ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, weight: e.target.value as YarnWeight || undefined }))}>
                      <option value="">— select —</option>
                      {(['lace','fingering','sport','dk','worsted','aran','bulky','super-bulky'] as YarnWeight[]).map(w => (
                        <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.inlineLabel}>
                    Colorway
                    <input type="text" className={styles.inlineInput}
                      value={yarnForm.colorway ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, colorway: e.target.value }))} />
                  </label>
                  <label className={styles.inlineLabel}>
                    Fibre Content
                    <input type="text" className={styles.inlineInput}
                      value={yarnForm.fiberContent ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, fiberContent: e.target.value }))}
                      placeholder="e.g. 100% Merino" />
                  </label>
                  <label className={styles.inlineLabel}>
                    Dye Lot
                    <input type="text" className={styles.inlineInput}
                      value={yarnForm.dyeLot ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, dyeLot: e.target.value }))}
                      placeholder="e.g. DL-4821" />
                  </label>
                  <label className={styles.inlineLabel}>
                    Skeins
                    <input type="number" min={1} className={styles.inlineInput}
                      value={yarnForm.skeins ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, skeins: e.target.value ? parseInt(e.target.value) : undefined }))} />
                  </label>
                  <label className={styles.inlineLabel}>
                    Yards / Skein
                    <input type="number" min={1} className={styles.inlineInput}
                      value={yarnForm.yardsPerSkein ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, yardsPerSkein: e.target.value ? parseInt(e.target.value) : undefined }))} />
                  </label>
                  <label className={styles.inlineLabel}>
                    Supplier
                    <input type="text" className={styles.inlineInput}
                      value={yarnForm.supplier ?? ''}
                      onChange={e => setYarnForm(f => ({ ...f, supplier: e.target.value }))}
                      placeholder="e.g. local yarn store…" />
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

              {/* Tags */}
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Tags</span>
                <span className={styles.detailVal}>
                  {project.tags?.length ? (
                    <span className={styles.tagChips}>
                      {project.tags.map(t => (
                        <span key={t} className={styles.tagChip}>{t}</span>
                      ))}
                    </span>
                  ) : (
                    <span className={styles.missing}>None</span>
                  )}
                </span>
                <button className={styles.addBtn} onClick={() => openEdit('tags')} aria-label="Edit tags">
                  {project.tags?.length ? <PencilIcon size={14}/> : 'Add'}
                </button>
              </div>
              {editingField === 'tags' && (
                <div className={styles.inlineForm} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                  {tagsForm.length > 0 && (
                    <div className={styles.tagEditRow}>
                      {tagsForm.map(t => (
                        <span key={t} className={styles.tagEditChip}>
                          {t}
                          <button className={styles.tagChipRemove} onClick={() => setTagsForm(f => f.filter(x => x !== t))}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  {tagList.filter(t => !tagsForm.includes(t)).length > 0 && (
                    <div className={styles.tagPickerSection}>
                      <span className={styles.tagPickerLabel}>Existing:</span>
                      {tagList.filter(t => !tagsForm.includes(t)).map(t => (
                        <button key={t} type="button" className={styles.tagPickerChip}
                          onClick={() => setTagsForm(f => [...f, t])}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    className={styles.tagAddInput}
                    style={{ width: '100%', maxWidth: 280 }}
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { e.preventDefault(); addTagFromInput() }
                    }}
                    placeholder="New tag — comma to add several"
                    autoComplete="off"
                  />
                  <div className={styles.inlineActions}>
                    <button className={styles.inlineSave} onClick={saveTags}>Save</button>
                    <button className={styles.inlineCancel} onClick={() => { setEditingField(null); setTagInput('') }}>Cancel</button>
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

          {/* Project actions */}
          <div className={styles.projectActions}>
            <button
              className={styles.pageIconBtn}
              title={project.status === 'archived' ? 'Unarchive' : 'Archive'}
              onClick={() => updateProject(project.id, { status: project.status === 'archived' ? 'paused' : 'archived' })}
            >
              <ArchiveIcon size={14}/>
            </button>
            <button
              className={`${styles.pageIconBtn} ${styles.pageIconBtnDanger}`}
              title="Delete project"
              onClick={() => { if (window.confirm(`Delete "${project.name}"? This cannot be undone.`)) { deleteProject(project.id); navigate('/dashboard') } }}
            >
              <TrashIcon size={14}/>
            </button>
          </div>

        </div>
      </div>
  )
}

