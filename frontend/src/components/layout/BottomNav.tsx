import { useNavigate, useLocation } from 'react-router-dom'
import { GridIcon, BarChartIcon, NavGearIcon } from '../icons'
import styles from './BottomNav.module.css'

const NAV_ITEMS = [
  {
    label: 'Projects',
    path: '/dashboard',
    icon: <GridIcon/>,
  },

  {
    label: 'Stats',
    path: '/stats',
    icon: <BarChartIcon/>,
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: <NavGearIcon/>,
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <button
              key={item.path}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className={styles.icon}>{item.icon}</span>
              <span className={styles.label}>{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
