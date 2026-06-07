import { useState, useEffect, useRef } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import styles from './PDFPagePicker.module.css'

export interface PageSelection {
  pageNumber: number
  role: 'chart' | 'photo' | null
  chartName?: string
  imageBase64?: string       // full page
  croppedBase64?: string     // cropped chart area
  totalRows?: number
  totalStitches?: number
  confirmed?: boolean
}

interface PDFPagePickerProps {
  file: File
  onComplete: (selections: PageSelection[]) => void
  onCancel: () => void
}

export default function PDFPagePicker({ file, onComplete, onCancel }: PDFPagePickerProps) {
  const [pages, setPages] = useState<string[]>([])
  const [pageImageDatas, setPageImageDatas] = useState<ImageData[]>([])
  const [selections, setSelections] = useState<PageSelection[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingPage, setLoadingPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const chartInputRefs = useRef<Record<number, HTMLInputElement | null>>({})

  useEffect(() => { renderPDF() }, [file])

  const renderPDF = async () => {
    try {
      setLoading(true)
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString()
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const numPages = pdf.numPages
      setTotalPages(numPages)
      const pageImages: string[] = []
      const imageDataList: ImageData[] = []
      for (let i = 1; i <= numPages; i++) {
        setLoadingPage(i)
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2.0 })
        // Render to hardware canvas — handles embedded raster images correctly.
        const hwCanvas = document.createElement('canvas')
        hwCanvas.width = viewport.width
        hwCanvas.height = viewport.height
        const hwCtx = hwCanvas.getContext('2d')!
        hwCtx.fillStyle = '#ffffff'
        hwCtx.fillRect(0, 0, hwCanvas.width, hwCanvas.height)
        await page.render({ canvas: hwCanvas, viewport, background: 'white' }).promise
        // getImageData forces GPU→CPU readback — confirmed correct on Windows/Chrome.
        const imageData = hwCtx.getImageData(0, 0, hwCanvas.width, hwCanvas.height)
        imageDataList.push(imageData)
        // Build display PNG for the picker thumbnails.
        const swCanvas = document.createElement('canvas')
        swCanvas.width = hwCanvas.width
        swCanvas.height = hwCanvas.height
        const swCtx = swCanvas.getContext('2d', { willReadFrequently: true })!
        swCtx.putImageData(imageData, 0, 0)
        pageImages.push(swCanvas.toDataURL('image/png'))
      }
      setPages(pageImages)
      setPageImageDatas(imageDataList)
      setSelections(pageImages.map((img, i) => ({
        pageNumber: i + 1,
        role: null,
        imageBase64: img,
      })))
      setLoading(false)
    } catch (err) {
      console.error('PDF render error:', err)
      setLoading(false)
    }
  }

  const toggleRole = (index: number, role: 'chart' | 'photo') => {
    setSelections(prev => prev.map((s, i) => {
      if (i !== index) {
        if (role === 'photo' && s.role === 'photo') return { ...s, role: null }
        return s
      }
      if (s.role === role) {
        setExpandedIndex(null)
        return { ...s, role: null, chartName: undefined, confirmed: false }
      }
      const chartCount = prev.filter(x => x.role === 'chart').length + 1
      if (role === 'chart') {
        setExpandedIndex(index)
        setTimeout(() => {
          chartInputRefs.current[index]?.focus()
          chartInputRefs.current[index]?.select()
        }, 100)
      }
      return { ...s, role, chartName: role === 'chart' ? `Chart ${chartCount}` : undefined, confirmed: false }
    }))
  }

  const updateSel = (index: number, patch: Partial<PageSelection>) =>
    setSelections(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s))

  const confirmChart = (index: number) => {
    updateSel(index, { confirmed: true })
    setExpandedIndex(null)
  }

  const selectedCharts = selections.filter(s => s.role === 'chart')
  const allConfirmed = selectedCharts.length > 0 && selectedCharts.every(s => s.confirmed)

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        <div className={styles.header}>
          <div className={styles.headerTitle}>Select &amp; Set Up Chart Pages</div>
          <div className={styles.headerSub}>Mark each chart page, crop to the chart area, then confirm</div>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <div className={styles.loadingText}>Rendering page {loadingPage} of {totalPages || '?'}…</div>
          </div>
        ) : (
          <div className={styles.pageGrid}>
            {pages.map((src, i) => {
              const sel = selections[i]
              const isChart = sel.role === 'chart'
              const isPhoto = sel.role === 'photo'
              const isExpanded = expandedIndex === i

              return (
                <div key={i} className={`${styles.pageCard} ${isChart ? styles.pageChart : ''} ${isPhoto ? styles.pagePhoto : ''} ${isExpanded ? styles.pageExpanded : ''}`}>

                  {/* Buttons */}
                  <div className={styles.pageBtns}>
                    <button className={`${styles.pageBtn} ${isChart ? styles.pageBtnActive : ''}`} onClick={() => toggleRole(i, 'chart')}>
                      {isChart ? (sel.confirmed ? '✓ Chart' : '● Chart') : 'Chart'}
                    </button>
                    <button className={`${styles.pageBtn} ${isPhoto ? styles.pageBtnPhoto : ''}`} onClick={() => toggleRole(i, 'photo')}>
                      {isPhoto ? '✓ Photo' : 'Photo'}
                    </button>
                  </div>

                  <div className={styles.pageNum}>Page {i + 1}</div>

                  {/* Chart setup panel — shown when expanded */}
                  {isChart && isExpanded && pageImageDatas[i] && (
                    <ChartSetupPanel
                      src={src}
                      imageData={pageImageDatas[i]}
                      sel={sel}
                      inputRef={el => { chartInputRefs.current[i] = el }}
                      onChange={patch => updateSel(i, patch)}
                      onConfirm={() => confirmChart(i)}
                    />
                  )}

                  {/* Confirmed summary */}
                  {isChart && !isExpanded && sel.confirmed && (
                    <div className={styles.confirmedSummary} onClick={() => setExpandedIndex(i)}>
                      <div className={styles.confirmedName}>{sel.chartName}</div>
                      <div className={styles.confirmedDetail}>
                        {sel.totalRows ?? '?'} rows · {sel.totalStitches ?? '?'} sts
                      </div>
                      <div className={styles.confirmedEdit}>Edit ›</div>
                    </div>
                  )}

                  {/* Collapsed unconfirmed — show thumbnail */}
                  {(!isChart || (!isExpanded && !sel.confirmed)) && (
                    <div className={styles.pageImgWrap} onClick={isChart ? () => setExpandedIndex(i) : undefined}>
                      <img src={src} alt={`Page ${i + 1}`} className={styles.pageImg} />
                      {isChart && (
                        <div className={styles.tapToSetup}>Tap to set up chart</div>
                      )}
                    </div>
                  )}

                </div>
              )
            })}
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            {selectedCharts.length} chart{selectedCharts.length !== 1 ? 's' : ''} selected
            {selectedCharts.filter(s => s.confirmed).length > 0 && ` · ${selectedCharts.filter(s => s.confirmed).length} confirmed`}
            {selections.find(s => s.role === 'photo') ? ' · 1 photo' : ''}
          </div>
          <div className={styles.footerActions}>
            <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button
              className={styles.proceedBtn}
              disabled={!allConfirmed}
              onClick={() => onComplete(selections.filter(s => s.role !== null))}
            >
              Done →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────

interface PixelBounds { x: number; y: number; w: number; h: number }
interface NudgeOffsets { top: number; bottom: number; left: number; right: number }

// ── detectChartBounds ─────────────────────────────────────────
// Finds tight content bounds within a crop region using adaptive density
// thresholding. Handles normal, inverted (dark-bg), colorwork, and no-stitch
// charts by setting threshold at 25% of the peak row density in the region.

function detectChartBounds(
  data: Uint8ClampedArray, srcWidth: number,
  ox: number, oy: number, w: number, h: number
): { x: number; y: number; x2: number; y2: number } {
  // Detect inverted chart (dark background) by averaging corner brightness.
  const corners = [[ox, oy], [ox + w - 1, oy], [ox, oy + h - 1], [ox + w - 1, oy + h - 1]] as const
  const avgCorner = corners.reduce((sum, [px, py]) => {
    const i = (py * srcWidth + px) * 4
    return sum + (data[i] + data[i + 1] + data[i + 2]) / 3
  }, 0) / 4
  const inverted = avgCorner < 100

  const isContent = (idx: number) => {
    const r = data[idx], g = data[idx + 1], b = data[idx + 2]
    return inverted
      ? (r + g + b) / 3 > 200                                          // inverted: bright grid lines
      : (Math.max(r, g, b) - Math.min(r, g, b) > 30) || ((r + g + b) / 3 < 180) // normal: colorful or dark
  }

  // Scan every row for content density.
  const rowDensities = Array.from({ length: h }, (_, dy) => {
    let c = 0
    for (let dx = 0; dx < w; dx++) c += isContent(((oy + dy) * srcWidth + (ox + dx)) * 4) ? 1 : 0
    return c / w
  })

  // Adaptive threshold: 25% of peak row density.
  // This adapts to chart type (colorwork peak ~90%, B&W symbol peak ~40%).
  const peakRow = Math.max(...rowDensities)
  const rowThresh = Math.max(0.05, peakRow * 0.25)

  let top = h - 1, bottom = 0
  for (let dy = 0; dy < h; dy++) { if (rowDensities[dy] >= rowThresh) { top = dy; break } }
  for (let dy = h - 1; dy >= 0; dy--) { if (rowDensities[dy] >= rowThresh) { bottom = dy; break } }

  // Scan columns within the found row band.
  const colDensities = Array.from({ length: w }, (_, dx) => {
    let c = 0
    for (let dy = top; dy <= bottom; dy++) c += isContent(((oy + dy) * srcWidth + (ox + dx)) * 4) ? 1 : 0
    return c / Math.max(1, bottom - top + 1)
  })

  const peakCol = Math.max(...colDensities)
  const colThresh = Math.max(0.03, peakCol * 0.15)

  let left = w - 1, right = 0
  for (let dx = 0; dx < w; dx++) { if (colDensities[dx] >= colThresh) { left = dx; break } }
  for (let dx = w - 1; dx >= 0; dx--) { if (colDensities[dx] >= colThresh) { right = dx; break } }

  return bottom >= top && right >= left
    ? { x: ox + left, y: oy + top, x2: ox + right, y2: oy + bottom }
    : { x: ox, y: oy, x2: ox + w - 1, y2: oy + h - 1 }
}

// ── computeBounds ─────────────────────────────────────────────
// Applies nudge offsets to initial bounds, clamped to image extents.
// Positive offset = expand that edge outward; negative = shrink inward.

function computeBounds(
  initial: PixelBounds, offsets: NudgeOffsets, imgW: number, imgH: number
): PixelBounds {
  const x = Math.max(0, initial.x - offsets.left)
  const y = Math.max(0, initial.y - offsets.top)
  const x2 = Math.min(imgW - 1, initial.x + initial.w - 1 + offsets.right)
  const y2 = Math.min(imgH - 1, initial.y + initial.h - 1 + offsets.bottom)
  return { x, y, w: Math.max(0, x2 - x + 1), h: Math.max(0, y2 - y + 1) }
}

// ── Crop Refine Panel ─────────────────────────────────────────

interface CropRefinePanelProps {
  imageData: ImageData
  initialBounds: PixelBounds
  chartName: string
  onBack: () => void
  onConfirm: (croppedBase64: string) => void
}

const NUDGE_PX = 4

function CropRefinePanel({ imageData, initialBounds, chartName, onBack, onConfirm }: CropRefinePanelProps) {
  const [offsets, setOffsets] = useState<NudgeOffsets>({ top: 0, bottom: 0, left: 0, right: 0 })
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    const b = computeBounds(initialBounds, offsets, imageData.width, imageData.height)
    if (b.w <= 0 || b.h <= 0) return
    const canvas = document.createElement('canvas')
    canvas.width = b.w
    canvas.height = b.h
    canvas.getContext('2d', { willReadFrequently: true })!
      .putImageData(imageData, -b.x, -b.y, b.x, b.y, b.w, b.h)
    setPreviewUrl(canvas.toDataURL('image/png'))
  }, [offsets, initialBounds, imageData])

  const nudge = (edge: keyof NudgeOffsets, delta: number) =>
    setOffsets(prev => ({ ...prev, [edge]: prev[edge] + delta }))

  const handleConfirm = () => {
    const b = computeBounds(initialBounds, offsets, imageData.width, imageData.height)
    if (b.w <= 0 || b.h <= 0) return
    const canvas = document.createElement('canvas')
    canvas.width = b.w
    canvas.height = b.h
    canvas.getContext('2d', { willReadFrequently: true })!
      .putImageData(imageData, -b.x, -b.y, b.x, b.y, b.w, b.h)
    onConfirm(canvas.toDataURL('image/png'))
  }

  return (
    <div className={styles.refinePanel}>
      <div className={styles.refineTitle}>{chartName} — Fine-tune crop</div>
      <div className={styles.refineHint}>Use + to expand each edge outward, − to shrink it inward</div>

      <div className={styles.refineNudgeRow}>
        <span className={styles.refineEdgeLabel}>Top</span>
        <button className={styles.nudgeBtn} onClick={() => nudge('top', NUDGE_PX)}>▲ +</button>
        <button className={styles.nudgeBtn} onClick={() => nudge('top', -NUDGE_PX)}>▼ −</button>
      </div>

      <div className={styles.refinePreviewWrap}>
        {previewUrl
          ? <img src={previewUrl} alt="Crop preview" className={styles.refinePreview} />
          : <div className={styles.refineLoading}>Generating preview…</div>
        }
      </div>

      <div className={styles.refineNudgeRow}>
        <span className={styles.refineEdgeLabel}>Bottom</span>
        <button className={styles.nudgeBtn} onClick={() => nudge('bottom', NUDGE_PX)}>▼ +</button>
        <button className={styles.nudgeBtn} onClick={() => nudge('bottom', -NUDGE_PX)}>▲ −</button>
      </div>

      <div className={styles.refineNudgeRow}>
        <span className={styles.refineEdgeLabel}>Left</span>
        <button className={styles.nudgeBtn} onClick={() => nudge('left', NUDGE_PX)}>◄ +</button>
        <button className={styles.nudgeBtn} onClick={() => nudge('left', -NUDGE_PX)}>► −</button>
        <span className={styles.refineEdgeSep} />
        <span className={styles.refineEdgeLabel}>Right</span>
        <button className={styles.nudgeBtn} onClick={() => nudge('right', NUDGE_PX)}>► +</button>
        <button className={styles.nudgeBtn} onClick={() => nudge('right', -NUDGE_PX)}>◄ −</button>
      </div>

      <div className={styles.refineActions}>
        <button className={styles.cancelBtn} onClick={onBack}>← Back</button>
        <button className={styles.confirmBtn} onClick={handleConfirm}>Confirm Chart ✓</button>
      </div>
    </div>
  )
}

