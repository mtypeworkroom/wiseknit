import styles from './ChartGrid.module.css'
import { PLEIONE_CHART } from '../../data/pleione'

interface ChartGridProps {
  currentRow: number
  totalRows: number
}


type StitchType = 'k' | 'p' | 'yo' | 'k2tog' | 'ssk'

function CellSymbol({ type }: { type: StitchType }) {
  switch (type) {
    case 'k':
      return null

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
      // Forward slash /
      return (
        <svg viewBox="0 0 36 36" width="28" height="28">
          <line x1="6" y1="30" x2="30" y2="6"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )

    case 'ssk':
      // Backslash \
      return (
        <svg viewBox="0 0 36 36" width="28" height="28">
          <line x1="6" y1="6" x2="30" y2="30"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      )

    default:
      return null
  }
}

export default function ChartGrid({ currentRow }: ChartGridProps) {
  // Use Pleione chart data — sorted by row number descending (chart top to bottom)
  const rows = [...PLEIONE_CHART].sort((a, b) => b.rowNumber - a.rowNumber)
  const cols = rows[0]?.stitches.length ?? 10

  return (
    <div className={styles.wrap}>

      {/* Column numbers — right to left as per chart convention */}
      <div className={styles.colNumbers}>
        <div className={styles.rowNumSpacer} />
        {Array.from({ length: cols }, (_, i) => (
          <div key={i} className={styles.colNum}>{cols - i}</div>
        ))}
        <div className={styles.sideSpacer} />
      </div>

      {/* Rows */}
      {rows.map((row) => {
        const isCurrent = row.rowNumber === currentRow
        const isPast = row.rowNumber < currentRow
        const isRS = row.rowNumber % 2 !== 0

        // On RS rows read right to left (reverse the stitches for display)
        const displayStitches = isRS
          ? [...row.stitches].reverse()
          : row.stitches

        return (
          <div key={row.rowNumber} className={styles.row}>

            {/* Row number */}
            <div className={`${styles.rowNum} ${isCurrent ? styles.rowNumCurrent : ''}`}>
              {isCurrent && (
                <svg viewBox="0 0 10 14" width="8" height="12">
                  <polygon points="0,0 10,7 0,14" fill="#1A6A8A" />
                </svg>
              )}
              {row.rowNumber}
            </div>

            {/* Cells */}
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

            {/* RS/WS label */}
            <div className={styles.sideLabel}>
              {isRS ? 'RS' : 'WS'}
            </div>

          </div>
        )
      })}

    </div>
  )
}
