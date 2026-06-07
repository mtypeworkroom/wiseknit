// ─────────────────────────────────────────────
// WiseKnit — Backend API Client
// All AI calls go through FastAPI backend
// ─────────────────────────────────────────────

import type { AIProviderName, ParsedChart } from './types'

const BACKEND_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function testConnectionViaBackend(
  provider: AIProviderName,
  apiKey: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BACKEND_URL}/ai/test-connection`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, api_key: apiKey }),
  })
  if (!res.ok) throw new Error(`Backend error: ${res.status}`)
  return res.json()
}

export async function parseChartViaBackend(
  provider: AIProviderName,
  apiKey: string,
  imageBase64: string,
  legendText?: string,
): Promise<ParsedChart> {
  const res = await fetch(`${BACKEND_URL}/ai/parse-chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      api_key: apiKey,
      image_base64: imageBase64,
      legend_text: legendText,
    }),
  })
  if (!res.ok) throw new Error(`Backend error: ${res.status}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error ?? 'Chart parsing failed')
  return data.chart
}
