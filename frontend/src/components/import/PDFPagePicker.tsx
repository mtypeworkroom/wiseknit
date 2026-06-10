import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { ChevronLeftIcon, ChevronRightIcon, PencilIcon } from '../icons'
import styles from './PDFPagePicker.module.css'

export interface PageSelection {
  pageNumber: number
  role: 'chart' | 'photo' | null
  chartName?: string
  imageBase64?: string       // full page
  croppedBase64?: string     // cropped chart area
  totalRows?: number
  totalStitches?: number
  workedInRound?: boolean
  confirmed?: boolean
}

interface PDFPagePickerProps {
  file: File
  onComplete: (selections: PageSelection[], totalPages: number) => void
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
  const pageCardRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const lastConfirmedRef = useRef<number | null>(null)

  useEffect(() => {
    if (expandedIndex !== null) {
      setTimeout(() => {
        pageCardRefs.current[expandedIndex]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }, 50)
    } else if (lastConfirmedRef.current !== null) {
      const idx = lastConfirmedRef.current
      lastConfirmedRef.current = null
      setTimeout(() => {
        pageCardRefs.current[idx]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }, 50)
    }
  }, [expandedIndex])

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
      setExpandedIndex(index)
      return { ...s, role, chartName: role === 'chart' ? `Chart ${chartCount}` : undefined, confirmed: false }
    }))
  }

  const updateSel = (index: number, patch: Partial<PageSelection>) =>
    setSelections(prev => prev.map((s, i) => i === index ? { ...s, ...patch } : s))

  const confirmChart = (index: number) => {
    lastConfirmedRef.current = index
    updateSel(index, { confirmed: true })
    setExpandedIndex(null)
  }

  const selectedCharts = selections.filter(s => s.role === 'chart')
  const photoSel = selections.find(s => s.role === 'photo')
  const canComplete = !loading
    && (selectedCharts.length === 0 || selectedCharts.every(s => s.confirmed))
    && (!photoSel || photoSel.confirmed)

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

            {/* ── PDF pages — original always visible ── */}
            {pages.map((src, i) => {
              const sel = selections[i]
              const isChart = sel.role === 'chart'
              const isPhoto = sel.role === 'photo'
              // Photos expand inline; charts open the full-screen overlay
              const isPhotoExpanded = expandedIndex === i && isPhoto

              return (
                <div key={i} ref={el => { pageCardRefs.current[i] = el }} className={`${styles.pageCard} ${isChart ? styles.pageChart : ''} ${isPhoto ? styles.pagePhoto : ''} ${isPhotoExpanded ? styles.pageExpanded : ''}`}>

                  <div className={styles.pageBtns}>
                    <button className={`${styles.pageBtn} ${isChart ? styles.pageBtnActive : ''}`} onClick={() => toggleRole(i, 'chart')}>
                      {isChart ? (sel.confirmed ? '✓ Chart' : '● Chart') : 'Chart'}
                    </button>
                    <button className={`${styles.pageBtn} ${isPhoto ? styles.pageBtnPhoto : ''}`} onClick={() => toggleRole(i, 'photo')}>
                      {isPhoto ? '✓ Photo' : 'Photo'}
                    </button>
                  </div>

                  <div className={styles.pageNum}>Page {i + 1}</div>

                  {/* Photo crop panel — inline expand */}
                  {isPhotoExpanded && pageImageDatas[i] && (
                    <PhotoCropPanel
                      src={src}
                      imageData={pageImageDatas[i]}
                      onConfirm={(croppedBase64) => {
                        const updated = selections.map((s2, i2) =>
                          i2 === i ? { ...s2, croppedBase64, confirmed: true } : s2
                        )
                        setSelections(updated)
                        setExpandedIndex(null)
                        const charts = updated.filter(s2 => s2.role === 'chart')
                        if (charts.length === 0 || charts.every(s2 => s2.confirmed)) {
                          onComplete(updated.filter(s2 => s2.role !== null), totalPages)
                        }
                      }}
                      onCancel={() => setExpandedIndex(null)}
                    />
                  )}

                  {/* Thumbnail — always shown (charts never expand the card) */}
                  {!isPhotoExpanded && (
                    <div
                      className={styles.pageImgWrap}
                      onClick={((isChart || isPhoto) && !sel.confirmed) ? () => setExpandedIndex(i) : undefined}
                    >
                      <img src={src} alt={`Page ${i + 1}`} className={styles.pageImg} />
                      {isChart && !sel.confirmed && (
                        <div className={styles.tapToSetup}>Tap to set up chart</div>
                      )}
                      {isChart && sel.confirmed && (
                        <div className={styles.confirmedOverlay}>✓ {sel.chartName}</div>
                      )}
                      {isPhoto && !sel.confirmed && (
                        <div className={styles.tapToSetup}>Tap to crop photo</div>
                      )}
                      {isPhoto && sel.confirmed && (
                        <div className={styles.confirmedOverlay}>✓ Photo</div>
                      )}
                    </div>
                  )}

                </div>
              )
            })}

            {/* ── Confirmed chart crops — appear at the end ── */}
            {selections.filter(s => s.role === 'chart' && s.confirmed).map((sel) => (
              <div key={`crop-${sel.pageNumber}`} className={`${styles.pageCard} ${styles.pageChart}`}>
                <div className={styles.pageBtns}>
                  <span className={styles.chartCropLabel}>✓ Chart from page {sel.pageNumber}</span>
                  <button className={styles.pageBtn} onClick={() => setExpandedIndex(sel.pageNumber - 1)} aria-label="Edit crop"><PencilIcon size={13}/></button>
                </div>
                <div className={styles.pageNum}>{sel.chartName}</div>
                {sel.croppedBase64 && (
                  <div className={styles.pageImgWrap}>
                    <img src={sel.croppedBase64} alt={sel.chartName} className={styles.pageImg} />
                  </div>
                )}
                <div className={styles.cropDetail}>{sel.totalRows} rows · {sel.totalStitches} sts</div>
              </div>
            ))}

          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.footerInfo}>
            {selectedCharts.length} chart{selectedCharts.length !== 1 ? 's' : ''} selected
            {selectedCharts.filter(s => s.confirmed).length > 0 && ` · ${selectedCharts.filter(s => s.confirmed).length} confirmed`}
            {photoSel ? (photoSel.confirmed ? ' · 1 photo ✓' : ' · 1 photo — tap to crop') : ''}
          </div>
          <div className={styles.footerActions}>
            <button className={styles.cancelBtn} onClick={onCancel}>Cancel</button>
            <button
              className={styles.proceedBtn}
              disabled={!canComplete}
              onClick={() => onComplete(selections.filter(s => s.role !== null), totalPages)}
            >
              Done
            </button>
          </div>
        </div>

      </div>

      {/* Chart setup overlay — full-screen, opens when a chart page is active */}
      {expandedIndex !== null && selections[expandedIndex]?.role === 'chart' && pageImageDatas[expandedIndex] && (
        <ChartSetupOverlay
          src={pages[expandedIndex]}
          imageData={pageImageDatas[expandedIndex]}
          sel={selections[expandedIndex]}
          pageNum={expandedIndex + 1}
          onChange={patch => updateSel(expandedIndex, patch)}
          onConfirm={() => confirmChart(expandedIndex)}
          onBack={() => setExpandedIndex(null)}
        />
      )}

    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────

