import type { Project } from '../../types'
import { selectProgressPct } from '../../store/projectStore'
import styles from './ResumeStrip.module.css'

interface ResumeStripProps {
  project: Project
  onResume: () => void
}

export default function ResumeStrip({ project, onResume }: ResumeStripProps) {
  const pct = selectProgressPct(project)
  const isNew = project.currentRow === 0

  return (
    <div className={styles.strip}>
      <div className={styles.left}>
        <div className={styles.name}>{project.name}</div>
        <div className={styles.progressRow}>
          <div className={styles.track}>
            <div className={styles.fill} style={{ width: `${pct}%` }} />
          </div>
          <span className={styles.pct}>{pct}%</span>
          <span className={styles.detail}>
            {isNew ? 'Not started' : `Row ${project.currentRow} of ${project.totalRows}`}
          </span>
        </div>
      </div>
      <button className={styles.btn} onClick={onResume}>
        {isNew ? 'Begin →' : 'Resume →'}
      </button>
    </div>
  )
}
