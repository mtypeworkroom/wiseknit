import { useState, useEffect } from 'react'
import type { Project } from '../../types'
import { selectLastSessionLabel } from '../../store/projectStore'
import { loadImage } from '../../store/imageStore'
import styles from './ProjectCard.module.css'

interface ProjectCardProps {
  project: Project
  onClick: () => void
  onArchive?: (id: string) => void
  onDelete?: (id: string) => void
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

export default function ProjectCard({ project, onClick, onArchive, onDelete }: ProjectCardProps) {
  const lastSession = selectLastSessionLabel(project)
  const [photoSrc, setPhotoSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!project.photoKey) { setPhotoSrc(null); return }
    loadImage(project.photoKey).then(src => setPhotoSrc(src ?? null))
  }, [project.photoKey])

  const stopAndCall = (e: React.MouseEvent, fn: () => void) => {
    e.stopPropagation()
    fn()
  }

  return (
    <div
      className={`${styles.card} ${project.status === 'active' ? styles.activeCard : ''}`}
      onClick={onClick}
    >
      {/* Photo + info row */}
      <div className={styles.cardRow}>
        <div className={styles.photoWrap}>
          {photoSrc
            ? <img src={photoSrc} alt={project.name} className={styles.photo} />
            : <div className={styles.photoPlaceholder}>
                <span className={styles.placeholderEmoji}>{STATUS_EMOJI[project.status] ?? '🧶'}</span>
              </div>
          }
        </div>

        <div className={styles.info}>
          <div className={styles.body}>
            <div className={styles.name}>{project.name}</div>
            <span className={`${styles.badge} ${styles[`badge_${project.status}`]}`}>
              {STATUS_LABEL[project.status]}
            </span>
            <div className={styles.sub}>{project.category ?? 'Project'}</div>
            {project.needle?.sizeMm && (
              <div className={styles.sub}>{project.needle.sizeMm}mm needles</div>
            )}
          </div>

          <div className={styles.stats}>
            <div className={styles.statItem}>
              <span className={styles.statLbl}>rows worked</span>
              <span className={styles.statVal}>{project.totalRowsWorked ?? 0}</span>
            </div>
            <div className={styles.statItem}>
              <span className={styles.statLbl}>last session</span>
              <span className={styles.statVal}>{lastSession}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action strip */}
      {(onArchive || onDelete) && (
        <div className={styles.actions} onClick={e => e.stopPropagation()}>
          {onArchive && (
            <button
              className={styles.archiveBtn}
              title={project.status === 'archived' ? 'Unarchive' : 'Archive'}
              onClick={e => stopAndCall(e, () => onArchive(project.id))}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              className={styles.deleteBtn}
              title="Delete"
              onClick={e => stopAndCall(e, () => onDelete(project.id))}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
