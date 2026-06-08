import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { loadPDF } from '../../store/imageStore'
import styles from './PDFViewer.module.css'

interface PDFViewerProps {
  pdfKey: string
  onClose: () => void
}

function getDist(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX
  const dy = touches[0].clientY - touches[1].clientY
  return Math.sqrt(dx * dx + dy * dy)
}

export default function PDFViewer({ pdfKey, onClose }: PDFViewerProps) {
  const pdfRef = useRef<any>(null)
  const [pdfLoaded, setPdfLoaded] = useState(false)
  const [pageNum, setPageNum] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [pageUrl, setPageUrl] = useState('')
  const [rendering, setRendering] = useState(true)
  const [error, setError] = useState('')

  const imgRef = useRef<HTMLImageElement>(null)
  const pageAreaRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef(1)
  const panRef = useRef({ x: 0, y: 0 })
  const touchRef = useRef<{
    type: 'pinch' | 'pan'
    initDist: number
    initZoom: number
    initPanX: number
    initPanY: number
    startX: number
    startY: number
  } | null>(null)
  const lastTapRef = useRef(0)

  const applyTransform = (zoom: number, x: number, y: number) => {
    if (imgRef.current) {
      imgRef.current.style.transform = `scale(${zoom}) translate(${x}px, ${y}px)`
    }
  }

  const resetTransform = () => {
    zoomRef.current = 1
    panRef.current = { x: 0, y: 0 }
    applyTransform(1, 0, 0)
  }

  // Load PDF from IndexedDB
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
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString()
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise
      if (!cancelled) {
        pdfRef.current = pdf
        setTotalPages(pdf.numPages)
        setPdfLoaded(true)
      }
    }).catch(err => {
      if (!cancelled) setError(`Failed to load PDF: ${err.message}`)
    })
    return () => { cancelled = true }
  }, [pdfKey])

  // Render current page whenever pdf loads or page changes
  useEffect(() => {
    if (!pdfLoaded || !pdfRef.current) return
    let cancelled = false
    setRendering(true)
    resetTransform();
    (async () => {
      try {
        const page = await pdfRef.current.getPage(pageNum)
        const scale = 2.0
        const viewport = page.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        await page.render({ canvas, viewport }).promise
        if (!cancelled) setPageUrl(canvas.toDataURL('image/jpeg', 0.9))
      } catch (err: any) {
        if (!cancelled) setError(`Failed to render page: ${err.message}`)
      } finally {
        if (!cancelled) setRendering(false)
      }
    })()
    return () => { cancelled = true }
  }, [pdfLoaded, pageNum])

  // Touch and wheel event handlers (passive: false needed for preventDefault)
  useEffect(() => {
    const el = pageAreaRef.current
    if (!el) return

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault()
        touchRef.current = {
          type: 'pinch',
          initDist: getDist(e.touches),
          initZoom: zoomRef.current,
          initPanX: panRef.current.x,
          initPanY: panRef.current.y,
          startX: 0,
          startY: 0,
        }
      } else if (e.touches.length === 1) {
        const now = Date.now()
        if (now - lastTapRef.current < 300) {
          e.preventDefault()
          resetTransform()
          lastTapRef.current = 0
          return
        }
        lastTapRef.current = now
        if (zoomRef.current > 1.05) {
          e.preventDefault()
          touchRef.current = {
            type: 'pan',
            initDist: 0,
            initZoom: zoomRef.current,
            initPanX: panRef.current.x,
            initPanY: panRef.current.y,
            startX: e.touches[0].clientX,
            startY: e.touches[0].clientY,
          }
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!touchRef.current) return
      e.preventDefault()
      if (touchRef.current.type === 'pinch' && e.touches.length === 2) {
        const dist = getDist(e.touches)
        const scale = dist / touchRef.current.initDist
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
      touchRef.current = null
      if (zoomRef.current < 1) resetTransform()
    }

    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      const newZoom = Math.min(5, Math.max(1, zoomRef.current * factor))
      zoomRef.current = newZoom
      if (newZoom === 1) panRef.current = { x: 0, y: 0 }
      applyTransform(newZoom, panRef.current.x, panRef.current.y)
    }

    const opts = { passive: false } as EventListenerOptions
    el.addEventListener('touchstart', onTouchStart, opts)
    el.addEventListener('touchmove', onTouchMove, opts)
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('wheel', onWheel, opts)
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('wheel', onWheel)
    }
  }, [])

  const goTo = (n: number) => {
    setPageNum(Math.min(totalPages, Math.max(1, n)))
  }

  return createPortal(
    <div className={styles.overlay}>
      <div className={styles.topBar}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <span className={styles.pageInfo}>
          {totalPages > 0 ? `Page ${pageNum} of ${totalPages}` : 'Loading…'}
        </span>
        <div className={styles.navBtns}>
          <button className={styles.navBtn} onClick={() => goTo(pageNum - 1)} disabled={pageNum <= 1}>‹</button>
          <button className={styles.navBtn} onClick={() => goTo(pageNum + 1)} disabled={pageNum >= totalPages}>›</button>
        </div>
      </div>

      <div className={styles.pageArea} ref={pageAreaRef}>
        {error ? (
          <div className={styles.errorMsg}>{error}</div>
        ) : rendering && !pageUrl ? (
          <div className={styles.spinner} />
        ) : (
          <>
            <img
              ref={imgRef}
              src={pageUrl}
              alt={`Page ${pageNum}`}
              className={styles.pageImg}
            />
            {rendering && <div className={styles.pageSpinner} />}
          </>
        )}
      </div>

      <div className={styles.hint}>Pinch or scroll to zoom · Double-tap to reset</div>
    </div>,
    document.body
  )
}
