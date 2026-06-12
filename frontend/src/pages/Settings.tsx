import { useState } from 'react'
import { useSettingsStore } from '../store/settingsStore'
import type { ReminderSound, ReminderChime } from '../types'
import { playChime } from '../utils/audio'
import TopBar from '../components/layout/TopBar'
import SettingsAI from './SettingsAI'
import { useThemeStore } from '../store/themeStore'
import { GearIcon, AppearanceIcon, BellIcon, DownloadIcon } from '../components/icons'
import mtypeLogo from '../assets/mtype_workroom_logo_circle_512.svg'
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
        backLabel="Settings"
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
                <div className={styles.aboutCard}>
                  <img src={mtypeLogo} alt="MType Workroom" className={styles.mtypeLogo} />
                  <div className={styles.rowLabel}>WiseKnit</div>
                  <div className={styles.rowSub}>v0.1.0 · by MType Workroom</div>
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
        {subPage === 'notifications' && <SettingsNotifications />}

        {subPage === 'data' && (
          <div className={styles.page}>
            <div className={styles.comingSoon}>Backup & data — coming soon</div>
          </div>
        )}

      </div>
    </>
  )
}

const SOUND_OPTIONS: { value: ReminderSound; label: string; sub: string }[] = [
  { value: 'chime+speak', label: 'Chime + speak', sub: 'Tone plays, then reminder text is read aloud' },
  { value: 'chime',       label: 'Chime only',    sub: 'Alert tone, no voice' },
  { value: 'speak',       label: 'Speak only',    sub: 'Reminder text read aloud, no tone' },
  { value: 'mute',        label: 'Mute',          sub: 'Visual reminder only, no sound' },
]

const CHIME_OPTIONS: { value: ReminderChime; label: string; sub: string }[] = [
  { value: 'descend', label: 'Descending', sub: 'Tone sweeps downward (default)' },
  { value: 'ascend',  label: 'Ascending',  sub: 'Tone sweeps upward' },
  { value: 'bell',    label: 'Bell',       sub: 'Sustained bell tone, slow decay' },
  { value: 'ping',    label: 'Ping',       sub: 'Short, crisp high note' },
  { value: 'double',  label: 'Double',     sub: 'Two quick notes in succession' },
]

function SettingsNotifications() {
  const { reminderSound, setReminderSound, reminderVoice, setReminderVoice, reminderChime, setReminderChime } = useSettingsStore()
  return (
    <div className={styles.page}>
      <div className={styles.settingGroup}>
        <div className={styles.settingGroupTitle}>Default reminder sound</div>
        <div className={styles.settingGroupSub}>Applied to all reminders unless overridden per reminder</div>
        {SOUND_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`${styles.soundOption} ${reminderSound === opt.value ? styles.soundOptionActive : ''}`}
            onClick={() => setReminderSound(opt.value)}
          >
            <div className={styles.soundOptionLabel}>{opt.label}</div>
            <div className={styles.soundOptionSub}>{opt.sub}</div>
          </button>
        ))}
      </div>
      <div className={styles.settingGroup}>
        <div className={styles.settingGroupTitle}>Chime tone</div>
        <div className={styles.settingGroupSub}>The tone played when a reminder fires</div>
        {CHIME_OPTIONS.map(opt => (
          <div key={opt.value} className={styles.chimeRow}>
            <button
              className={`${styles.soundOption} ${styles.chimeOption} ${reminderChime === opt.value ? styles.soundOptionActive : ''}`}
              onClick={() => setReminderChime(opt.value)}
            >
              <div className={styles.soundOptionLabel}>{opt.label}</div>
              <div className={styles.soundOptionSub}>{opt.sub}</div>
            </button>
            <button
              className={styles.chimePreview}
              onClick={() => playChime(opt.value)}
              title="Preview"
            >▶</button>
          </div>
        ))}
      </div>
      <div className={styles.settingGroup}>
        <div className={styles.settingGroupTitle}>Voice</div>
        <div className={styles.settingGroupSub}>Gender of the voice used when reading reminder text aloud</div>
        {(['female', 'male'] as const).map(v => (
          <button
            key={v}
            className={`${styles.soundOption} ${reminderVoice === v ? styles.soundOptionActive : ''}`}
            onClick={() => setReminderVoice(v)}
          >
            <div className={styles.soundOptionLabel}>{v.charAt(0).toUpperCase() + v.slice(1)}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
