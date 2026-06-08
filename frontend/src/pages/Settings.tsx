import { useState } from 'react'
import TopBar from '../components/layout/TopBar'
import SettingsAI from './SettingsAI'
import { useThemeStore } from '../store/themeStore'
import { GearIcon, AppearanceIcon, BellIcon, DownloadIcon } from '../components/icons'
import styles from './Settings.module.css'

type SubPage = null | 'ai' | 'appearance' | 'notifications' | 'data'

const MENU_ITEMS = [
  {
    key: 'ai' as SubPage,
    label: 'AI Provider',
    sub: 'Gemini, Claude — configure your API key',
    icon: <GearIcon size={18} stroke="var(--accent)"/>,
    iconBg: 'var(--accent-lt)',
  },
  {
    key: 'appearance' as SubPage,
    label: 'Appearance',
    sub: 'Theme, chart size, font',
    icon: <AppearanceIcon size={18} stroke="var(--ink-mid)"/>,
    iconBg: 'var(--surface2)',
  },
  {
    key: 'notifications' as SubPage,
    label: 'Notifications',
    sub: 'Row reminders, cable alerts',
    icon: <BellIcon size={18} stroke="var(--warn)"/>,
    iconBg: 'var(--warn-lt)',
  },
  {
    key: 'data' as SubPage,
    label: 'Backup & Data',
    sub: 'Export, backup, reset',
    icon: <DownloadIcon size={18} stroke="var(--ink-mid)"/>,
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
  const { mode, setMode } = useThemeStore()

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
            <div className={styles.section}>
              <div className={styles.sectionTitle}>Theme</div>
              <div className="card">
                {(['light', 'dark', 'auto'] as const).map((opt, i, arr) => (
                  <div
                    key={opt}
                    className={`card-row ${styles.menuRow}`}
                    onClick={() => setMode(opt)}
                    style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
                  >
                    <div className={styles.rowLeft}>
                      <div className={styles.rowLabel}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</div>
                      <div className={styles.rowSub}>
                        {opt === 'light' ? 'Always light' : opt === 'dark' ? 'Always dark' : 'Follow system setting'}
                      </div>
                    </div>
                    {mode === opt && <span style={{ color: 'var(--accent)', fontSize: 18 }}>✓</span>}
                  </div>
                ))}
              </div>
            </div>
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
