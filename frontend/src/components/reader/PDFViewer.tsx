import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { loadPDF } from '../../store/imageStore'
import { BookmarkIcon, StitchMarkerIcon, SectionMarkerIcon, BracketIcon } from '../icons'
import type { PdfSection, PdfReadingRect, BracketPos } from '../../types'
import styles from './PDFViewer.module.css'

interface PDFViewerProps {
  pdfKey: string
  initialPage?: number
  /** Set when navigating from a section chip — shows bookmark marker and reading rects */
  activeSection?: PdfSection
  /** Global highlights not tied to a section (shown when no activeSection) */
  extraRects?: PdfReadingRect[]
  bracketPos?: BracketPos
  onSaveSection?: (label: string, page: number, markXPct?: number, markYPct?: number) => void
  onSaveReadingRect?: (page: number, x1Pct: number, y1Pct: number, x2Pct: number, y2Pct: number, color: string) => void
  onRemoveReadingRect?: (id: string) => void
  onSaveBracket?: (pos: BracketPos) => void
  onClose: () => void
}

type BracketDragMode = 'move' | 'n' | 's' | 'e' | 'w'
interface BracketDragState {
  mode: BracketDragMode
  fLeft: number; fTop: number; fWidth: number; fHeight: number
  startXPct: number; startYPct: number
  initPos: BracketPos
}

type TagPhase = 'idle' | 'placing' | 'naming' | 'drawing-rect'

const HIGHLIGHT_COLORS = ['#D4A017', '#E8185A', '#5BD45B', '#60C7F7', '#C084FC']
const DEFAULT_COLOR = HIGHLIGHT_COLORS[0]

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]
}

