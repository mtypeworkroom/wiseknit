# WiseKnit — Known Issues & Fixes Needed

## UI & Visual

### Project Detail - Header status badge
In light mode not enough constrast between the text and background.

### Select & Set UP Chart Page
But all the nudge buttons at the top, can we show more of the chart without scrolling.

When a chart is setup it need to be page added to the project, not a replacement of the PDR page. The PDF needs to stay as is, eventually we will need to have a page picker. 

Make it more obvious the the numbers in the gauge swatch boxes are examples (are we reading this from the pattern?)

If a file has already been uploaded and pages selected and we are in edit mode we need to skip the upload PDF step and go straight to the page picker.

When there are multiple charts, need a selector so the user can decide on which chart to start with.

### Project Detail - Pattern
We need place on the page to edit the chart, need to be able to re-select in case the set up need to be adjusted.

### Project Detail - Session History
Move Notes up and Session History to the bottom, or better yet make that a button or an expand out

### Project Detail - Guage and Yarn
Need to implement the Add button and change that text to Edit if those details were already entered.
---

## Project Setup — Needle Size Selector

Current selector is missing small needle sizes and does not show US/mm pairing.

**Required changes:**
- Add missing small sizes: 0000, 000, 00, 0, and 1 (US)
- Display both US size name and mm equivalent together for every size
- Suggested format: `US 0 (2.0mm)`, `US 1 (2.25mm)`, `US 2 (2.75mm)` etc.

**Complete US needle size reference:**
| US Size | mm    |
|---------|-------|
| 0000    | 1.25  |
| 000     | 1.5   |
| 00      | 1.75  |
| 0       | 2.0   |
| 1       | 2.25  |
| 2       | 2.75  |
| 3       | 3.25  |
| 4       | 3.5   |
| 5       | 3.75  |
| 6       | 4.0   |
| 7       | 4.5   |
| 8       | 5.0   |
| 9       | 5.5   |
| 10      | 6.0   |
| 10.5    | 6.5   |
| 11      | 8.0   |
| 13      | 9.0   |
| 15      | 10.0  |
| 17      | 12.0  |
| 19      | 15.0  |
| 35      | 19.0  |
| 50      | 25.0  |

---

### Active Knitting — RS/WS vs Worked in the Round
The bottom bar shows RS/WS based on row parity. Charts knitted in the round have no WS rows — every row is a right-side round. Currently `workedInRound` exists on `ProjectChart` but there is no UI in Project Setup to set it.

**Required work:**
- Add a "Worked in the round / flat" toggle to the chart setup step in Project Setup
- Wire the toggle to `workedInRound` on `ProjectChart`
- The bottom bar already reads `chart.workedInRound` and will show "Rnd" once it is set correctly

---

### Active Knitting — Per-Row Instructions
The instruction slot in the bottom bar currently shows a computed RS/WS/Rnd indicator and stitch count.
The full feature requires per-row instruction text to be stored and displayed.

**Required work:**
- Add a `rowNotes: Record<number, string>` (or similar) field to `ProjectChart`
- Add UI during setup (or inline while knitting) to enter per-row notes
- Display the note for the current row in the instruction slot
- Fall back to RS/WS/Rnd + stitch count when no note exists for a row

---

**Required work:**
- `totalRowsWorked` should only increment when the user advances to a row they have not reached before (i.e. `currentRow > highWaterMark`)
- Store a `maxRowReached` (or use `totalRowsWorked` as the high-water mark) and only increment when a new furthest row is hit
- Going back should not change `totalRowsWorked`
- Project Detail display should match what the knitting screen shows

---

## Wiring & Functionality

### Dashboard card, add a smae archive and delete button on the card.

### Project Photo — Selected Image Not Wired Up
The image selection UI exists but the selected photo is not being saved or
displayed correctly. Needs to be wired into the project store and displayed
on the Project Detail page and Dashboard card.

### Edit Project — Not Wired Up
Edit button on Project Detail page needs to be connected to an edit flow.
Should pre-populate the setup wizard (or a simplified edit form) with existing
project data and save changes back to the store.

### Archive Project — Not Wired Up
Archive action needs to update project status in the store and remove the
project from the active projects list, placing it in an archived view.

### Delete Project — Not Wired Up
Delete action needs to remove the project from the store, delete associated
chart images from IndexedDB, and return the user to the Dashboard.
Should include a confirmation dialog before executing.
