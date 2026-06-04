import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  mode: 'light' | 'dark' | 'auto'
  setMode: (mode: 'light' | 'dark' | 'auto') => void
  toggle: () => void
}

function applyTheme(mode: 'light' | 'dark' | 'auto') {
  const root = document.documentElement
  if (mode === 'auto') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.dataset.theme = prefersDark ? 'dark' : 'light'
  } else {
    root.dataset.theme = mode
  }
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'dark',

      setMode: (mode) => {
        applyTheme(mode)
        set({ mode })
      },

      toggle: () => {
        const current = get().mode
        const next = current === 'dark' ? 'light' : 'dark'
        applyTheme(next)
        set({ mode: next })
      },
    }),
    {
      name: 'wiseknit-theme',
      onRehydrateStorage: () => (state) => {
        // Apply theme immediately when store loads from localStorage
        if (state) applyTheme(state.mode)
      },
    }
  )
)
