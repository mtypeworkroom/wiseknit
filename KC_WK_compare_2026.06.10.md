# KnitCompanion vs WiseKnit — Feature Comparison
*Based on Very Pink Knits YouTube playlist (PLUv37jBrlCtK_W65fJKr3PNkLcUv-SiLs) and supporting reviews/blog posts*
*Date: 2026-06-10*

---

## Source Material

| Source | URL |
|---|---|
| Very Pink Knits playlist | youtube.com/playlist?list=PLUv37jBrlCtK_W65fJKr3PNkLcUv-SiLs |
| verypink.com blog | verypink.com/category/knitcompanion |
| knitcompanion.com | knitcompanion.com |
| Pepper Knits review | pepperknits.com |
| PDX Knitterati review | pdxknitterati.com |
| Edie Eckman review | edieeckman.com |
| The Knitting Circle tutorial | theknittingcircle.com |

---

## Video Playlist Summary

| # | Title | Topic |
|---|---|---|
| 1 | Knitting Help – knitCompanion | App intro, getting patterns in, row markers, free vs paid overview |
| 2 | knitCompanion – Customizing Features | Marker colors, width, transparency; chart stitch color-coding |
| 3 | knitCompanion – Using Charts and Markers | Chart setup, magic markers, row highlighting for chart work |
| 4 | knitCompanion – Customizing Written Patterns | Reformatting multi-column instructions to single column |
| 5 | knitCompanion – Joining Parts | Linking separate charts/written sections; drag-and-drop page reorganization |
| 6 | (title not recovered) | Likely QuickKeys or transition video |
| 7 | knitCompanion – Linked Counters | Secondary counters that advance on a schedule with the main counter |
| 8 | knitCompanion – Smart Counters | iOS auto-trigger counters |
| 9–12 | (titles not recovered) | Android FAQ, iOS FAQ, MacBook intro, Calculators |
| 13 | knitCompanion – kCDesigns & Android Update | kCDesigns marketplace; Android parity update |
| — | Big Android Update! | Major Android feature parity release (Sep 2023) |
| — | Knit*Minute – Make a Project | Short: creating a new project |
| — | Knit*Minute – Scribble | Short: freehand annotation feature |

---

## What WiseKnit Already Has

- PDF import, full-screen reader with zoom / pan / pinch-to-zoom
- Section bookmarks — named chips that navigate to a specific PDF page
- Stitch marker highlights — drag-to-draw colored rectangles on PDF pages; long-press to remove; 5 colors
- Charts — image-based with row highlight overlay and row counter
- RS/WS detection, repeat count tracking, total rows worked
- Session recording — start row, end row, duration, date; history on project detail
- Full project metadata: yarn (all 9 fields), needle (size/type/cable), gauge, designer, category, notes
- Per-row notes on charts — stored as `rowNotes` on ProjectChart; accessible via note icon in the active knitting strip; tap to open a modal, save, and dismiss
- Interval steps — position-based (start / middle / end of row) repeating instructions that fire every N total rows from a configurable start row, up to a repeat count cap; displayed inline in the active knitting instruction strip; set up per chart via a dedicated modal
- Progress bar and zoom levels in active knitting screen
- Free counters — project-level named manual tally counters; user-chosen color with auto light/dark number contrast; left sidebar in active knitting (tap = increment, long-press = decrement, hover tooltip on desktop); setup inside Pattern card in Project Detail (inline chip row, + to add; tap chip to edit name/color, reset to 0, or delete); stored as `freeCounters[]` on `Project`

---

## Gap List — KnitCompanion Features Not Yet in WiseKnit

### Tier 1 — Core tracking (biggest functional gap)

| # | Feature | What KC does | WiseKnit today |
|---|---|---|---|
| 1 | ✅ **Row position marker on written pattern** | Sliding highlight bar spanning the full page width — awkward with multi-column patterns | Built: freely draggable/resizable bracket frame in PDF viewer; position stored as percentages |
| 2 | ✅ **Row alerts / reminders** | Pop-up at a specific row: "Switch to 3mm needle here", "Add bead" | Built: repeat-relative and absolute types; per-reminder sound override; chime + TTS; settings for default sound, chime tone, and voice gender |
| 3 | ✅ **Live project timer** | Stopwatch running while you knit; cumulative per project; editable | Built: tap to start/stop chip in active knitting top bar; session save modal with editable duration |

### Tier 2 — Chart and counter enhancements

| # | Feature | What KC does | WiseKnit today |
|---|---|---|---|
| 4 | **Count-by-2 mode** | Row marker advances every 2 rows — skips plain return rows for lace | ✅ RS Only toggle in chart setup — display row and total both double; chip 2 also reflects actual rows |
| 5 | **Linked / secondary counters** | A counter that auto-increments every N main rows (e.g. "increase every 6 rows") | Manual free counters built (project-level, named, color-coded); auto-increment every N rows not yet built |
| 6 | **Written + chart linked view** | One tap advances both the written instruction position AND the chart row marker simultaneously | PDF viewer and active knitting chart screen are disconnected |
| 7 | ✅ **Per-row instructions in active knitting** | Written instruction for the current row shown below the chart as it advances | Built: interval steps fire at configurable row intervals and display in the active knitting strip grouped by position (start / middle / end); per-row notes via note icon + modal |

### Tier 3 — Pattern navigation and annotation

