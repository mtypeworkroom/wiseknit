// ─────────────────────────────────────
// WiseKnit — Core Types
// ─────────────────────────────────────

// ── ENUMS ────────────────────────────

export type ProjectStatus = 'active' | 'paused' | 'waiting' | 'completed' | 'archived'

export type YarnWeight =
  | 'lace'
  | 'fingering'
  | 'sport'
  | 'dk'
  | 'worsted'
  | 'aran'
  | 'bulky'
  | 'super-bulky'

export type NeedleType =
  | 'circular-fixed'
  | 'circular-interchangeable'
  | 'straight'
  | 'dpn'
  | 'magic-loop'

export type StitchType =
  | 'k'
  | 'p'
  | 'yo'
  | 'k2tog'
  | 'ssk'
  | 'cdd'
  | 'c4b'
  | 'c4f'
  | 'c6b'
  | 'c6f'
  | 'sl'
  | 'empty'

// ── BRACKET POSITION ─────────────────

export interface BracketPos {
  x1Pct: number
  y1Pct: number
  x2Pct: number
  y2Pct: number
}

// ── PDF SECTION ──────────────────────

export interface PdfReadingRect {
  id: string
  page: number
  x1Pct: number
  y1Pct: number
  x2Pct: number
  y2Pct: number
  color: string
}

export interface PdfSection {
  label: string
  page: number
  markXPct?: number
  markYPct?: number
  readingRects?: PdfReadingRect[]
}

// ── PROJECT ──────────────────────────

export interface Project {
  id: string
  name: string
  status: ProjectStatus
  category?: string
  designer?: string
  tags?: string[]
  patternId?: string
  currentRow: number
  totalRows: number
  totalRowsWorked: number
  chartRepeatStartRow: number
  startedAt?: string
  lastSessionAt?: string
  createdAt: string
  updatedAt: string
  needle?: Needle
  yarn?: Yarn
  gauge?: Gauge
  notes?: string
  photo?: string
  charts?: ProjectChart[]
  activeChartId?: string  // persisted chart selection
  photoKey?: string     // IndexedDB key for the project photo crop
  pdfKey?: string       // IndexedDB key for the attached PDF file
  pdfPageCount?: number // total pages in the attached PDF
  pdfSections?: PdfSection[]
  readingRects?: PdfReadingRect[] // global highlights not tied to a section
  bracketPos?: BracketPos
  timerStartedAt?: string   // ISO timestamp; present = timer is running
  timerStartRow?: number    // row when timer was started, for session record
}

// ── PROJECT CHART ────────────────────

export interface ProjectChartSymbol {
  symbol: string
  label: string
  description: string
  confident: boolean
}

export interface ProjectChart {
  id: string
  name: string
  totalRows: number
  totalStitches: number
  repeatStartRow: number
  workedInRound: boolean
  countBy2?: boolean
  symbols: ProjectChartSymbol[]
  notes?: string
  rowNotes?: Record<number, string>  // per-row instructions keyed by row number
  flags: string[]
  reminders?: ProjectReminder[]
  intervalSteps?: IntervalStep[]
  imageKey?: string      // IndexedDB key for cropped chart image
  pageKey?: string       // IndexedDB key for full page image
  imageBase64?: string   // legacy — superseded by imageKey
  pageBase64?: string    // legacy — superseded by pageKey
  textInstructions?: string  // text-only instructions when no chart image
}

// ── PATTERN ──────────────────────────

export interface Pattern {
  id: string
  name: string
  source?: string
  designer?: string
  totalRows: number
  totalStitches: number
  sections: PatternSection[]
  chart: ChartRow[]
  symbols: StitchSymbol[]
  reminders: RowReminder[]
  flags: PatternFlag[]
  importedAt: string
}

export interface PatternSection {
  id: string
  name: string
  colStart: number
  colEnd: number
  color: string
}

export interface ChartRow {
  rowNumber: number
  stitches: ChartCell[]
}

export interface ChartCell {
  col: number
  stitch: string
}

export interface StitchSymbol {
  type: string
  label: string
  description: string
  color?: string
}

// ── INTERVAL STEPS ───────────────────────

export interface IntervalStep {
  id: string
  name: string
  text: string           // plain-language instruction e.g. "K1, M1L at beg of row"
  startRow: number       // total rows worked when counting begins (1-based)
  repeatEvery: number    // fire every N total rows from startRow
  repeatCount: number    // cap: total number of times it fires
  order: number          // display order within the same position group
  position: 'start' | 'middle' | 'end'
  stsStart?: string      // for 'middle': stitch number or marker reference e.g. "12" or "marker 1"
  sound: ReminderSound
}

// ── PROJECT REMINDERS ────────────────

export type ReminderSound = 'chime+speak' | 'chime' | 'speak' | 'mute'
export type ReminderChime = 'descend' | 'ascend' | 'bell' | 'ping' | 'double'

export interface ProjectReminder {
  id: string
  text: string
  type: 'absolute' | 'repeat'  // absolute = total rows worked; repeat = chart row position
  row: number
  sound?: ReminderSound  // undefined = use app default from settings
}

// ── REMINDERS & FLAGS ────────────────

export interface RowReminder {
  rowNumber: number
  message: string
  type: 'cable' | 'section' | 'decrease' | 'warning' | 'info'
}

export interface PatternFlag {
  id: string
  rowNumber: number
  col: number
  message: string
  resolved: boolean
  resolution?: string
}

// ── YARN & NEEDLES ───────────────────

export interface Yarn {
  brand?: string
  name?: string
  weight?: YarnWeight
  colorway?: string
  color?: string
  fiberContent?: string
  dyeLot?: string
  skeins?: number
  yardsPerSkein?: number
  supplier?: string
}

export interface Needle {
  sizeMm: number
  type: NeedleType
  cableLength?: number
}

export interface Gauge {
  stitchesPer10cm: number
  rowsPer10cm: number
}

// ── SESSIONS ─────────────────────────

export interface Session {
  id: string
  projectId: string
  startRow: number
  endRow: number
  rowsCompleted: number
  durationMinutes: number
  date: string
}

// ── UI STATE ─────────────────────────

export interface AppTheme {
  mode: 'light' | 'dark' | 'auto'
}

export interface ChartViewState {
  zoom: 'S' | 'M' | 'L' | 'XL'
  showColNumbers: boolean
  showRowNumbers: boolean
  highlightStyle: 'fill' | 'outline' | 'arrow' | 'dim-others'
  pastRowOpacity: number
}
