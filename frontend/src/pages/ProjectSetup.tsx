import { useState, useRef, useMemo } from 'react'
import { UploadIcon, FileCheckIcon, ChevronLeftIcon, ChevronRightIcon, PencilIcon } from '../components/icons'
import { savePDF, saveImage } from '../store/imageStore'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useProjectStore, selectTagList } from '../store/projectStore'
import type { Project, NeedleType, YarnWeight, ProjectChart } from '../types'
import PDFPagePicker, { type PageSelection } from '../components/import/PDFPagePicker'
import ChartEditModal from '../components/import/ChartEditModal'
import { CATEGORY_GROUPS } from '../data/categories'
import styles from './ProjectSetup.module.css'

interface SetupState {
  name: string
  category: string
  designer: string
  tags: string[]
  totalRows: number
  chartRepeatStartRow: number
  yarnBrand: string
  yarnName: string
  yarnWeight: YarnWeight | ''
  colorway: string
  fiberContent: string
  dyeLot: string
  skeins: string
  yardsPerSkein: string
  supplier: string
  needleSizeMm: number
  needleType: NeedleType
  cableLength: string
  gaugeStitches: string
  gaugeRows: string
  notes: string
}

const INITIAL: SetupState = {
  name: '', category: 'Sweaters', designer: '', tags: [],
  totalRows: 16, chartRepeatStartRow: 1,
  yarnBrand: '', yarnName: '', yarnWeight: '', colorway: '',
  fiberContent: '', dyeLot: '', skeins: '', yardsPerSkein: '', supplier: '',
  needleSizeMm: 4, needleType: 'circular-fixed', cableLength: '',
  gaugeStitches: '', gaugeRows: '', notes: '',
}

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
const STEPS = ['Basics', 'Yarn', 'Needles', 'Pattern', 'Review']

