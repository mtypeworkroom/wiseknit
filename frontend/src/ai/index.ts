// ─────────────────────────────────────────────
// WiseKnit — AI Provider Factory
// Returns the correct provider based on settings
// ─────────────────────────────────────────────

import { GeminiProvider } from './gemini'
import { ClaudeProvider } from './claude'
import { HuggingFaceProvider } from './huggingface'
import type { AIProvider, AIProviderName } from './types'

export function getAIProvider(
  providerName: AIProviderName,
  apiKey: string
): AIProvider {
  switch (providerName) {
    case 'gemini':
      return new GeminiProvider(apiKey)
    case 'claude':
      return new ClaudeProvider(apiKey)
    case 'huggingface':
      return new HuggingFaceProvider(apiKey)
    default:
      return new GeminiProvider(apiKey)
  }
}

export type { AIProvider, AIProviderName, ParsedChart, ParsedFlag, AIProviderConfig } from './types'