| # | Feature | What KC does | WiseKnit today | Decision |
|---|---|---|---|---|
| 8 | **Size highlighting** | Fully manual — switch to Edit mode, drop a highlight on each instance one at a time, resize handles, copy for repeats. Tedious enough that most knitters skip it. | Not implemented | AI feature — manual version is impractical; AI finds all instances automatically |
| 9 | **PDF freehand / text highlighting** | Digital highlighter and scribble on pattern text | Stitch marker rectangles cover 90% of this need | Low priority — stitch markers handle most cases; freehand is a possible future addition |
| 10 | **Inline typed annotations** | Typed note attached to a specific pattern location | Not implemented | Yes — build it, but with a significantly better UX than KC |
| 11 | **Always-visible symbol key** | QuickKeys panel for instant legend/abbreviation access | Not implemented | Yes — build it, but rethink how it works entirely |

### Tier 4 — Calculators

| # | Feature | Description | Notes |
|---|---|---|---|
| 12 | ✅ **Inc/Dec evenly** | Enter current stitch count + target → exact placement of each increase or decrease | Built |
| 13 | ✅ **Sleeve taper** | Enter measurements → full shaping schedule (inc/dec every N rows) | Built |
| 14 | ✅ **Stitch/row converter + size recommendation** | Enter gauge + body measurements → stitch/row counts + recommended pattern size | Built — sts + row gauge, size chart with chest/length/yardage, proportionality warning, yardage estimate with area-scaling explanation; unit preference (in/cm) in Settings |

### Tier 2 (addition) — PDF Page Management

| # | Feature | What KC does | WiseKnit today | Decision |
|---|---|---|---|---|
| 20 | **Page rotation** | Rotate individual pages within the viewer — essential for landscape schematics and mixed-orientation patterns | No rotation — pages display as-is from the PDF | Yes — per-page rotation that persists |
| 21 | **Add PDF pages** | Add pages from additional PDFs after initial import (errata, extra schematics, size charts from another file) | PDF is fixed at import time | Yes — and fix KC's omission: added pages must be deletable |

### Tier 5 — Advanced / nice to have

| # | Feature | Notes |
|---|---|---|
| 15 | Stitch position tracker | Only viable with voice control — stopping to move a dot manually defeats the purpose. "Move 5 stitches ahead." Dependent on #19; do not build without it. |
| 16 | Freehand drawing on PDF | Low priority — stitch marker rectangles cover most needs |
| 17 | Pattern text sections — crop and extract | Yes — same mechanism as chart import: crop a region of written pattern text from the PDF, store it as a dedicated section. Removes surrounding size tables, unrelated columns, and clutter. Bracket row marker and row reminders then apply cleanly to that focused section. WiseKnit already has the PDF crop infrastructure. |
| 18 | Chart symbol color-coding | Medium — useful for colorwork and complex charts; KC calls these Magic Markers |
| 19 | Voice control | "Next row", "move 5 stitches ahead", "beginning of row" — hands-free, needles never go down. Enables #15. Significant build effort, high value. |

---

## WiseKnit Design Decisions

### Row Position Marker — The Bracket

**Problem with KC's approach:** A full-width horizontal bar spanning the entire page. Works acceptably for single-column patterns but breaks for multi-column layouts (the most common format in knitting magazines and commercial patterns) — the bar covers text in adjacent columns and gives no indication of which column you are in.

**Options considered:**
- Full-width sliding bar (KC approach) — ruled out: column problem
- Thin horizontal line / ruler — ruled out: too subtle on screen, no text highlighted
- Fixed left-margin tab — ruled out: anchored to page edge, meaningless when reading column 2 or 3
- Spotlight / dim surroundings — strong contender; no text coverage at all
- **Bracket frame — selected**

**The bracket design:**

A freely positionable rectangular frame — four corner brackets or full border lines — that the user drags to surround the row they are currently reading. The text inside is completely unobstructed.

```
 ┌─────────────────────────────┐
 │ Row 14: K2, *yo, k2tog...  │
 └─────────────────────────────┘
```

Key behaviors:
- **Freely draggable in X and Y** — drag it to any position on the page; works with 1, 2, 3, or more columns
- **Freely slidable vertically** — slide up and down with a finger or mouse to follow the current row; no snapping, because written pattern rows have irregular line heights
- **Resizable width** — drag left and right edges to fit the column; set once per column, stays there
- **Resizable height** — drag top and bottom edges to fit the row height
- **Persists position** — when you return to the page/section, the bracket is where you left it
- **Position stored as percentages** — survives zoom and pan correctly (same approach as stitch marker highlights)

**Why brackets specifically:**
- Knitters already read brackets as meaningful notation — they denote repeats in written patterns (*k2tog, yo* repeat within [ ])
- The frame marks a region without covering any text, unlike a filled highlight
- Fully column-aware by design — the left and right edges define the column, so it naturally spans only what you intend
- More precise than a bar: you can size it to exactly one row's height

**Knitting connection:** Patterns already use [ ] to mark repeat sections. Using a bracket frame as a "you are here" marker extends a symbol knitters already understand.

### Live Timer — Design

**Approach: tap to start, tap to stop, editable.**

- Knitter taps a start button in the active knitting screen — deliberate, intentional
- Timer runs visibly while they knit
- Knitter taps stop when done
- Assumption: if someone cares enough to start the timer manually, they care enough to stop it
- **Editable session duration** as the safety net for the times they forget — after ending a session (or on the session history screen) they can correct the recorded time
- No auto-pause, no inactivity detection, no prompts — keep it simple
- Cumulative time across all sessions shown on the project detail page

