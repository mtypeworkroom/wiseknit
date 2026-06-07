// ─────────────────────────────────────────────
// WiseKnit — Google Gemini Provider
// Free tier: 15 req/min, 1500 req/day
// Model: gemini-1.5-flash (best for vision/docs)
// ─────────────────────────────────────────────

import type { AIProvider, AIProviderName, ParsedChart } from './types'
import type { RowReminder } from '../types'

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const DEFAULT_MODEL = 'gemini-2.5-flash'

const CHART_PARSE_PROMPT = `You are an expert knitting pattern reader. 
Analyze this knitting chart image and extract the chart data.

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
- X or cross = "cable" 

Flag any symbols you are not confident about with confident: false and add to flags array.
Return ONLY the JSON, no markdown, no explanation.`

const REMINDER_PROMPT = (chartJson: string) => `You are a knitting assistant.
Given this parsed knitting chart data, generate helpful row reminders for the knitter.
Focus on: cable rows, lace rows, increases, decreases, section changes, last rows.

Chart data:
${chartJson}

Return a JSON array of reminders:
[
  { "rowNumber": 4, "message": "Lace row — yo, ssk, k2tog", "type": "info" },
  { "rowNumber": 16, "message": "End of chart repeat", "type": "info" }
]

Return ONLY the JSON array, no markdown.`

export class GeminiProvider implements AIProvider {
  name: AIProviderName = 'gemini'
  displayName = 'Google Gemini'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  get isConfigured() {
    return !!this.apiKey
  }

  private async callAPI(model: string, body: object): Promise<any> {
    const url = `${GEMINI_API_URL}/${model}:generateContent?key=${this.apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message ?? `Gemini API error: ${res.status}`)
    }
    return res.json()
  }

  async parseChart(imageBase64: string, legendText?: string): Promise<ParsedChart> {
    const prompt = legendText
      ? `${CHART_PARSE_PROMPT}\n\nLegend text from pattern:\n${legendText}`
      : CHART_PARSE_PROMPT

    const data = await this.callAPI(DEFAULT_MODEL, {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/png', data: imageBase64 } },
        ]
      }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 4096 },
    })

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as ParsedChart
  }

  async generateReminders(chart: ParsedChart): Promise<RowReminder[]> {
    const data = await this.callAPI(DEFAULT_MODEL, {
      contents: [{
        parts: [{ text: REMINDER_PROMPT(JSON.stringify(chart, null, 2)) }]
      }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1024 },
    })

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '[]'
    const clean = text.replace(/```json|```/g, '').trim()
    return JSON.parse(clean) as RowReminder[]
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.callAPI(DEFAULT_MODEL, {
        contents: [{ parts: [{ text: 'Reply with just: ok' }] }],
        generationConfig: { maxOutputTokens: 10 },
      })
      return { success: true, message: 'Connected to Google Gemini successfully' }
    } catch (err: any) {
      return { success: false, message: err.message ?? 'Connection failed' }
    }
  }
}
