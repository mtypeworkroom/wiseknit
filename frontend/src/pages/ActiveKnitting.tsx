import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import ChartGrid from '../components/knitting/ChartGrid'
import styles from './ActiveKnitting.module.css'

export default function ActiveKnitting() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, advanceRow, updateProject } = useProjectStore()
  const project = projects.find((p) => p.id === id)

  const [panelOpen, setPanelOpen] = useState<'legend' | 'tools' | null>(null)
  const [backMenuOpen, setBackMenuOpen] = useState(false)
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
  const isLaceRow = [2,4,6,8].includes(project.currentRow)
  const isPurlRow = [10,12,14,16].includes(project.currentRow)

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
    if (project.currentRow > 1) {
      updateProject(project.id, {
        currentRow: project.currentRow - 1,
        // totalRowsWorked unchanged — going back doesn't un-knit rows
      })
    }
  }

  const togglePanel = (panel: 'legend' | 'tools') => {
    setPanelOpen(panelOpen === panel ? null : panel)
  }

  const getRowInstruction = (row: number) => {
    if ([2,4,6,8].includes(row)) return 'ssk, yo, k, yo, <strong>k2tog</strong>, p, ssk, yo, k, yo'
    if ([10,12,14,16].includes(row)) return 'All purl/dot row — WS'
    if (row % 2 !== 0) return 'RS — knit all, purl centre stitch'
    return 'WS — purl all, knit centre stitch'
  }

  return (
    <div className={styles.shell}>
      {/* Rotate overlay — phones in portrait only */}
      <div className={styles.rotateOverlay}>
        <svg className={styles.rotateIcon} viewBox="0 0 24 24" fill="none" stroke="#3CCFEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2"/>
          <path d="M9 22h6"/>
          <path d="M12 17v.01"/>
        </svg>
        <svg className={styles.rotateArrow} viewBox="0 0 24 24" fill="none" stroke="#3CCFEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4"/>
          <path d="M21 12V7a2 2 0 0 0-2-2h-4"/>
          <path d="m3 16 4 4 4-4"/>
        </svg>
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
        <div className={styles.tbRight}>
          <button
            className={`${styles.tbIcon} ${panelOpen === 'tools' ? styles.tbIconActive : ''}`}
            onClick={() => togglePanel('tools')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
            </svg>
          </button>
          <button
            className={`${styles.tbIcon} ${panelOpen === 'legend' ? styles.tbIconActive : ''}`}
            onClick={() => togglePanel('legend')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
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
        {['Add section line', 'Color a section', 'Reset highlights', 'Fit to screen'].map((label) => (
          <button key={label} className={styles.toolBtn}>{label}</button>
        ))}
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

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <div className={styles.rowInfo}>
          <span className={styles.rowLabel}>Row</span>
          <span className={styles.rowNum}>{project.currentRow}</span>
          <span className={styles.rowOf}>/ {project.totalRows}</span>
        </div>
        <div className={styles.separator} />
        <div className={styles.rowInfo}>
          <span className={styles.rowLabel}>Total</span>
          <span className={styles.rowNum}>{(project as any).totalRowsWorked ?? 0}</span>
        </div>

        <div className={styles.separator} />

        <div
          className={styles.instrWrap}
          dangerouslySetInnerHTML={{ __html: getRowInstruction(project.currentRow) }}
        />

        {(isLaceRow || isPurlRow) && (
          <span className={styles.aiPill}>
            {isLaceRow ? '⚡ Lace row' : '⚡ All purl row'}
          </span>
        )}

        <div className={styles.separator} />

        {/* Split back button */}
        <div className={styles.splitBtn}>
          <button className={styles.splitMain} onClick={handlePrev}>← Back</button>
          <button
            className={styles.splitArrow}
            onClick={() => setBackMenuOpen(o => !o)}
            aria-label="More options"
          >▾</button>
          {backMenuOpen && (
            <div className={styles.backMenu}>
              <button className={styles.backMenuItem} onClick={() => { handlePrev(); setBackMenuOpen(false) }}>
                ← Go back one row
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
        <button className={styles.nextBtn} onClick={handleNext}>Next Row ›</button>

        {/* Jump to row picker */}
        {jumpMenuOpen && (
          <div className={styles.jumpOverlay} onClick={() => setJumpMenuOpen(false)}>
            <div className={styles.jumpModal} onClick={e => e.stopPropagation()}>
              <div className={styles.jumpTitle}>Go Back to Total Row</div>
              <div className={styles.jumpSubtitle}>You have worked {project.totalRowsWorked ?? 0} rows total</div>
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
                }}>Go to Row →</button>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}
