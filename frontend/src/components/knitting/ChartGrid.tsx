import { useState, useEffect } from 'react'
import styles from './ChartGrid.module.css'
import { PLEIONE_CHART } from '../../data/pleione'
import type { ProjectChart } from '../../types'
import { loadImage } from '../../store/imageStore'
import { PurlIcon, YarnOverIcon, K2togIcon, SskIcon, RowMarkerIcon } from '../icons'

interface ChartGridProps {
  currentRow: number
  totalRows: number
  chart?: ProjectChart   // if provided, render image-based chart
  zoom?: 'S' | 'M' | 'L' | 'XL'
}

const ZOOM_WIDTH: Record<string, number> = { S: 200, M: 320, L: 480, XL: 640 }

type StitchType = 'k' | 'p' | 'yo' | 'k2tog' | 'ssk'

function CellSymbol({ type }: { type: StitchType }) {
  switch (type) {
    case 'p':      return <PurlIcon/>
    case 'yo':     return <YarnOverIcon/>
    case 'k2tog':  return <K2togIcon/>
    case 'ssk':    return <SskIcon/>
    default:       return null
  }
}

// ── Image-based chart (from AI parse) ─────────────────────────

function ImageChart({ chart, currentRow, zoom }: { chart: ProjectChart; currentRow: number; zoom?: string }) {
  const inline = chart.imageBase64
  const [imageSrc, setImageSrc] = useState(
    inline ? (inline.startsWith('data:') ? inline : `data:image/png;base64,${inline}`) : ''
  )
  useEffect(() => {
    if (!chart.imageKey) return
    loadImage(chart.imageKey).then(b64 => {
      if (!b64) return
      setImageSrc(b64.startsWith('data:') ? b64 : `data:image/png;base64,${b64}`)
    })
  }, [chart.imageKey])

  const rowHeight = 100 / chart.totalRows
  const highlightBottom = (currentRow - 1) * rowHeight

  const chartWidth = ZOOM_WIDTH[zoom ?? 'M']

  return (
    <div className={styles.imageChartWrap}>
      <div className={styles.imageChartInner} style={{ width: chartWidth }}>
        <img src={imageSrc} alt={chart.name} className={styles.chartImage} onError={e => (e.currentTarget.style.outline = '3px solid red')} />
        <div
          className={styles.rowHighlight}
          style={{ bottom: `${highlightBottom}%`, height: `${rowHeight}%` }}
        />
      </div>
      {chart.symbols.length > 0 && (
        <div className={styles.imageLegend}>
          {chart.symbols.map((s, i) => (
            <div key={i} className={styles.legendItem}>
              <span className={styles.legendSymbol}>{s.symbol || '□'}</span>
              <span className={styles.legendLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Stitch-grid chart (Pleione sample) ────────────────────────

function StitchChart({ currentRow }: { currentRow: number }) {
  const rows = [...PLEIONE_CHART].sort((a, b) => b.rowNumber - a.rowNumber)
  const cols = rows[0]?.stitches.length ?? 10

  return (
    <div className={styles.wrap}>
      <div className={styles.colNumbers}>
        <div className={styles.rowNumSpacer} />
        {Array.from({ length: cols }, (_, i) => (
          <div key={i} className={styles.colNum}>{cols - i}</div>
        ))}
        <div className={styles.sideSpacer} />
      </div>

      {rows.map((row) => {
        const isCurrent = row.rowNumber === currentRow
        const isPast = row.rowNumber < currentRow
        const isRS = row.rowNumber % 2 !== 0
        const displayStitches = isRS ? [...row.stitches].reverse() : row.stitches

        return (
          <div key={row.rowNumber} className={styles.row} data-current={isCurrent ? 'true' : 'false'}>
            <div className={`${styles.rowNum} ${isCurrent ? styles.rowNumCurrent : ''}`}>
              {isCurrent && (
                <RowMarkerIcon/>
              )}
              {row.rowNumber}
            </div>
            <div className={styles.cellRow}>
              {displayStitches.map((cell, i) => {
                const cellClasses = [
                  styles.cell,
                  isCurrent ? styles.cellCurrent : '',
                  isPast ? styles.cellPast : '',
                  cell.stitch === 'p' ? styles.stitchP : '',
                  cell.stitch === 'k2tog' || cell.stitch === 'ssk' ? styles.stitchDec : '',
                  cell.stitch === 'yo' ? styles.stitchYo : '',
                ].filter(Boolean).join(' ')
                return (
                  <div key={i} className={cellClasses}>
                    <CellSymbol type={cell.stitch as StitchType} />
                  </div>
                )
              })}
            </div>
            <div className={styles.sideLabel}>{isRS ? 'RS' : 'WS'}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────

export default function ChartGrid({ currentRow, chart, zoom }: ChartGridProps) {
  if (chart?.imageKey || chart?.imageBase64) {
    return <ImageChart chart={chart} currentRow={currentRow} zoom={zoom} />
  }
  // If project has a chart but no image yet, show a placeholder
  if (chart) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ink-mid)', fontSize: 14 }}>
        Chart image not available — re-import the project to add a chart image.
      </div>
    )
  }
  return <StitchChart currentRow={currentRow} />
}
