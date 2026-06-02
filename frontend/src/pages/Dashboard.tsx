// src/pages/Dashboard.tsx
import TopBar from '../components/layout/TopBar'

export default function Dashboard() {
  return (
    <>
      <TopBar title="WiseKnit" showBrand />
      <div className="page-scroll" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--ink-mid)', fontFamily: 'var(--font-mono)' }}>Dashboard — coming soon</p>
      </div>
    </>
  )
}
