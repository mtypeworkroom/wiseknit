import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import SettingsAI from './SettingsAI'
import styles from './Settings.module.css'

type SubPage = null | 'ai' | 'appearance' | 'notifications' | 'data'

const MENU_ITEMS = [
  {
    key: 'ai' as SubPage,
    label: 'AI Provider',
    sub: 'Gemini, Claude — configure your API key',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
      </svg>
    ),
    iconBg: 'var(--accent-lt)',
  },
  {
    key: 'appearance' as SubPage,
    label: 'Appearance',
    sub: 'Theme, chart size, font',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-mid)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 2a10 10 0 0 1 0 20c-2.76 0-5-2.24-5-5 0-1.66.88-3 2-4l3-3"/>
      </svg>
    ),
    iconBg: 'var(--surface2)',
  },
  {
    key: 'notifications' as SubPage,
    label: 'Notifications',
    sub: 'Row reminders, cable alerts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    iconBg: 'var(--warn-lt)',
  },
  {
    key: 'data' as SubPage,
    label: 'Backup & Data',
    sub: 'Export, backup, reset',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-mid)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="8 17 12 21 16 17"/>
        <line x1="12" y1="12" x2="12" y2="21"/>
        <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29"/>
      </svg>
    ),
    iconBg: 'var(--surface2)',
  },
]

const SUB_TITLES: Record<string, string> = {
  ai: 'AI Provider',
  appearance: 'Appearance',
  notifications: 'Notifications',
  data: 'Backup & Data',
}

export default function Settings() {
  const [subPage, setSubPage] = useState<SubPage>(null)

  const title = subPage ? SUB_TITLES[subPage] : 'Settings'

  return (
    <>
      <TopBar
        title={title}
        showBrand={!subPage}
        showBack={!!subPage}
        backLabel="← Settings"
      />

      <div className="page-scroll">

        {/* Main settings menu */}
        {!subPage && (
          <div className={styles.page}>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>Preferences</div>
              <div className="card">
                {MENU_ITEMS.map((item, i) => (
                  <div
                    key={item.key}
                    className={`card-row ${styles.menuRow}`}
                    onClick={() => setSubPage(item.key)}
                    style={{ borderBottom: i < MENU_ITEMS.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className={styles.rowIcon} style={{ background: item.iconBg }}>
                      {item.icon}
                    </div>
                    <div className={styles.rowLeft}>
                      <div className={styles.rowLabel}>{item.label}</div>
                      <div className={styles.rowSub}>{item.sub}</div>
                    </div>
                    <span className={styles.rowArrow}>›</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.sectionTitle}>About</div>
              <div className="card">
                <div className="card-row" style={{ borderBottom: 'none' }}>
                  <div className={styles.rowLeft}>
                    <div className={styles.rowLabel}>WiseKnit</div>
                    <div className={styles.rowSub}>v0.1.0 — MType Workroom</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* Sub pages */}
        {subPage === 'ai' && <SettingsAI />}
        {subPage === 'appearance' && (
          <div className={styles.page}>
            <div className={styles.comingSoon}>Appearance settings — coming soon</div>
          </div>
        )}
        {subPage === 'notifications' && (
          <div className={styles.page}>
            <div className={styles.comingSoon}>Notification settings — coming soon</div>
          </div>
        )}
        {subPage === 'data' && (
          <div className={styles.page}>
            <div className={styles.comingSoon}>Backup & data — coming soon</div>
          </div>
        )}

      </div>
    </>
  )
}
