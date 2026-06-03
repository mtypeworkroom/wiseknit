// ─────────────────────────────────────────────
// Pleione by Audrey Borrego (Yarnflakes)
// Free pattern — personal use only
// Body Chart Sizes 1-8
// 11 sts wide x 16 rows
// ─────────────────────────────────────────────
//
// Symbol key:
//   k     = blank  (RS: knit,  WS: purl)
//   p     = dot    (RS: purl,  WS: knit)
//   yo    = o      (yarn over)
//   k2tog = /      (right leaning decrease)
//   ssk   = \      (left leaning decrease)
//
// Chart read right to left on RS (odd) rows
// Col 0 = leftmost (col 11 in pattern)
// Col 10 = rightmost (col 1 in pattern)
// ─────────────────────────────────────────────

import type { Pattern, ChartRow } from '../types'

type S = 'k' | 'p' | 'yo' | 'k2tog' | 'ssk'

// Each row listed left to right as printed in chart (col 11 → col 1)
// Knitter reads RS rows right to left, so we reverse on RS rows in the renderer
const CHART_DATA: S[][] = [
  // Row 1  (RS — all knit except centre purl)
  ['k','k','k','k','k','p','k','k','k','k','k'],
  // Row 2  (WS — lace: \ o k o / • \ o k o /)
  ['ssk','yo','k','yo','k2tog','p','ssk','yo','k','yo','k2tog'],
  // Row 3  (RS)
  ['k','k','k','k','k','p','k','k','k','k','k'],
  // Row 4  (WS — lace)
  ['ssk','yo','k','yo','k2tog','p','ssk','yo','k','yo','k2tog'],
  // Row 5  (RS)
  ['k','k','k','k','k','p','k','k','k','k','k'],
  // Row 6  (WS — lace)
  ['ssk','yo','k','yo','k2tog','p','ssk','yo','k','yo','k2tog'],
  // Row 7  (RS)
  ['k','k','k','k','k','p','k','k','k','k','k'],
  // Row 8  (WS — lace)
  ['ssk','yo','k','yo','k2tog','p','ssk','yo','k','yo','k2tog'],
  // Row 9  (RS)
  ['k','k','k','k','k','p','k','k','k','k','k'],
  // Row 10 (WS — all purl/dot row)
  ['p','p','p','p','p','p','p','p','p','p','p'],
  // Row 11 (RS)
  ['k','k','k','k','k','p','k','k','k','k','k'],
  // Row 12 (WS — all purl/dot)
  ['p','p','p','p','p','p','p','p','p','p','p'],
  // Row 13 (RS)
  ['k','k','k','k','k','p','k','k','k','k','k'],
  // Row 14 (WS — all purl/dot)
  ['p','p','p','p','p','p','p','p','p','p','p'],
  // Row 15 (RS)
  ['k','k','k','k','k','p','k','k','k','k','k'],
  // Row 16 (WS — all purl/dot)
  ['p','p','p','p','p','p','p','p','p','p','p'],
]

export const PLEIONE_CHART: ChartRow[] = CHART_DATA.map((stitches, i) => ({
  rowNumber: i + 1,
  stitches: stitches.map((stitch, col) => ({
    col,
    stitch: stitch as any,
  })),
}))

export const PLEIONE_PATTERN: Pattern = {
  id: 'pleione-body-s1-8',
  name: 'Pleione — Body Chart (Sizes 1–8)',
  source: 'Free pattern by Audrey Borrego (Yarnflakes)',
  designer: 'Audrey Borrego',
  totalRows: 16,
  totalStitches: 11,
  sections: [],
  chart: PLEIONE_CHART,
  symbols: [
    { type: 'k',     label: '□',  description: 'RS: Knit / WS: Purl' },
    { type: 'p',     label: '•',  description: 'RS: Purl / WS: Knit' },
    { type: 'yo',    label: 'o',  description: 'Yarn over' },
    { type: 'k2tog', label: '/',  description: 'K2tog — right leaning decrease' },
    { type: 'ssk',   label: '\\', description: 'SSK — left leaning decrease' },
  ],
  reminders: [
    { rowNumber: 2,  message: 'Lace row — ssk, yo, k2tog', type: 'info' },
    { rowNumber: 4,  message: 'Lace row — ssk, yo, k2tog', type: 'info' },
    { rowNumber: 6,  message: 'Lace row — ssk, yo, k2tog', type: 'info' },
    { rowNumber: 8,  message: 'Lace row — ssk, yo, k2tog', type: 'info' },
    { rowNumber: 10, message: 'All purl/dot row', type: 'info' },
    { rowNumber: 12, message: 'All purl/dot row', type: 'info' },
    { rowNumber: 14, message: 'All purl/dot row', type: 'info' },
    { rowNumber: 16, message: 'End of chart repeat', type: 'info' },
  ],
  flags: [],
  importedAt: new Date().toISOString(),
}
