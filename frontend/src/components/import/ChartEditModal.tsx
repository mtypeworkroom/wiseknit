import { useState, useEffect, useRef } from 'react'
import { SaveIcon, CropIcon, BellIcon, TrashIcon } from '../icons'
import type { ProjectReminder, ReminderSound } from '../../types'

const SOUND_OPTS: { value: ReminderSound; label: string }[] = [
  { value: 'chime+speak', label: '🔔+🗣' },
  { value: 'chime',       label: '🔔' },
  { value: 'speak',       label: '🗣' },
  { value: 'mute',        label: '🔕' },
]
import { createPortal } from 'react-dom'
import ReactCrop, { type PercentCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import type { ProjectChart } from '../../types'
import { saveImage, loadImage } from '../../store/imageStore'
import { detectChartBounds, computeBounds, type PixelBounds, type NudgeOffsets } from './PDFPagePicker'
import styles from './ChartEditModal.module.css'

interface Props {
  chart: ProjectChart
  onSave: (updates: Partial<ProjectChart>) => void
  onClose: () => void
}

const NUDGE_PX = 4

function cropFromImg(img: HTMLImageElement, b: PixelBounds): string {
  if (b.w <= 0 || b.h <= 0 || !img.complete || img.naturalWidth === 0) return ''
  try {
    const out = document.createElement('canvas')
    out.width = Math.round(b.w)
    out.height = Math.round(b.h)
    const ctx = out.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(img, Math.round(b.x), Math.round(b.y), Math.round(b.w), Math.round(b.h), 0, 0, Math.round(b.w), Math.round(b.h))
    const url = out.toDataURL('image/png')
    return url === 'data:,' ? '' : url
  } catch {
    return ''
  }
}


function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function rulerStride(displaySpacingPx: number): number {
  if (displaySpacingPx >= 10) return 1
  if (displaySpacingPx >= 5) return 5
  if (displaySpacingPx >= 2.5) return 10
  return 25
}

async function drawRuledChart(
  imageSrc: string,
  totalRows: number,
  totalStitches: number,
  maxDisplayW: number,
  maxDisplayH: number
): Promise<string> {
  const img = await loadImg(imageSrc)
  const iw = img.naturalWidth
  const ih = img.naturalHeight

  // How much will this image be scaled down when displayed?
  const displayScale = Math.min(maxDisplayW / iw, maxDisplayH / ih, 1)

  // Font size: grow with cell size (up to 16px displayed), never below 9px displayed.
  // cellMin is in canvas pixels; convert to display pixels for the cap.
  const cellMinCanvas = Math.min(iw / totalStitches, ih / totalRows)
  const cellBasedDisplay = cellMinCanvas * displayScale * 0.45
  const fontDisplay = Math.min(Math.max(cellBasedDisplay, 9), 16)
  const fontSize = Math.round(fontDisplay / displayScale) // back to canvas pixels

  // Margins sized to contain the text (in canvas pixels)
  const RULER_LEFT = Math.round(fontSize * 2.5)
  const RULER_TOP = Math.round(fontSize * 1.6)

  const RULER_RIGHT = RULER_LEFT // same width, now on the right

  const canvas = document.createElement('canvas')
  canvas.width = iw + RULER_RIGHT
  canvas.height = ih + RULER_TOP
  const ctx = canvas.getContext('2d')!

  // Margin background
  ctx.fillStyle = '#ECEEF6'
  ctx.fillRect(iw, 0, RULER_RIGHT, canvas.height)
  ctx.fillRect(0, 0, iw, RULER_TOP)

  // Chart image
  ctx.drawImage(img, 0, RULER_TOP)

  // Separator lines — 1px in display space
  ctx.strokeStyle = '#A0AACC'
  ctx.lineWidth = Math.round(1 / displayScale)
  ctx.beginPath()
  ctx.moveTo(iw, 0); ctx.lineTo(iw, canvas.height)
  ctx.moveTo(0, RULER_TOP); ctx.lineTo(canvas.width, RULER_TOP)
  ctx.stroke()

  ctx.fillStyle = '#3D4E80'
  ctx.font = `${fontSize}px monospace`

  const rowH = ih / totalRows
  const stitchW = iw / totalStitches
  // Stride based on displayed spacing so density is judged in screen pixels
  const rowStride = rulerStride(rowH * displayScale)
  const stitchStride = rulerStride(stitchW * displayScale)

  // Row numbers — right margin, row 1 at bottom (charts read right to left)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  for (let i = 0; i < totalRows; i++) {
    const rowNum = totalRows - i
    if (rowNum === 1 || rowNum === totalRows || (rowNum - 1) % rowStride === 0) {
      ctx.fillText(String(rowNum), iw + Math.round(fontSize * 0.25), RULER_TOP + (i + 0.5) * rowH)
    }
  }

  // Stitch numbers — top margin, stitch 1 at left
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  for (let j = 0; j < totalStitches; j++) {
    const stitchNum = totalStitches - j
    if (stitchNum === 1 || stitchNum === totalStitches || (stitchNum - 1) % stitchStride === 0) {
      ctx.fillText(String(stitchNum), (j + 0.5) * stitchW, RULER_TOP - Math.round(fontSize * 0.2))
    }
  }

  return canvas.toDataURL('image/png')
}

