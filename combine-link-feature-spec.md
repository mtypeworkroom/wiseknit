# Feature: Combine & Link Charts

## Background
KnitCompanion's existing "Join" feature only reunites two halves of the *same*
chart split across pages (same row numbering, purely spatial). This feature is
different: it lets users take *separate, independently-tracked pieces* they've
already set up (each with its own row count, stitch count, and repeat length)
and either merge them into one new chart, or link them with a shared counter.

## Entry Point
- New "Combine" button, available wherever a user views their list of
  tracked pieces ("chips") for a project.

## Combine Canvas
- Opens a new screen showing all existing piece chips as simple text
  placeholders (name + dimensions, e.g. "Lace Panel A — 4 rows x 12 sts").
- User drags chips to express **relative position only**:
  - Left / right of each other (horizontal adjacency)
  - Above / below each other (vertical adjacency)
- No manual alignment, scaling, or cropping by the user — this is purely a
  relationship graph (which chip is next to which, in which direction).
- Backend uses each chip's existing row/stitch/repeat metadata to resolve
  the graph into an actual combined grid.

## Backend Combine Logic
- **Horizontal adjacency (different repeat lengths):** compute LCM of the
  repeat lengths of adjacent pieces. Tile each piece's pattern to fill the
  LCM row count, then place side by side.
  - Cap combined LCM at **120 rows**. If exceeded, reject the combine for
    that grouping and suggest Linked Pages instead.
  - Cap applies to the *overall* LCM across all pieces in a combine group,
    not just pairwise (e.g. three pieces with repeats 5/7/9 → LCM 315 →
    rejected).
- **Vertical adjacency:** stack pieces in row sequence. Needs an alignment
  rule for mismatched stitch widths (left/center/right anchor — likely the
  one small bit of user input needed here).
- **Text-only pieces:** align by row-number mapping rather than visual
  scaling — tag each written row with its row number and render in a
  parallel track next to the adjacent chart.
- **Output:** a new **derived piece** — its own chart, row count, stitch
  count, and One-Tap marker/counter. Original source pieces remain intact
  and independently editable (Magic Markers, etc. still work on them).
- Combine is **single-level only** — no nesting derived pieces into further
  combines (not needed since LCM tiling already handles the repeat math).

## Linked Pages (alternative/fallback)
- User can link multiple existing pieces so they can **swipe between them**
  in the knitting view, rather than merging into one chart.
- All linked pieces share a single **absolute row counter**.
- Each linked chart displays its own row as:
  `display_row = ((absolute_row - 1) mod piece_repeat_length) + 1`
- One-Tap marker increments the shared absolute counter regardless of which
  linked chart is currently visible.
- Optional UI indicator: "rows until realignment" — when all linked pieces
  return to row 1 simultaneously (i.e. multiples of the LCM of their
  repeats).
- Used when: combine isn't possible (LCM > 120), pieces are too wide to
  usefully merge on screen, or the user simply prefers separate views.

## User Choice
- Combine vs. Linked Pages is a **user preference**, not strictly
  hierarchical — available as two options for the same grouping of pieces
  whenever both are mathematically possible.

## Open Questions for Implementation
- Alignment rule UI for vertically-stacked pieces with mismatched widths
  (left/center/right anchor — minimal user input).
- Whether combine groupings can be edited/re-run after creation (e.g. user
  adds a 4th piece to an existing combine).
- Data model: derived pieces need a reference back to source piece IDs +
  the relationship graph used to generate them, so combines can be
  regenerated if a source piece's setup changes.
