import { useState } from 'react'
import { useAIStore } from '../store/aiStore'
import type { AIProviderName } from '../ai/types'
import styles from './SettingsAI.module.css'

const PROVIDERS: { name: AIProviderName; label: string; description: string; keyLabel: string; keyLink: string; free: boolean }[] = [
  {
    name: 'huggingface',
    label: 'Hugging Face',
    description: 'Free tier — open source models, no billing required. Uses Llama Vision for chart parsing.',
    keyLabel: 'Hugging Face Token',
    keyLink: 'https://huggingface.co/settings/tokens',
    free: true,
  },
  {
    name: 'gemini',
    label: 'Google Gemini',
    description: 'Good quality chart parsing. Requires Google account with billing enabled.',
    keyLabel: 'Gemini API Key',
    keyLink: 'https://aistudio.google.com/app/apikey',
    free: false,
  },
  {
    name: 'claude',
    label: 'Anthropic Claude',
    description: 'Best quality chart parsing. Requires an Anthropic account with billing.',
    keyLabel: 'Anthropic API Key',
    keyLink: 'https://console.anthropic.com/settings/keys',
    free: false,
  },
]

export default function SettingsAI() {
  const { provider, apiKey, setProvider, setApiKey } = useAIStore()
  const [keyInput, setKeyInput] = useState(apiKey)
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [saved, setSaved] = useState(false)

  const selectedProvider = PROVIDERS.find(p => p.name === provider) ?? PROVIDERS[0]

  const handleSave = () => {
    setApiKey(keyInput)
    setTestResult(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleTest = async () => {
    if (!keyInput) return
    setTesting(true)
    setTestResult(null)
    try {
      const { testConnectionViaBackend } = await import('../ai/backend')
      const result = await testConnectionViaBackend(provider, keyInput)
      setTestResult(result)
    } catch (err: any) {
      setTestResult({ success: false, message: err.message ?? 'Connection failed — is the backend running?' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className={styles.page}>

      {/* Provider selector */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>AI Provider</div>
        <div className={styles.providerList}>
          {PROVIDERS.map(p => (
            <div
              key={p.name}
              className={`${styles.providerCard} ${provider === p.name ? styles.providerSelected : ''}`}
              onClick={() => { setProvider(p.name); setTestResult(null) }}
            >
              <div className={styles.providerTop}>
                <div className={styles.providerName}>{p.label}</div>
                {p.free && <span className={styles.freeBadge}>Free</span>}
                {provider === p.name && <span className={styles.selectedTick}>✓</span>}
              </div>
              <div className={styles.providerDesc}>{p.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{selectedProvider.keyLabel}</div>
        <div className={styles.keyCard}>
          <div className={styles.keyInputRow}>
            <input
              className={styles.keyInput}
              type={showKey ? 'text' : 'password'}
              value={keyInput}
              onChange={e => { setKeyInput(e.target.value); setTestResult(null); setSaved(false) }}
              placeholder="Paste your API key here…"
            />
            <button className={styles.showBtn} onClick={() => setShowKey(s => !s)}>
              {showKey ? 'Hide' : 'Show'}
            </button>
          </div>

          <a
            href={selectedProvider.keyLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.keyLink}
          >
            Get a free {selectedProvider.label} API key →
          </a>

          {/* Test result */}
          {testResult && (
            <div className={`${styles.testResult} ${testResult.success ? styles.testOk : styles.testFail}`}>
              {testResult.success ? '✓' : '✗'} {testResult.message}
            </div>
          )}

          <div className={styles.keyActions}>
            <button
              className={styles.testBtn}
              onClick={handleTest}
              disabled={!keyInput || testing}
            >
              {testing ? 'Testing…' : 'Test Connection'}
            </button>
            <button
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!keyInput}
            >
              {saved ? '✓ Saved' : 'Save Key'}
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className={styles.section}>
        <div className={styles.infoCard}>
          <div className={styles.infoTitle}>About your API key</div>
          <div className={styles.infoText}>
            Your API key is stored locally on this device only and is never sent to WiseKnit servers.
            It is used directly to call the AI provider when parsing patterns.
            For maximum security, move to the FastAPI backend when available.
          </div>
        </div>
      </div>

    </div>
  )
}
