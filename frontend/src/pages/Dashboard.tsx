import { useNavigate } from 'react-router-dom'
import TopBar from '../components/layout/TopBar'
import ResumeStrip from '../components/dashboard/ResumeStrip'
import ProjectCard from '../components/dashboard/ProjectCard'
import {
  useProjectStore,
  selectActiveProjects,
} from '../store/projectStore'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const navigate = useNavigate()
  const { projects } = useProjectStore()
  const activeProjects = selectActiveProjects(projects)

  return (
    <>
      <TopBar showBrand />

      <div className="page-scroll">

        {/* Resume strips — one per active project */}
        <div className={styles.resumeStrips}>
          <div className={styles.stripsLabel}>Continue knitting</div>
          {activeProjects.map((project) => (
            <ResumeStrip
              key={project.id}
              project={project}
              onResume={() => navigate(`/project/${project.id}/knit`)}
            />
          ))}
        </div>

        {/* Project grid */}
        <div className={styles.projectsWrap}>
          <div className={styles.sectionHeader}>
            <span className="section-label">All Projects</span>
            <button className={styles.sortBtn}>Sort ↕</button>
          </div>

          <div className={styles.projectGrid}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => navigate(`/project/${project.id}`)}
              />
            ))}
          </div>
        </div>

      </div>

      {/* FAB — new project */}
      <button
        className={styles.fab}
        onClick={() => navigate('/project/new')}
        aria-label="New project"
      >
        +
      </button>
    </>
  )
}
