import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import type { Project, NeedleType, YarnWeight, ProjectChart } from '../types'
import PDFPagePicker, { type PageSelection } from '../components/import/PDFPagePicker'
import styles from './ProjectSetup.module.css'

interface SetupState {
  name: string
  category: string
  designer: string
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
  name: '', category: 'Sweater / Jumper', designer: '',
  totalRows: 16, chartRepeatStartRow: 1,
  yarnBrand: '', yarnName: '', yarnWeight: '', colorway: '',
  fiberContent: '', dyeLot: '', skeins: '', yardsPerSkein: '', supplier: '',
  needleSizeMm: 4, needleType: 'circular-fixed', cableLength: '',
  gaugeStitches: '', gaugeRows: '', notes: '',
}

const NEEDLE_SIZES = [2, 2.5, 3, 3.25, 3.5, 3.75, 4, 4.5, 5, 5.5, 6, 6.5, 7, 8, 10, 12]
const STEPS = ['Basics', 'Yarn', 'Needles', 'Pattern', 'Review']

export default function ProjectSetup() {
  const navigate = useNavigate()
  const { addProject } = useProjectStore()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<SetupState>(INITIAL)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [showPagePicker, setShowPagePicker] = useState(false)
  const [pageSelections, setPageSelections] = useState<PageSelection[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof SetupState, value: any) =>
    setForm(f => ({ ...f, [key]: value }))

  const nextStep = () => setStep(s => Math.min(s + 1, STEPS.length - 1))
  const prevStep = () => setStep(s => Math.max(s - 1, 0))
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfFile(file)
    // Auto-fill name from filename if not set
    if (!form.name) {
      const name = file.name.replace('.pdf', '').replace(/[-_]/g, ' ')
      set('name', name.charAt(0).toUpperCase() + name.slice(1))
    }
  }

  const handlePagePickerComplete = (selections: PageSelection[]) => {
    setPageSelections(selections)
    setShowPagePicker(false)
    nextStep()
  }

  const handleSaveDraft = async () => {
    const now = new Date().toISOString()
    const draft: Project = {
      id: `draft-${Date.now()}`,
      name: form.name || 'Untitled Draft',
      status: 'waiting',
      category: form.category,
      currentRow: 1,
      totalRows: form.totalRows,
      totalRowsWorked: 0,
      chartRepeatStartRow: form.chartRepeatStartRow,
      createdAt: now,
      updatedAt: now,
      notes: form.notes || undefined,
      needle: form.needleSizeMm ? {
        sizeMm: form.needleSizeMm,
        type: form.needleType,
      } : undefined,
      yarn: (form.yarnBrand || form.yarnName) ? {
        brand: form.yarnBrand || undefined,
        name: form.yarnName || undefined,
      } : undefined,
    }
    addProject(draft)
    navigate('/dashboard')
  }

  const handleCreate = () => {
    const now = new Date().toISOString()
    const confirmedSelections = pageSelections.filter(s => s.role === 'chart' && s.confirmed)
    const projectCharts: ProjectChart[] = confirmedSelections.map((sel, i) => ({
      id: `chart-${Date.now()}-${i}`,
      name: sel.chartName ?? `Chart ${i + 1}`,
      totalRows: sel.totalRows ?? 0,
      totalStitches: sel.totalStitches ?? 0,
      repeatStartRow: 1,
      workedInRound: false,
      symbols: [],
      flags: [],
      imageBase64: sel.croppedBase64 || sel.imageBase64,
    }))

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: form.name || 'Untitled Project',
      status: 'active',
      category: form.category,
      currentRow: 1,
      totalRows: projectCharts[0]?.totalRows || form.totalRows,
      totalRowsWorked: 0,
      chartRepeatStartRow: 1,
      createdAt: now,
      updatedAt: now,
      lastSessionAt: now.split('T')[0],
      startedAt: now.split('T')[0],
      notes: form.notes || undefined,
      photo: undefined,
      charts: projectCharts.length > 0 ? projectCharts : undefined,
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
    addProject(newProject)
    navigate(`/project/${newProject.id}`)
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

      {/* Top bar */}
      <div className={styles.topbar}>
        <button className={styles.tbBack} onClick={() => step === 0 ? navigate('/dashboard') : prevStep()}>
          ← {step === 0 ? 'Dashboard' : 'Back'}
        </button>
        <span className={styles.tbTitle}>New Project — {STEPS[step]}</span>
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
              <div className={styles.stepHeading}>Start a new project</div>
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
                    {['Sweater / Jumper','Cardigan','Hat','Mittens / Gloves','Socks','Cowl / Scarf','Shawl','Blanket','Other'].map(c => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label className={styles.fieldLabel}>Designer <span className={styles.optional}>optional</span></label>
                  <input className={styles.input} value={form.designer}
                    onChange={e => set('designer', e.target.value)}
                    placeholder="e.g. Audrey Borrego, self-designed…" />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 3: PATTERN UPLOAD ── */}
          {step === 3 && (
            <div className={styles.stepPanel}>
              <div className={styles.stepHeading}>Upload your pattern</div>
              <div className={styles.stepSub}>Upload a PDF then select which pages contain charts</div>

              {/* PDF Upload */}
              <div className={styles.card}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                {!pdfFile ? (
                  <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--ink-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <div className={styles.uploadTitle}>Tap to upload PDF</div>
                    <div className={styles.uploadSub}>Your pattern file</div>
                  </div>
                ) : (
                  <div className={styles.fileSelected}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ok)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div className={styles.fileName}>{pdfFile.name}</div>
                    <button className={styles.changeFile} onClick={() => fileInputRef.current?.click()}>Change</button>
                  </div>
                )}
              </div>

              {/* Chart page selection — only shown after PDF upload */}
              {pdfFile && (
                <div className={styles.card}>
                  <div className={styles.cardTitle}>Chart Pages</div>
                  {pageSelections.filter(s => s.role === 'chart').length === 0 ? (
                    <div className={styles.noCharts}>
                      <div className={styles.noChartsText}>Select which pages contain charts — AI will read them after setup</div>
                      <button className={styles.selectPagesBtn} onClick={() => setShowPagePicker(true)}>
                        Select Pages from PDF →
                      </button>
                    </div>
                  ) : (
                    <>
                      {pageSelections.filter(s => s.role === 'chart').map(s => (
                        <div key={s.pageNumber} className={styles.chartRow}>
                          <span className={styles.chartRowName}>{s.chartName ?? `Chart (p.${s.pageNumber})`}</span>
                          <span className={styles.chartRowPage}>Page {s.pageNumber}</span>
                        </div>
                      ))}
                      {pageSelections.find(s => s.role === 'photo') && (
                        <div className={styles.chartRow}>
                          <span className={styles.chartRowName} style={{ color: 'var(--warn)' }}>Project photo selected</span>
                          <span className={styles.chartRowPage}>Page {pageSelections.find(s => s.role === 'photo')?.pageNumber}</span>
                        </div>
                      )}
                      <div className={styles.parseNote}>
                        AI will parse {pageSelections.filter(s => s.role === 'chart').length} chart{pageSelections.filter(s => s.role === 'chart').length !== 1 ? 's' : ''} after you tap Start Knitting
                      </div>
                      <button className={styles.selectPagesBtn} onClick={() => setShowPagePicker(true)}>
                        Change Selection
                      </button>
                    </>
                  )}
                </div>
              )}


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
                <div className={styles.pillRow}>
                  {NEEDLE_SIZES.map(size => (
                    <button key={size}
                      className={`${styles.pill} ${form.needleSizeMm === size ? styles.pillSel : ''}`}
                      onClick={() => set('needleSizeMm', size)}>
                      {size}mm
                    </button>
                  ))}
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
                    <input className={styles.input} type="number" value={form.gaugeStitches} onChange={e => set('gaugeStitches', e.target.value)} placeholder="22" />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.fieldLabel}>Rows per 10cm</label>
                    <input className={styles.input} type="number" value={form.gaugeRows} onChange={e => set('gaugeRows', e.target.value)} placeholder="28" />
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
                  { label: 'Needle', val: `${form.needleSizeMm}mm · ${form.needleType.replace(/-/g, ' ')}`, s: 2 },
                ].map(({ label, val, s }) => (
                  <div key={label} className={styles.reviewRow}>
                    <span className={styles.reviewLabel}>{label}</span>
                    <span className={styles.reviewVal}>{val}</span>
                    <button className={styles.reviewEdit} onClick={() => setStep(s)}>Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        {step < 4 && step !== 3 && (
          <button className={styles.skipBtn} onClick={nextStep}>Skip for now</button>
        )}
        {form.name && (
          <button className={styles.draftBtn} onClick={handleSaveDraft}>Save Draft</button>
        )}
        <div className={styles.spacer} />
        {step < 4
          ? <button className={styles.btnPrimary} onClick={nextStep} disabled={step === 0 && !form.name}>
              Next →
            </button>
          : <button className={styles.btnPrimary} onClick={handleCreate} disabled={!form.name}>
              Start Knitting →
            </button>
        }
      </div>

    </div>
  )
}
