import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useThemeStore } from './store/themeStore'

// Pages
import Dashboard from './pages/Dashboard'
import PatternImport from './pages/PatternImport'
import ActiveKnitting from './pages/ActiveKnitting'
import ProjectSetup from './pages/ProjectSetup'
import ProjectDetail from './pages/ProjectDetail'
import Patterns from './pages/Patterns'
import Stats from './pages/Stats'
import Settings from './pages/Settings'

// Layout
import BottomNav from './components/layout/BottomNav'

function App() {
  const { mode } = useThemeStore()

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement
    if (mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.dataset.theme = prefersDark ? 'dark' : 'light'
    } else {
      root.dataset.theme = mode
    }
  }, [mode])

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          {/* Default route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Main screens */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/import" element={<PatternImport />} />
          <Route path="/patterns" element={<Patterns />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/settings/*" element={<Settings />} />

          {/* Project screens */}
          <Route path="/project/new" element={<ProjectSetup />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/project/:id/knit" element={<ActiveKnitting />} />
        </Routes>

        {/* Bottom nav hidden on active knitting and setup screens */}
        <Routes>
          <Route path="/project/:id/knit" element={null} />
          <Route path="/project/new" element={null} />
          <Route path="*" element={<BottomNav />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