export default function ChartEditModal({ chart, onSave, onClose }: Props) {
  const hasFullPage = !!(chart.pageKey || chart.pageBase64)

  const [nudgeImg, setNudgeImg] = useState<HTMLImageElement | null>(null)
  const [nudgeBounds, setNudgeBounds] = useState<PixelBounds | null>(null)
  const [offsets, setOffsets] = useState<NudgeOffsets>({ top: 0, bottom: 0, left: 0, right: 0 })

  const pageImgRef = useRef<HTMLImageElement>(null)
  const [pageImageData, setPageImageData] = useState<ImageData | null>(null)
  const [pageLoading, setPageLoading] = useState(false)
  const [pageImageSrc, setPageImageSrc] = useState(chart.pageKey ? '' : (chart.pageBase64 ?? ''))

  const [previewUrl, setPreviewUrl] = useState(chart.imageKey ? '' : (chart.imageBase64 ?? ''))
  const [ruledPreviewUrl, setRuledPreviewUrl] = useState('')
  const [phase, setPhase] = useState<'refine' | 'reselect'>('refine')
  const [crop, setCrop] = useState<PercentCrop>()
  const [totalRows, setTotalRows] = useState<number | ''>(chart.totalRows ?? '')
  const [totalStitches, setTotalStitches] = useState<number | ''>(chart.totalStitches ?? '')
  const [countBy2, setCountBy2] = useState(chart.countBy2 ?? false)
  const [rowNotesMap, setRowNotesMap] = useState<Record<number, string>>(() => {
    const m: Record<number, string> = {}
    if (chart.rowNotes) for (const [k, v] of Object.entries(chart.rowNotes)) m[parseInt(k)] = v
    return m
  })
  const [noteRow, setNoteRow] = useState(1)
  const [notesOpen, setNotesOpen] = useState(() => !!(chart.rowNotes && Object.keys(chart.rowNotes).length > 0) || !!(chart.reminders?.length))

  const [reminders, setReminders] = useState<ProjectReminder[]>(() => chart.reminders ?? [])
  const [draftRText, setDraftRText] = useState('')
  const [draftRType, setDraftRType] = useState<'repeat' | 'absolute'>('repeat')

  const addReminder = (row = noteRow) => {
    if (!draftRText.trim()) return
    setReminders(rs => [...rs, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      text: draftRText.trim(),
      type: draftRType,
      row,
    }])
    setDraftRText('')
  }

  const navigateRow = (dir: 1 | -1) => {
    addReminder(noteRow)  // auto-save draft if non-empty, bound to current row
    const maxRow = typeof totalRows === 'number' ? totalRows : 999
    setNoteRow(r => dir === 1 ? Math.min(maxRow, r + 1) : Math.max(1, r - 1))
  }
  const mountedRef = useRef(true)

  useEffect(() => {
    const rows = typeof totalRows === 'number' ? totalRows : 0
    const sts = typeof totalStitches === 'number' ? totalStitches : 0
    if (!previewUrl) { setRuledPreviewUrl(''); return }
    if (rows <= 0 || sts <= 0) { setRuledPreviewUrl(previewUrl); return }
    let cancelled = false
    drawRuledChart(previewUrl, rows, sts, window.innerWidth, window.innerHeight)
      .then(url => { if (!cancelled) setRuledPreviewUrl(url) })
      .catch(() => { if (!cancelled) setRuledPreviewUrl(previewUrl) })
    return () => { cancelled = true }
  }, [previewUrl, totalRows, totalStitches])

  // Computed image size for the reselect screen — JS wins over CSS cascade issues with ReactCrop's own styles
  const [imgMaxSize, setImgMaxSize] = useState({ maxWidth: 0, maxHeight: 0 })
  useEffect(() => {
    const SIDEBAR = 160
    const BAR = 52
    const calc = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const landscape = w > h
      setImgMaxSize(landscape
        ? { maxWidth: w - SIDEBAR, maxHeight: h }
        : { maxWidth: w, maxHeight: h - BAR }
      )
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])

  useEffect(() => {
    mountedRef.current = true
    async function init() {
      const src = chart.imageKey
        ? (await loadImage(chart.imageKey)) ?? ''
        : (chart.imageBase64 ?? '')
      if (!src || !mountedRef.current) return
      setPreviewUrl(src)
      loadImg(src).then(img => {
        if (!mountedRef.current) return
        setNudgeImg(img)
        setNudgeBounds({ x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight })
      }).catch(() => {})
    }
    init()
    return () => { mountedRef.current = false }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const enterReselect = async () => {
    setPhase('reselect')
    if (pageImageData) return
    let pageSrc = pageImageSrc
    if (!pageSrc) {
      if (!chart.pageKey) return
      pageSrc = (await loadImage(chart.pageKey)) ?? ''
      if (!pageSrc || !mountedRef.current) return
      setPageImageSrc(pageSrc)
    }
    setPageLoading(true)
    loadImg(pageSrc).then(img => {
      if (!mountedRef.current) return
      setTimeout(() => {
        if (!mountedRef.current) return
        try {
          const c = document.createElement('canvas')
          c.width = img.naturalWidth
          c.height = img.naturalHeight
          const ctx = c.getContext('2d', { willReadFrequently: true })!
          ctx.drawImage(img, 0, 0)
          setPageImageData(ctx.getImageData(0, 0, c.width, c.height))
        } catch {}
        setPageLoading(false)
      }, 0)
    }).catch(() => { if (mountedRef.current) setPageLoading(false) })
  }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerCrop(makeAspectCrop({ unit: '%', width: 80 }, width / height, width, height), width, height) as PercentCrop)
  }

  const handleRedetect = () => {
    const imgEl = pageImgRef.current
    if (!crop || !imgEl || imgEl.naturalWidth === 0) return

    const imgW = imgEl.naturalWidth
    const imgH = imgEl.naturalHeight
    const cropX = Math.round((crop.x / 100) * imgW)
    const cropY = Math.round((crop.y / 100) * imgH)
    const cropW = Math.round((crop.width / 100) * imgW)
    const cropH = Math.round((crop.height / 100) * imgH)
    if (cropW <= 0 || cropH <= 0) return

    let newBounds: PixelBounds
    if (pageImageData && pageImageData.width === imgW) {
      try {
        const { x, y, x2, y2 } = detectChartBounds(pageImageData.data, pageImageData.width, cropX, cropY, cropW, cropH)
        const pad = 4
        newBounds = {
          x: Math.max(0, x - pad),
          y: Math.max(0, y - pad),
          w: Math.min(imgW, x2 + pad + 1) - Math.max(0, x - pad),
          h: Math.min(imgH, y2 + pad + 1) - Math.max(0, y - pad),
        }
      } catch {
        newBounds = { x: cropX, y: cropY, w: cropW, h: cropH }
      }
    } else {
      newBounds = { x: cropX, y: cropY, w: cropW, h: cropH }
    }

    const newOffsets: NudgeOffsets = { top: 0, bottom: 0, left: 0, right: 0 }
    const b = computeBounds(newBounds, newOffsets, imgW, imgH)
    const url = cropFromImg(imgEl, b)

    setNudgeImg(imgEl)
    setNudgeBounds(newBounds)
    setOffsets(newOffsets)
    if (url) setPreviewUrl(url)
    setTotalRows('')
    setTotalStitches('')
    setPhase('refine')
  }

  const nudge = (edge: keyof NudgeOffsets, delta: number) => {
    if (!nudgeImg || !nudgeBounds) return
    const newOffsets = { ...offsets, [edge]: offsets[edge] + delta }
    setOffsets(newOffsets)
    const b = computeBounds(nudgeBounds, newOffsets, nudgeImg.naturalWidth, nudgeImg.naturalHeight)
    const url = cropFromImg(nudgeImg, b)
    if (url) setPreviewUrl(url)
  }

  const handleSave = async () => {
    let finalCrop: string | undefined
    if (nudgeImg && nudgeBounds) {
      const b = computeBounds(nudgeBounds, offsets, nudgeImg.naturalWidth, nudgeImg.naturalHeight)
      const url = cropFromImg(nudgeImg, b)
      if (url) finalCrop = url
    }
    const filteredNotes: Record<number, string> = {}
    for (const [k, v] of Object.entries(rowNotesMap)) {
      if (v.trim()) filteredNotes[parseInt(k)] = v.trim()
    }
    const updates: Partial<ProjectChart> = {
      totalRows: typeof totalRows === 'number' ? totalRows : undefined,
      totalStitches: typeof totalStitches === 'number' ? totalStitches : undefined,
      rowNotes: Object.keys(filteredNotes).length > 0 ? filteredNotes : undefined,
      reminders: reminders.length > 0 ? reminders : undefined,
      countBy2: countBy2 ? true : undefined,
    }
    if (finalCrop) {
      const imageKey = chart.imageKey ?? `chart-img-${chart.id}`
      await saveImage(imageKey, finalCrop)
      updates.imageKey = imageKey
    }
    onSave(updates)
  }

  // ── Full-screen reselect phase — rendered via portal to escape stacking context ──
  if (phase === 'reselect') {
    return createPortal(
      <div className={styles.reselectScreen}>
        {pageLoading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : (
          <div className={styles.reselectCropArea}>
            <ReactCrop crop={crop} onChange={(_c, pc) => setCrop(pc)}>
              <img
                ref={pageImgRef}
                src={pageImageSrc}
                alt="Pattern page"
                className={styles.reselectImg}
                style={imgMaxSize.maxWidth ? {
                  maxWidth: imgMaxSize.maxWidth,
                  maxHeight: imgMaxSize.maxHeight,
                } : undefined}
                onLoad={onImageLoad}
              />
            </ReactCrop>
          </div>
        )}

        <div className={styles.reselectBar}>
          <span className={styles.reselectHint}>
            {pageLoading ? 'Loading page…' : 'Drag to select the chart area'}
          </span>
          <button className={styles.reselectCancel} onClick={() => setPhase('refine')}>Cancel</button>
          <button
            className={styles.reselectDetect}
            disabled={!crop || pageLoading}
            onClick={handleRedetect}
          >
            Detect
          </button>
        </div>
      </div>,
      document.body
    )
  }

  // ── Refine phase — full-screen via portal ──────────────────────────────
  // Controls bar switches axis: portrait = top bar (wraps), landscape = right sidebar
  return createPortal(
    <div className={styles.refineScreen}>

      <div className={styles.previewWrap}>
        {ruledPreviewUrl
          ? <img src={ruledPreviewUrl} alt="Chart preview" className={styles.previewImg} />
          : <div className={styles.loading}><div className={styles.spinner} /></div>
        }
      </div>

      <div className={styles.refineControls}>

        {/* Rows / Sts at the very top */}
        <div className={styles.topInputsBar}>
          <label className={styles.countLabel}>
            <span className={styles.countLabelText}>Rows</span>
            <input className={styles.countInput} type="number" value={totalRows}
              onChange={e => setTotalRows(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="Rows" />
          </label>
          <label className={styles.countLabel}>
            <span className={styles.countLabelText}>Sts</span>
            <input className={styles.countInput} type="number" value={totalStitches}
              onChange={e => setTotalStitches(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="Sts" />
          </label>
        </div>

        {/* Nudge bar — sits closest to the image in both orientations */}
        <div className={styles.refineNudgeBar}>
          {(['top', 'bottom', 'left', 'right'] as const).map(edge => (
            <div key={edge} className={styles.nudgeGroup}>
              <span className={styles.nudgeEdgeLabel}>{edge.charAt(0).toUpperCase()}</span>
              <button className={styles.nudgeBtn} disabled={!nudgeBounds} onClick={() => nudge(edge, NUDGE_PX)}>+</button>
              <button className={styles.nudgeBtn} disabled={!nudgeBounds} onClick={() => nudge(edge, -NUDGE_PX)}>−</button>
            </div>
          ))}
        </div>

        {/* Notes & Reminders — shared row navigator */}
        <div className={styles.refineNotesBar}>
          <button className={styles.notesToggle} onClick={() => setNotesOpen(o => !o)}>
            <span className={styles.notesToggleLabel}>Notes &amp; Reminders</span>
            <span className={styles.notesToggleArrow}>{notesOpen ? '▴' : '▾'}</span>
          </button>
          {notesOpen && (
            <div className={styles.notesBody}>
              {/* Shared row navigator */}
              <div className={styles.notesRowNav}>
                <button
                  className={styles.notesNavBtn}
                  onClick={() => navigateRow(-1)}
                  disabled={noteRow <= 1}
                >◀</button>
                <span className={styles.notesRowLabel}>Row {countBy2 ? noteRow * 2 - 1 : noteRow}</span>
                <button
                  className={styles.notesNavBtn}
                  onClick={() => navigateRow(1)}
                  disabled={typeof totalRows === 'number' && noteRow >= totalRows}
                >▶</button>
              </div>

              {/* Row note */}
              <input
                className={styles.notesRowInput}
                type="text"
                value={rowNotesMap[noteRow] ?? ''}
                onChange={e => setRowNotesMap(m => ({ ...m, [noteRow]: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter') navigateRow(1)
                  if (e.key === 'ArrowDown') { e.preventDefault(); navigateRow(1) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); navigateRow(-1) }
                }}
                placeholder={`Row ${countBy2 ? noteRow * 2 - 1 : noteRow} instruction…`}
                autoComplete="off"
              />

              {/* Reminders at this row */}
              {reminders.filter(r => r.row === noteRow).map(r => (
                <div key={r.id} className={styles.reminderRow}>
                  <span className={`${styles.reminderBadge} ${r.type === 'repeat' ? styles.reminderBadgeRepeat : styles.reminderBadgeAbs}`}>
                    {r.type === 'repeat' ? 'repeat' : 'once'}
                  </span>
                  <span className={styles.reminderRowText}>{r.text}</span>
                  {SOUND_OPTS.map(opt => (
                    <button
                      key={opt.value}
                      className={`${styles.soundOptBtn} ${(r.sound ?? 'chime+speak') === opt.value ? styles.soundOptBtnActive : ''}`}
                      title={opt.value}
                      onClick={() => setReminders(rs => rs.map(x => x.id === r.id ? { ...x, sound: opt.value } : x))}
                    >{opt.label}</button>
                  ))}
                  <button className={styles.reminderDel} onClick={() => setReminders(rs => rs.filter(x => x.id !== r.id))}>
                    <TrashIcon size={11}/>
                  </button>
                </div>
              ))}

              {/* Add reminder for this row */}
              <div className={styles.reminderAddRow}>
                <button
                  className={`${styles.reminderTypeBtn} ${draftRType === 'repeat' ? styles.reminderTypeBtnActive : ''}`}
                  onClick={() => setDraftRType(t => t === 'repeat' ? 'absolute' : 'repeat')}
                  title={draftRType === 'repeat' ? 'Every repeat' : 'Once only'}
                >
                  {draftRType === 'repeat' ? '↻' : '1×'}
                </button>
                <input
                  type="text"
                  value={draftRText}
                  onChange={e => setDraftRText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addReminder()}
                  className={styles.reminderTextInput}
                  placeholder="Add reminder…"
                />
                <button className={styles.reminderAddBtn} onClick={() => addReminder()}>
                  <BellIcon size={12}/>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RS-only (count-by-2) toggle */}
        <label className={styles.settingsRow}>
          <span className={styles.settingsRowLabel}>RS Only</span>
          <input type="checkbox" className={styles.toggleInput} checked={countBy2} onChange={e => setCountBy2(e.target.checked)} />
          <div className={`${styles.toggleTrack} ${countBy2 ? styles.toggleTrackOn : ''}`}>
            <div className={`${styles.toggleThumb} ${countBy2 ? styles.toggleThumbOn : ''}`} />
          </div>
        </label>

        {/* Actions bar — save controls */}
        <div className={styles.refineActionsBar}>
          <div className={styles.refineSpacer} />
          <div className={styles.actionBtns}>
            {hasFullPage && (
              <button className={styles.squareBtn} aria-label="Re-crop" title="Re-crop" onClick={enterReselect}>
                <CropIcon size={14}/>
              </button>
            )}
            <button className={`${styles.squareBtn} ${styles.squareBtnSave}`} aria-label="Save" title="Save" onClick={handleSave}>
              <SaveIcon size={14}/>
            </button>
            <button className={styles.squareBtn} aria-label="Close" title="Close" onClick={onClose}>✕</button>
          </div>
        </div>

      </div>

    </div>,
    document.body
  )
}
