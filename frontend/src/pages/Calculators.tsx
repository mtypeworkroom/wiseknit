import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import { ChevronRightIcon } from '../components/icons'
import { useSettingsStore } from '../store/settingsStore'
import styles from './Calculators.module.css'

// ── Inc/Dec Evenly ────────────────────────────────────────────────────────────

interface IncDecGroup { plain: number; times: number }
type IncDecResult =
  | null
  | { err: string }
  | { type: 'inc' | 'dec'; diff: number; from: number; to: number; groups: IncDecGroup[] }

function calcIncDec(from: number, to: number): IncDecResult {
  if (from === to) return null
  const diff = Math.abs(to - from)
  const q = Math.floor(from / diff)
  const r = from % diff
  const groups: IncDecGroup[] = []
  if (to > from) {
    if (diff - r > 0) groups.push({ plain: q, times: diff - r })
    if (r > 0) groups.push({ plain: q + 1, times: r })
    return { type: 'inc', diff, from, to, groups }
  } else {
    if (q < 2) return { err: 'Too many decreases for this stitch count — try splitting into multiple passes.' }
    if (diff - r > 0) groups.push({ plain: q - 2, times: diff - r })
    if (r > 0) groups.push({ plain: q - 1, times: r })
    return { type: 'dec', diff, from, to, groups }
  }
}

function incDecCopyText(r: { type: 'inc' | 'dec'; groups: IncDecGroup[] }): string {
  const stitch = r.type === 'inc' ? 'M1' : 'k2tog'
  return r.groups.map(g => {
    const inner = g.plain === 0 ? stitch : `K${g.plain}, ${stitch}`
    return g.times === 1 ? `*${inner}*` : `*${inner}* ×${g.times}`
  }).join('; ')
}

// ── Sleeve Taper ──────────────────────────────────────────────────────────────

interface TaperGroup { every: number; times: number }
type TaperResult =
  | null
  | { err: string }
  | { type: 'inc' | 'dec'; diff: number; shapeRows: number; totalRows: number; groups: TaperGroup[] }

function calcSleeveTaper(castOn: number, target: number, rows: number): TaperResult {
  if (castOn === target) return null
  const diff = Math.abs(target - castOn)
  if (diff % 2 !== 0) return { err: `Stitch difference (${diff}) is odd — adjust cast-on by 1 stitch to make it even, so each shaping row can add 1 st each end.` }
  const shapeRows = diff / 2
  if (rows < shapeRows) return { err: `Not enough rows: need at least ${shapeRows} rows for ${shapeRows} shaping events, but only ${rows} are available.` }
  const q = Math.floor(rows / shapeRows)
  const r = rows % shapeRows
  const groups: TaperGroup[] = []
  if (shapeRows - r > 0) groups.push({ every: q, times: shapeRows - r })
  if (r > 0) groups.push({ every: q + 1, times: r })
  return { type: target > castOn ? 'inc' : 'dec', diff, shapeRows, totalRows: rows, groups }
}

function taperCopyText(r: { type: 'inc' | 'dec'; groups: TaperGroup[] }): string {
  const verb = r.type === 'inc' ? 'Inc' : 'Dec'
  return r.groups.map(g => {
    const interval = g.every === 1 ? 'every row' : `every ${g.every} rows`
    return g.times === 1 ? `${verb} 1 each end ${interval}` : `${verb} 1 each end ${interval} ×${g.times}`
  }).join('; ')
}

// ── Pattern Size Finder ───────────────────────────────────────────────────────

interface SizeEntry { id: string; name: string; chest: string; length: string; yardage: string }

interface SizedRow {
  name: string
  chest: number
  length?: number
  yardage?: number       // pattern stated yardage for this size
  sts: number
  actual: number         // finished chest at user gauge
  actualLength?: number  // finished length at user gauge (if row gauges provided)
  yardageNeeded?: number // estimated yardage at user gauge
}

type SizeRecResult =
  | null
  | { err: string }
  | { type: 'exact' | 'between' | 'none'
      recommended: SizedRow
      alternative?: SizedRow
      ease: number }

