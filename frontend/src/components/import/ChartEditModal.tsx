import { useState, useEffect, useRef } from 'react'
import { SaveIcon } from '../icons'
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
  const [phase, setPhase] = useState<'refine' | 'reselect'>('refine')
  const [crop, setCrop] = useState<PercentCrop>()
  const [totalRows, setTotalRows] = useState<number | ''>(chart.totalRows ?? '')
  const [totalStitches, setTotalStitches] = useState<number | ''>(chart.totalStitches ?? '')
  const mountedRef = useRef(true)

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
    const updates: Partial<ProjectChart> = {
      totalRows: typeof totalRows === 'number' ? totalRows : undefined,
      totalStitches: typeof totalStitches === 'number' ? totalStitches : undefined,
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
        {previewUrl
          ? <img key={previewUrl} src={previewUrl} alt="Chart preview" className={styles.previewImg} />
          : <div className={styles.loading}><div className={styles.spinner} /></div>
        }
      </div>

      <div className={styles.refineControls}>

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

        {/* Actions bar — counts and save controls */}
        <div className={styles.refineActionsBar}>
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
          <div className={styles.refineSpacer} />
          {hasFullPage && (
            <button className={styles.iconBtn} aria-label="Re-crop" title="Re-crop" onClick={enterReselect}>Crop</button>
          )}
          <button className={styles.iconBtnPrimary} aria-label="Save" title="Save" onClick={handleSave}>
            <SaveIcon size={15}/>
          </button>
          <button className={styles.iconBtn} aria-label="Close" title="Close" onClick={onClose}>✕</button>
        </div>

      </div>

    </div>,
    document.body
  )
}