// ── Chart Setup Panel ─────────────────────────────────────────

interface ChartSetupPanelProps {
  src: string
  imageData: ImageData
  sel: PageSelection
  inputRef: (el: HTMLInputElement | null) => void
  onChange: (patch: Partial<PageSelection>) => void
  onConfirm: () => void
}

function ChartSetupPanel({ src, imageData, sel, inputRef, onChange, onConfirm }: ChartSetupPanelProps) {
  const [crop, setCrop] = useState<Crop>()
  const [phase, setPhase] = useState<'select' | 'refine'>('select')
  const [detectedBounds, setDetectedBounds] = useState<PixelBounds | null>(null)

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, width / height, width, height),
      width, height
    ))
  }

  const handlePreview = () => {
    if (!crop) return
    const cropX = Math.round((crop.x / 100) * imageData.width)
    const cropY = Math.round((crop.y / 100) * imageData.height)
    const cropW = Math.round((crop.width / 100) * imageData.width)
    const cropH = Math.round((crop.height / 100) * imageData.height)
    if (cropW <= 0 || cropH <= 0) return
    const { x, y, x2, y2 } = detectChartBounds(imageData.data, imageData.width, cropX, cropY, cropW, cropH)
    const pad = 4
    setDetectedBounds({
      x: Math.max(0, x - pad),
      y: Math.max(0, y - pad),
      w: Math.min(imageData.width, x2 + pad + 1) - Math.max(0, x - pad),
      h: Math.min(imageData.height, y2 + pad + 1) - Math.max(0, y - pad),
    })
    setPhase('refine')
  }

  const handleRefineConfirm = (croppedBase64: string) => {
    onChange({ croppedBase64 })
    onConfirm()
  }

  if (phase === 'refine' && detectedBounds) {
    return (
      <CropRefinePanel
        imageData={imageData}
        initialBounds={detectedBounds}
        chartName={sel.chartName ?? 'Chart'}
        onBack={() => setPhase('select')}
        onConfirm={handleRefineConfirm}
      />
    )
  }

  const canProceed = !!sel.chartName && !!sel.totalRows && sel.totalRows > 0
    && !!sel.totalStitches && sel.totalStitches > 0 && !!crop

  return (
    <div className={styles.setupPanel}>
      <div className={styles.setupSection}>
        <div className={styles.setupLabel}>Chart name</div>
        <input
          ref={inputRef}
          className={styles.setupInput}
          value={sel.chartName ?? ''}
          onChange={e => onChange({ chartName: e.target.value })}
          placeholder="e.g. Body Chart, Sleeve Chart…"
        />
      </div>

      <div className={styles.setupSection}>
        <div className={styles.setupLabel}>
          Drag to crop just the chart area
          {crop && <span className={styles.cropDone}> ✓ Ready</span>}
        </div>
        <ReactCrop crop={crop} onChange={(_c, pc) => setCrop(pc)} className={styles.cropWrap}>
          <img
            src={src}
            alt="Page"
            className={styles.cropImg}
            onLoad={onImageLoad}
          />
        </ReactCrop>
      </div>

      <div className={styles.setupRow}>
        <div className={styles.setupSection}>
          <div className={styles.setupLabel}>Total rows</div>
          <input
            className={styles.setupInputSmall}
            type="number"
            min={1}
            value={sel.totalRows ?? ''}
            onChange={e => onChange({ totalRows: parseInt(e.target.value) || undefined })}
            placeholder="e.g. 28"
          />
        </div>
        <div className={styles.setupSection}>
          <div className={styles.setupLabel}>Stitches per row</div>
          <input
            className={styles.setupInputSmall}
            type="number"
            min={1}
            value={sel.totalStitches ?? ''}
            onChange={e => onChange({ totalStitches: parseInt(e.target.value) || undefined })}
            placeholder="e.g. 14"
          />
        </div>
      </div>

      <button
        className={styles.confirmBtn}
        disabled={!canProceed}
        onClick={handlePreview}
      >
        Preview &amp; Refine →
      </button>
    </div>
  )
}
