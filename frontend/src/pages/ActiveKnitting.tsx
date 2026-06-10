import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import ChartGrid from '../components/knitting/ChartGrid'
import { GearIcon, InfoIcon, PhoneIcon, RotateArrowIcon, RepeatIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/icons'
import styles from './ActiveKnitting.module.css'

export default function ActiveKnitting() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, advanceRow, updateProject } = useProjectStore()
  const project = projects.find((p) => p.id === id)

  const [panelOpen, setPanelOpen] = useState<'legend' | 'tools' | null>(null)
  const [backMenuOpen, setBackMenuOpen] = useState(false)
  const [zoom, setZoom] = useState<'S' | 'M' | 'L' | 'XL'>('M')
  const chartAreaRef = useRef<HTMLDivElement>(null)
  const [jumpMenuOpen, setJumpMenuOpen] = useState(false)

  useEffect(() => {
    if (!project) navigate('/dashboard')
  }, [project, navigate])

  // Update lastSessionAt when user opens the knitting screen
  useEffect(() => {
    if (project) {
      updateProject(project.id, {
        lastSessionAt: new Date().toISOString().split('T')[0],
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only on mount

  // Scroll current row into view whenever row changes
  useEffect(() => {
    if (!chartAreaRef.current) return
    const currentRowEl = chartAreaRef.current.querySelector('[data-current="true"]')
    if (currentRowEl) {
      currentRowEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [project?.currentRow])

  if (!project) return null

  const pct = Math.round((project.currentRow / project.totalRows) * 100)
  const totalRowsWorked = (project as any).totalRowsWorked ?? 0
  const repeatNum = Math.floor(totalRowsWorked / project.totalRows) + 1
  const charts = project.charts ?? []
  const chartIndex = Math.max(0, charts.findIndex(c => c.id === project.activeChartId))
  const chart = charts[chartIndex] ?? charts[0]

  const getRowSide = () => {
    if (!chart) return null
    if (chart.workedInRound) return 'Rnd'
    return project.currentRow % 2 !== 0 ? 'RS' : 'WS'
  }

  const handleReset = () => {
    if (window.confirm('Reset to row 1? This will clear your progress in this session.')) {
      updateProject(project.id, {
        currentRow: project.chartRepeatStartRow ?? 1,
        totalRowsWorked: 0,
      })
    }
  }

  const handleNext = () => {
    // Always allow advance — store handles the repeat loop
    advanceRow(project.id)
  }

  const handlePrev = () => {
    const worked = project.totalRowsWorked ?? 0
    if (worked === 0) return
    const repeatStart = project.chartRepeatStartRow ?? 1
    const prevRow = project.currentRow <= repeatStart ? project.totalRows : project.currentRow - 1
    updateProject(project.id, { currentRow: prevRow, totalRowsWorked: worked - 1 })
  }

  const canGoBack = (project.totalRowsWorked ?? 0) > 0

  const togglePanel = (panel: 'legend' | 'tools') => {
    setPanelOpen(panelOpen === panel ? null : panel)
  }

  return (
    <div className={styles.shell}>
      {/* Rotate overlay — phones in portrait only */}
      <div className={styles.rotateOverlay}>
        <PhoneIcon className={styles.rotateIcon}/>
        <RotateArrowIcon className={styles.rotateArrow}/>
        <div className={styles.rotateTitle}>Rotate your device</div>
        <div className={styles.rotateSub}>WiseKnit's chart view works best in landscape mode</div>
        <div className={styles.rotateBrand}>WiseKnit by MType Workroom</div>
      </div>

      {/* Top bar */}
      <div className={styles.topbar}>
        <button className={styles.tbBack} onClick={() => navigate(`/project/${id}`)}>
          Back
        </button>
        <span className={styles.tbPattern}>{project.name}</span>
        {/* Chip 1: chart row position */}
        <div className={styles.tbChip}>
          <span className={styles.tbChipLabel}>row</span>
          <span className={styles.tbChipNum}>{project.currentRow}</span>
          <span className={styles.tbChipSep}>/</span>
          <span className={styles.tbChipSub}>{project.totalRows}</span>
        </div>
        {/* Chip 2: total worked + repeat icon */}
        <div className={styles.tbChip}>
          <span className={styles.tbChipNum}>{totalRowsWorked}</span>
          <RepeatIcon className={styles.tbRepeatIcon}/>
          <span className={styles.tbRepeatNum}>{repeatNum}</span>
        </div>
        <div className={styles.tbRight}>
          <button
            className={`${styles.tbIcon} ${panelOpen === 'tools' ? styles.tbIconActive : ''}`}
            onClick={() => togglePanel('tools')}
          >
            <GearIcon size={14}/>
          </button>
          <button
            className={`${styles.tbIcon} ${panelOpen === 'legend' ? styles.tbIconActive : ''}`}
            onClick={() => togglePanel('legend')}
          >
            <InfoIcon size={14}/>
          </button>
        </div>
      </div>

      {/* Chart area — full screen */}
      <div
        className={styles.chartArea}
        ref={chartAreaRef}
        onClick={() => { setPanelOpen(null); setBackMenuOpen(false) }}
      >
        <ChartGrid
          currentRow={project.currentRow}
          totalRows={project.totalRows}
          chart={chart}
          zoom={zoom}
        />
      </div>

      {/* Legend panel */}
      <div className={`${styles.panel} ${panelOpen === 'legend' ? styles.panelOpen : ''}`}>
        <div className={styles.panelTitle}>Stitch Key</div>
        {[
          { sym: '', label: 'K — Knit', cls: '' },
          { sym: '■', label: 'P — Purl', cls: styles.symPurl },
          { sym: 'O', label: 'YO — Yarn Over', cls: styles.symYo },
          { sym: 'K2T', label: 'K2tog — Decrease', cls: styles.symDec },
          { sym: 'C4B', label: 'C4B — Cable Back', cls: styles.symCable },
          { sym: 'C4F', label: 'C4F — Cable Front', cls: styles.symCable },
        ].map(({ sym, label, cls }) => (
          <div key={label} className={styles.legendItem}>
            <div className={`${styles.legendSym} ${cls}`}>{sym}</div>
            <span>{label}</span>
          </div>
        ))}
        <div className={styles.panelTitle} style={{ marginTop: 20 }}>Sections</div>
        {[
          { color: 'var(--section-a)', label: 'Cable Panel' },
          { color: 'var(--section-b)', label: 'Seed Stitch Border' },
          { color: 'var(--section-c)', label: 'Stockinette Body' },
        ].map(({ color, label }) => (
          <div key={label} className={styles.sectionItem}>
            <div className={styles.sectionDot} style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Tools panel */}
      <div className={`${styles.panel} ${panelOpen === 'tools' ? styles.panelOpen : ''}`}>
        <div className={styles.panelTitle}>Chart Tools</div>
        <div className={styles.zoomRow}>
          {(['S', 'M', 'L', 'XL'] as const).map(z => (
            <button
              key={z}
              className={`${styles.zoomBtn} ${zoom === z ? styles.zoomBtnActive : ''}`}
              onClick={() => setZoom(z)}
            >{z}</button>
          ))}
        </div>
        <button className={styles.resetBtn} onClick={handleReset}>
          ↺ Start Over — Reset to Row 1
        </button>
        <div className={styles.panelTitle} style={{ marginTop: 16 }}>Progress</div>
        <div className={styles.toolProgress}>
          <div className={styles.toolProgRow}>
            <span>Row {project.currentRow} of {project.totalRows}</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>


      {/* Instructions + nav bar — instructions wrap left, buttons anchored right */}
      <div className={styles.bottomBar}>
        {getRowSide() && (
          <div className={styles.instrContent}>
            <span className={styles.rowSidePill}>{getRowSide()}</span>
            {chart?.totalStitches ? (
              <span className={styles.instrText}>{chart.totalStitches} sts</span>
            ) : null}
            {chart?.notes ? (
              <span className={styles.instrNotes}>{chart.notes}</span>
            ) : null}
          </div>
        )}
        <div className={styles.instrNav}>
          <div className={styles.splitBtn}>
            <button className={styles.splitMain} onClick={handlePrev} disabled={!canGoBack}><ChevronLeftIcon size={14}/></button>
            <button
              className={styles.splitArrow}
              onClick={() => setBackMenuOpen(o => !o)}
              aria-label="More options"
            >▾</button>
            {backMenuOpen && (
              <div className={styles.backMenu}>
                <button className={styles.backMenuItem} onClick={() => { handlePrev(); setBackMenuOpen(false) }} disabled={!canGoBack}>
                  <ChevronLeftIcon size={12}/>Go back one row
                </button>
                <button className={styles.backMenuItem} onClick={() => { handleReset(); setBackMenuOpen(false) }}>
                  ↺ Reset to row 1
                </button>
                <button className={styles.backMenuItem} style={{color: 'var(--accent)'}} onClick={() => { setJumpMenuOpen(true); setBackMenuOpen(false) }}>
                  ⤷ Go to specific row
                </button>
              </div>
            )}
          </div>
          <button className={styles.nextBtn} onClick={handleNext}><ChevronRightIcon size={14}/></button>
        </div>

        {/* Jump to row picker */}
        {jumpMenuOpen && (
          <div className={styles.jumpOverlay} onClick={() => setJumpMenuOpen(false)}>
            <div className={styles.jumpModal} onClick={e => e.stopPropagation()}>
              <div className={styles.jumpTitle}>Go Back to Total Row</div>
              <div className={styles.jumpSubtitle}>You have worked {totalRowsWorked} rows total</div>
              <div className={styles.jumpInputWrap}>
                <input
                  type="number"
                  min={1}
                  max={project.totalRowsWorked ?? 1}
                  defaultValue={project.totalRowsWorked ?? 1}
                  className={styles.jumpInput}
                  id="jump-row-input"
                  autoFocus
                />
                <span className={styles.jumpInputHint}>max {project.totalRowsWorked ?? 0} rows worked</span>
              </div>
              <div className={styles.jumpActions}>
                <button className={styles.jumpCancel} onClick={() => setJumpMenuOpen(false)}>Cancel</button>
                <button className={styles.jumpConfirm} onClick={() => {
                  const input = document.getElementById('jump-row-input') as HTMLInputElement
                  const totalTarget = Math.min(
                    project.totalRowsWorked ?? 0,
                    Math.max(1, parseInt(input.value) || 1)
                  )
                  // Calculate which chart row that total maps to
                  const repeatStart = project.chartRepeatStartRow ?? 1
                  const chartLen = project.totalRows - repeatStart + 1
                  const chartRow = repeatStart + ((totalTarget - 1) % chartLen)
                  updateProject(project.id, {
                    currentRow: chartRow,
                    totalRowsWorked: totalTarget,
                  })
                  setJumpMenuOpen(false)
                  setBackMenuOpen(false)
                }}>Go to Row</button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