function getDist(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

export default function PDFViewer({
  pdfKey, initialPage = 1, activeSection, extraRects, bracketPos: bracketPosProp,
  onSaveSection, onSaveReadingRect, onRemoveReadingRect, onSaveBracket, onClose,
}: PDFViewerProps) {
  const pdfRef = useRef<any>(null)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [pageNum, setPageNum] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(0)
  const [pageUrl, setPageUrl] = useState('')
  const [rendering, setRendering] = useState(true)
  const [error, setError] = useState('')
  const [tagPhase, setTagPhase] = useState<TagPhase>('idle')
  const [tagInput, setTagInput] = useState('')
  const [tagXPct, setTagXPct] = useState<number | null>(null)
  const [tagYPct, setTagYPct] = useState<number | null>(null)
  const [rectColor, setRectColor] = useState(DEFAULT_COLOR)

  const [bracketActive, setBracketActive] = useState(false)
  const [localBracket, setLocalBracket] = useState<BracketPos>(
    () => bracketPosProp ?? { x1Pct: 5, y1Pct: 5, x2Pct: 95, y2Pct: 14 }
  )

  const frameRef = useRef<HTMLDivElement>(null)
  const pageAreaRef = useRef<HTMLDivElement>(null)
  const bracketRef = useRef<HTMLDivElement>(null)
  const bracketDragRef = useRef<BracketDragState | null>(null)
  // Bookmark marker and preview rect live outside pageFrame to keep its
  // compositing layer free of SVG content (SVGs degrade rasterisation quality).
  // Plain-background reading-rect divs render safely inside pageFrame.
  const markerDivRef = useRef<HTMLDivElement>(null)
  const rectPreviewDivRef = useRef<HTMLDivElement>(null)

  const markerXPctRef = useRef<number | null>(null)
  const markerYPctRef = useRef<number | null>(null)
  const drawStartRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const mouseDragRef = useRef(false)
  const tagPhaseRef = useRef<TagPhase>('idle')

  // Long-press to remove a reading rect — all hit-testing done via coordinate math
  // so the compositing layer children (rect divs) stay pointer-events: none.
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const pressingRectIdRef = useRef<string | null>(null)
  const onRemoveReadingRectRef = useRef(onRemoveReadingRect)
  onRemoveReadingRectRef.current = onRemoveReadingRect
  const canRemoveRef = useRef(false)
  canRemoveRef.current = !!onRemoveReadingRect
  const [pressingRectId, setPressingRectId] = useState<string | null>(null)
  // Kept fresh each render so native handlers see current rects without stale closure.
  const pageRectsRef = useRef<PdfReadingRect[]>([])
  const touchRef = useRef<{
    type: 'pinch' | 'pan'
    initDist: number; initZoom: number
    initPanX: number; initPanY: number
    startX: number; startY: number
  } | null>(null)
  const lastTapRef = useRef(0)

  useEffect(() => { tagPhaseRef.current = tagPhase }, [tagPhase])
  useEffect(() => { if (bracketPosProp) setLocalBracket(bracketPosProp) }, [bracketPosProp])

  const cancelLongPress = () => {
    if (longPressTimerRef.current) { clearTimeout(longPressTimerRef.current); longPressTimerRef.current = null }
    setPressingRectId(null)
    pressingRectIdRef.current = null
    pressStartPosRef.current = null
  }

  const startLongPress = (id: string, x: number, y: number) => {
    cancelLongPress()
    pressStartPosRef.current = { x, y }
    pressingRectIdRef.current = id
    setPressingRectId(id)
    longPressTimerRef.current = setTimeout(() => {
      onRemoveReadingRectRef.current?.(id)
      setPressingRectId(null)
      pressingRectIdRef.current = null
      pressStartPosRef.current = null
      longPressTimerRef.current = null
    }, 600)
  }

  const markerX = tagPhase === 'naming' ? tagXPct : (activeSection?.markXPct ?? null)
  const markerY = tagPhase === 'naming' ? tagYPct : (activeSection?.markYPct ?? null)
  markerXPctRef.current = markerX
  markerYPctRef.current = markerY

  // ── Imperative DOM helpers ────────────────────────────────────────────────

  const updateMarkerDOM = () => {
    const marker = markerDivRef.current
    if (!marker) return
    const xPct = markerXPctRef.current
    const yPct = markerYPctRef.current
    if (xPct == null || yPct == null || !frameRef.current || !pageAreaRef.current) {
      marker.style.display = 'none'; return
    }
    const fRect = frameRef.current.getBoundingClientRect()
    const aRect = pageAreaRef.current.getBoundingClientRect()
    marker.style.display = 'block'
    marker.style.left = `${fRect.left - aRect.left + (xPct / 100) * fRect.width}px`
    marker.style.top  = `${fRect.top  - aRect.top  + (yPct / 100) * fRect.height}px`
  }

  const applyTransform = (zoom: number, x: number, y: number) => {
    if (frameRef.current) {
      frameRef.current.style.transform = `scale(${zoom}) translate(${x}px, ${y}px)`
    }
    if (pageAreaRef.current && !mouseDragRef.current) {
      pageAreaRef.current.style.cursor = zoom > 1 ? 'grab' : ''
    }
    updateMarkerDOM()
  }

  const resetTransform = () => {
    zoomRef.current = 1
    panRef.current = { x: 0, y: 0 }
    applyTransform(1, 0, 0)
  }

  // ── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false
    setError('')
    setRendering(true)
    loadPDF(pdfKey).then(async (ab) => {
      if (!ab || cancelled) {
        if (!cancelled) setError('Pattern PDF not found. Please re-import the PDF from project setup.')
        return
      }
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
      ).toString()
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise
      if (!cancelled) { pdfRef.current = pdf; setTotalPages(pdf.numPages); setPdfLoaded(true) }
    }).catch(err => { if (!cancelled) setError(`Failed to load PDF: ${err.message}`) })
    return () => { cancelled = true }
  }, [pdfKey])

  useEffect(() => {
    if (!pdfLoaded || !pdfRef.current) return
    let cancelled = false
    setRendering(true)
    resetTransform()
    ;(async () => {
      try {
        const page = await pdfRef.current.getPage(pageNum)
        const scale = 2.0
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width; canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvas, viewport }).promise
        if (!cancelled) setPageUrl(canvas.toDataURL('image/jpeg', 0.9))
      } catch (err: any) {
        if (!cancelled) setError(`Failed to render page: ${err.message}`)
      } finally {
        if (!cancelled) {
          setRendering(false)
          requestAnimationFrame(updateMarkerDOM)
        }
      }
    })()
    return () => { cancelled = true }
  }, [pdfLoaded, pageNum])

  useEffect(() => { requestAnimationFrame(updateMarkerDOM) }, [markerX, markerY])

  useEffect(() => {
    const el = pageAreaRef.current
    if (!el) return

    // Returns the reading rect hit by (clientX, clientY), or null.
    // Uses getBoundingClientRect() on frameRef so zoom/pan are accounted for.
    const hitRect = (clientX: number, clientY: number) => {
      if (!canRemoveRef.current || !frameRef.current) return null
      const fr = frameRef.current.getBoundingClientRect()
      const xPct = (clientX - fr.left) / fr.width * 100
      const yPct = (clientY - fr.top) / fr.height * 100
      return pageRectsRef.current.find(r =>
        xPct >= Math.min(r.x1Pct, r.x2Pct) && xPct <= Math.max(r.x1Pct, r.x2Pct) &&
        yPct >= Math.min(r.y1Pct, r.y2Pct) && yPct <= Math.max(r.y1Pct, r.y2Pct)
      ) ?? null
    }

    const onTouchStart = (e: TouchEvent) => {
      if (bracketRef.current?.contains(e.target as Node)) return
      if (tagPhaseRef.current !== 'idle') return
      if (e.touches.length === 1) {
        const t = e.touches[0]
        const hit = hitRect(t.clientX, t.clientY)
        if (hit) {
          e.preventDefault()
          startLongPress(hit.id, t.clientX, t.clientY)
          return
        }
        const now = Date.now()
        if (now - lastTapRef.current < 300) {
          e.preventDefault(); resetTransform(); lastTapRef.current = 0; return
        }
        lastTapRef.current = now
        if (zoomRef.current > 1.05) {
          e.preventDefault()
          touchRef.current = {
            type: 'pan', initDist: 0,
            initZoom: zoomRef.current, initPanX: panRef.current.x, initPanY: panRef.current.y,
            startX: t.clientX, startY: t.clientY,
          }
        }
      } else if (e.touches.length === 2) {
        e.preventDefault()
        touchRef.current = {
          type: 'pinch', initDist: getDist(e.touches),
          initZoom: zoomRef.current, initPanX: panRef.current.x, initPanY: panRef.current.y,
          startX: 0, startY: 0,
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (pressingRectIdRef.current && pressStartPosRef.current && e.touches.length === 1) {
        const dx = e.touches[0].clientX - pressStartPosRef.current.x
        const dy = e.touches[0].clientY - pressStartPosRef.current.y
        if (Math.sqrt(dx * dx + dy * dy) > 8) cancelLongPress()
        return
      }
      if (!touchRef.current) return
      e.preventDefault()
      if (touchRef.current.type === 'pinch' && e.touches.length === 2) {
        const scale = getDist(e.touches) / touchRef.current.initDist
        const newZoom = Math.min(5, Math.max(1, touchRef.current.initZoom * scale))
        zoomRef.current = newZoom
        applyTransform(newZoom, panRef.current.x, panRef.current.y)
      } else if (touchRef.current.type === 'pan' && e.touches.length === 1) {
        const dx = (e.touches[0].clientX - touchRef.current.startX) / zoomRef.current
        const dy = (e.touches[0].clientY - touchRef.current.startY) / zoomRef.current
        const newX = touchRef.current.initPanX + dx
        const newY = touchRef.current.initPanY + dy
        panRef.current = { x: newX, y: newY }
        applyTransform(zoomRef.current, newX, newY)
      }
    }

    const onTouchEnd = () => {
      if (pressingRectIdRef.current) { cancelLongPress(); return }
      touchRef.current = null
      if (zoomRef.current < 1) resetTransform()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const newZoom = Math.min(5, Math.max(1, zoomRef.current * (e.deltaY < 0 ? 1.1 : 0.9)))
      zoomRef.current = newZoom
      if (newZoom === 1) panRef.current = { x: 0, y: 0 }
      applyTransform(newZoom, panRef.current.x, panRef.current.y)
    }

    const onMouseDown = (e: MouseEvent) => {
      if (bracketRef.current?.contains(e.target as Node)) return
      if (tagPhaseRef.current !== 'idle') return
      const hit = hitRect(e.clientX, e.clientY)
      if (hit) { startLongPress(hit.id, e.clientX, e.clientY); return }
      if (zoomRef.current <= 1) return
      e.preventDefault()
      mouseDragRef.current = true
      el.style.cursor = 'grabbing'
      touchRef.current = {
        type: 'pan', initDist: 0,
        initZoom: zoomRef.current, initPanX: panRef.current.x, initPanY: panRef.current.y,
        startX: e.clientX, startY: e.clientY,
      }
    }

    const onMouseMove = (e: MouseEvent) => {
      if (pressingRectIdRef.current && pressStartPosRef.current) {
        const dx = e.clientX - pressStartPosRef.current.x
        const dy = e.clientY - pressStartPosRef.current.y
        if (Math.sqrt(dx * dx + dy * dy) > 8) cancelLongPress()
        return
      }
      if (!mouseDragRef.current || !touchRef.current) return
      const dx = (e.clientX - touchRef.current.startX) / zoomRef.current
      const dy = (e.clientY - touchRef.current.startY) / zoomRef.current
      panRef.current = { x: touchRef.current.initPanX + dx, y: touchRef.current.initPanY + dy }
      applyTransform(zoomRef.current, panRef.current.x, panRef.current.y)
    }

    const onMouseUp = () => {
      if (pressingRectIdRef.current) { cancelLongPress(); return }
      if (!mouseDragRef.current) return
      mouseDragRef.current = false; touchRef.current = null
      el.style.cursor = zoomRef.current > 1 ? 'grab' : ''
    }

    const opts = { passive: false } as EventListenerOptions
    el.addEventListener('touchstart', onTouchStart, opts)
    el.addEventListener('touchmove', onTouchMove, opts)
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('wheel', onWheel, opts)
    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
    }
  }, [])

  // ── Bracket drag ──────────────────────────────────────────────────────────

  const computeBracketPos = (drag: BracketDragState, clientX: number, clientY: number): BracketPos => {
    const xPct = Math.max(0, Math.min(100, (clientX - drag.fLeft) / drag.fWidth * 100))
    const yPct = Math.max(0, Math.min(100, (clientY - drag.fTop) / drag.fHeight * 100))
    const dx = xPct - drag.startXPct
    const dy = yPct - drag.startYPct
    const p = drag.initPos
    if (drag.mode === 'move') {
      const w = p.x2Pct - p.x1Pct, h = p.y2Pct - p.y1Pct
      const x1 = Math.max(0, Math.min(100 - w, p.x1Pct + dx))
      const y1 = Math.max(0, Math.min(100 - h, p.y1Pct + dy))
      return { x1Pct: x1, y1Pct: y1, x2Pct: x1 + w, y2Pct: y1 + h }
    }
    if (drag.mode === 'n') return { ...p, y1Pct: Math.max(0, Math.min(p.y2Pct - 1, p.y1Pct + dy)) }
    if (drag.mode === 's') return { ...p, y2Pct: Math.max(p.y1Pct + 1, Math.min(100, p.y2Pct + dy)) }
    if (drag.mode === 'w') return { ...p, x1Pct: Math.max(0, Math.min(p.x2Pct - 1, p.x1Pct + dx)) }
    return { ...p, x2Pct: Math.max(p.x1Pct + 1, Math.min(100, p.x2Pct + dx)) }
  }

  const applyBracketDOM = (pos: BracketPos) => {
    const el = bracketRef.current
    if (!el) return
    el.style.left = `${pos.x1Pct}%`
    el.style.top = `${pos.y1Pct}%`
    el.style.width = `${pos.x2Pct - pos.x1Pct}%`
    el.style.height = `${pos.y2Pct - pos.y1Pct}%`
  }

  const startBracketDrag = (e: React.PointerEvent, mode: BracketDragMode) => {
    e.stopPropagation()
    e.preventDefault()
    if (!frameRef.current) return
    const fr = frameRef.current.getBoundingClientRect()
    bracketDragRef.current = {
      mode,
      fLeft: fr.left, fTop: fr.top, fWidth: fr.width, fHeight: fr.height,
      startXPct: (e.clientX - fr.left) / fr.width * 100,
      startYPct: (e.clientY - fr.top) / fr.height * 100,
      initPos: { ...localBracket },
    }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }

  const onBracketPointerMove = (e: React.PointerEvent) => {
    if (!bracketDragRef.current) return
    e.stopPropagation()
    applyBracketDOM(computeBracketPos(bracketDragRef.current, e.clientX, e.clientY))
  }

  const onBracketPointerUp = (e: React.PointerEvent) => {
    if (!bracketDragRef.current) return
    e.stopPropagation()
    const newPos = computeBracketPos(bracketDragRef.current, e.clientX, e.clientY)
    bracketDragRef.current = null
    setLocalBracket(newPos)
    onSaveBracket?.(newPos)
    applyBracketDOM(newPos)
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  const goTo = (n: number) => setPageNum(Math.min(totalPages, Math.max(1, n)))

  const startPlacing = () => {
    resetTransform(); setTagInput(''); setTagXPct(null); setTagYPct(null); setTagPhase('placing')
  }

  const startDrawingRect = () => setTagPhase('drawing-rect')

  const handlePlacingTap = (e: React.MouseEvent) => {
    if (!frameRef.current) return
    const rect = frameRef.current.getBoundingClientRect()
    setTagXPct(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
    setTagYPct(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)))
    setTagPhase('naming')
  }

  const handleDrawStart = (clientX: number, clientY: number) => {
    drawStartRef.current = { clientX, clientY }
    const preview = rectPreviewDivRef.current
    const aRect = pageAreaRef.current?.getBoundingClientRect()
    if (preview && aRect) {
      const [r, g, b] = hexToRgb(rectColor)
      preview.style.background = `rgba(${r},${g},${b},0.2)`
      preview.style.borderColor = `rgba(${r},${g},${b},0.9)`
      preview.style.display = 'block'
      preview.style.left = `${clientX - aRect.left}px`
      preview.style.top  = `${clientY - aRect.top}px`
      preview.style.width = '0px'; preview.style.height = '0px'
    }
  }

  const handleDrawMove = (clientX: number, clientY: number) => {
    const start = drawStartRef.current
    const preview = rectPreviewDivRef.current
    const aRect = pageAreaRef.current?.getBoundingClientRect()
    if (!start || !preview || !aRect) return
    preview.style.left   = `${Math.min(start.clientX, clientX) - aRect.left}px`
    preview.style.top    = `${Math.min(start.clientY, clientY) - aRect.top}px`
    preview.style.width  = `${Math.abs(clientX - start.clientX)}px`
    preview.style.height = `${Math.abs(clientY - start.clientY)}px`
  }

  const handleDrawEnd = (clientX: number, clientY: number) => {
    const start = drawStartRef.current
    drawStartRef.current = null
    if (rectPreviewDivRef.current) rectPreviewDivRef.current.style.display = 'none'
    if (!start || !frameRef.current) { setTagPhase('idle'); return }
    const fRect = frameRef.current.getBoundingClientRect()
    const clamp = (v: number) => Math.max(0, Math.min(100, v))
    const x1Pct = clamp((start.clientX - fRect.left) / fRect.width * 100)
    const y1Pct = clamp((start.clientY - fRect.top)  / fRect.height * 100)
    const x2Pct = clamp((clientX       - fRect.left) / fRect.width * 100)
    const y2Pct = clamp((clientY       - fRect.top)  / fRect.height * 100)
    if (Math.abs(x2Pct - x1Pct) > 1 && Math.abs(y2Pct - y1Pct) > 1) {
      onSaveReadingRect?.(pageNum, x1Pct, y1Pct, x2Pct, y2Pct, rectColor)
    }
    setTagPhase('idle')
  }

  const saveTag = () => {
    const label = tagInput.trim()
    if (label) onSaveSection?.(label, pageNum, tagXPct ?? undefined, tagYPct ?? undefined)
    setTagInput(''); setTagXPct(null); setTagYPct(null); setTagPhase('idle')
  }

  const cancelTag = () => {
    setTagInput(''); setTagXPct(null); setTagYPct(null)
    drawStartRef.current = null
    if (rectPreviewDivRef.current) rectPreviewDivRef.current.style.display = 'none'
    setTagPhase('idle')
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const pageRects = [
    ...(activeSection?.readingRects ?? []),
    ...(extraRects ?? []),
  ].filter(r => r.page === pageNum)
  pageRectsRef.current = pageRects

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        {tagPhase === 'placing' ? (
          <>
            <span className={styles.placingHint}>Tap where this section starts</span>
            <button className={styles.tagCancelBtn} onClick={cancelTag}>✕</button>
          </>
        ) : tagPhase === 'naming' ? (
          <>
            <input
              className={styles.tagInput} type="text" placeholder="Section name…"
              value={tagInput} onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveTag(); if (e.key === 'Escape') cancelTag() }}
              autoFocus
            />
            <button className={styles.tagSaveBtn} onClick={saveTag} disabled={!tagInput.trim()}>Save</button>
            <button className={styles.tagCancelBtn} onClick={cancelTag}>✕</button>
          </>
        ) : tagPhase === 'drawing-rect' ? (
          <>
            <div className={styles.colorPalette}>
              {HIGHLIGHT_COLORS.map(c => (
                <button
                  key={c}
                  className={`${styles.colorSwatch}${c === rectColor ? ` ${styles.colorSwatchActive}` : ''}`}
                  style={{ background: c }}
                  onClick={() => setRectColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
            <span className={styles.placingHint}>Drag to add a highlight</span>
            <button className={styles.tagCancelBtn} onClick={cancelTag}>✕</button>
          </>
        ) : (
          <>
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
            <span className={styles.pageInfo}>
              {totalPages > 0 ? `Page ${pageNum} of ${totalPages}` : 'Loading…'}
            </span>
            {onSaveSection && (
              <button className={styles.tagBtn} onClick={startPlacing} aria-label="Bookmark" title="Bookmark">
                <BookmarkIcon size={18} />
              </button>
            )}
            {onSaveReadingRect && (
              <button className={styles.tagBtn} onClick={startDrawingRect} aria-label="Stitch marker" title="Stitch marker">
                <StitchMarkerIcon size={18} />
              </button>
            )}
            <button
              className={`${styles.tagBtn}${bracketActive ? ` ${styles.tagBtnActive}` : ''}`}
              onClick={() => setBracketActive(a => !a)}
              aria-label="Row bracket"
              title="Row bracket"
            >
              <BracketIcon size={16} />
            </button>
            <div className={styles.navBtns}>
              <button className={styles.navBtn} onClick={() => goTo(pageNum - 1)} disabled={pageNum <= 1}>‹</button>
              <button className={styles.navBtn} onClick={() => goTo(pageNum + 1)} disabled={pageNum >= totalPages}>›</button>
            </div>
          </>
        )}
      </div>

      <div className={styles.pageArea} ref={pageAreaRef}>
        {error ? (
          <div className={styles.errorMsg}>{error}</div>
        ) : rendering && !pageUrl ? (
          <div className={styles.spinner} />
        ) : (
          <>
            <div ref={frameRef} className={styles.pageFrame}>
              <img src={pageUrl} alt={`Page ${pageNum}`} className={styles.pageImg} />
              {/* Reading rects live inside pageFrame so they scale/pan with the page.
                  Plain background divs (no SVG) are safe in the compositing layer. */}
              {pageRects.map(r => {
                const [rv, gv, bv] = hexToRgb(r.color ?? DEFAULT_COLOR)
                return (
                  <div
                    key={r.id}
                    className={`${styles.readingRect}${pressingRectId === r.id ? ` ${styles.readingRectPressing}` : ''}`}
                    style={{
                      left:        `${Math.min(r.x1Pct, r.x2Pct)}%`,
                      top:         `${Math.min(r.y1Pct, r.y2Pct)}%`,
                      width:       `${Math.abs(r.x2Pct - r.x1Pct)}%`,
                      height:      `${Math.abs(r.y2Pct - r.y1Pct)}%`,
                      background:  `rgba(${rv},${gv},${bv},0.22)`,
                      borderColor: `rgba(${rv},${gv},${bv},0.65)`,
                    }}
                  />
                )
              })}
              {bracketActive && (
                <div
                  ref={bracketRef}
                  className={styles.bracket}
                  style={{
                    left: `${localBracket.x1Pct}%`,
                    top: `${localBracket.y1Pct}%`,
                    width: `${localBracket.x2Pct - localBracket.x1Pct}%`,
                    height: `${localBracket.y2Pct - localBracket.y1Pct}%`,
                  }}
                  onPointerMove={onBracketPointerMove}
                  onPointerUp={onBracketPointerUp}
                >
                  <div className={`${styles.bCorner} ${styles.bCornerTL}`} />
                  <div className={`${styles.bCorner} ${styles.bCornerTR}`} />
                  <div className={`${styles.bCorner} ${styles.bCornerBL}`} />
                  <div className={`${styles.bCorner} ${styles.bCornerBR}`} />
                  <div className={`${styles.bEdge} ${styles.bEdgeN}`} onPointerDown={e => startBracketDrag(e, 'n')} />
                  <div className={`${styles.bEdge} ${styles.bEdgeS}`} onPointerDown={e => startBracketDrag(e, 's')} />
                  <div className={`${styles.bEdge} ${styles.bEdgeW}`} onPointerDown={e => startBracketDrag(e, 'w')} />
                  <div className={`${styles.bEdge} ${styles.bEdgeE}`} onPointerDown={e => startBracketDrag(e, 'e')} />
                  <div className={styles.bBody} onPointerDown={e => startBracketDrag(e, 'move')} />
                </div>
              )}
            </div>
            {rendering && <div className={styles.pageSpinner} />}
            {tagPhase === 'placing' && (
              <div className={styles.placingOverlay} onClick={handlePlacingTap} />
            )}
            {tagPhase === 'drawing-rect' && (
              <div
                className={styles.drawingOverlay}
                onMouseDown={e => handleDrawStart(e.clientX, e.clientY)}
                onMouseMove={e => { if (drawStartRef.current) handleDrawMove(e.clientX, e.clientY) }}
                onMouseUp={e => handleDrawEnd(e.clientX, e.clientY)}
                onTouchStart={e => handleDrawStart(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchMove={e => handleDrawMove(e.touches[0].clientX, e.touches[0].clientY)}
                onTouchEnd={e => handleDrawEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
              />
            )}
          </>
        )}
        {/* Bookmark marker outside pageFrame (SVG content would degrade compositing layer quality) */}
        <div ref={markerDivRef} className={styles.sectionMarker} style={{ display: 'none' }}>
          <SectionMarkerIcon size={30} />
        </div>
        <div ref={rectPreviewDivRef} className={styles.rectPreview} style={{ display: 'none' }} />
      </div>

      <div className={styles.hint}>
        {onRemoveReadingRect
          ? 'Pinch or scroll to zoom · Double-tap to reset · Hold a highlight to remove'
          : 'Pinch or scroll to zoom · Double-tap to reset'}
      </div>
    </div>,
    document.body
  )
}