function calcSizeRec(
  patSts: number, usrSts: number,
  userChest: number,
  entries: SizeEntry[],
  patRows?: number, usrRows?: number,
): SizeRecResult {
  const rowRatio = (patRows && usrRows && patRows > 0 && usrRows > 0) ? patRows / usrRows : undefined
  const stsRatio = patSts / usrSts

  const parsed = entries
    .map(e => ({
      name: e.name.trim(),
      chest: parseFloat(e.chest),
      length: e.length.trim() ? parseFloat(e.length) : undefined,
      yardage: e.yardage.trim() ? parseFloat(e.yardage) : undefined,
    }))
    .filter(e => e.name && isFinite(e.chest) && e.chest > 0)
  if (parsed.length === 0) return null

  const targetSts = userChest * usrSts / 10

  const sized: SizedRow[] = parsed
    .map(s => {
      const yardageNeeded = (s.yardage !== undefined && isFinite(s.yardage))
        ? s.yardage * stsRatio * (rowRatio ?? 1)
        : undefined
      return {
        name: s.name,
        chest: s.chest,
        length: s.length,
        yardage: s.yardage,
        sts: s.chest * patSts / 10,
        actual: s.chest * stsRatio,
        actualLength: (s.length !== undefined && rowRatio !== undefined) ? s.length * rowRatio : undefined,
        yardageNeeded,
      }
    })
    .sort((a, b) => a.sts - b.sts)

  let lowerIdx = -1
  let upperIdx = -1
  for (let i = 0; i < sized.length; i++) {
    if (sized[i].sts <= targetSts) lowerIdx = i
    if (upperIdx === -1 && sized[i].sts >= targetSts) upperIdx = i
  }

  if (upperIdx === -1) {
    const largest = sized[sized.length - 1]
    return { type: 'none', recommended: largest, ease: largest.actual - userChest }
  }

  const upper = sized[upperIdx]
  const ease = upper.actual - userChest

  if (lowerIdx === -1 || lowerIdx === upperIdx) {
    return { type: 'exact', recommended: upper, ease }
  }

  return { type: 'between', recommended: upper, alternative: sized[lowerIdx], ease }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Calculators() {
  const { units } = useSettingsStore()
  const u = units                                          // 'cm' | 'in'
  const swatch = units === 'in' ? '4in' : '10cm'          // gauge swatch label
  const chestPh = units === 'in' ? '36' : '92'            // placeholder body chest

  const [openCard, setOpenCard] = useState<string | null>(null)

  // Inc/Dec Evenly state
  const [fromVal, setFromVal] = useState('')
  const [toVal, setToVal] = useState('')
  const [incDecCopied, setIncDecCopied] = useState(false)

  // Sleeve Taper state
  const [castOnVal, setCastOnVal] = useState('')
  const [taperTargetVal, setTaperTargetVal] = useState('')
  const [taperRowsVal, setTaperRowsVal] = useState('')
  const [taperCopied, setTaperCopied] = useState(false)

  // Pattern Size Finder state
  const [sPatSts, setSPatSts] = useState('')
  const [sPatRows, setSPatRows] = useState('')
  const [sUsrSts, setSUsrSts] = useState('')
  const [sUsrRows, setSUsrRows] = useState('')
  const [sUserChest, setSUserChest] = useState('')
  const [sizes, setSizes] = useState<SizeEntry[]>([])
  const [newSizeName, setNewSizeName] = useState('')
  const [newSizeChest, setNewSizeChest] = useState('')
  const [newSizeLength, setNewSizeLength] = useState('')
  const [newSizeYardage, setNewSizeYardage] = useState('')

  function addSize() {
    const name = newSizeName.trim()
    const chest = newSizeChest.trim()
    if (!name || !chest || !isFinite(parseFloat(chest)) || parseFloat(chest) <= 0) return
    setSizes(prev => [...prev, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name, chest, length: newSizeLength.trim(), yardage: newSizeYardage.trim(),
    }])
    setNewSizeName('')
    setNewSizeChest('')
    setNewSizeLength('')
    setNewSizeYardage('')
  }

  function removeSize(id: string) {
    setSizes(prev => prev.filter(s => s.id !== id))
  }

  function toggle(id: string) {
    setOpenCard(prev => prev === id ? null : id)
  }

  // Inc/Dec results
  const idFrom = fromVal === '' ? NaN : parseInt(fromVal, 10)
  const idTo = toVal === '' ? NaN : parseInt(toVal, 10)
  const idValid = !isNaN(idFrom) && !isNaN(idTo) && idFrom > 0 && idTo > 0
  const idResult: IncDecResult | undefined = idValid ? calcIncDec(idFrom, idTo) : undefined

  // Taper results
  const tCastOn = castOnVal === '' ? NaN : parseInt(castOnVal, 10)
  const tTarget = taperTargetVal === '' ? NaN : parseInt(taperTargetVal, 10)
  const tRows = taperRowsVal === '' ? NaN : parseInt(taperRowsVal, 10)
  const tValid = !isNaN(tCastOn) && !isNaN(tTarget) && !isNaN(tRows) && tCastOn > 0 && tTarget > 0 && tRows > 0
  const tResult: TaperResult | undefined = tValid ? calcSleeveTaper(tCastOn, tTarget, tRows) : undefined

  function copyIncDec(r: { type: 'inc' | 'dec'; groups: IncDecGroup[] }) {
    navigator.clipboard.writeText(incDecCopyText(r)).catch(() => {})
    setIncDecCopied(true)
    setTimeout(() => setIncDecCopied(false), 1500)
  }

  function copyTaper(r: { type: 'inc' | 'dec'; groups: TaperGroup[] }) {
    navigator.clipboard.writeText(taperCopyText(r)).catch(() => {})
    setTaperCopied(true)
    setTimeout(() => setTaperCopied(false), 1500)
  }

  // Size Finder computed
  const sPatNum    = parseFloat(sPatSts)
  const sPatRowNum = parseFloat(sPatRows)
  const sUsrNum    = parseFloat(sUsrSts)
  const sUsrRowNum = parseFloat(sUsrRows)
  const sChestNum  = parseFloat(sUserChest)
  const sStsValid  = isFinite(sPatNum) && isFinite(sUsrNum) && sPatNum > 0 && sUsrNum > 0
  const sRowsValid = isFinite(sPatRowNum) && isFinite(sUsrRowNum) && sPatRowNum > 0 && sUsrRowNum > 0
  const sFullValid = sStsValid && isFinite(sChestNum) && sChestNum > 0 && sizes.length > 0
  // Scale factors: user/pattern (< 1 = tighter, > 1 = looser)
  const stsScale   = sStsValid ? sUsrNum / sPatNum : null
  const rowScale   = sRowsValid ? sUsrRowNum / sPatRowNum : null
  // Finished measurement multiplier: pattern × this = actual at user gauge
  const stsRatio   = sStsValid ? sPatNum / sUsrNum : null
  const rowRatio   = sRowsValid ? sPatRowNum / sUsrRowNum : null
  // Proportionality warning: scales differ by > 10 percentage points
  const disproportion = (stsScale !== null && rowScale !== null)
    ? Math.abs(stsScale - rowScale)
    : null
  const isDisproportionate = disproportion !== null && disproportion > 0.1
  const sResult: SizeRecResult | undefined = sFullValid
    ? calcSizeRec(sPatNum, sUsrNum, sChestNum, sizes,
        sRowsValid ? sPatRowNum : undefined,
        sRowsValid ? sUsrRowNum : undefined)
    : undefined

  return (
    <>
      <TopBar title="Calculators" />
      <div className="page-scroll">
        <div className={styles.content}>

          {/* ── Inc/Dec Evenly ── */}
          <section className={`${styles.card} ${openCard === 'incdec' ? styles.cardOpen : ''}`}>
            <button className={styles.cardHeader} onClick={() => toggle('incdec')}>
              <div className={styles.cardHeaderText}>
                <span className={styles.cardTitle}>Increase / Decrease Evenly</span>
                <span className={styles.cardDesc}>Distributes shaping evenly across a row.</span>
              </div>
              <ChevronRightIcon className={`${styles.chevron} ${openCard === 'incdec' ? styles.chevronOpen : ''}`} />
            </button>

            {openCard === 'incdec' && (
              <div className={styles.cardBody}>
                <div className={styles.fields}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Current stitches</span>
                    <input className={styles.input} type="number" inputMode="numeric" min="1"
                      value={fromVal} onChange={e => setFromVal(e.target.value)} placeholder="80" />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Target stitches</span>
                    <input className={styles.input} type="number" inputMode="numeric" min="1"
                      value={toVal} onChange={e => setToVal(e.target.value)} placeholder="87" />
                  </label>
                </div>

                {idValid && idResult === null && <p className={styles.none}>No change needed</p>}
                {idResult != null && 'err' in idResult && <p className={styles.error}>{idResult.err}</p>}

                {idResult != null && 'type' in idResult && (
                  <div className={styles.result}>
                    <div className={styles.resultHead}>
                      <span className={`${styles.badge} ${idResult.type === 'inc' ? styles.badgeInc : styles.badgeDec}`}>
                        {idResult.type === 'inc' ? '▲' : '▼'} {idResult.diff} st{idResult.diff !== 1 ? 's' : ''}
                      </span>
                      <span className={styles.range}>{idResult.from} → {idResult.to}</span>
                    </div>
                    <div className={styles.instr}>
                      {idResult.groups.map((g, i) => (
                        <span key={i}>
                          {i > 0 && <span className={styles.sep}>; </span>}
                          <span className={styles.grp}>
                            <span className={styles.ast}>*</span>
                            {g.plain > 0 && `K${g.plain}, `}
                            <em>{idResult.type === 'inc' ? 'M1' : 'k2tog'}</em>
                            <span className={styles.ast}>*</span>
                            {g.times > 1 && <span className={styles.times}> ×{g.times}</span>}
                          </span>
                        </span>
                      ))}
                    </div>
                    <div className={styles.copyRow}>
                      <button type="button"
                        className={`${styles.copyBtn} ${incDecCopied ? styles.copyDone : ''}`}
                        onClick={() => copyIncDec(idResult)}>
                        {incDecCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Sleeve Taper ── */}
          <section className={`${styles.card} ${openCard === 'taper' ? styles.cardOpen : ''}`}>
            <button className={styles.cardHeader} onClick={() => toggle('taper')}>
              <div className={styles.cardHeaderText}>
                <span className={styles.cardTitle}>Sleeve Taper</span>
                <span className={styles.cardDesc}>Full shaping schedule from stitch counts and available rows.</span>
              </div>
              <ChevronRightIcon className={`${styles.chevron} ${openCard === 'taper' ? styles.chevronOpen : ''}`} />
            </button>

            {openCard === 'taper' && (
              <div className={styles.cardBody}>
                <div className={styles.fields}>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Cast-on stitches</span>
                    <input className={styles.input} type="number" inputMode="numeric" min="1"
                      value={castOnVal} onChange={e => setCastOnVal(e.target.value)} placeholder="50" />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Target stitches</span>
                    <input className={styles.input} type="number" inputMode="numeric" min="1"
                      value={taperTargetVal} onChange={e => setTaperTargetVal(e.target.value)} placeholder="80" />
                  </label>
                  <label className={styles.field}>
                    <span className={styles.fieldLabel}>Rows available</span>
                    <input className={styles.input} type="number" inputMode="numeric" min="1"
                      value={taperRowsVal} onChange={e => setTaperRowsVal(e.target.value)} placeholder="120" />
                  </label>
                </div>

                {tValid && tResult === null && <p className={styles.none}>No shaping needed</p>}
                {tResult != null && 'err' in tResult && <p className={styles.error}>{tResult.err}</p>}

                {tResult != null && 'type' in tResult && (
                  <div className={styles.result}>
                    <div className={styles.resultHead}>
                      <span className={`${styles.badge} ${tResult.type === 'inc' ? styles.badgeInc : styles.badgeDec}`}>
                        {tResult.type === 'inc' ? '▲' : '▼'} {tResult.diff} st{tResult.diff !== 1 ? 's' : ''}
                      </span>
                      <span className={styles.range}>{tCastOn} → {tTarget}</span>
                      <span className={styles.shapeMeta}>{tResult.shapeRows} shaping rows</span>
                    </div>
                    <div className={styles.instr}>
                      {tResult.groups.map((g, i) => {
                        const verb = tResult.type === 'inc' ? 'Inc' : 'Dec'
                        const interval = g.every === 1 ? 'every row' : `every ${g.every} rows`
                        return (
                          <span key={i}>
                            {i > 0 && <span className={styles.sep}>; </span>}
                            <span className={styles.grp}>
                              <em>{verb} 1 each end</em>
                              {' '}{interval}
                              {g.times > 1 && <span className={styles.times}> ×{g.times}</span>}
                            </span>
                          </span>
                        )
                      })}
                    </div>
                    <div className={styles.copyRow}>
                      <button type="button"
                        className={`${styles.copyBtn} ${taperCopied ? styles.copyDone : ''}`}
                        onClick={() => copyTaper(tResult)}>
                        {taperCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Pattern Size Finder ── */}
          <section className={`${styles.card} ${openCard === 'size' ? styles.cardOpen : ''}`}>
            <button className={styles.cardHeader} onClick={() => toggle('size')}>
              <div className={styles.cardHeaderText}>
                <span className={styles.cardTitle}>Pattern Size Finder</span>
                <span className={styles.cardDesc}>Find which size to knit when your gauge differs from the pattern.</span>
              </div>
              <ChevronRightIcon className={`${styles.chevron} ${openCard === 'size' ? styles.chevronOpen : ''}`} />
            </button>

            {openCard === 'size' && (
              <div className={styles.cardBody}>

                {/* Gauge inputs — sts + rows for each */}
                <div className={styles.gaugeGroup}>
                  <div className={styles.gaugeRow}>
                    <span className={styles.gaugeRowLabel}>Pattern gauge</span>
                    <input className={`${styles.input} ${styles.gaugeInput}`} type="number" inputMode="decimal"
                      value={sPatSts} onChange={e => setSPatSts(e.target.value)} placeholder="20" />
                    <span className={styles.gaugeUnit}>sts</span>
                    <input className={`${styles.input} ${styles.gaugeInput}`} type="number" inputMode="decimal"
                      value={sPatRows} onChange={e => setSPatRows(e.target.value)} placeholder="28" />
                    <span className={styles.gaugeUnit}>rows / {swatch}</span>
                  </div>
                  <div className={styles.gaugeRow}>
                    <span className={styles.gaugeRowLabel}>Your gauge</span>
                    <input className={`${styles.input} ${styles.gaugeInput}`} type="number" inputMode="decimal"
                      value={sUsrSts} onChange={e => setSUsrSts(e.target.value)} placeholder="18" />
                    <span className={styles.gaugeUnit}>sts</span>
                    <input className={`${styles.input} ${styles.gaugeInput}`} type="number" inputMode="decimal"
                      value={sUsrRows} onChange={e => setSUsrRows(e.target.value)} placeholder="25" />
                    <span className={styles.gaugeUnit}>rows / {swatch}</span>
                  </div>
                </div>

                {/* Gauge summary hint */}
                {sStsValid && (
                  <div className={styles.gaugeHint}>
                    <span>
                      {stsRatio! > 1.005
                        ? `Sts: ~${((stsRatio! - 1) * 100).toFixed(1)}% wider`
                        : stsRatio! < 0.995
                        ? `Sts: ~${((1 - stsRatio!) * 100).toFixed(1)}% narrower`
                        : 'Sts: gauge matches'}
                    </span>
                    {sRowsValid && (
                      <span className={styles.gaugeHintSep}>·</span>
                    )}
                    {sRowsValid && (
                      <span>
                        {rowRatio! > 1.005
                          ? `Rows: ~${((rowRatio! - 1) * 100).toFixed(1)}% longer`
                          : rowRatio! < 0.995
                          ? `Rows: ~${((1 - rowRatio!) * 100).toFixed(1)}% shorter`
                          : 'Rows: gauge matches'}
                      </span>
                    )}
                  </div>
                )}

                {/* Proportionality warning */}
                {isDisproportionate && (
                  <div className={styles.gaugeWarn}>
                    Stitch and row gauge are scaling differently — sleeve depth, raglan shaping,
                    and length instructions may need to be adjusted.
                  </div>
                )}

                {/* Size chart */}
                <div className={styles.sizeChartSection}>
                  <div className={styles.sizeChartLabel}>Pattern size chart</div>
                  <div className={styles.sizeList}>
                    {sizes.length === 0
                      ? <div className={styles.sizeEmpty}>No sizes added yet</div>
                      : sizes.map(s => (
                          <div key={s.id} className={styles.sizeItem}>
                            <div className={styles.sizeItemMain}>
                              <span className={styles.sizeItemName}>{s.name}</span>
                              <span className={styles.sizeItemMeta}>
                                {s.chest} {u} chest
                                {s.length ? ` · ${s.length} ${u} length` : ''}
                                {s.yardage ? ` · ${s.yardage} yds` : ''}
                              </span>
                            </div>
                            <button className={styles.sizeItemRemove} onClick={() => removeSize(s.id)}>×</button>
                          </div>
                        ))
                    }
                  </div>
                  <div className={styles.sizeAddRow}>
                    <input className={`${styles.input} ${styles.sizeAddName}`}
                      type="text" value={newSizeName} onChange={e => setNewSizeName(e.target.value)}
                      placeholder="Size name" onKeyDown={e => e.key === 'Enter' && addSize()} />
                    <input className={`${styles.input} ${styles.sizeAddMeasure}`}
                      type="number" inputMode="decimal" value={newSizeChest}
                      onChange={e => setNewSizeChest(e.target.value)}
                      placeholder={`Chest ${u}`} onKeyDown={e => e.key === 'Enter' && addSize()} />
                    <input className={`${styles.input} ${styles.sizeAddMeasure}`}
                      type="number" inputMode="decimal" value={newSizeLength}
                      onChange={e => setNewSizeLength(e.target.value)}
                      placeholder={`Length ${u}`} onKeyDown={e => e.key === 'Enter' && addSize()} />
                    <input className={`${styles.input} ${styles.sizeAddMeasure}`}
                      type="number" inputMode="decimal" value={newSizeYardage}
                      onChange={e => setNewSizeYardage(e.target.value)}
                      placeholder="Yardage" onKeyDown={e => e.key === 'Enter' && addSize()} />
                    <button className={styles.sizeAddBtn} onClick={addSize}>+ Add</button>
                  </div>
                </div>

                {/* Body measurement */}
                <label className={`${styles.field} ${styles.chestField}`}>
                  <span className={styles.fieldLabel}>Your body chest ({u})</span>
                  <input className={styles.input} type="number" inputMode="decimal" min="1"
                    value={sUserChest} onChange={e => setSUserChest(e.target.value)} placeholder={chestPh} />
                </label>

                {/* Result */}
                {sResult != null && 'type' in sResult && (
                  <div className={styles.result}>
                    <div className={styles.resultHead}>
                      <span className={`${styles.badge} ${sResult.type === 'none' ? styles.badgeDec : styles.badgeInc}`}>
                        {sResult.type === 'none' ? 'No size fits' : 'Recommended'}
                      </span>
                      {sResult.type !== 'none' && (
                        <span className={styles.range}>{sUserChest} {u} body</span>
                      )}
                    </div>

                    <div className={styles.sizeRecName}>{sResult.recommended.name}</div>

                    <div className={styles.sizeRecDetail}>
                      <span>Chest: {sResult.recommended.chest} {u} → ~{sResult.recommended.actual.toFixed(1)} {u} at your gauge</span>
                      <span className={styles.sizeEase}>{sResult.ease >= 0 ? '+' : ''}{sResult.ease.toFixed(1)} {u} ease</span>
                    </div>

                    {sResult.recommended.actualLength !== undefined && (
                      <div className={styles.sizeRecDetail}>
                        <span>Length: {sResult.recommended.length} {u} → ~{sResult.recommended.actualLength.toFixed(1)} {u} at your gauge</span>
                      </div>
                    )}

                    {sResult.recommended.yardageNeeded !== undefined && sResult.recommended.yardage !== undefined && (() => {
                      const needed = Math.round(sResult.recommended.yardageNeeded)
                      const stated = sResult.recommended.yardage
                      const diff = Math.round(sResult.recommended.yardageNeeded - stated)
                      const actualChest = sResult.recommended.actual.toFixed(1)
                      const statedChest = sResult.recommended.chest
                      return (
                        <div className={styles.sizeYardage}>
                          <div className={styles.sizeYardageRow}>
                            <span className={styles.sizeYardageAmt}>~{needed} yds</span>
                          </div>
                          {diff !== 0 && (
                            <p className={diff > 0 ? styles.sizeYardageMore : styles.sizeYardageLess}>
                              {diff > 0 ? `+${diff}` : diff} yds vs pattern's stated {stated} yds —
                              at your gauge this size finishes at {actualChest} {u} instead of {statedChest} {u},
                              so you're knitting {diff > 0 ? 'more' : 'less'} fabric than the pattern anticipates.
                            </p>
                          )}
                        </div>
                      )
                    })()}

                    {sResult.type === 'between' && sResult.alternative && (
                      <p className={styles.sizeNote}>
                        This will have slightly more ease than the pattern intends.
                        For less ease, knit <strong>{sResult.alternative.name}</strong>{' '}
                        (~{sResult.alternative.actual.toFixed(1)} {u} at your gauge).
                      </p>
                    )}

                    {sResult.type === 'none' && (
                      <p className={styles.sizeNote}>
                        No size in the chart is large enough. The closest is{' '}
                        <strong>{sResult.recommended.name}</strong> (~{sResult.recommended.actual.toFixed(1)} {u}
                        at your gauge, {Math.abs(sResult.ease).toFixed(1)} {u} short of your body measurement).
                      </p>
                    )}

                    {sResult.recommended.yardageNeeded !== undefined && (
                      <p className={styles.sizeDisclaimer}>
                        Yardage estimate is approximate. Actual usage varies by yarn, fiber, tension, and pattern construction. Buy extra to be safe.
                      </p>
                    )}
                  </div>
                )}

              </div>
            )}
          </section>

        </div>
      </div>
    </>
  )
}