export interface PixelBounds { x: number; y: number; w: number; h: number }
export interface NudgeOffsets { top: number; bottom: number; left: number; right: number }

// ── detectChartBounds ─────────────────────────────────────────
// Finds tight content bounds within a crop region using adaptive density
// thresholding. Handles normal, inverted (dark-bg), colorwork, and no-stitch
// charts by setting threshold at 25% of the peak row density in the region.

export function detectChartBounds(
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

  // Adaptive threshold: 5% of peak row density.
  // Low threshold so sparse symbol/dot rows are included even when a highlighted
  // repeat column drives peak density very high (~10× the surrounding rows).
  const peakRow = Math.max(...rowDensities)
  const rowThresh = Math.max(0.02, peakRow * 0.05)

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
  const colThresh = Math.max(0.01, peakCol * 0.05)

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

export function computeBounds(
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
      <div className={styles.refineHeader}>
        <span className={styles.refineTitle}>{chartName} — Fine-tune crop</span>
        <span className={styles.refineHint}>+ expands edge outward, − shrinks inward</span>
      </div>

      <div className={styles.nudgeGrid}>
        {(['top','bottom','left','right'] as const).map(edge => (
          <div key={edge} className={styles.nudgeGroup}>
            <span className={styles.nudgeEdgeLabel}>{edge}</span>
            <button className={styles.nudgeBtn} onClick={() => nudge(edge, NUDGE_PX)}>+</button>
            <button className={styles.nudgeBtn} onClick={() => nudge(edge, -NUDGE_PX)}>−</button>
          </div>
        ))}
      </div>

      <div className={styles.refinePreviewWrap}>
        {previewUrl
          ? <img src={previewUrl} alt="Crop preview" className={styles.refinePreview} />
          : <div className={styles.refineLoading}>Generating preview…</div>
        }
      </div>

      <div className={styles.refineActions}>
        <button className={styles.cancelBtn} onClick={onBack}><ChevronLeftIcon size={16}/></button>
        <button className={styles.confirmBtn} onClick={handleConfirm}>Confirm Chart ✓</button>
      </div>
    </div>
  )
}

