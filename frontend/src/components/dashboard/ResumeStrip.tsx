import type { Project } from '../../types'
import { selectLastSessionLabel } from '../../store/projectStore'
import styles from './ResumeStrip.module.css'

interface ResumeStripProps {
  project: Project
  onResume: () => void
}

export default function ResumeStrip({ project, onResume }: ResumeStripProps) {
  const isNew = project.currentRow === 0
  const lastSession = selectLastSessionLabel(project)

  return (
    <div className={styles.strip}>
      <div className={styles.left}>
        <div className={styles.name}>{project.name}</div>
        <div className={styles.detail}>
          {isNew ? 'Not started yet' : `Last worked ${lastSession}`}
        </div>
      </div>
      <button className={styles.btn} onClick={onResume} aria-label={isNew ? 'Begin' : 'Resume'}>
        →
      </button>
    </div>
  )
}
