# WiseKnit — Known Issues & Fixes Needed

## UI & Visual
### Select & Set Up - Guage
Make it more obvious the the numbers in the gauge swatch boxes are examples (are we reading this from the pattern?)


### Select & Set Up Chart Page - Page Picker
When there are multiple charts, need a selector so the user can decide on which chart to start with.

### Project Detail - Session History
Move Notes up and Session History to the bottom, or better yet make that a button or an expand out
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

### Active Knitting - Chart
Need to add Zoom feature on the chart.

### Active Knitting - Text
Need to add options for text only instructions wihtout a chart.


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
