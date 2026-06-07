import { useThemeStore } from '../../store/themeStore'
import { useNavigate } from 'react-router-dom'
import logo from '../../assets/mtype_workroom_logo.svg'
import styles from './TopBar.module.css'

interface TopBarProps {
  title?: string
  showBrand?: boolean
  showBack?: boolean
  backLabel?: string
  backTo?: string
  rightContent?: React.ReactNode
}

export default function TopBar({
  title = 'WiseKnit',
  showBrand = false,
  showBack = false,
  backLabel = '← Back',
  backTo,
  rightContent,
}: TopBarProps) {
  const { toggle } = useThemeStore()
  const navigate = useNavigate()

  const handleBack = () => {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <div className={styles.topbar}>
      <div className={styles.topbarInner}>
        {showBack && (
          <button className={styles.backBtn} onClick={handleBack}>
            {backLabel}
          </button>
        )}

        {showBrand ? (
          <div className={styles.brandWrap}>
            <img src={logo} alt="MType Workroom" className={styles.logo} />
            <span className={styles.brandText}>{title}</span>
          </div>
        ) : (
          <span className={styles.title}>{title}</span>
        )}

        <div className={styles.right}>
          {rightContent}
          <button className={styles.themeToggle} onClick={toggle} aria-label="Toggle theme" />
        </div>
      </div>
    </div>
  )
}