**Why not auto-stop:** Knitters keep their tablets on and the app in focus by design — locking the screen means having to unlock it constantly while knitting, which interrupts the flow. Any focus-loss or inactivity detection fails because the screen staying on all night is a deliberate choice, not a signal that knitting has stopped. There is no reliable automatic signal for "put the knitting down," so we don't pretend there is.

---

### Count-by-2 Mode — Design

**What it solves:** Many charts only show RS (right-side) rows — the WS return rows are always "purl back" or "knit back" and are omitted from the chart entirely. Without count-by-2, the knitter must remember to advance the counter twice per charted row, which breaks focus.

**Decision: fixed at 2, not configurable.** Every-other-row covers the vast majority of cases. Patterns that chart every 4th row are rare enough not to warrant a configuration option.

**Row number display:** The counter shows the pattern row number (what the written pattern calls it), not the chart row position. So if the chart only shows RS rows, the counter reads 1, 3, 5, 7... matching the numbers printed in the pattern. This keeps the counter in sync with any written instructions the knitter is cross-referencing.

**Applies to:** both chart-based projects and written-pattern row counters.

---

### Linked / Secondary Counters — Design

**What they solve:** Complex shaping often requires tracking multiple independent schedules simultaneously. Example: a raglan sweater where you increase on one edge every 3 rows and on a neckline every 10 rows. These are separate counts running against the same main row counter. Without secondary counters the knitter must track these mentally or on paper.

