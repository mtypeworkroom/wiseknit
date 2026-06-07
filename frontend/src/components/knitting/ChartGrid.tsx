import styles from './ChartGrid.module.css'
import { PLEIONE_CHART } from '../../data/pleione'
import type { ProjectChart } from '../../types'

interface ChartGridProps {
  currentRow: number
  totalRows: number
  chart?: ProjectChart   // if provided, render image-based chart
}

type StitchType = 'k' | 'p' | 'yo' | 'k2tog' | 'ssk'

function CellSymbol({ type }: { type: StitchType }) {
  switch (type) {
    case 'p':
      return (
        <svg viewBox="0 0 36 36" width="14" height="14">
          <circle cx="18" cy="18" r="5" fill="currentColor" />
        </svg>
      )
    case 'yo':
      return (
        <svg viewBox="0 0 36 36" width="20" height="20">
          <circle cx="18" cy="18" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      )
    case 'k2tog':
      return (
        <svg viewBox="0 0 36 36" width="28" height="28">
          <line x1="6" y1="30" x2="30" y2="6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    case 'ssk':
      return (
        <svg viewBox="0 0 36 36" width="28" height="28">
          <line x1="6" y1="6" x2="30" y2="30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )
    default:
      return null
  }
}

// ── Image-based chart (from AI parse) ─────────────────────────

function ImageChart({ chart, currentRow }: { chart: ProjectChart; currentRow: number }) {
  const raw = chart.imageBase64!
  const imageSrc = raw.startsWith('data:') ? raw : `data:image/png;base64,${raw}`
  const rowHeight = 100 / chart.totalRows
  const highlightBottom = (currentRow - 1) * rowHeight

  return (
    <div className={styles.imageChartWrap}>
      <div className={styles.imageChartInner}>
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
                <svg viewBox="0 0 10 14" width="8" height="12">
                  <polygon points="0,0 10,7 0,14" fill="#1A6A8A" />
                </svg>
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

export default function ChartGrid({ currentRow, chart }: ChartGridProps) {
  if (chart?.imageBase64) {
    return <ImageChart chart={chart} currentRow={currentRow} />
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
