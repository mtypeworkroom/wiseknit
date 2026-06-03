import type { Project } from '../../types'
import {
  selectProgressPct,
  selectLastSessionLabel,
} from '../../store/projectStore'
import styles from './ProjectCard.module.css'

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

const STATUS_EMOJI: Record<string, string> = {
  active: '🧶',
  paused: '⏸',
  waiting: '⏳',
  completed: '✓',
  archived: '📦',
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  paused: 'Paused',
  waiting: 'Waiting',
  completed: 'Done',
  archived: 'Archived',
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const pct = selectProgressPct(project)
  const lastSession = selectLastSessionLabel(project)
  const rowsLeft = project.totalRows - project.currentRow

  return (
    <div
      className={`${styles.card} ${project.status === 'active' ? styles.activeCard : ''}`}
      onClick={onClick}
    >
      <div className={styles.body}>
        <div className={styles.top}>
          <div className={styles.icon}>{STATUS_EMOJI[project.status] ?? '🧶'}</div>
          <div className={styles.meta}>
            <div className={styles.name}>{project.name}</div>
            <div className={styles.sub}>
              {project.category ?? 'Project'} · {project.needle?.sizeMm ?? '—'}mm
            </div>
          </div>
          <span className={`${styles.badge} ${styles[`badge_${project.status}`]}`}>
            {STATUS_LABEL[project.status]}
          </span>
        </div>

        <div className={styles.progress}>
          <div className={styles.progRow}>
            <span className={styles.progLabel}>
              {project.currentRow === 0 ? 'Not started' : `Row ${project.currentRow} of ${project.totalRows}`}
            </span>
            <span className={styles.progPct}>{pct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <div className={styles.statVal}>{rowsLeft}</div>
          <div className={styles.statLbl}>Rows left</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statVal}>{lastSession}</div>
          <div className={styles.statLbl}>Last session</div>
        </div>
      </div>
    </div>
  )
}
