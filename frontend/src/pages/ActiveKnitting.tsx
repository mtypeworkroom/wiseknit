import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectStore } from '../store/projectStore'
import ChartGrid from '../components/knitting/ChartGrid'
import { InfoIcon, BellIcon, PhoneIcon, RotateArrowIcon, RepeatIcon, MinusIcon, PlusIcon, PencilIcon, ClockIcon, TrashIcon } from '../components/icons'
import type { ProjectReminder, ReminderSound, IntervalStep } from '../types'
import { useSettingsStore } from '../store/settingsStore'
import { playReminderAlert } from '../utils/audio'
import styles from './ActiveKnitting.module.css'


function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  return `${m}:${String(sec).padStart(2, '0')}`
}

function textColorForBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 > 128 ? '#1a1a1a' : '#ffffff'
}

export default function ActiveKnitting() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { projects, advanceRow, updateProject, addSession, stepCounter } = useProjectStore()
  const defaultSound = useSettingsStore(s => s.reminderSound)
  const defaultVoice = useSettingsStore(s => s.reminderVoice)
  const defaultChime = useSettingsStore(s => s.reminderChime)
  const project = projects.find((p) => p.id === id)

  const [panelOpen, setPanelOpen] = useState<'legend' | 'tools' | null>(null)
  const [backMenuOpen, setBackMenuOpen] = useState(false)
  const zoom: 'S' | 'M' | 'L' | 'XL' = 'M'
  const chartAreaRef = useRef<HTMLDivElement>(null)
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const labelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [counterTooltip, setCounterTooltip] = useState<{ name: string; x: number; y: number } | null>(null)
  const [slideLabel, setSlideLabel] = useState<{ name: string; x: number; y: number } | null>(null)

  const handleCounterDown = (counterId: string, e: React.PointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'touch') {
      const rect = e.currentTarget.getBoundingClientRect()
      if (labelTimerRef.current) clearTimeout(labelTimerRef.current)
      const counter = project.freeCounters?.find(c => c.id === counterId)
      if (counter) {
        setSlideLabel({ name: counter.name, x: rect.right + 6, y: rect.top + rect.height / 2 })
        labelTimerRef.current = setTimeout(() => setSlideLabel(null), 1500)
      }
    }
    pressTimerRef.current = setTimeout(() => {
      pressTimerRef.current = null
      stepCounter(project.id, counterId, -1)
    }, 500)
  }
  const handleCounterUp = (counterId: string) => {
    if (pressTimerRef.current !== null) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
      stepCounter(project.id, counterId, 1)
    }
  }
  const handleCounterCancel = () => {
    if (pressTimerRef.current !== null) {
      clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
  }

  const handleCounterMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, name: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCounterTooltip({ name, x: rect.right + 8, y: rect.top + rect.height / 2 })
  }
  const handleCounterMouseLeave = () => setCounterTooltip(null)
  const [jumpMenuOpen, setJumpMenuOpen] = useState(false)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteModalValue, setNoteModalValue] = useState('')

  const [elapsedMs, setElapsedMs] = useState(0)
  const [sessionModalOpen, setSessionModalOpen] = useState(false)
  const [draftMinutes, setDraftMinutes] = useState('1')
  const sessionStartRowRef = useRef(0)

  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [draftReminderText, setDraftReminderText] = useState('')
  const [draftReminderType, setDraftReminderType] = useState<'repeat' | 'absolute'>('repeat')
  const [draftReminderRow, setDraftReminderRow] = useState('')
  const [completionBanner, setCompletionBanner] = useState<string | null>(null)
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Close note modal when row advances
  useEffect(() => {
    setNoteModalOpen(false)
  }, [project?.currentRow])

  // Chime when row advances onto a reminder
  useEffect(() => {
    const charts = project?.charts ?? []
    const chartIndex = Math.max(0, charts.findIndex(c => c.id === project?.activeChartId))
    const activeChart = charts[chartIndex] ?? charts[0]
    const reminders = activeChart?.reminders ?? []
    const chartRow = project?.currentRow ?? 0
    const c2 = activeChart?.countBy2 ?? false
    const dispRow = c2 ? chartRow * 2 - 1 : chartRow
    const totalWorked = (project as any)?.totalRowsWorked ?? 0
    const active = reminders.filter(r =>
      r.type === 'repeat' ? dispRow === r.row : totalWorked === r.row
    )
    active.forEach(r => playReminderAlert(r.text, r.sound ?? defaultSound, defaultVoice, defaultChime))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.currentRow, project?.totalRowsWorked])

  // Play shaping step sounds on row change
  useEffect(() => {
    const allCharts = project?.charts ?? []
    const activeIdx = Math.max(0, allCharts.findIndex(c => c.id === project?.activeChartId))
    const activeChart = allCharts[activeIdx] ?? allCharts[0]
    const steps = activeChart?.intervalSteps ?? []
    const totalWorked = (project as any)?.totalRowsWorked ?? 0
    steps.forEach(step => {
      const row = totalWorked + 1
      if (row < step.startRow) return
      if ((row - step.startRow + 1) % step.repeatEvery !== 0) return
      const fn = Math.floor((row - step.startRow + 1) / step.repeatEvery)
      if (fn >= 1 && fn <= step.repeatCount) {
        playReminderAlert(step.text, step.sound, defaultVoice, defaultChime)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.totalRowsWorked])

  // Live timer tick
  useEffect(() => {
    if (!project?.timerStartedAt) { setElapsedMs(0); return }
    const tick = () => setElapsedMs(Date.now() - new Date(project.timerStartedAt!).getTime())
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [project?.timerStartedAt])

  if (!project) return null

  const timerRunning = !!project.timerStartedAt

  const handleTimerStart = () => {
    updateProject(project.id, {
      timerStartedAt: new Date().toISOString(),
      timerStartRow: project.currentRow,
    })
  }

  const handleTimerStop = () => {
    const ms = project.timerStartedAt ? Date.now() - new Date(project.timerStartedAt).getTime() : 0
    sessionStartRowRef.current = project.timerStartRow ?? project.currentRow
    setDraftMinutes(String(Math.max(1, Math.round(ms / 60000))))
    setSessionModalOpen(true)
    // timer keeps running until Save or Discard
  }

  const stopTimer = () => updateProject(project.id, { timerStartedAt: undefined, timerStartRow: undefined })

  const handleSessionSave = () => {
    stopTimer()
    addSession({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      projectId: project.id,
      startRow: sessionStartRowRef.current,
      endRow: project.currentRow,
      rowsCompleted: Math.max(0, project.currentRow - sessionStartRowRef.current),
      durationMinutes: Math.max(1, parseInt(draftMinutes) || 1),
      date: new Date().toISOString().split('T')[0],
    })
    setSessionModalOpen(false)
  }

  const handleSessionDiscard = () => {
    stopTimer()
    setSessionModalOpen(false)
  }

  const totalRowsWorked = (project as any).totalRowsWorked ?? 0
  const charts = project.charts ?? []
  const chartIndex = Math.max(0, charts.findIndex(c => c.id === project.activeChartId))
  const chart = charts[chartIndex] ?? charts[0]
  const countBy2 = chart?.countBy2 ?? false

  const chartTotalRows = chart?.totalRows ?? project.totalRows
  const displayRow = countBy2 ? project.currentRow * 2 - 1 : project.currentRow
  const displayTotalRows = countBy2 ? chartTotalRows * 2 : chartTotalRows
  const displayTotalWorked = (countBy2 ? totalRowsWorked * 2 : totalRowsWorked) + 1

  const repeatNum = Math.floor(totalRowsWorked / project.totalRows) + 1

  const getStepFireNum = (step: IntervalStep, totalWorked: number): number => {
    const row = totalWorked + 1  // totalRowsWorked is 0-based; row 1 = totalWorked 0
    if (row < step.startRow) return 0
    if ((row - step.startRow + 1) % step.repeatEvery !== 0) return 0
    return Math.floor((row - step.startRow + 1) / step.repeatEvery)
  }
  const shapingSteps = chart?.intervalSteps ?? []
  const firingSteps = shapingSteps
    .filter(s => { const fn = getStepFireNum(s, totalRowsWorked); return fn >= 1 && fn <= s.repeatCount })
    .sort((a, b) => a.order - b.order)
  const startSteps = firingSteps.filter(s => s.position === 'start')
  const middleSteps = firingSteps.filter(s => s.position === 'middle')
  const endSteps = firingSteps.filter(s => s.position === 'end')

  const activeReminders = (chart?.reminders ?? []).filter(r =>
    r.type === 'repeat' ? displayRow === r.row : totalRowsWorked === r.row
  )

  const updateChartReminders = (reminders: ProjectReminder[]) => {
    if (!chart) return
    updateProject(project.id, {
      charts: (project.charts ?? []).map(c =>
        c.id === chart.id ? { ...c, reminders } : c
      ),
    })
  }

  const addReminder = () => {
    const row = parseInt(draftReminderRow)
    if (!draftReminderText.trim() || isNaN(row) || row < 1) return
    const next: ProjectReminder = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: draftReminderText.trim(),
      type: draftReminderType,
      row,
    }
    updateChartReminders([...(chart?.reminders ?? []), next])
    setDraftReminderText('')
    setDraftReminderRow('')
  }

  const deleteReminder = (reminderId: string) => {
    updateChartReminders((chart?.reminders ?? []).filter(r => r.id !== reminderId))
  }

  const getRowSide = () => {
    if (!chart) return null
    if (chart.workedInRound) return 'Rnd'
    if (countBy2) return 'RS'
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
    const completing = firingSteps.filter(s => getStepFireNum(s, totalRowsWorked) === s.repeatCount)
    if (completing.length > 0) {
      const names = completing.map(s => s.name).join(', ')
      setCompletionBanner(`${names} complete`)
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current)
      bannerTimerRef.current = setTimeout(() => setCompletionBanner(null), 2500)
    }
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

  const openNoteModal = () => {
    setNoteModalValue(chart?.rowNotes?.[project.currentRow] ?? '')
    setNoteModalOpen(true)
  }

  const saveNote = () => {
    if (!chart) { setNoteModalOpen(false); return }
    const trimmed = noteModalValue.trim()
    const newNotes = { ...(chart.rowNotes ?? {}) }
    if (trimmed) newNotes[project.currentRow] = trimmed
    else delete newNotes[project.currentRow]
    updateProject(project.id, {
      charts: (project.charts ?? []).map(c =>
        c.id === chart.id
          ? { ...c, rowNotes: Object.keys(newNotes).length > 0 ? newNotes : undefined }
          : c
      ),
    })
    setNoteModalOpen(false)
  }

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
        <span className={styles.tbPattern}>{chart?.name ?? project.name}</span>
        {/* Chip 1: row position */}
        <div className={styles.tbChip}>
          <span className={styles.tbChipLabel}>row</span>
          <span className={styles.tbChipNum}>{displayRow}</span>
          <span className={styles.tbChipSep}>/</span>
          <span className={styles.tbChipSub}>{displayTotalRows}</span>
        </div>
        {/* Chip 2: total worked + repeat icon */}
        <div className={styles.tbChip}>
          <span className={styles.tbChipNum}>{displayTotalWorked}</span>
          <RepeatIcon className={styles.tbRepeatIcon}/>
          <span className={styles.tbRepeatNum}>{repeatNum}</span>
        </div>
        {/* Nav buttons */}
        <div className={styles.splitBtn}>
          <button className={styles.splitMain} onClick={handlePrev} disabled={!canGoBack}><MinusIcon size={14}/></button>
          <button
            className={styles.splitArrow}
            onClick={() => setBackMenuOpen(o => !o)}
            aria-label="More options"
          >▾</button>
          {backMenuOpen && (
            <div className={styles.backMenu}>
              <button className={styles.backMenuItem} onClick={() => { handlePrev(); setBackMenuOpen(false) }} disabled={!canGoBack}>
                <MinusIcon size={12}/>Go back one row
              </button>
              <button className={styles.backMenuItem} onClick={() => { handleReset(); setBackMenuOpen(false) }}>
                ↺ Reset to row 1
              </button>
              <button className={styles.backMenuItem} style={{color: 'var(--accent)'}} onClick={() => { setJumpMenuOpen(true); setBackMenuOpen(false) }}>
                ⤷ Go to specific row
              </button>
              <button className={styles.backMenuItem} style={{color: 'var(--accent)'}} onClick={() => { setDraftReminderRow(String(project.currentRow)); setReminderModalOpen(true); setBackMenuOpen(false) }}>
                <BellIcon size={12}/>Reminders
              </button>
            </div>
          )}
        </div>
        <button className={styles.nextBtn} onClick={handleNext}><PlusIcon size={14}/></button>
        <button
          className={`${styles.tbTimerChip}${timerRunning ? ` ${styles.tbTimerRunning}` : ''}`}
          onClick={timerRunning ? handleTimerStop : handleTimerStart}
          title={timerRunning ? 'Stop timer' : 'Start timer'}
        >
          {timerRunning ? (
            <span className={styles.tbTimerDisplay}>{formatElapsed(elapsedMs)}</span>
          ) : (
            <ClockIcon size={13} className={styles.tbTimerIcon} />
          )}
        </button>
        <button
          className={`${styles.tbIcon} ${panelOpen === 'legend' ? styles.tbIconActive : ''}`}
          onClick={() => togglePanel('legend')}
        >
          <InfoIcon size={14}/>
        </button>
      </div>

      {/* Chart zone — counter sidebar (when present) + chart */}
      <div className={styles.chartZone}>
        {(project.freeCounters?.length ?? 0) > 0 && (
          <div className={styles.counterSidebar}>
            {project.freeCounters!.map(counter => (
              <button
                key={counter.id}
                className={styles.counterPill}
                style={{ background: counter.color ?? 'var(--accent)' }}
                onPointerDown={e => handleCounterDown(counter.id, e)}
                onPointerUp={() => handleCounterUp(counter.id)}
                onPointerLeave={handleCounterCancel}
                onContextMenu={e => e.preventDefault()}
                onMouseEnter={e => handleCounterMouseEnter(e, counter.name)}
                onMouseLeave={handleCounterMouseLeave}
                aria-label={`${counter.name}: ${counter.value}. Tap to increment, hold to decrement.`}
              >
                <span className={styles.counterPillValue} style={{ color: textColorForBg(counter.color ?? '#3CCFEF') }}>{counter.value}</span>
              </button>
            ))}
          </div>
        )}
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


      {/* Instructions + nav bar — instructions wrap left, buttons anchored right */}
      <div className={styles.bottomBar}>
        {getRowSide() && (
          <div className={styles.instrContent}>
            {/* Reminders — full-width row, only when present */}
            {activeReminders.length > 0 && (
              <div className={styles.instrMetaReminders}>
                {activeReminders.map(r => (
                  <div key={r.id} className={styles.activeReminder}>
                    <BellIcon size={11} className={styles.activeReminderIcon}/>
                    <span className={styles.activeReminderText}>{r.text}</span>
                  </div>
                ))}
              </div>
            )}
            {/* Interval steps (flex:1) — pure display, no note text */}
            <div className={styles.rowNoteArea}>
              {startSteps.map(s => (
                <span key={s.id} className={styles.shapingStep}>[{s.text}]</span>
              ))}
              {middleSteps.map(s => (
                <span key={s.id} className={styles.shapingStep}>
                  [{s.stsStart ? `at ${s.stsStart}: ` : ''}{s.text}]
                </span>
              ))}
              {endSteps.map(s => (
                <span key={s.id} className={styles.shapingStep}>[{s.text}]</span>
              ))}
            </div>
            {/* Chips + note icon */}
            <div className={styles.instrMetaRight}>
              <span className={styles.rowSidePill}>{getRowSide()}</span>
              {chart?.totalStitches ? (
                <span className={styles.instrText}>{chart.totalStitches} sts</span>
              ) : null}
              <button
                className={`${styles.noteIconBtn} ${chart?.rowNotes?.[project.currentRow] ? styles.noteIconBtnActive : ''}`}
                onClick={e => { e.stopPropagation(); openNoteModal() }}
                aria-label={chart?.rowNotes?.[project.currentRow] ? 'Edit row note' : 'Add row note'}
              >
                <PencilIcon size={12}/>
              </button>
            </div>
          </div>
        )}

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

      {/* Session save modal */}
      {sessionModalOpen && (
        <div className={styles.jumpOverlay} onClick={() => setSessionModalOpen(false)}>
          <div className={styles.jumpModal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setSessionModalOpen(false)}>✕</button>
            <div className={styles.jumpTitle}>Save Session</div>
            <div className={styles.jumpSubtitle}>Rows {sessionStartRowRef.current}–{project.currentRow}</div>
            <div className={styles.jumpInputWrap}>
              <input
                type="number"
                min={1}
                value={draftMinutes}
                onChange={e => setDraftMinutes(e.target.value)}
                className={styles.jumpInput}
                autoFocus
              />
              <span className={styles.jumpInputHint}>minutes</span>
            </div>
            <div className={styles.jumpActions}>
              <button className={styles.jumpCancel} onClick={handleSessionDiscard}>Discard</button>
              <button className={styles.jumpConfirm} onClick={handleSessionSave}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Shaping step completion banner */}
      {completionBanner && (
        <div className={styles.completionBanner}>{completionBanner}</div>
      )}

      {/* Row note modal */}
      {noteModalOpen && (
        <div className={styles.jumpOverlay} onClick={() => setNoteModalOpen(false)}>
          <div className={styles.jumpModal} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setNoteModalOpen(false)}>✕</button>
            <div className={styles.jumpTitle}>Row {displayRow} Note</div>
            <div className={styles.jumpInputWrap}>
              <input
                type="text"
                value={noteModalValue}
                onChange={e => setNoteModalValue(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveNote(); if (e.key === 'Escape') setNoteModalOpen(false) }}
                className={styles.jumpInput}
                placeholder="Row instruction…"
                autoFocus
                style={{ width: '100%' }}
              />
            </div>
            <div className={styles.jumpActions}>
              <button className={styles.jumpCancel} onClick={() => setNoteModalOpen(false)}>Cancel</button>
              <button className={styles.jumpConfirm} onClick={saveNote}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Reminder management modal */}
      {reminderModalOpen && (
        <div className={styles.jumpOverlay} onClick={() => setReminderModalOpen(false)}>
          <div className={`${styles.jumpModal} ${styles.reminderModal}`} onClick={e => e.stopPropagation()}>
            <button className={styles.modalClose} onClick={() => setReminderModalOpen(false)}>✕</button>
            <div className={styles.jumpTitle}>Row Reminders</div>

            {/* Existing reminders */}
            <div className={styles.reminderList}>
              {(chart?.reminders ?? []).length === 0 && (
                <div className={styles.reminderEmpty}>No reminders yet</div>
              )}
              {(chart?.reminders ?? []).map(r => (
                <div key={r.id} className={styles.reminderRow}>
                  <span className={`${styles.reminderTypeBadge} ${r.type === 'repeat' ? styles.reminderTypeRepeat : styles.reminderTypeAbs}`}>
                    {r.type === 'repeat' ? 'repeat' : 'once'}
                  </span>
                  <span className={styles.reminderRowNum}>row {r.row}</span>
                  <span className={styles.reminderRowText}>{r.text}</span>
                  {(['chime+speak','chime','speak','mute'] as ReminderSound[]).map(s => (
                    <button
                      key={s}
                      className={`${styles.soundOptBtn} ${(r.sound ?? defaultSound) === s ? styles.soundOptBtnActive : ''}`}
                      title={s}
                      onClick={() => updateChartReminders((chart?.reminders ?? []).map(x => x.id === r.id ? { ...x, sound: s } : x))}
                    >{{ 'chime+speak':'🔔+🗣', chime:'🔔', speak:'🗣', mute:'🔕' }[s]}</button>
                  ))}
                  <button className={styles.reminderDelete} onClick={() => deleteReminder(r.id)}>
                    <TrashIcon size={12}/>
                  </button>
                </div>
              ))}
            </div>

            {/* Add new */}
            <div className={styles.reminderAddForm}>
              <div className={styles.reminderTypeToggle}>
                <button
                  className={`${styles.reminderTypeBtn} ${draftReminderType === 'repeat' ? styles.reminderTypeBtnActive : ''}`}
                  onClick={() => setDraftReminderType('repeat')}
                >Every repeat</button>
                <button
                  className={`${styles.reminderTypeBtn} ${draftReminderType === 'absolute' ? styles.reminderTypeBtnActive : ''}`}
                  onClick={() => setDraftReminderType('absolute')}
                >Once</button>
              </div>
              <div className={styles.reminderAddRow}>
                <input
                  type="number"
                  min={1}
                  value={draftReminderRow}
                  onChange={e => setDraftReminderRow(e.target.value)}
                  className={styles.reminderRowInput}
                  placeholder="Row"
                />
                <input
                  type="text"
                  value={draftReminderText}
                  onChange={e => setDraftReminderText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addReminder()}
                  className={styles.reminderTextInput}
                  placeholder="Reminder text…"
                  autoFocus
                />
                <button className={styles.jumpConfirm} onClick={addReminder}>Add</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {counterTooltip && createPortal(
        <div
          className={styles.counterTooltip}
          style={{ top: counterTooltip.y, left: counterTooltip.x }}
        >
          {counterTooltip.name}
        </div>,
        document.body
      )}
      {slideLabel && createPortal(
        <div
          className={styles.counterSlideLabel}
          style={{ top: slideLabel.y, left: slideLabel.x }}
        >
          {slideLabel.name}
        </div>,
        document.body
      )}

    </div>
  )
}
