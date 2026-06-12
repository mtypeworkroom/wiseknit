# WiseKnit — Project Context for Claude Code

## Product Overview
WiseKnit is an AI-assisted knitting companion PWA by MType Workroom, positioned as a modern, fully-featured alternative to KnitCompanion. Brand colors: dark navy `#0D1B2A`, teal accent `#3CCFEF`, gold `#E8C84A`.

## Business Model (decided)
- **Subscription only, no free tier** — but full features for every subscriber, no paid tiers/feature gating
- Target price point around **$5/month**, month-to-month, no long-term commitment
- **Persistent data for lapsed subscribers** — when someone cancels, their projects/data remain saved (storage cost is negligible) so sporadic knitters can resubscribe and pick up exactly where they left off. This is a deliberate differentiator from KnitCompanion's per-device subscription friction.
- **AI features are Bring-Your-Own-Key (BYOK)** — users connect their own HuggingFace/Gemini/Claude API key. AI features are *visible but locked* until a key is connected, so users know what they're missing without it being a paywall.
- AI is purely a **convenience layer on top of full manual functionality** — every AI-assisted feature must have a working manual-setup equivalent first. AI later auto-populates the same data structures a user would fill in by hand.
- Architecture should keep data shapes **portable and AI-output-compatible** (flat objects, plain-language text fields) since AI population is just a "fill in this structure" step, not a schema change.

## Current Tech Stack
- Frontend: React + TypeScript + Vite (PWA), Zustand for state, CSS Modules
- Backend: FastAPI (Python 3.12), httpx, Pydantic v2
- PDF handling: pdfjs-dist, react-image-crop for chart cropping
- Chart images: stored in **IndexedDB** (keyed by chart ID) — NOT in localStorage, which has size limits that break with image data
- AI: HuggingFace router as default provider (model: `moonshotai/Kimi-K2.6:fireworks-ai`), Gemini and Claude also supported as alternatives
- Deployment (current dev): Vercel (frontend), local FastAPI (backend) — production backend not yet decided, but plan is Supabase (DB/Auth/Storage) + Render or Fly.io (FastAPI) + Vercel (frontend) + Stripe (billing) for cost-effective scaling

## Current Data Model
```typescript
interface Project {
  id, name, status, category
  currentRow, totalRows, totalRowsWorked, chartRepeatStartRow
  charts?: ProjectChart[]
  needle?, yarn?, gauge?, notes?, photo?
}

interface ProjectChart {
  id, name
  totalRows, totalStitches
  repeatStartRow, workedInRound
  symbols: ProjectChartSymbol[]
  notes?, flags: string[]
  imageBase64?: string  // IndexedDB key, not raw data
}
```

## Current File Structure (frontend)
```
frontend/src/
├── ai/                      — provider abstraction (HF/Gemini/Claude)
├── components/
│   ├── import/PDFPagePicker.tsx  — page selection + react-image-crop
│   ├── knitting/ChartGrid.tsx    — image-based chart display + row highlight
│   └── layout/                   — TopBar, BottomNav
├── data/pleione.ts          — sample project chart data
├── pages/
│   ├── Dashboard, ActiveKnitting, ProjectDetail
│   ├── ProjectSetup.tsx     — 5-step wizard (Basics → Yarn → Needles → Pattern → Review)
│   └── Settings, SettingsAI
├── store/
│   ├── projectStore.ts      — Zustand persist (localStorage)
│   ├── imageStore.ts         — IndexedDB helper for chart images
│   ├── aiStore.ts, themeStore.ts
└── types/index.ts
```

## NEXT FEATURE TO BUILD: Row Instruction System

**Goal:** Replace KnitCompanion's confusing "linked counters" abstraction with plain-language, position-based row instructions. This is the core value-add over a basic chart viewer and must work fully without AI.

### Concept
Users set up reusable instructions tied to specific rows. When the knitter's current row matches, the instruction text displays in a panel below the chart/pattern.

### Data Model
Each instruction needs:
- `startRow`: number — first row this applies to
- `repeatEvery?`: number — if set, repeats every N rows from startRow (omit for one-time instructions)
- `endRow?`: number — optional cap for repeating instructions
- `position`: `'start' | 'middle' | 'end'` — where in the row this instruction applies
- `text`: string — plain-language instruction (e.g., "place marker", "k2tog at each end")
- `chartId?`: string — if set, this is **chart-scoped** (fires based on this chart's own row, accounting for its repeat loop). If omitted, it's **project-scoped** (fires based on the project's master row)

### Master Row Concept (for joined/multiple charts)
- Introduce a project-level `masterRow` separate from each chart's internal `currentRow`
- Each chart tracks its own row independently (with its own repeat-loop logic, as currentRow/chartRepeatStartRow already do)
- Project-scoped instructions key off `masterRow`
- Chart-scoped instructions key off that chart's own current row (post-repeat-loop)
- When multiple charts are active/joined, the instruction panel aggregates triggered instructions from ALL active charts plus any project-scoped ones for the current masterRow
- Charts advancing independently is fine — masterRow is a shared reference point, not a forced sync mechanism
- Build masterRow in now even for single-chart projects, since it's the same mechanism needed for "garment-relative" instructions on a chart with a repeat loop (e.g., "row 40 overall: begin armhole" vs "every 4th row of the repeat: cable")

### UI Requirements
- A setup screen where users add/edit/delete instructions (likely accessed from Project Detail or during Pattern setup step)
- Each instruction entry: position selector (start/middle/end), row trigger (one-time row number, OR "every N rows starting at row X" with optional end), text field, optional chart selector if multiple charts exist
- On the Active Knitting screen, a text panel below/near the chart shows all instructions triggered for the current row(s), grouped/ordered by position (start → middle → end)
- Multiple instructions on the same row at the same position should stack (display all, not replace)

### Future AI Hook (do not build yet, but keep model compatible)
Eventually, AI will read pattern text and pre-populate this same instruction list for user review — this requires no schema changes if the data model above is followed, since AI output would just be an array of these same objects.
