import type { SVGProps } from 'react'

type IconProps = { size?: number } & SVGProps<SVGSVGElement>

// ─── WiseKnit Owl ─────────────────────────────────────────────────────────────

export function OwlIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="-1 -1 26 26" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <defs>
        <pattern id="owlBodyFill" patternUnits="userSpaceOnUse" width="2.5" height="1.25">
          <rect width="2.5" height="1.25" fill="#0f2d4a"/>
          <path fill="#5de8ff" stroke="none" d="M 1.25,1.25 C 1.25,0.5 1.75,0 2.5,0 2.5,0.75 2,1.25 1.25,1.25 Z M 0,0 C 0,0.75 0.5,1.25 1.25,1.25 1.25,0.5 0.75,0 0,0 Z"/>
        </pattern>
      </defs>
      <g transform="translate(-0.5529225,0.22473291)">
        <path d="M 12.553,22.680802 l -9.177242,0.052530 c -1,0 -1.0008083,-2.012848 -0.8444445,-5.416162 C 2.3917308,11.835411 6.5238675,9.4432116 5.8191919,8.8636363 4.2544323,7.3113232 6.3385532,2.9113353 7.2121212,0.81717172 L 12.553,3.1909091 L 17.893724,0.81717172 C 18.767292,2.9113353 20.851413,7.3113232 19.286653,8.8636363 C 18.581978,9.4432116 22.714114,11.835411 22.574532,17.317170 C 22.730895,20.720484 22.730087,22.733332 21.730087,22.733332 Z" fill="url(#owlBodyFill)" stroke="#e8c84a" strokeWidth="1.8"/>
        <path d="M 3.375758,22.733332 c -1,0 -1.0008083,-2.012848 -0.8444445,-5.416162 C 2.3917308,11.835411 6.5238675,9.4432116 5.8191919,8.8636363 L 6.1252529,9.2666663 C 9.3558103,13.436729 7.3716825,20.650587 3.5747478,22.626262 Z" fill="#e8c84a"/>
        <path d="M 21.730087,22.733332 C 22.730087,22.733332 22.730895,20.720484 22.574532,17.317170 C 22.714114,11.835411 18.581978,9.4432116 19.286653,8.8636363 L 18.980591,9.2666663 C 15.750034,13.436729 17.734162,20.650587 21.531096,22.626262 Z" fill="#e8c84a"/>
        <path d="M 6.1252529,9.2666663 C 9.3558103,13.436729 7.3716825,20.650587 3.5747478,22.626262" stroke="#e8c84a" strokeWidth="1.8"/>
        <path d="M 18.980591,9.2666663 C 15.750034,13.436729 17.734162,20.650587 21.531096,22.626262" stroke="#e8c84a" strokeWidth="1.8"/>
      </g>
    </svg>
  )
}

// ─── Chart Grid ──────────────────────────────────────────────────────────────

export function ChartGridIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M3 9h18" />
      <path d="M12 9v12" />
    </svg>
  )
}

// ─── Section Marker (solid bookmark) ─────────────────────────────────────────

export function SectionMarkerIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={Math.round(size * 2 / 3)} height={size} viewBox="0 0 16 24" fill="currentColor" stroke="white" strokeWidth="1.5" strokeLinejoin="round" {...props}>
      <path d="M14 0H2C.9 0 0 .9 0 2v22l8-3.5 8 3.5V2C16 .9 15.1 0 14 0Z"/>
    </svg>
  )
}

// ─── Stitch Marker / Reading Position ────────────────────────────────────────

export function StitchMarkerIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 22a5 5 0 0 0 5-5c0-2-2-4-3-6V4a2 2 0 0 0-4 0v7c-1 2-3 4-3 6a5 5 0 0 0 5 5z" />
      <line x1="10" y1="4" x2="14" y2="4" />
    </svg>
  )
}

// ─── Knitting Needles ─────────────────────────────────────────────────────────

