// ─────────────────────────────────────────────
// WiseKnit — Hugging Face Inference Provider
// Free tier — no billing required
// Model: meta-llama/Llama-3.2-11B-Vision-Instruct
// ─────────────────────────────────────────────

import type { AIProvider, AIProviderName, ParsedChart } from './types'
import type { RowReminder } from '../types'

const HF_API_URL = 'https://api-inference.huggingface.co/models'
const VISION_MODEL = 'meta-llama/Llama-3.2-11B-Vision-Instruct'
const TEXT_MODEL = 'meta-llama/Llama-3.1-8B-Instruct'

const CHART_PARSE_PROMPT = `You are an expert knitting pattern reader.
Analyze this knitting chart image carefully and extract all chart data.

Return ONLY a JSON object with this exact structure, no other text:
{
  "name": "chart name if visible, otherwise Chart",
  "totalRows": <number>,
  "totalStitches": <number>,
  "rows": [
    {
      "rowNumber": 1,
      "isRS": true,
      "stitches": [
        { "col": 0, "symbol": " ", "stitch": "k" }
      ]
    }
  ],
  "symbols": [
    { "symbol": " ", "stitch": "k", "description": "RS: Knit / WS: Purl", "confident": true }
  ],
  "flags": []
}

Stitch mappings:
- Empty/blank square = k (knit)
- Filled dot • = p (purl)
- Circle O or o = yo (yarn over)
- Forward slash / = k2tog (right leaning decrease)
- Backslash \\ = ssk (left leaning decrease)

Flag uncertain symbols with confident: false.
Return ONLY valid JSON.`

export class HuggingFaceProvider implements AIProvider {
  name: AIProviderName = 'huggingface'
  displayName = 'Hugging Face'
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  get isConfigured() {
    return !!this.apiKey
  }

  private async callVision(imageBase64: string, prompt: string): Promise<string> {
    const res = await fetch(`${HF_API_URL}/${VISION_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          image: imageBase64,
          text: prompt,
        },
        parameters: {
          max_new_tokens: 4096,
          temperature: 0.1,
          return_full_text: false,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any)?.error ?? `Hugging Face API error: ${res.status}`)
    }

    const data = await res.json()
    // HF returns array of generated text
    if (Array.isArray(data)) {
      return data[0]?.generated_text ?? ''
    }
    return data?.generated_text ?? ''
  }

  private async callText(prompt: string): Promise<string> {
    const res = await fetch(`${HF_API_URL}/${TEXT_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 1024,
          temperature: 0.2,
          return_full_text: false,
        },
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as any)?.error ?? `Hugging Face API error: ${res.status}`)
    }

    const data = await res.json()
    if (Array.isArray(data)) return data[0]?.generated_text ?? ''
    return data?.generated_text ?? ''
  }

  async parseChart(imageBase64: string, legendText?: string): Promise<ParsedChart> {
    const prompt = legendText
      ? `${CHART_PARSE_PROMPT}\n\nLegend from pattern:\n${legendText}`
      : CHART_PARSE_PROMPT

    const text = await this.callVision(imageBase64, prompt)
    const clean = text.replace(/```json|```/g, '').trim()
    // Find JSON in response
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse chart data from response')
    return JSON.parse(jsonMatch[0]) as ParsedChart
  }

  async generateReminders(chart: ParsedChart): Promise<RowReminder[]> {
    const prompt = `You are a knitting assistant. Generate row reminders for this chart.
Chart has ${chart.totalRows} rows. Focus on lace rows, unusual stitches, section changes.
Return ONLY a JSON array like: [{"rowNumber": 4, "message": "Lace row", "type": "info"}]

Chart info: ${chart.totalRows} rows x ${chart.totalStitches} stitches`

    const text = await this.callText(prompt)
    const clean = text.replace(/```json|```/g, '').trim()
    const jsonMatch = clean.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    return JSON.parse(jsonMatch[0]) as RowReminder[]
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const res = await fetch(`${HF_API_URL}/${TEXT_MODEL}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: 'Reply with: ok',
          parameters: { max_new_tokens: 5, return_full_text: false },
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as any)?.error ?? `Error: ${res.status}`)
      }

      return { success: true, message: 'Connected to Hugging Face successfully' }
    } catch (err: any) {
      return { success: false, message: err.message ?? 'Connection failed' }
    }
  }
}
