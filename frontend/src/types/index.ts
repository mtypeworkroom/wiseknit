// ─────────────────────────────────────
// WiseKnit — Core Types
// ─────────────────────────────────────

// ── ENUMS ────────────────────────────

export type ProjectStatus = 'active' | 'paused' | 'waiting' | 'completed' | 'archived';

export type YarnWeight =
  | 'lace'
  | 'fingering'
  | 'sport'
  | 'dk'
  | 'worsted'
  | 'aran'
  | 'bulky'
  | 'super-bulky';

export type NeedleType =
  | 'circular-fixed'
  | 'circular-interchangeable'
  | 'straight'
  | 'dpn'
  | 'magic-loop';

export type StitchType =
  | 'k'       // knit
  | 'p'       // purl
  | 'yo'      // yarn over
  | 'k2tog'   // knit 2 together
  | 'ssk'     // slip slip knit
  | 'cdd'     // central double decrease
  | 'c4b'     // cable 4 back
  | 'c4f'     // cable 4 front
  | 'c6b'     // cable 6 back
  | 'c6f'     // cable 6 front
  | 'sl'      // slip
  | 'empty';  // no stitch

// ── PROJECT ──────────────────────────

export interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  category?: string;
  patternId?: string;
  currentRow: number;
  totalRows: number;
  startedAt?: string;
  lastSessionAt?: string;
  createdAt: string;
  updatedAt: string;
  needle?: Needle;
  yarn?: Yarn;
  gauge?: Gauge;
  notes?: string;
}

// ── PATTERN ──────────────────────────

export interface Pattern {
  id: string;
  name: string;
  source?: string;
  designer?: string;
  totalRows: number;
  totalStitches: number;
  sections: PatternSection[];
  chart: ChartRow[];
  symbols: StitchSymbol[];
  reminders: RowReminder[];
  flags: PatternFlag[];
  importedAt: string;
}

export interface PatternSection {
  id: string;
  name: string;
  colStart: number;
  colEnd: number;
  color: string;
}

export interface ChartRow {
  rowNumber: number;
  stitches: ChartCell[];
}

export interface ChartCell {
  col: number;
  stitch: StitchType;
  sectionId?: string;
}

export interface StitchSymbol {
  type: StitchType;
  label: string;
  description: string;
  color?: string;
}

// ── REMINDERS & FLAGS ────────────────

export interface RowReminder {
  rowNumber: number;
  message: string;
  type: 'cable' | 'section' | 'decrease' | 'warning' | 'info';
}

export interface PatternFlag {
  id: string;
  rowNumber: number;
  col: number;
  message: string;
  resolved: boolean;
  resolution?: string;
}

// ── YARN & NEEDLES ───────────────────

export interface Yarn {
  brand?: string;
  name?: string;
  weight?: YarnWeight;
  colorway?: string;
  color?: string;
  fiberContent?: string;
  dyeLot?: string;
  skeins?: number;
  yardsPerSkein?: number;
  supplier?: string;
}

export interface Needle {
  sizeMm: number;
  type: NeedleType;
  cableLength?: number;
}

export interface Gauge {
  stitchesPer10cm: number;
  rowsPer10cm: number;
}

// ── SESSIONS ─────────────────────────

export interface Session {
  id: string;
  projectId: string;
  startRow: number;
  endRow: number;
  rowsCompleted: number;
  durationMinutes: number;
  date: string;
}

// ── UI STATE ─────────────────────────

export interface AppTheme {
  mode: 'light' | 'dark' | 'auto';
}

export interface ChartViewState {
  zoom: 'S' | 'M' | 'L' | 'XL';
  showColNumbers: boolean;
  showRowNumbers: boolean;
  highlightStyle: 'fill' | 'outline' | 'arrow' | 'dim-others';
  pastRowOpacity: number;
}
