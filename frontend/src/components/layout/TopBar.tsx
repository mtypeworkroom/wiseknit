import { useNavigate } from 'react-router-dom'
import { ChevronLeftIcon, OwlIcon } from '../icons'
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
            <div className={styles.owlPill}>
              <OwlIcon size={22} className={styles.owlIcon} />
            </div>
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
