// ── AI Provider types ────────────────────────

export type AIProviderName = 'huggingface' | 'gemini' | 'claude'

export interface AIProviderConfig {
  name: AIProviderName
  label: string
  requiresKey: boolean
}

export interface AIProvider {
  name: AIProviderName
  testConnection: (apiKey: string) => Promise<{ success: boolean; message: string }>
  parseChart: (apiKey: string, imageBase64: string, legendText?: string) => Promise<ParsedChart>
}

// ── Parsed chart types ───────────────────────

export interface ParsedSymbol {
  symbol: string
  label: string
  description: string
  confident: boolean
}

export interface ParsedChart {
  name: string
  totalRows: number
  totalStitches: number
  repeatStartRow: number
  workedInRound: boolean
  symbols: ParsedSymbol[]
  notes?: string
  flags: string[]
  imageBase64?: string
}

// Keep for backward compat — no longer used for full stitch grid
export interface ParsedFlag {
  message: string
}
