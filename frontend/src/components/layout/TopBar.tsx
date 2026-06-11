import { useNavigate } from 'react-router-dom'
import logoDark from '../../assets/mtype_workroom_logo_circle_512.svg'
import logoLight from '../../assets/mtype_workroom_logo_circle_512_light.svg'
import { useThemeStore } from '../../store/themeStore'
import { ChevronLeftIcon } from '../icons'
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
  backLabel = 'Back',
  backTo,
  rightContent,
}: TopBarProps) {
  const navigate = useNavigate()
  const { mode } = useThemeStore()
  const isLight = mode === 'light' || (mode === 'auto' && !window.matchMedia('(prefers-color-scheme: dark)').matches)
  const logo = isLight ? logoLight : logoDark

  const handleBack = () => {
    if (backTo) navigate(backTo)
    else navigate(-1)
  }

  return (
    <div className={styles.topbar}>
      <div className={styles.topbarInner}>
        {showBack && (
          <button className={styles.backBtn} onClick={handleBack} aria-label={backLabel}>
            <ChevronLeftIcon size={16}/>
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

        {rightContent && (
          <div className={styles.right}>
            {rightContent}
          </div>
        )}
      </div>
    </div>
  )
}
