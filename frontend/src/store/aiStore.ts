// ─────────────────────────────────────────────
// WiseKnit — AI Settings Store
// Persists provider choice and API key
// ─────────────────────────────────────────────

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AIProviderName } from '../ai/types'
import { getAIProvider } from '../ai'
import type { AIProvider } from '../ai/types'

interface AIStore {
  provider: AIProviderName
  apiKey: string
  setProvider: (provider: AIProviderName) => void
  setApiKey: (key: string) => void
  getProvider: () => AIProvider | null
}

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      provider: 'huggingface',
      apiKey: '',

      setProvider: (provider) => set({ provider }),
      setApiKey: (apiKey) => set({ apiKey }),

      getProvider: () => {
        const { provider, apiKey } = get()
        if (!apiKey) return null
        return getAIProvider(provider, apiKey)
      },
    }),
    {
      name: 'wiseknit-ai',
    }
  )
)
