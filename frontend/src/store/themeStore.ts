import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  mode: 'light' | 'dark' | 'auto'
  setMode: (mode: 'light' | 'dark' | 'auto') => void
  toggle: () => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      mode: 'dark',
      setMode: (mode) => set({ mode }),
      toggle: () => {
        const current = get().mode
        set({ mode: current === 'dark' ? 'light' : 'dark' })
      },
    }),
    {
      name: 'wiseknit-theme',
    }
  )
)