export function KnittingNeedlesIcon({ size = 24, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      {/* Needle 2 — under: split at crossing (≈12,12) so needle 1 reads as over */}
      <circle cx="20.5" cy="3.5" r="2" fill="currentColor" stroke="none" />
      <line x1="18.8" y1="5.2" x2="13.4" y2="10.6" />
      <line x1="10.6" y1="13.4" x2="3" y2="21" />
      {/* Needle 1 — over */}
      <circle cx="3.5" cy="3.5" r="2" fill="currentColor" stroke="none" />
      <line x1="5.2" y1="5.2" x2="21" y2="21" />
    </svg>
  )
}

// ─── Bookmark / Tag ──────────────────────────────────────────────────────────

export function BookmarkIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

// ─── Book / Read ─────────────────────────────────────────────────────────────

export function BookOpenIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  )
}

// ─── Pencil / Edit ───────────────────────────────────────────────────────────

export function PencilIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}

// ─── Play / Resume ───────────────────────────────────────────────────────────

export function PlayIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M4.5 2.5v11l9-5.5-9-5.5z"/>
    </svg>
  )
}

// ─── Navigation chevrons (Heroicons micro solid) ─────────────────────────────

export function ChevronLeftIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 0 1 0 1.06L6.56 8.5l3.22 3.22a.75.75 0 1 1-1.06 1.06l-3.75-3.75a.75.75 0 0 1 0-1.06l3.75-3.75a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
    </svg>
  )
}

export function ChevronRightIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 0 1 1.06 0l3.75 3.75a.75.75 0 0 1 0 1.06l-3.75 3.75a.75.75 0 1 1-1.06-1.06L9.44 8.5 6.22 5.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
    </svg>
  )
}

// ─── Solid-fill action icons ──────────────────────────────────────────────────

export function TrashIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <rect x="9" y="1" width="6" height="3" rx="1"/>
      <rect x="2" y="5" width="20" height="3.5" rx="0.5"/>
      <path d="M5 10l1 12h12l1-12z"/>
    </svg>
  )
}

export function ArchiveIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" {...props}>
      <rect x="1" y="4" width="22" height="4" rx="1"/>
      <rect x="3" y="9.5" width="18" height="12" rx="1"/>
    </svg>
  )
}

// ─── Stroke icons ─────────────────────────────────────────────────────────────

export function FileIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="9" y1="13" x2="15" y2="13"/>
      <line x1="9" y1="17" x2="12" y2="17"/>
    </svg>
  )
}

export function FileCheckIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

export function ImageIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21 15 16 10 5 21"/>
    </svg>
  )
}

export function PlusIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

export function MinusIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}

export function UploadIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

export function CropIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15" />
      <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15" />
    </svg>
  )
}

export function SaveIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" {...props}>
      <path d="M2 1h8.5L13 3.5V13a1 1 0 01-1 1H3a1 1 0 01-1-1V2a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
      <rect x="4.5" y="1" width="4" height="3.5" rx="0.4" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="3" y="8" width="9" height="5.5" rx="0.4" stroke="currentColor" strokeWidth="1.2"/>
    </svg>
  )
}

export function GearIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
    </svg>
  )
}

export function InfoIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  )
}

export function AppearanceIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 2a10 10 0 0 1 0 20c-2.76 0-5-2.24-5-5 0-1.66.88-3 2-4l3-3"/>
    </svg>
  )
}

export function BellIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  )
}

export function DownloadIcon({ size, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="8 17 12 21 16 17"/>
      <line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
    </svg>
  )
}

// ─── Navigation icons (no default size — CSS controls dimensions) ─────────────

export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1"/>
      <rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/>
      <rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

export function BarChartIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

export function NavGearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

// ─── Specialty icons (fixed colors / context-specific) ───────────────────────

export function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#3CCFEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2"/>
      <path d="M9 22h6"/>
      <path d="M12 17v.01"/>
    </svg>
  )
}