**Key decisions:**
- Maximum **5 secondary counters** per chart or project. In practice most knitters will use 1–2; 5 is a generous ceiling.
- Each counter is **named by the knitter** (e.g. "Raglan inc", "Neckline", "Bead count")
- Counters can **auto-increment** every N main rows, OR be **manually tapped** by the knitter — not all shaping follows a strict row schedule
- Counters can **reset** at a specified value (e.g. a sub-repeat counter that runs 1–6 then returns to 1)
- Counters can count **up or down** (useful for decrease shaping where you start with a number and work toward zero)
- Secondary counters are a **safety net** — if per-row instructions (#7) are implemented well, many knitters won't need them. But they remain available for patterns with complex independent shaping schedules.

**Proposed data model:**
```typescript
interface LinkedCounter {
  id: string
  name: string            // knitter-named
  value: number           // current count
  triggerEvery?: number   // auto-increment every N main rows (optional — can be manual-only)
  resetAt?: number        // reset to 0 when value reaches this (optional)
  countDown: boolean      // true = counting down toward zero
}
```
Stored as an array on `ProjectChart` (chart-scoped) or on `Project` (written-pattern-only).

---

### Per-Row Instructions + Chart Linking — Design

**Decision:** Items #6 (Written + chart linked view) and #7 (Per-row instructions in active knitting) are merged. If per-row instructions are displayed well directly on the chart screen, there is no need for a separate mechanism that links the PDF written pattern view to the chart.

**What this means in practice:** The active knitting screen shows a single line of the written instruction for the current row below the chart — advancing automatically as the row counter advances. The knitter reads the chart visually and the instruction textually in one place, without switching screens.

**Chart-Page Row Instruction Strip:**

A single line of text shown directly below the chart image, updating as the row counter advances. No separate panel, no scrolling — just the current row's instruction inline with the chart.

```
Row 14 (RS): K2, *yo, k2tog, k3, ssk, yo, k1* rep to last 2, k2
```

Implementation phases:

*Phase 1 — Manual entry (build first, no AI required):*
- Expose `rowNotes` (already on `ProjectChart`) in the chart edit UI
- Knitter types instructions row by row
- Display the matching note for the current row in the strip
- Empty rows show nothing (strip collapses)

*Phase 2 — AI extraction:*
- Extract text from PDF pages containing written instructions
- Send to Claude, get back a per-row instruction map
- Populate `rowNotes` automatically; knitter reviews and corrects
- Same strip, same display — AI fills in the data faster

The `rowNotes` schema already exists on `ProjectChart`. Phase 1 is purely a UI addition.

**Gap this closes vs KC:** KC requires a separate Join setup to link chart and written views. WiseKnit makes it automatic once row instructions are populated.

---

### Row Alerts / Reminders — Design

**Problem with KC's approach:** Reminders are stored as absolute row numbers only. If you have a 24-row repeat and need a reminder at row 6 of every repeat, you must manually calculate and enter row 6, 30, 54, 78... for however many repeats the pattern has. With non-divisible repeat lengths this becomes a significant setup burden. The only workaround is KC's Join function — creating one enormous virtual chart covering all repeats — which is impractical for long patterns.

**Core principle: AI is always optional, built on top of manual functionality.** The manual system must be complete and fully usable on its own. AI is an accelerator for populating data, not a dependency.

**Two reminder types:**

- **Repeat-relative**: "fire at row 6 of every repeat" — stored once as a row within the repeat cycle; triggers automatically every time `currentRow mod repeatLength = 6`. Solves the divisibility problem entirely.
- **Absolute**: "fire at row 42, once" — for one-time events like "begin neck shaping", "switch to 3mm needle", "cast off".

Most patterns need both types coexisting.

**Works with or without a chart:**
- Chart projects: reminders scoped to the chart, tied to the chart's row counter
- Written-pattern-only projects (no chart): reminders tied to a standalone row counter on the project
- The row counter is always the source of truth for triggering reminders
- The bracket position marker is a separate, manually-positioned visual aid — it may not always be up to date, so it is never used to trigger reminders

**Reminder behavior when it fires:**
- **Persistent** — the reminder stays visible until the knitter advances past that row. Knitters frequently stop mid-row and must be able to come back and still see the reminder.
- If the knitter goes back to that row (decrements the counter), the reminder reappears.
- Clears automatically when the row counter moves past it.

**Two entry modes:**

*Manual (always available):*
- User adds a reminder: enter row number, choose type (absolute / repeat-relative), enter text
- Edit and delete reminders at any time
- No AI required

*AI-assisted (optional, on top of manual):*
- AI reads the pattern PDF and suggests a list of reminders with type and row pre-filled
- User reviews the full list, edits text, changes row numbers, deletes suggestions
- User confirms before anything goes active — AI never writes reminders directly without review
- After confirmation, reminders behave identically to manually entered ones

**Proposed data model:**
```typescript
interface RowReminder {
  id: string
  text: string
  type: 'absolute' | 'repeat'
  row: number        // absolute row number if type='absolute'
                     // row within repeat cycle (1-indexed) if type='repeat'
}
```
Stored on `ProjectChart` for chart projects; stored directly on `Project` for written-pattern-only projects.

### Calculators (Tier 4) — Design

**All three confirmed. Build as a dedicated calculators section, surfaced contextually.**

**Inc/Dec Evenly (#12)**
Pure algorithm. Given current stitch count and target stitch count, calculate exact row instructions: "increase 1 stitch every 4 stitches, then every 3 stitches for the remainder" etc. Standard knitting math, well-defined formula.

**Sleeve Taper (#13)**
Pure algorithm. Given body measurements (arm length, cuff width, upper arm width) and row gauge, calculate the full shaping schedule: "increase 1 stitch each end every 6 rows, 8 times; then every 8 rows, 4 times." Outputs a ready-to-follow instruction list.

**Stitch/Row Converter + Size Recommendation (#14)**
Two parts:

*Part 1 — Converter (algorithm):*
Given gauge and target dimensions, calculate stitch and row counts. Standard formula: `(measurement cm × stitches per 10cm) ÷ 10 = stitch count`.

*Part 2 — Size recommendation (algorithm + optional AI):*
- User's gauge is already stored on the project
- User's body measurements stored on user profile (to be built)
- User enters desired ease (positive = roomier, negative = closer fit)
- Algorithm: `(body measurement + ease) × gauge ÷ 10 = stitches needed` → match to closest pattern size
- **AI component (optional):** read the pattern PDF and extract the finished measurements table automatically rather than requiring manual entry
- Output: "Based on your gauge and a 2 inch positive ease, we recommend the **Medium (42 inch)** size"

**Discoverability — key design principle:**
The reason knitters don't use calculators in KC is they don't know they exist or can't find them. WiseKnit must surface calculators **contextually** at the moment they're needed, not buried in a menu:
- Gauge entered during project setup → prompt: "Want a size recommendation based on your measurements?"
- Row reminder or annotation mentions "increase evenly" → surface the Inc/Dec calculator inline
- Approaching a sleeve section → offer the Sleeve Taper calculator
- General calculator access always available from the project screen for deliberate use

This applies broadly: **every feature in WiseKnit should be discoverable at the moment it's relevant**, not require the knitter to watch tutorial videos to know it exists.

---

### PDF Page Management (#20 and #21) — Design

**Page rotation (#20):**
Patterns frequently mix orientations — a schematic or wide stitch chart is often landscape in a portrait pattern. The viewer needs a rotate button (90° clockwise / counterclockwise) that persists per page. The knitter should never have to tilt their tablet to read a page.

Implementation: store a `rotation` value per page in the project. Apply as a CSS transform in the PDF viewer. Existing zoom and pan should still work correctly after rotation.

**Add and delete PDF pages (#21):**
After the initial import a knitter may need to add pages from a second file — a separately distributed errata sheet, an additional size chart, a schematic from the designer's website. KC supports adding pages but **never allows deleting them**, which means a mistakenly added page is permanent. This is a known frustration.

WiseKnit must support both:
- **Add pages:** open the PDF page picker for a second (or third) file; selected pages are appended to the project's page set
- **Delete pages:** any page — whether from the original import or added later — can be removed. A confirmation prompt before deletion. Any stitch markers, annotations, or bracket positions on that page are removed with it.

Pages are stored in IndexedDB already. Adding/removing entries is straightforward with the existing infrastructure.

---

### Written Pattern Tracking — KC vs WiseKnit (Full Comparison)

**KC's full setup process for a written pattern section (Text Piece):**
1. Tap Setup at top left
2. Tap blue plus (+) → select Text Piece
3. Select the pattern page
4. Crop the text region (drag diagonally, hit Crop)
5. Enter the row count manually
6. Enter the starting row number manually
7. **Drag a blue horizontal handle for every single row** — because text fonts and paragraph heights vary, each row divider must be positioned manually to box in exactly that row's text
8. Tap Knit to save
9. Separately join the Text Piece to any charts

For a 60-row pattern section that is **at minimum 60 individual drag operations** before knitting a single stitch. KC's own kCDesigns marketplace exists partly because this setup is hard enough that pre-configured patterns are a selling point.

**What KC's knit mode does well (worth adopting):**
- One-tap row advancement — tap once, highlighter jumps to the next row automatically
- Row reminders — text or audio popup when the tracker reaches a specific row
- Long-press on the tracker to frog (go back), skip ahead, or reset to row 1

**Why KC needs all that setup:** The highlight bar approach requires knowing exactly where each row starts and ends on the page before it can auto-advance. Variable text heights mean every row divider must be pre-defined. This is an inherent cost of the auto-advancing bar model.

**How WiseKnit's bracket eliminates the setup entirely:**

The bracket is freely positioned by the knitter in real time — there is no pre-configuration of row heights because the knitter IS the row height configuration. They drag the bracket to the row they're on. When they finish, they drag it down to the next row. Setup cost: zero.

The trade-off: WiseKnit's bracket doesn't auto-advance to the exact next row (because row heights aren't pre-defined). The knitter drags it manually. This is a conscious trade — eliminate 60 drag operations upfront, in exchange for one small drag per row advancement.

**For the crop step:** WiseKnit already has the PDF crop infrastructure from chart import. The cropped section eliminates surrounding clutter before the knitter even opens the bracket — same benefit, no extra setup.

**Long-press to frog:** Worth adopting. Long-press on the bracket opens a quick action: go back one row, reset to start.

---

### Pattern Text Sections (#17) — Design

**What it is:** The same crop-and-extract mechanism already used for chart images, applied to written pattern text. The knitter selects a region on a PDF page — just the body instructions, just the sleeve shaping, just the neckline — and it becomes a dedicated named section in the project. The surrounding page content (size tables, other sections, unrelated columns) is excluded.

**Why it matters:** Most commercial patterns pack multiple things onto each page. When you're tracking your place in the body instructions, you don't want to be visually parsing around the sleeve instructions and the finished measurements table on the same page. A cropped section gives you exactly and only what you need right now.

**WiseKnit advantage:** The PDF page picker already supports region selection and crop for charts. Extending it to create written pattern sections reuses the same tool and the same infrastructure — different role, same mechanism. The knitter already knows how to use it.

**What you can do with a cropped section:**
- Apply the bracket row marker to track position within just that section
- Attach row reminders scoped to that section's row numbers
- Add inline annotations
- Pair with a chart if the pattern has both (one section = written instructions, one = chart, same row counter drives both)

---

### Size Highlighting (#8) — Design

**Why manual doesn't work:** KC's implementation requires switching to Edit mode, dropping a highlight on each size instance individually, resizing corner handles to fit, then copying for every additional occurrence throughout the document. A commercial multi-size pattern mentions your size 40–100+ times. In practice most knitters skip this feature entirely because the setup cost is too high.

**WiseKnit approach: AI-only feature, built on top of existing stitch marker infrastructure.**

Flow:
1. Knitter selects their size during project setup or from the PDF viewer ("I'm knitting the Medium / 42 inch / 96 sts")
2. AI reads the full PDF text, identifies every instance of that size designation throughout all pages
3. Places stitch marker highlights automatically on all instances — same colored rectangle system already built
4. Knitter can adjust, recolor, or remove any individual highlight
5. No manual placement required

**Why this is the right AI use case:** The task is mechanical (find this string/number throughout a document), deterministic (there's a right answer), and tediously repetitive at human scale. AI does it in seconds; a human doing it manually will give up.

**Dependency:** Requires PDF text extraction (pdf.js already supports `page.getTextContent()`), which maps text positions to page coordinates, allowing highlights to be placed accurately.

---

### Inline Annotations (#10) — Design Notes

**Yes, build it.** Attaching a typed note to a specific location on the pattern page is genuinely useful — modifications, personal sizing notes, "I used a different decrease here," etc.

**KC's UX problems to avoid:**
- Too many steps: toggle a mode flip at the top, enter edit mode, locate the control on the right side, add the note — four or five actions before you can type a word
- Note entry area is cramped — about one visible row before it scrolls, and scrolling back up is difficult
- On the pattern, notes appear as a tiny comment bubble that is easy to miss and hard to tap precisely

**What better looks like:**
- Long-press anywhere on the PDF to place a note at that spot — one gesture, no mode switching
- Full or half-screen note editor with proper text area — room to write
- Notes displayed as a clearly visible, tappable callout on the pattern page (not a tiny icon)
- Tap the callout to read/edit, long-press to delete — consistent with the stitch marker interaction model we already have

---

### Symbol Key / QuickKeys (#11) — Design Notes

**Yes, build it.** Having to navigate away from your place in the pattern to look up an abbreviation is a genuine friction point — you lose your place, you lose focus.

**Display:** The existing slide-out info panel in ActiveKnitting (the ℹ button) is the right home. Already built and wired — just needs real content instead of hardcoded placeholders.

**Three-tier content strategy:**

- **Tier 1 — Manual crop (built):** Same one-gesture crop the user already knows from chart import. User crops the key/legend region from the PDF during project setup. Stored as `keyImageKey` on `Project` (IndexedDB). Displayed as a full-width zoomable image in the slide-out panel. Better than KC because: (a) no tiny unreadable thumbnail — the panel is full-width, (b) pinch-to-zoom works, (c) setup is one gesture.

- **Tier 2 — Stitchfiddle integration (future):** Stitchfiddle exports contain structured color and symbol data. If a chart was built in Stitchfiddle, importing their export would auto-populate the key with zero user effort. Requires investigation of their export format and any available API. User has free license — note for future exploration.

- **Tier 3 — AI crop read (future):** User crops the key region (same as Tier 1). Instead of displaying the image, send it to a vision model which returns structured `symbol → description` pairs. User reviews and corrects. Handles non-standard symbols, custom cables, colorwork. Result renders as structured entries (perfect quality at any size) rather than an image.

**Add/Edit key flow:**
- During project setup (Pattern step): offer key crop alongside chart selection in PDFPagePicker
- On Project Detail page: Add/Edit Key button in the Pattern section navigates back to Setup step 3
- In active knitting: panel shows key image if set; "No stitch key — add one in project setup" if not

---

### Row-by-Row Instructions View — Design

**Concept:** A companion view to the chart with the same interaction model — row counter with increment/decrement controls, display updates to show the written instruction for that row. Clean, focused, no scrolling through a wall of pattern text.

```
Row 14 (RS)
K2, *yo, k2tog, k3, ssk, yo, k1* repeat to last 2 sts, k2

[ ▲ Row 15 ]   [ ▼ Row 13 ]
```

**The killer feature — synced chart + instructions:** The same row counter drives both the chart highlight overlay and the instructions view. When the knitter increments the row, the chart overlay moves to the next row AND the instructions panel updates simultaneously. KC does not do this. It is the natural next step once the chart image display is working correctly.

**Where AI fits (optional, layered on top of manual):**

- *Parsing:* Take raw pattern text and break it into discrete per-row instructions automatically. Handles complex language like "work as established" or "continue in pattern" by expanding based on prior rows.
- *Expansion:* Patterns often compress multiple rows or reference earlier sections. AI expands these into explicit instructions for each row so the knitter never has to hunt.
- *Translation:* Abbreviation lookup on demand — tap "ssk" in an instruction, get a plain-English explanation: "slip, slip, knit — a left-leaning decrease."
- *Annotation:* AI reads the full pattern and adds contextual notes to specific rows: "Stitch count changes on this row", "This row begins a new repeat", "Both chart and written instructions apply here."

**Setup flow:**
1. During project setup, knitter pastes or uploads the written instructions section
2. AI parses into a structured row-by-row data model
3. Knitter reviews and corrects before starting
4. During knitting: increment row, read instruction

**Data model (proposed):**

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

This would be added to the existing `Project` type alongside `charts`. For chart projects, `ProjectInstructions` and `ProjectChart` share the same row counter. For written-pattern-only projects, `ProjectInstructions` drives a standalone row counter.

---

### Chart Enhancements — Design

These are improvements to WiseKnit's chart system that go beyond what KnitCompanion offers or correct where KC falls short.

**Why KC's chart approach breaks down:**
- KC uses a uniform grid overlay divided by row/stitch count
- Breaks on charts with variable row heights (bobbles, cables, inconsistent designer spacing)
- Symbol key is a scrollable panel that consumes too much screen real estate
- Page navigation ribbon at the top is hard to tap and provides no context

**Row boundary detection (smarter than KC's uniform grid):**

Instead of assuming uniform row heights, detect actual horizontal grid lines in the chart image using OpenCV (Hough line transform). This allows the highlight overlay to match the real chart even when rows are uneven. Fallback: let the knitter drag row boundaries manually to correct misalignment. This eliminates the systematic error in KC's approach without requiring 60+ manual drag operations upfront.

**Repeat region marking:**

Knitter brackets a stitch repeat section; it is highlighted differently from the current row indicator. Can be implemented with touch gestures (pinch inward to bracket, tap to release). Patterns already use [ ] to mark repeats — the visual metaphor is already understood.

**Tap-to-identify symbols (AI-assisted, on demand):**

- Knitter taps any cell on the chart
- App crops that small image region
- Sends crop + the pattern legend to a vision model
- Returns the symbol name and full stitch instructions
- Displayed as a small popup or bottom sheet — no permanent UI real estate used
- Contextual and on-demand; avoids the need to pre-parse the entire chart
- Falls back gracefully to the parsed pattern key (see below) for known symbols

**Pattern key parsing (AI-assisted):**

Most patterns include a written key section, e.g.:
```
□ = knit on RS, purl on WS
• = purl on RS, knit on WS
○ = yarn over
```
An LLM can parse this text into a structured symbol dictionary for the project. That dictionary then powers tap-to-identify without a vision call for common symbols, and populates the always-visible symbol key (Feature #11).

---

### Page Navigation — Design

KC's thumbnail ribbon at the top of the viewer is a poor mobile pattern: small tap targets, no labels, no context about what's on each page.

**Smart page drawer (selected approach):**

A bottom sheet slides up from a "pages" button. Shows larger thumbnails with knitter-assigned labels (Chart A, Schematic, Notes, Body Instructions). Dismisses on selection. No permanent screen real estate consumed. Knitter labels pages once during setup; the drawer makes navigation meaningful rather than raw page numbers.

**Alternative considered — tabbed sections:**

Knitter organizes pattern into named sections (Charts, Schematics, Notes, Instructions) during setup. Tabs are meaningful, not raw page numbers. Trades setup effort for cleaner navigation during knitting. Reasonable for dedicated knitters who do thorough setup; higher barrier for casual users.

**Not building — contextual surfacing only:**

No page browsing during active knitting, app surfaces what is relevant automatically. Too restrictive — knitters legitimately need to flip to a schematic mid-row.

**Decision:** Smart page drawer. Lower setup cost than full section organization, still meaningfully better than a raw page ribbon. Knitter adds a label when they want one; unlabeled pages show by page number.

---

## KnitCompanion Full Feature Inventory (for reference)

### Pattern / PDF ingestion
- Import from: local files, email, Ravelry library, Dropbox, Google Drive, Box, any share source
- Works fully offline after import
- Multi-select batch operations (copy, delete, pack)
- Search and sort by name or modification date

### Row and stitch markers
- Sliding row marker bar: horizontal highlight dragged down the page; persists through zoom and page navigation
- Stitch position dot: movable "you are here" dot within a row for horizontal tracking
- One-tap row advancement (paid)
- Marker customization: color, width, transparency (paid)
- Inverted marker: highlights everything *except* the current row (paid)
- Even/odd row colors to distinguish RS from WS passes at a glance

### Chart tools
- Intelligent chart recognition ("magic wand"): auto-detects grid cells by analyzing the PDF; sensitivity adjustable
- Manual grid alignment when auto-detection needs correction
- Magic Markers: re-color individual stitch symbols; "show count" mode displays stitch count per symbol run per row
- Count-by-2 mode: marker advances every 2 rows to skip plain return rows (eliminates mental math for lace)
- Guided Charts: written instructions linked to chart rows; one marker governs both simultaneously
- Row alerts: text reminder triggered at a specific row number
- Persistent key visibility: chart legend always visible alongside the chart

### Joining and reorganization
- Join: drag pages from different parts of the PDF into a unified project view; one row marker spans all
- Text piece reorganization: multi-column instructions rearranged to a single column
- Full page-level reorganization of pattern layout

### Counters
- Unlimited basic counters per project (free)
- Linked counters: secondary counter advances on a user-defined schedule relative to the main counter
- Smart counters (iOS): counters that auto-trigger based on row position or respond to voice
- Voice control: hands-free advancement so hands stay on the needles

### Annotations
- Scribble: freehand drawing/writing on the PDF in multiple colors
- Text highlights: digital highlighter on pattern text
- Inline typed notes: attached to specific pattern locations
- Audio notes: voice memo attached to the pattern
- Row-specific reminders: text pop-up at a specified row
- Project notes page: dedicated text field for yarn info, modifications, deadlines
- Note Page PDF: blank page auto-added to every project for extra notes
- Video links: embed YouTube URLs directly in the project; watch without leaving the app
- Size highlighting: tap your size; all matching numbers highlight throughout the document

### Timer
- Per-project stopwatch with cumulative tracking
- Editable (correct if forgotten)

### Sync and backup
- iCloud sync across iPhone, iPad, MacBook
- Dropbox sync for cross-platform iOS ↔ Android or backup
- Share to Google Drive, Box, and other clouds
- Fully offline-first

### Platform coverage
- iOS 16.4+ (iPhone, iPad)
- macOS 12.5+ (same feature parity)
- Android 8.0+
- Amazon FireOS 7+
- Windows via BlueStacks (unofficial workaround)

### Calculators (paid)
- Inc/Dec Evenly: spread increases or decreases across a row
- Blanket Sizer: dimensions from gauge and stitch count
- Sleeve Taper: shaping schedule from measurements

### kCDesigns marketplace
- 1,500+ pre-configured patterns from independent designers
- Markers, highlights, counters pre-placed; user selects size
- No subscription required per pattern beyond the pattern price

### Color system
- Named colors with descriptions (e.g. "Bead A — copper size 8")
- System colors shared globally across projects
- Color picker with saturation, brightness, opacity controls

---

## User Pain Points with KnitCompanion (from comments and reviews)

These are the things real users complain about — each is an opportunity for WiseKnit.

1. **Steep learning curve** — "Not an app where you figure out features by poking around." Requires watching 13+ tutorial videos. Every reviewer notes this.
2. **Subscription anxiety** — Early behavior (setups disappear when subscription lapses) was fixed, but the perception persists. Users worry about lock-in.
3. **No Windows native app** — BlueStacks workaround is clunky and RAM-hungry. Multiple users nearly didn't purchase because of this.
4. **Android lags behind iOS** — Smart Counters still iOS-only; linked counters came to Android late. Users on Android feel like second-class citizens.
5. **Pricing confusion** — Three-tier structure (Basics free / Essentials / Setup+Essentials) confuses new users; unclear which features require which tier during demos.
6. **Non-PDF friction** — Patterns in web pages, images, or magazine scans must be manually converted to PDF first. No native path.
7. **Slider disappears on zoom** — Reproducible glitch on iPhone with scanned book PDFs.
8. **Voice control + linked counters don't interact clearly** — The interaction isn't documented and even the tutorial creator didn't know the answer.
9. **Pattern key still requires scrolling** — Before QuickKeys was added, users had to flip pages to reference the legend.
10. **Cost perception** — At £39/year some users find it overkill for simple projects; value requires heavy chart/lace work.

---

## Where WiseKnit Can Leapfrog KnitCompanion

These are either gaps KC has or things WiseKnit's architecture enables that KC cannot do.

| Advantage | Detail |
|---|---|
| **Web-based** | Any device, any OS, no install, no app store — Windows, Chromebook, Android, iOS all work natively |
| **No learning curve goal** | Make every feature discoverable inline — no 13-video prerequisite |
| **AI row instruction extraction** | Extract written instructions from the PDF and map to row numbers automatically — no app does this |
| **AI stitch symbol identification** | Tap any symbol in a chart; AI identifies it and gives plain-English instructions — contextual, on-demand, no permanent screen real estate |
| **AI size adjustment** | Tap your size once; AI recalculates all stitch counts and measurements throughout |
| **Smarter chart row detection** | Hough line transform detects actual grid lines rather than assuming uniform row heights — works correctly on charts with bobbles, cables, and variable spacing |
| **Zero-setup written pattern tracking** | Bracket system requires no pre-configuration (contrast KC's 60+ drag operations per section) |
| **Yarn stash management** | Most apps ignore this entirely; WiseKnit already tracks 9 yarn fields per project and can grow into a full stash view |
| **Pricing model flexibility** | No established model yet — can choose one-time purchase or generous free tier to avoid subscription anxiety |
| **Import from URL** | Web-first architecture means fetching a pattern from a URL is more natural than in a native app |

---

## Competitive Landscape (other apps in this space)

| App | Platforms | Pricing model | Key differentiator |
|---|---|---|---|
| **KnitCompanion** | iOS, macOS, Android | Subscription (3 tiers) | Chart auto-detection, Magic Markers, deepest feature set |
| **Row Counter** | iOS, Android | Free / IAP | Ravelry-connected, voice control, simple |
| **YarnBuddy** | iOS | Free / Pro annual | Stash management, Apple Watch, home screen widgets |
| **Pattern Keeper** | iOS, Android | One-time ~$10 | Chart-focused, cross-stitch origins, no subscription |
| **Stash2Go II** | iOS | — | PDF markup, Apple Watch, Ravelry stash sync |
| **Yarn Stasher** | Web | — | AI yarn label scanning (camera), Ravelry sync |
| **Loopsy** | — | — | Smart pattern generation, interactive work mode |
| **Alpaca** | iOS only | — | Activity feed, shop location mapping |

**Notable gap in the market**: No app combines strong pattern reading *and* yarn stash management *and* AI features. KnitCompanion owns pattern reading. YarnBuddy owns stash. No one owns all three.

---

## Priority Build Order (WiseKnit perspective)

Based on impact vs effort and what would make a knitter switch from KC. Organized in two tracks that can progress in parallel.

### Track A — KC Gap Closure (written pattern + active knitting)

1. ✅ **Per-row instructions in active knitting** (Tier 2 #7) — interval steps: position-based (start/middle/end), fires every N total rows from start row × repeat count cap; per-row notes via note icon + modal
2. ✅ **Row position marker on written pattern** (Tier 1 #1) — done
3. ✅ **Live project timer** (Tier 1 #3) — done
4. ✅ **Row alerts / reminders** (Tier 1 #2) — done
5. ✅ **Count-by-2 mode** (Tier 2 #4) — RS Only toggle on chart setup; display row, total, and worked rows all correct
6. ✅ (manual) **Free counters** (Tier 2 #5 partial) — project-level named manual counters with color coding done; **auto-increment every N rows, reset-at, count-down** remaining ← NEXT
7. **AI row instruction extraction** — differentiator; Phase 2 of the instruction strip; build after Phase 1 (manual entry) works
8. **Size highlighting** (Tier 3 #8) — AI-only; high frequency pain point; depends on PDF text extraction
9. ✅ **Calculators** (Tier 4 #12, #13, #14) — all three built: Inc/Dec Evenly, Sleeve Taper, Pattern Size Finder (sts + row gauge, size chart, yardage estimate, proportionality warning); unit preference in Settings
10. **Always-visible symbol key / QuickKeys** (Tier 3 #11) — powers both abbreviation lookup and the pattern key parser output ← NEXT
11. **Page navigation drawer** — bottom sheet replacing the ribbon; medium effort, clear UX improvement
12. **PDF page add/delete and rotation** (#20, #21) — frequently needed; deletable pages fixes a known KC frustration
13. **Pattern text sections** (Tier 5 #17) — crop written section from PDF; reuses chart crop infrastructure
14. **Inline typed annotations** (Tier 3 #10) — long-press to place; full text area; consistent with stitch marker model

### Track B — Chart Enhancements (chart image quality)

1. ✅ **Chart setup wizard UX** — required fields with asterisks + warning borders on empty inputs, nudge intervals halved (4→2 px), crop preview shows zoomed selection with gray surround, Discard & Exit returns to project detail for existing projects / dashboard for new ones
2. **Fix chart image display** — IndexedDB load in ChartGrid (in progress)
3. **Adjustable row boundaries** — manual drag to correct uneven chart grids
4. **Row boundary detection** — Hough line transform on chart image; fallback to manual drag
5. **Repeat region marking** — touch gesture to bracket stitch repeat sections
6. **Tap-to-identify symbols** — vision AI on demand per cell tap; uses pattern key dictionary if available
7. **Pattern key parsing** — AI extracts symbol dictionary from pattern key text; populates symbol key (#11)

### Tier 5 / Future
- Voice control (#19) — high value, significant build effort; enables stitch position tracker (#15)
- Freehand drawing (#16) — low priority; stitch markers cover most cases
- Chart symbol color-coding (#18) — KC calls these Magic Markers; useful for colorwork
