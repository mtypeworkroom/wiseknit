# WiseKnit — Ideas & Feature Vision

## Chart Display & Navigation

### Current Approach (Correct Decision)
AI-based stitch-by-stitch chart extraction was explored and abandoned — vision models
are inconsistent at returning structured grid data and the effort to validate output
exceeds the benefit. The right approach is to treat the chart image as the source of
truth and build smart UI on top of it.

The current flow — crop chart from PDF, store in IndexedDB, display with row highlight
overlay — is solid. The active work is getting the image to render correctly in the
ActiveKnitting screen.

### Chart Limitations in KnitCompanion
- Uses a uniform grid overlay divided by row/stitch count
- Breaks on charts with variable row heights (bobbles, cables, inconsistent designer spacing)
- Symbol key is a scrollable panel that consumes too much screen real estate
- Page navigation ribbon at the top is hard to tap and provides no context

### Planned Chart Improvements for WiseKnit

**Row boundary detection**
Instead of assuming uniform row heights, detect actual horizontal grid lines in the
chart image using OpenCV (Hough line transform). This allows the overlay to match
the real chart even when rows are uneven. As a fallback, let the knitter drag row
boundaries manually to correct misalignment.

**Pinch to zoom**
Essential for active knitting — knitter needs to get close to the chart without
losing their place.

**Repeat region marking**
Knitter brackets a stitch repeat section; it is highlighted differently from the
current row. Can be implemented with touch gestures.

**Tap-to-identify symbols (AI-assisted)**
- Knitter taps any cell on the chart
- App crops that small image region
- Sends crop + the pattern legend to a vision model
- Returns the symbol name and full stitch instructions
- Displayed as a small popup or bottom sheet — no permanent UI real estate used
- This is contextual and on-demand, avoiding the need to pre-parse the entire chart

**Pattern key parsing (AI-assisted)**
Most patterns include a written key section, e.g.:
```
□ = knit on RS, purl on WS
• = purl on RS, knit on WS
○ = yarn over
```
An LLM can parse this text into a structured symbol dictionary for the project.
That dictionary then powers tap-to-identify without a vision call for common symbols.

### Page Navigation — Better than the Ribbon
KnitCompanion's thumbnail ribbon is a poor mobile pattern. Options for WiseKnit:

**Smart page drawer (recommended)**
Bottom sheet slides up from a "pages" button. Shows larger thumbnails with
knitter-assigned labels (Chart A, Schematic, Notes). Dismisses on selection.
No permanent screen real estate used.

**Tabbed sections**
Knitter organizes pattern into named sections during setup — Charts, Schematics,
Notes, Instructions. Tabs are meaningful, not raw page numbers.

**Contextual surfacing**
No page browsing during active knitting. App surfaces what is relevant to the
current row automatically. A "related" button shows schematic or notes for the
current section only.

---

## Row-by-Row Instructions View

### Concept
A companion view to the chart with the same interaction model — row counter with
increment/decrement controls, display updates to show the written instruction for
that row. Clean, focused, no scrolling through a wall of pattern text.

```
Row 14 (RS)
K2, *yo, k2tog, k3, ssk, yo, k1* repeat to last 2 sts, k2

[ ▲ Row 15 ]   [ ▼ Row 13 ]
```

### Where AI Fits

**Parsing**
Take raw pattern text and break it into discrete per-row instructions automatically.
Handles complex language like "work as established" or "continue in pattern" by
expanding based on prior rows.

**Expansion**
Patterns often compress multiple rows or reference earlier sections. AI expands
these into explicit instructions for each row so the knitter never has to hunt.

**Translation**
Abbreviation lookup on demand — tap "ssk" in an instruction, get a plain-English
explanation: "slip, slip, knit — a left-leaning decrease."

**Annotation**
AI reads the full pattern and adds contextual notes to specific rows:
- "Stitch count changes on this row"
- "This row begins a new repeat"
- "Both chart and written instructions apply here"

### Setup Flow
1. During project setup, knitter pastes or uploads the written instructions section
2. AI parses into a structured row-by-row data model
3. Knitter reviews and corrects before starting
4. During knitting: increment row, read instruction

### Data Model (Proposed)

```typescript
interface PatternRow {
  rowNumber: number
  side?: 'RS' | 'WS'
  instruction: string           // full written instruction for this row
  instructionExpanded?: string  // AI-expanded version if original uses shorthand
  stitchCountBefore?: number
  stitchCountAfter?: number
  notes?: string[]              // AI-generated annotations
  flags?: string[]              // e.g. 'repeat-start', 'stitch-count-change'
}

interface ProjectInstructions {
  id: string
  name: string                  // e.g. "Body", "Sleeve", "Chart A Notes"
  rows: PatternRow[]
  rawText?: string              // original pasted text, kept for re-parsing
}
```

This would be added to the existing `Project` type alongside `charts`.

### The Killer Feature — Synced Chart + Instructions
The same row counter drives both the chart highlight overlay and the instructions
view. When the knitter increments the row:
- Chart overlay moves to the next row
- Instructions panel updates to show that row's written instruction

This is something KnitCompanion does not do. It is the natural next step once
the chart image display is working correctly.

---

## Prioritized Roadmap

1. **Fix chart image display** — IndexedDB load in ChartGrid (in progress)
2. **Pinch to zoom** on chart image
3. **Adjustable row boundaries** — manual drag to correct uneven chart grids
4. **Row-by-row instructions view** — AI parsing of pattern text, synced row counter
5. **Tap-to-identify symbols** — vision AI on demand per cell tap
6. **Pattern key parsing** — AI extracts symbol dictionary from pattern text
7. **Repeat region marking** — touch gesture to bracket stitch repeats
8. **Better page navigation** — bottom sheet drawer replacing the ribbon