// ── Photo Crop Panel ──────────────────────────────────────────

interface PhotoCropPanelProps {
  src: string
  imageData: ImageData
  onConfirm: (croppedBase64: string) => void
  onCancel: () => void
}

function PhotoCropPanel({ src, imageData, onConfirm, onCancel }: PhotoCropPanelProps) {
  const [crop, setCrop] = useState<Crop>()

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerCrop(
      makeAspectCrop({ unit: '%', width: 55 }, 4 / 5, width, height),
      width, height
    ))
  }

  const handleConfirm = () => {
    if (!crop) return
    const cropX = Math.round((crop.x / 100) * imageData.width)
    const cropY = Math.round((crop.y / 100) * imageData.height)
    const cropW = Math.round((crop.width / 100) * imageData.width)
    const cropH = Math.round((crop.height / 100) * imageData.height)
    if (cropW <= 0 || cropH <= 0) return
    const canvas = document.createElement('canvas')
    canvas.width = cropW
    canvas.height = cropH
    canvas.getContext('2d', { willReadFrequently: true })!
      .putImageData(imageData, -cropX, -cropY, cropX, cropY, cropW, cropH)
    onConfirm(canvas.toDataURL('image/jpeg', 0.85))
  }

  return (
    <div className={styles.setupPanel}>
      <div className={styles.setupSection}>
        <div className={styles.setupLabel}>
          Drag to crop the project photo (4:5 portrait)
          {crop && <span className={styles.cropDone}> ✓ Ready</span>}
        </div>
        <ReactCrop crop={crop} onChange={(_c, pc) => setCrop(pc)} aspect={4 / 5} className={styles.cropWrap}>
          <img src={src} alt="Page" className={styles.cropImg} onLoad={onImageLoad} />
        </ReactCrop>
      </div>
      <div className={styles.refineActions}>
        <button className={styles.cancelBtn} onClick={onCancel}><ChevronLeftIcon size={16}/></button>
        <button className={styles.confirmBtn} disabled={!crop} onClick={handleConfirm}>
          Confirm Photo ✓
        </button>
      </div>
    </div>
  )
}

// ── Chart Setup Overlay (full-screen) ────────────────────────

interface ChartSetupOverlayProps {
  src: string
  imageData: ImageData
  sel: PageSelection
  pageNum: number
  onChange: (patch: Partial<PageSelection>) => void
  onConfirm: () => void
  onBack: () => void
}