export function RotateArrowIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#3CCFEF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9 3H5a2 2 0 0 0-2 2v4m0 6v4a2 2 0 0 0 2 2h4"/>
      <path d="M21 12V7a2 2 0 0 0-2-2h-4"/>
      <path d="m3 16 4 4 4-4"/>
    </svg>
  )
}

// ─── Knitting stitch symbols ──────────────────────────────────────────────────

export function PurlIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" width="14" height="14" {...props}>
      <circle cx="18" cy="18" r="5" fill="currentColor"/>
    </svg>
  )
}

export function YarnOverIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" width="20" height="20" {...props}>
      <circle cx="18" cy="18" r="7" fill="none" stroke="currentColor" strokeWidth="2"/>
    </svg>
  )
}

export function K2togIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28" {...props}>
      <line x1="6" y1="30" x2="30" y2="6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  )
}

export function SskIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 36 36" width="28" height="28" {...props}>
      <line x1="6" y1="6" x2="30" y2="30" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    </svg>
  )
}

export function RowMarkerIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 10 14" width="8" height="12" {...props}>
      <polygon points="0,0 10,7 0,14" fill="#1A6A8A"/>
    </svg>
  )
}

export function ClockIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" {...props}>
      <circle cx="8" cy="8" r="6" />
      <path d="M8 5 L8 8 L10.5 9.5" />
    </svg>
  )
}

export function BracketIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...props}>
      <path d="M5 2 L2 2 L2 5" />
      <path d="M11 2 L14 2 L14 5" />
      <path d="M2 11 L2 14 L5 14" />
      <path d="M14 11 L14 14 L11 14" />
    </svg>
  )
}

export function StepsIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="4,20 4,16 8,16 8,12 12,12 12,8 16,8 16,4 20,4" />
    </svg>
  )
}

export function HashIcon({ size = 16, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  )
}

export function RepeatIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 6.35 6.35" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <marker id="repeatArrow" refX="0" refY="0" orient="auto-start-reverse"
          markerWidth="0.75" markerHeight="0.75" viewBox="0 0 1 1"
          preserveAspectRatio="xMidYMid" overflow="visible">
          <path transform="scale(0.7)" fillRule="evenodd" fill="context-stroke"
            d="m -0.21114562,-4.1055728 6.42229122,3.21114561 a 1,1 90 0 1 0,1.78885438 L -0.21114562,4.1055728 A 1.236068,1.236068 31.717474 0 1 -2,3 v -6 a 1.236068,1.236068 148.28253 0 1 1.78885438,-1.1055728 z"/>
        </marker>
      </defs>
      <g opacity="0.6">
        <path fill="none" stroke="currentColor" strokeWidth={0.52} strokeLinecap="round" strokeLinejoin="round"
          markerEnd="url(#repeatArrow)"
          d="M 0.72464562,2.9243598 0.71061364,1.7784555 C 0.70573998,1.3804533 1.0310505,1.059986 1.4290825,1.059986 h 3.1034717"/>
        <path fill="none" stroke="currentColor" strokeWidth={0.52} strokeLinecap="round" strokeLinejoin="round"
          markerEnd="url(#repeatArrow)"
          d="m 5.6253527,3.3563935 0.014032,1.1459036 c 0.00487,0.3980019 -0.3204365,0.718469 -0.7184683,0.718469 H 1.8174467"/>
      </g>
    </svg>
  )
}

export function CalculatorIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.2"/>
      <rect x="3.5" y="2.5" width="9" height="2.5" rx="0.5" fill="currentColor" opacity="0.25"/>
      <circle cx="6" cy="9" r="1.1" fill="currentColor"/>
      <circle cx="10" cy="9" r="1.1" fill="currentColor"/>
      <circle cx="6" cy="12.5" r="1.1" fill="currentColor"/>
      <circle cx="10" cy="12.5" r="1.1" fill="currentColor"/>
    </svg>
  )
}
