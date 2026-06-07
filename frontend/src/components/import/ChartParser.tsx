import { useState } from 'react'
import styles from './ChartParser.module.css'
import type { PageSelection } from './PDFPagePicker'
import type { ParsedChart } from '../../ai/types'

interface ChartParserProps {
  file: File
  selections: PageSelection[]
  provider: string
  apiKey: string
  onComplete: (charts: ParsedChart[]) => void
  onSkip: () => void
}

interface ParseProgress {
  current: number
  total: number
  chartName: string
  status: 'parsing' | 'done' | 'error'
  error?: string
}

async function extractPageAsBase64(file: File, pageNumber: number): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale: 2.0 }) // higher res for AI parsing

  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, canvas: canvas, viewport }).promise

  // Return base64 without the data:image/png;base64, prefix
  return canvas.toDataURL('image/png').split(',')[1]
}

async function parseChartViaBackend(
  provider: string,
  apiKey: string,
  imageBase64: string,
  chartName?: string
): Promise<ParsedChart> {
  const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
  const res = await fetch(`${apiUrl}/ai/parse-chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider,
      api_key: apiKey,
      image_base64: imageBase64,
      legend_text: chartName ? `This chart is named: ${chartName}` : undefined,
    }),
  })
  if (!res.ok) throw new Error(`Backend error: ${res.status}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.error ?? 'Parse failed')
  return data.chart as ParsedChart
}

export default function ChartParser({ file, selections, provider, apiKey, onComplete, onSkip }: ChartParserProps) {
  const [progress, setProgress] = useState<ParseProgress | null>(null)
  const [results, setResults] = useState<ParsedChart[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)

  const chartSelections = selections.filter(s => s.role === 'chart')

  const startParsing = async () => {
    setStarted(true)
    const parsed: ParsedChart[] = []
    const errs: string[] = []

    for (let i = 0; i < chartSelections.length; i++) {
      const sel = chartSelections[i]
      const chartName = sel.chartName ?? `Chart ${i + 1}`

      setProgress({
        current: i + 1,
        total: chartSelections.length,
        chartName,
        status: 'parsing',
      })

      try {
        const imageBase64 = await extractPageAsBase64(file, sel.pageNumber)
        const chart = await parseChartViaBackend(provider, apiKey, imageBase64, chartName)
        // Override name with user's chosen name
        chart.name = chartName
        parsed.push(chart)
        setProgress(p => p ? { ...p, status: 'done' } : p)
      } catch (err: any) {
        errs.push(`${chartName}: ${err.message ?? 'Unknown error'}`)
        setProgress(p => p ? { ...p, status: 'error', error: err.message } : p)
        // Small pause so user can see the error
        await new Promise(r => setTimeout(r, 1500))
      }
    }

    setResults(parsed)
    setErrors(errs)
    setFinished(true)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {!started && (
          <>
            <div className={styles.title}>Parse Charts with AI</div>
            <div className={styles.sub}>
              WiseKnit will send each chart page to AI for analysis.
              This reads the symbols and builds interactive row-by-row instructions.
            </div>
            <div className={styles.chartList}>
              {chartSelections.map((s, i) => (
                <div key={i} className={styles.chartItem}>
                  <span className={styles.chartItemName}>{s.chartName ?? `Chart ${i + 1}`}</span>
                  <span className={styles.chartItemPage}>Page {s.pageNumber}</span>
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <button className={styles.skipBtn} onClick={onSkip}>Skip for now</button>
              <button className={styles.parseBtn} onClick={startParsing}>
                Parse {chartSelections.length} Chart{chartSelections.length !== 1 ? 's' : ''} →
              </button>
            </div>
          </>
        )}

        {started && !finished && progress && (
          <>
            <div className={styles.title}>Parsing Charts…</div>
            <div className={styles.progressWrap}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
              <div className={styles.progressLabel}>
                {progress.current} of {progress.total}
              </div>
            </div>
            <div className={`${styles.currentChart} ${progress.status === 'error' ? styles.errorChart : ''}`}>
              {progress.status === 'parsing' && (
                <>
                  <div className={styles.spinner} />
                  <span>Reading {progress.chartName}…</span>
                </>
              )}
              {progress.status === 'done' && (
                <span className={styles.doneIcon}>✓ {progress.chartName} parsed</span>
              )}
              {progress.status === 'error' && (
                <span className={styles.errorIcon}>✗ {progress.chartName} — {progress.error}</span>
              )}
            </div>
            <div className={styles.sub}>Please keep this screen open while parsing</div>
          </>
        )}

        {finished && (
          <>
            <div className={styles.title}>
              {errors.length === 0 ? '✓ Charts Parsed' : 'Parsing Complete'}
            </div>
            {results.length > 0 && (
              <div className={styles.chartList}>
                {results.map((c, i) => (
                  <div key={i} className={styles.chartItem}>
                    <span className={styles.chartItemName}>{c.name}</span>
                    <span className={styles.chartItemPage}>{c.totalRows} rows · {c.totalStitches} sts</span>
                  </div>
                ))}
              </div>
            )}
            {errors.length > 0 && (
              <div className={styles.errorList}>
                {errors.map((e, i) => <div key={i} className={styles.errorItem}>✗ {e}</div>)}
              </div>
            )}
            <div className={styles.actions}>
              <button className={styles.parseBtn} onClick={() => onComplete(results)}>
                {results.length > 0 ? 'Start Knitting →' : 'Continue Without Charts →'}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
