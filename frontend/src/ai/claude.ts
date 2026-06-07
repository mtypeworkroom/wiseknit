// ─────────────────────────────────────────────
// WiseKnit — Anthropic Claude Provider
// BYOK — user provides their own API key
// Model: claude-opus-4-6 (best vision/reasoning)
// ─────────────────────────────────────────────

import type { AIProvider, AIProviderName, ParsedChart } from './types'
import type { RowReminder } from '../types'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-opus-4-6'

const CHART_PARSE_PROMPT = `You are an expert knitting pattern reader.
Analyze this knitting chart image and extract the chart data precisely.

Return a JSON object with this exact structure:
{
  "name": "chart name if visible, otherwise 'Chart'",
  "totalRows": number,
  "totalStitches": number,
  "rows": [
    {
      "rowNumber": 1,
      "isRS": true,
      "stitches": [
        { "col": 0, "symbol": "•", "stitch": "p" }
      ]
    }
  ],
  "symbols": [
    { "symbol": "•", "stitch": "p", "description": "RS: Purl / WS: Knit", "confident": true }
  ],
  "flags": []
}

Standard stitch mappings:
- Empty/blank square = "k" (knit)
- Filled dot/bullet • = "p" (purl)
- O or circle = "yo" (yarn over)
- Forward slash / = "k2tog" (right leaning decrease)
- Backslash \\ = "ssk" (left leaning decrease)

Flag any uncertain symbols with confident: false and add to flags array with possible options.
Return ONLY valid JSON, no markdown, no explanation.`

const REMINDER_PROMPT = (chartJson: string) => `You are a knitting assistant.
Given this knitting chart data, generate helpful row reminders.
Focus on: lace rows, cable rows, increases, decreases, section changes, pattern repeats.

Chart:
${chartJson}

Return a JSON array:
[
  { "rowNumber": 4, "message": "Lace row — yo, ssk, k2tog", "type": "info" }
]

Return ONLY the JSON array.`

export class ClaudeProvider implements AIProvider {
  name: AIProviderName = 'claude'
  displayName = 'Anthropic Claude'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  get isConfigured() {
    return !!this.apiKey
  }

  private async callAPI(body: object): Promise<any> {
    const res = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-allow-cors': 'true',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `Claude API error: ${res.status}`)
    }
    return res.json()
  }

  async parseChart(imageBase64: string, legendText?: string): Promise<ParsedChart> {
    const prompt = legendText
      ? `${CHART_PARSE_PROMPT}\n\nLegend from pattern:\n${legendText}`
      : CHART_PARSE_PROMPT

    const data = await this.callAPI({
      model: DEFAULT_MODEL,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 } },
        ]
      }]
    })

    const text = data.content?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as ParsedChart
  }

  async generateReminders(chart: ParsedChart): Promise<RowReminder[]> {
    const data = await this.callAPI({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: REMINDER_PROMPT(JSON.stringify(chart, null, 2))
      }]
    })

    const text = data.content?.[0]?.text ?? '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as RowReminder[]
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.callAPI({
        model: DEFAULT_MODEL,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Reply with just: ok' }]
      })
      return { success: true, message: 'Connected to Anthropic Claude successfully' }
    } catch (err: any) {
      return { success: false, message: err.message ?? 'Connection failed' }
    }
  }
}