function ChartSetupOverlay({ src, imageData, sel, pageNum, onChange, onConfirm, onBack }: ChartSetupOverlayProps) {
  const [crop, setCrop] = useState<Crop>({ unit: '%', x: 10, y: 10, width: 80, height: 80 })
  const [phase, setPhase] = useState<'select' | 'refine'>('select')
  const [detectedBounds, setDetectedBounds] = useState<PixelBounds | null>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)
  const overlayRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)

  // displayWidth: pixel width that shows the full page at zoom=1, scales linearly with zoom
  const baseWidth = containerSize.w > 0 && containerSize.h > 0
    ? Math.round(imageData.width * Math.min(
        containerSize.w / imageData.width,
        containerSize.h / imageData.height,
      ))
    : 0
  const displayWidth = baseWidth > 0 ? Math.round(baseWidth * zoom) : 0

  // Always-current refs so event handlers (registered once) can read latest values without stale closure
  const baseWidthRef = useRef(0)
  const cropRef = useRef<PercentCrop | undefined>(undefined)
  baseWidthRef.current = baseWidth
  cropRef.current = crop

  // Measure the left panel so we can compute a pixel display width that fits the full page
  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const measure = () => setContainerSize({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // After each zoom change, center the viewport on the crop selection midpoint
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el || zoom <= 1) return
    const bw = baseWidthRef.current
    if (!bw) return
    const c = cropRef.current
    const dispW = bw * zoom
    const dispH = dispW * (imageData.height / imageData.width)
    const cx = c && c.width > 0 ? (c.x + c.width / 2) / 100 : 0.5
    const cy = c && c.height > 0 ? (c.y + c.height / 2) / 100 : 0.5
    el.scrollLeft = Math.max(0, cx * dispW - el.clientWidth / 2)
    el.scrollTop  = Math.max(0, cy * dispH - el.clientHeight / 2)
  }, [zoom])

  useEffect(() => {
    const overlay = overlayRef.current
    const viewport = viewportRef.current
    if (!overlay || !viewport) return
    let lastTouchDist: number | null = null

    const doZoom = (pixels: number) => {
      const factor = Math.pow(1.003, -pixels)
      const cur = zoomRef.current
      const next = Math.max(1, Math.min(20, cur * factor))
      if (Math.abs(next - cur) < 0.001) return
      zoomRef.current = next
      setZoom(next)
    }

    // All scroll on the chart panel is intercepted: plain scroll is suppressed,
    // Ctrl+scroll zooms and centers on the crop selection.
    const handleViewportWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!e.ctrlKey && !e.metaKey) return
      const raw = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY
      const clamped = Math.max(-200, Math.min(200, raw))
      if (Math.abs(clamped) < 10) return
      doZoom(clamped)
    }

    // Block browser page-zoom from Ctrl+scroll on any part of the overlay
    const handleOverlayWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault()
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2)
        lastTouchDist = Math.hypot(
          e.touches[1].clientX - e.touches[0].clientX,
          e.touches[1].clientY - e.touches[0].clientY,
        )
    }
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || lastTouchDist === null) return
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      )
      const cur = zoomRef.current
      const next = Math.max(1, Math.min(20, cur * (dist / lastTouchDist)))
      if (Math.abs(next - cur) > 0.001) {
        zoomRef.current = next
        setZoom(next)
      }
      lastTouchDist = dist
    }
    const handleTouchEnd = () => { lastTouchDist = null }

    viewport.addEventListener('wheel', handleViewportWheel, { passive: false })
    overlay.addEventListener('wheel', handleOverlayWheel, { passive: false })
    overlay.addEventListener('touchstart', handleTouchStart, { passive: true })
    overlay.addEventListener('touchmove', handleTouchMove, { passive: false })
    overlay.addEventListener('touchend', handleTouchEnd)
    return () => {
      viewport.removeEventListener('wheel', handleViewportWheel)
      overlay.removeEventListener('wheel', handleOverlayWheel)
      overlay.removeEventListener('touchstart', handleTouchStart)
      overlay.removeEventListener('touchmove', handleTouchMove)
      overlay.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

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

  const canProceed = !!sel.chartName && !!sel.totalRows && sel.totalRows > 0
    && !!sel.totalStitches && sel.totalStitches > 0

  if (phase === 'refine' && detectedBounds) {
    return (
      <div className={styles.chartOverlay}>
        <CropRefinePanel
          imageData={imageData}
          initialBounds={detectedBounds}
          chartName={sel.chartName ?? 'Chart'}
          onBack={() => setPhase('select')}
          onConfirm={handleRefineConfirm}
        />
      </div>
    )
  }

  return (
    <div ref={overlayRef} className={styles.chartOverlay}>
      <div className={styles.chartOverlayHeader}>
        <button className={styles.cancelBtn} onClick={onBack}><ChevronLeftIcon size={16}/></button>
        <input
          className={styles.headerNameInput}
          value={sel.chartName ?? ''}
          onChange={e => onChange({ chartName: e.target.value })}
          placeholder="Chart name…"
          autoFocus
        />
        {crop
          ? <span className={styles.cropStatusReady}>Chart crop ✓</span>
          : <span className={styles.cropStatusEmpty}>Chart crop — draw a box on the left</span>
        }
      </div>

      <div className={styles.chartOverlayBody}>

        {/* Left: PDF page + crop tool.
            displayWidth drives zoom: at zoom=1 the image fits the panel exactly (full page visible).
            Ctrl+scroll zooms; viewport auto-centers on the crop selection midpoint. */}
        <div ref={viewportRef} className={styles.chartOverlayLeft}>
          <div style={displayWidth ? { width: displayWidth } : { width: '100%' }}>
            <ReactCrop
              crop={crop}
              onChange={(_c, pc) => setCrop(pc)}
              className={styles.cropWrap}
            >
              <img
                src={src}
                alt="Page"
                className={styles.cropImg}
              />
            </ReactCrop>
          </div>
        </div>

        {/* Right: compact form panel */}
        <div className={styles.chartOverlayRight}>
          <div className={styles.setupRowCombined}>
            <div className={styles.setupSection}>
              <div className={styles.setupLabel}>Construction</div>
              <div className={styles.toggleRow}>
                <button type="button" className={`${styles.toggleBtn} ${!sel.workedInRound ? styles.toggleBtnActive : ''}`} onClick={() => onChange({ workedInRound: false })}>
                  Flat
                </button>
                <button type="button" className={`${styles.toggleBtn} ${sel.workedInRound ? styles.toggleBtnActive : ''}`} onClick={() => onChange({ workedInRound: true })}>
                  Round
                </button>
              </div>
            </div>
            <div className={styles.setupSection}>
              <div className={styles.setupLabel}>Rows</div>
              <input
                className={styles.setupInputSmall}
                type="number" min={1}
                value={sel.totalRows ?? ''}
                onChange={e => { const v = parseInt(e.target.value); onChange({ totalRows: isNaN(v) ? undefined : Math.max(1, v) }) }}
                placeholder="—"
              />
            </div>
            <div className={styles.setupSection}>
              <div className={styles.setupLabel}>Sts / row</div>
              <input
                className={styles.setupInputSmall}
                type="number" min={1}
                value={sel.totalStitches ?? ''}
                onChange={e => { const v = parseInt(e.target.value); onChange({ totalStitches: isNaN(v) ? undefined : Math.max(1, v) }) }}
                placeholder="—"
              />
            </div>
          </div>

          <button className={styles.confirmBtn} style={{ marginTop: 'auto' }} disabled={!canProceed} onClick={handlePreview}>
            Preview &amp; Refine <ChevronRightIcon size={12}/>
          </button>
        </div>

      </div>
    </div>
  )
}
