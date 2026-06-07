import type { Project } from '../../types'
import {
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
  waiting: 'Draft',
  completed: 'Done',
  archived: 'Archived',
}

export default function ProjectCard({ project, onClick }: ProjectCardProps) {
  const lastSession = selectLastSessionLabel(project)

  return (
    <div
      className={`${styles.card} ${project.status === 'active' ? styles.activeCard : ''}`}
      onClick={onClick}
    >
      <div className={styles.body}>
        <div className={styles.top}>
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

        {/* Photo or placeholder below text — full width */}
        <div className={styles.photoWrap}>
          {(project as any).photo
            ? <img src={(project as any).photo} alt={project.name} className={styles.photo} />
            : <div className={styles.photoPlaceholder}>
                <span className={styles.placeholderEmoji}>{STATUS_EMOJI[project.status] ?? '🧶'}</span>
                <span className={styles.placeholderText}>No photo yet</span>
              </div>
          }
        </div>


      </div>

      <div className={styles.stats}>
        <span className={styles.statInline}>
          <span className={styles.statVal}>{project.totalRowsWorked ?? 0}</span>
          <span className={styles.statLbl}>rows worked</span>
        </span>
        <span className={styles.statDot}>·</span>
        <span className={styles.statInline}>
          <span className={styles.statLbl}>last session</span>
          <span className={styles.statVal}>{lastSession}</span>
        </span>
      </div>
    </div>
  )
}