export default function ProjectSetup() {
  const navigate = useNavigate()
  const { id: editId } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const { projects, addProject, updateProject } = useProjectStore()
  const tagList = selectTagList(projects)

  const existingProject = useMemo(
    () => editId ? projects.find(p => p.id === editId) : undefined,
    [editId, projects]
  )

  const initialForm = useMemo<SetupState>(() => {
    if (!existingProject) return INITIAL
    const p = existingProject
    return {
      name: p.name ?? '',
      category: p.category ?? 'Sweaters',
      designer: p.designer ?? '',
      tags: p.tags ?? [],
      totalRows: p.totalRows ?? 16,
      chartRepeatStartRow: p.chartRepeatStartRow ?? 1,
      yarnBrand: p.yarn?.brand ?? '',
      yarnName: p.yarn?.name ?? '',
      yarnWeight: p.yarn?.weight ?? '',
      colorway: p.yarn?.colorway ?? '',
      fiberContent: p.yarn?.fiberContent ?? '',
      dyeLot: p.yarn?.dyeLot ?? '',
      skeins: p.yarn?.skeins?.toString() ?? '',
      yardsPerSkein: p.yarn?.yardsPerSkein?.toString() ?? '',
      supplier: p.yarn?.supplier ?? '',
      needleSizeMm: p.needle?.sizeMm ?? 4,
      needleType: p.needle?.type ?? 'circular-fixed',
      cableLength: p.needle?.cableLength?.toString() ?? '',
      gaugeStitches: p.gauge?.stitchesPer10cm?.toString() ?? '',
      gaugeRows: p.gauge?.rowsPer10cm?.toString() ?? '',
      notes: p.notes ?? '',
    }
  }, [existingProject])

  const startStep = Math.min(Math.max(parseInt(searchParams.get('step') ?? '0') || 0, 0), STEPS.length - 1)
  const [step, setStep] = useState(startStep)
  const [form, setForm] = useState<SetupState>(initialForm)
  const [tagInput, setTagInput] = useState('')
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [showPagePicker, setShowPagePicker] = useState(false)
  const [pageSelections, setPageSelections] = useState<PageSelection[]>([])
  const [pdfPageCount, setPdfPageCount] = useState(0)
  const [chartEdits, setChartEdits] = useState<Record<string, Partial<ProjectChart>>>({})
  const [deletedChartIds, setDeletedChartIds] = useState<Set<string>>(new Set())
  const [editModalChart, setEditModalChart] = useState<ProjectChart | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof SetupState, value: any) =>
    setForm(f => ({ ...f, [key]: value }))

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const prevStep = () => setStep(s => Math.max(s - 1, 0))
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (pdfFile && file.name !== pdfFile.name) {
      setPageSelections([])
      setPdfPageCount(0)
    }
    setPdfFile(file)
    if (!form.name) {
      const name = file.name.replace('.pdf', '').replace(/[-_]/g, ' ')
      set('name', name.charAt(0).toUpperCase() + name.slice(1))
    }
  }

  const handlePagePickerComplete = (selections: PageSelection[], totalPages: number) => {
    setPageSelections(selections)
    setPdfPageCount(totalPages)
    setShowPagePicker(false)
    nextStep()
  }

  const commitPendingTagInput = () => {
    if (!tagInput.trim()) return form.tags
    const parts = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
    const merged = [...new Set([...form.tags, ...parts])]
    set('tags', merged)
    setTagInput('')
    return merged
  }

  const handleSaveDraft = async () => {
    const finalTags = commitPendingTagInput()
    const draftFields = {
      name: form.name || 'Untitled Draft',
      status: 'waiting' as const,
      category: form.category,
      designer: form.designer || undefined,
      tags: finalTags.length > 0 ? finalTags : undefined,
      totalRows: form.totalRows,
      chartRepeatStartRow: form.chartRepeatStartRow,
      notes: form.notes || undefined,
      needle: form.needleSizeMm ? { sizeMm: form.needleSizeMm, type: form.needleType } : undefined,
      yarn: (form.yarnBrand || form.yarnName) ? {
        brand: form.yarnBrand || undefined,
        name: form.yarnName || undefined,
      } : undefined,
    }
    if (existingProject) {
      updateProject(existingProject.id, draftFields)
      navigate(`/project/${existingProject.id}`)
    } else {
      const now = new Date().toISOString()
      addProject({ id: `draft-${Date.now()}`, currentRow: 1, totalRowsWorked: 0, createdAt: now, updatedAt: now, ...draftFields })
      navigate('/dashboard')
    }
  }

  const handleCreate = async () => {
    const createTags = commitPendingTagInput()
    const now = new Date().toISOString()
    const projectId = existingProject ? existingProject.id : `proj-${Date.now()}`

    let pdfKey: string | undefined = existingProject?.pdfKey
    let finalPageCount: number = existingProject?.pdfPageCount ?? pdfPageCount
    if (pdfFile) {
      pdfKey = `pdf-${projectId}`
      finalPageCount = pdfPageCount
      const ab = await pdfFile.arrayBuffer()
      await savePDF(pdfKey, ab)
    }

    let photoKey: string | undefined = existingProject?.photoKey
    const photoSel = pageSelections.find(s => s.role === 'photo' && s.croppedBase64)
    if (photoSel?.croppedBase64) {
      photoKey = `photo-${projectId}`
      await saveImage(photoKey, photoSel.croppedBase64)
    }

    const confirmedSelections = pageSelections.filter(s => s.role === 'chart' && s.confirmed)
    const projectCharts: ProjectChart[] = await Promise.all(confirmedSelections.map(async (sel, i) => {
      const chartId = `chart-${Date.now()}-${i}`
      const imageSrc = sel.croppedBase64 || sel.imageBase64
      const imageKey = imageSrc ? `chart-img-${chartId}` : undefined
      const pageKey = sel.imageBase64 ? `chart-page-${chartId}` : undefined
      if (imageKey && imageSrc) await saveImage(imageKey, imageSrc)
      if (pageKey && sel.imageBase64) await saveImage(pageKey, sel.imageBase64)
      return {
        id: chartId,
        name: sel.chartName ?? `Chart ${i + 1}`,
        totalRows: sel.totalRows ?? 0,
        totalStitches: sel.totalStitches ?? 0,
        repeatStartRow: 1,
        workedInRound: sel.workedInRound ?? false,
        symbols: [],
        flags: [],
        imageKey,
        pageKey,
      }
    }))

    const newProject: Project = {
      id: projectId,
      name: form.name || 'Untitled Project',
      status: 'active',
      category: form.category,
      designer: form.designer || undefined,
      tags: createTags.length > 0 ? createTags : undefined,
      currentRow: 1,
      totalRows: projectCharts[0]?.totalRows || form.totalRows,
      totalRowsWorked: 0,
      chartRepeatStartRow: 1,
      createdAt: now,
      updatedAt: now,
      lastSessionAt: now.split('T')[0],
      startedAt: now.split('T')[0],
      notes: form.notes || undefined,
      photoKey: photoKey,
      charts: projectCharts.length > 0 ? projectCharts : undefined,
      pdfKey: pdfKey,
      pdfPageCount: finalPageCount || undefined,
      needle: {
        sizeMm: form.needleSizeMm,
        type: form.needleType,
        cableLength: form.cableLength ? parseInt(form.cableLength) : undefined,
      },
      yarn: (form.yarnBrand || form.yarnName) ? {
        brand: form.yarnBrand || undefined,
        name: form.yarnName || undefined,
        weight: (form.yarnWeight as YarnWeight) || undefined,
        colorway: form.colorway || undefined,
        fiberContent: form.fiberContent || undefined,
        dyeLot: form.dyeLot || undefined,
        skeins: form.skeins ? parseInt(form.skeins) : undefined,
        yardsPerSkein: form.yardsPerSkein ? parseInt(form.yardsPerSkein) : undefined,
        supplier: form.supplier || undefined,
      } : undefined,
      gauge: (form.gaugeStitches && form.gaugeRows) ? {
        stitchesPer10cm: parseFloat(form.gaugeStitches),
        rowsPer10cm: parseFloat(form.gaugeRows),
      } : undefined,
    }
    if (existingProject) {
      updateProject(existingProject.id, {
        ...newProject,
        id: existingProject.id,
        createdAt: existingProject.createdAt,
        currentRow: existingProject.currentRow,
        totalRowsWorked: existingProject.totalRowsWorked,
        charts: (() => {
          const merged = (existingProject.charts ?? [])
            .filter(c => !deletedChartIds.has(c.id))
            .map(c => chartEdits[c.id] ? { ...c, ...chartEdits[c.id] } : c)
          return projectCharts.length > 0 ? [...merged, ...projectCharts] : merged
        })(),
      })
      navigate(`/project/${existingProject.id}`)
    } else {
      addProject(newProject)
      navigate(`/project/${newProject.id}`)
    }
  }

  return (
    <div className={styles.shell}>

      {/* PDF Page Picker overlay */}
      {showPagePicker && pdfFile && (
        <PDFPagePicker
          file={pdfFile}
          onComplete={handlePagePickerComplete}
          onCancel={() => setShowPagePicker(false)}
        />
      )}

      {/* Chart edit modal */}
      {editModalChart && (
        <ChartEditModal
          chart={editModalChart}
          onSave={(updates) => {
            setChartEdits(x => ({ ...x, [editModalChart.id]: { ...(x[editModalChart.id] ?? {}), ...updates } }))
            setEditModalChart(null)
          }}
          onClose={() => setEditModalChart(null)}
        />
      )}

      {/* Top bar */}
      <div className={styles.topbar}>
        <span className={styles.tbTitle}>{existingProject ? 'Edit Project' : 'New Project'} — {STEPS[step]}</span>
      </div>

      {/* Step indicators */}
      <div className={styles.stepBar}>
        {STEPS.map((label, i) => (
          <div key={i} className={styles.stepItem} onClick={() => i < step && setStep(i)}>
            <div className={`${styles.stepDot} ${i === step ? styles.stepActive : i < step ? styles.stepDone : ''}`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`${styles.stepLabel} ${i === step ? styles.stepLabelActive : i < step ? styles.stepLabelDone : ''}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && (
              <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className={styles.scroll}>
        <div className={styles.inner}>

          {/* ── STEP 0: BASICS ── */}
          {step === 0 && (
            <div className={styles.stepPanel}>
              <div className={styles.stepHeading}>{existingProject ? 'Edit project details' : 'Start a new project'}</div>
              <div className={styles.stepSub}>Give it a name and choose a category</div>
              <div className={styles.card}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Project Name</label>
                  <input className={styles.input} value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Mum's Christmas Sweater" />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Category</label>
                  <select className={styles.select} value={form.category} onChange={e => set('category', e.target.value)}>
                    {CATEGORY_GROUPS.map(({ group, options }) => (
                      <optgroup key={group} label={group}>
                        {options.map(o => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Designer <span className={styles.optional}>optional</span></label>
                  <input className={styles.input} value={form.designer}
                    onChange={e => set('designer', e.target.value)}
                    placeholder="e.g. Audrey Borrego, self-designed…" />
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Tags <span className={styles.optional}>optional</span></label>
                  {form.tags.length > 0 && (
                    <div className={styles.tagEditRow} style={{ marginBottom: 6 }}>
                      {form.tags.map(t => (
                        <span key={t} className={styles.tagEditChip}>
                          {t}
                          <button type="button" className={styles.tagChipRemove}
                            onClick={() => set('tags', form.tags.filter((x: string) => x !== t))}>×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  {tagList.filter(t => !form.tags.includes(t)).length > 0 && (
                    <div className={styles.tagPickerSection} style={{ marginBottom: 6 }}>
                      <span className={styles.tagPickerLabel}>Existing:</span>
                      {tagList.filter(t => !form.tags.includes(t)).map(t => (
                        <button key={t} type="button" className={styles.tagPickerChip}
                          onClick={() => set('tags', [...form.tags, t])}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                  <input
                    className={styles.tagAddInput}
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        const parts = tagInput.split(',').map(t => t.trim().toLowerCase()).filter(Boolean)
                        const newTags = parts.filter(t => !form.tags.includes(t))
                        if (newTags.length) set('tags', [...form.tags, ...newTags])
                        setTagInput('')
                      }
                    }}
                    placeholder="New tag — comma to add several"
                    autoComplete="off"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: PATTERN UPLOAD ── */}
          {step === 3 && (
            <div className={styles.stepPanel}>
              <div className={styles.stepHeading}>Import PDF</div>
              <div className={styles.stepSub}>
                {existingProject?.charts?.length
                  ? 'Add more charts or re-import the pattern PDF'
                  : 'Upload your pattern PDF then mark which pages contain charts'}
              </div>

              {/* Set up pattern — slim full-width bar */}
              <div className={styles.patternImportBar}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {existingProject?.charts?.length && !pdfFile ? (
                  <>
                    <span className={styles.patternBarMsg}>Pattern PDF already imported</span>
                    <button className={styles.reimportBtn} onClick={() => fileInputRef.current?.click()}>Re-import PDF</button>
                  </>
                ) : !pdfFile ? (
                  <button className={styles.patternUploadBtn} onClick={() => fileInputRef.current?.click()}>
                    <UploadIcon size={16}/>
                    Upload pattern PDF
                  </button>
                ) : (
                  <>
                    <FileCheckIcon size={16} stroke="var(--ok)"/>
                    <span className={styles.patternBarFileName}>{pdfFile.name}</span>
                    <button className={styles.changeFile} onClick={() => fileInputRef.current?.click()}>Change</button>
                    <div className={styles.patternBarSep} />
                    {pageSelections.filter(s => s.role === 'chart').length === 0 ? (
                      <button className={styles.selectPagesBtn} onClick={() => setShowPagePicker(true)}>Select pages</button>
                    ) : (
                      <button className={styles.selectPagesBtn} onClick={() => setShowPagePicker(true)}>
                        {pageSelections.filter(s => s.role === 'chart').length} chart{pageSelections.filter(s => s.role === 'chart').length !== 1 ? 's' : ''} · Edit selection
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Charts list */}
              <div className={styles.card}>
                <div className={styles.cardTitle}>Charts</div>

                {existingProject?.charts && existingProject.charts.length > 0 && existingProject.charts
                  .filter(c => !deletedChartIds.has(c.id))
                  .map((chart) => {
                    const edits = chartEdits[chart.id] ?? {}
                    const displayName = edits.name ?? chart.name
                    const displayRows = edits.totalRows ?? chart.totalRows
                    const displaySts = edits.totalStitches ?? chart.totalStitches
                    return (
                      <div key={chart.id} className={styles.chartRow}>
                        <span className={styles.chartRowName}>{displayName}</span>
                        <span className={styles.chartRowPage}>{displayRows} rows · {displaySts} sts</span>
                        <button className={styles.chartEditBtn} onClick={() => setEditModalChart({ ...chart, ...edits })} aria-label="Edit chart"><PencilIcon size={13}/></button>
                        <button className={styles.chartDeleteBtn} onClick={() => setDeletedChartIds(s => new Set([...s, chart.id]))}>✕</button>
                      </div>
                    )
                  })
                }

                {pageSelections.filter(s => s.role === 'chart').map(s => (
                  <div key={s.pageNumber} className={styles.chartRow}>
                    <span className={styles.chartRowName}>{s.chartName ?? `Chart (p.${s.pageNumber})`}</span>
                    <span className={styles.chartRowPage}>p.{s.pageNumber} · new</span>
                  </div>
                ))}

                {pageSelections.find(s => s.role === 'photo') && (
                  <div className={styles.chartRow}>
                    <span className={styles.chartRowName} style={{ color: 'var(--warn)' }}>Project photo</span>
                    <span className={styles.chartRowPage}>p.{pageSelections.find(s => s.role === 'photo')?.pageNumber}</span>
                  </div>
                )}

                {(!existingProject?.charts?.length && pageSelections.filter(s => s.role === 'chart').length === 0) && (
                  <div className={styles.noChartsText} style={{ padding: '8px 0' }}>No charts yet — upload a PDF to get started</div>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 1: YARN ── */}
          {step === 1 && (
            <div className={styles.stepPanel}>
              <div className={styles.stepHeading}>Yarn details</div>
              <div className={styles.stepSub}>Record everything — you'll thank yourself later</div>
              <div className={styles.card}>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Brand</label>
                    <input className={styles.input} value={form.yarnBrand} onChange={e => set('yarnBrand', e.target.value)} placeholder="e.g. Rowan" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Yarn Name</label>
                    <input className={styles.input} value={form.yarnName} onChange={e => set('yarnName', e.target.value)} placeholder="e.g. Felted Tweed" />
                  </div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Weight</label>
                    <select className={styles.select} value={form.yarnWeight} onChange={e => set('yarnWeight', e.target.value)}>
                      <option value="">— Select —</option>
                      {['lace','fingering','sport','dk','worsted','aran','bulky','super-bulky'].map(w => (
                        <option key={w} value={w}>{w.charAt(0).toUpperCase() + w.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Colorway</label>
                    <input className={styles.input} value={form.colorway} onChange={e => set('colorway', e.target.value)} placeholder="e.g. Storm Blue" />
                  </div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Fibre Content</label>
                    <input className={styles.input} value={form.fiberContent} onChange={e => set('fiberContent', e.target.value)} placeholder="e.g. 100% Merino" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Dye Lot</label>
                    <input className={styles.input} value={form.dyeLot} onChange={e => set('dyeLot', e.target.value)} placeholder="e.g. DL-4821" />
                  </div>
                </div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Skeins</label>
                    <input className={styles.input} type="number" min={1} value={form.skeins} onChange={e => set('skeins', e.target.value)} placeholder="4" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Yards per Skein</label>
                    <input className={styles.input} type="number" min={1} value={form.yardsPerSkein} onChange={e => set('yardsPerSkein', e.target.value)} placeholder="175" />
                  </div>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Supplier <span className={styles.optional}>optional</span></label>
                  <input className={styles.input} value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="e.g. local yarn store…" />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: NEEDLES ── */}
          {step === 2 && (
            <div className={styles.stepPanel}>
              <div className={styles.stepHeading}>Needles & gauge</div>
              <div className={styles.stepSub}>Used for project details and compatibility checks</div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Needle Size</div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <select
                      className={styles.select}
                      value={form.needleSizeMm}
                      onChange={e => set('needleSizeMm', parseFloat(e.target.value))}
                    >
                      {NEEDLE_SIZES.map(n => (
                        <option key={n.mm} value={n.mm}>{n.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.fieldRow} style={{ marginTop: 12 }}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Type</label>
                    <select className={styles.select} value={form.needleType} onChange={e => set('needleType', e.target.value as NeedleType)}>
                      <option value="circular-fixed">Circular — fixed</option>
                      <option value="circular-interchangeable">Circular — interchangeable</option>
                      <option value="straight">Straight</option>
                      <option value="dpn">DPN</option>
                      <option value="magic-loop">Magic loop</option>
                    </select>
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Cable Length <span className={styles.optional}>optional</span></label>
                    <select className={styles.select} value={form.cableLength} onChange={e => set('cableLength', e.target.value)}>
                      <option value="">—</option>
                      {['40','60','80','100','120'].map(l => <option key={l} value={l}>{l}cm</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Gauge Swatch <span className={styles.optional}>optional but recommended</span></div>
                <div className={styles.fieldRow}>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Stitches per 10cm</label>
                    <input className={styles.input} type="number" value={form.gaugeStitches} onChange={e => set('gaugeStitches', e.target.value)} placeholder="e.g. 22" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Rows per 10cm</label>
                    <input className={styles.input} type="number" value={form.gaugeRows} onChange={e => set('gaugeRows', e.target.value)} placeholder="e.g. 28" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 4: REVIEW ── */}
          {step === 4 && (
            <div className={styles.stepPanel}>
              <div className={styles.stepHeading}>Review & start</div>
              <div className={styles.stepSub}>Check your setup then start knitting</div>
              <div className={styles.card}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Notes <span className={styles.optional}>optional</span></label>
                  <textarea className={styles.textarea} value={form.notes}
                    onChange={e => set('notes', e.target.value)}
                    placeholder="Modifications, sizing notes, reminders…" />
                </div>
              </div>
              <div className={styles.card}>
                <div className={styles.cardTitle}>Review</div>
                {[
                  { label: 'Project', val: form.name || '—', s: 0 },
                  { label: 'Category', val: form.category, s: 0 },
                  { label: 'Pattern', val: pdfFile ? pdfFile.name : 'No PDF uploaded', s: 3 },
                  { label: 'Charts', val: pageSelections.filter(s => s.role === 'chart').length > 0
                    ? pageSelections.filter(s => s.role === 'chart').map(s => s.chartName ?? `p.${s.pageNumber}`).join(', ')
                    : `${form.totalRows} rows (manual)`, s: 3 },
                  { label: 'Yarn', val: form.yarnBrand || form.yarnName ? `${form.yarnBrand} ${form.yarnName}`.trim() : 'Not set', s: 1 },
                  { label: 'Needle', val: `${NEEDLE_SIZES.find(n => n.mm === form.needleSizeMm)?.label ?? `${form.needleSizeMm}mm`} · ${form.needleType.replace(/-/g, ' ')}`, s: 2 },
                ].map(({ label, val, s }) => (
                  <div key={label} className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>{label}</span>
                    <span className={styles.reviewVal}>{val}</span>
                    <button className={styles.reviewEdit} onClick={() => setStep(s)} aria-label="Edit"><PencilIcon size={13}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        {step > 0 && (
          <button className={styles.btnBack} onClick={prevStep} aria-label="Back"><ChevronLeftIcon size={16}/></button>
        )}
        <button className={styles.btnDiscard} onClick={() => navigate('/dashboard')}>Discard & Exit</button>
        {step < 4 && step !== 3 && (
          <button className={styles.skipBtn} onClick={nextStep}>Skip</button>
        )}
        <div className={styles.spacer} />
        {form.name && (
          <button className={styles.draftBtn} onClick={handleSaveDraft}>Save Draft</button>
        )}
        {step < 4
          ? <button className={styles.btnPrimary} onClick={nextStep} disabled={step === 0 && !form.name}>
              <ChevronRightIcon size={16}/>
            </button>
          : <button className={styles.btnPrimary} onClick={handleCreate} disabled={!form.name}>
              Start Knitting
            </button>
        }
      </div>

    </div>
  )
}
