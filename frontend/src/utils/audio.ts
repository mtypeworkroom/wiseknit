import type { ReminderSound, ReminderChime } from '../types'

export function playChime(type: ReminderChime = 'descend') {
  try {
    const ctx = new AudioContext()
    const t = ctx.currentTime

    if (type === 'descend') {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.connect(g); g.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, t)
      osc.frequency.exponentialRampToValueAtTime(440, t + 0.25)
      g.gain.setValueAtTime(0.25, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
      osc.start(t); osc.stop(t + 0.6)
      osc.onended = () => ctx.close()

    } else if (type === 'ascend') {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.connect(g); g.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, t)
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.25)
      g.gain.setValueAtTime(0.25, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.6)
      osc.start(t); osc.stop(t + 0.6)
      osc.onended = () => ctx.close()

    } else if (type === 'bell') {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.connect(g); g.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 1047
      g.gain.setValueAtTime(0.3, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.2)
      osc.start(t); osc.stop(t + 1.2)
      osc.onended = () => ctx.close()

    } else if (type === 'ping') {
      const osc = ctx.createOscillator(); const g = ctx.createGain()
      osc.connect(g); g.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 1318
      g.gain.setValueAtTime(0.25, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
      osc.start(t); osc.stop(t + 0.28)
      osc.onended = () => ctx.close()

    } else if (type === 'double') {
      const osc1 = ctx.createOscillator(); const g1 = ctx.createGain()
      osc1.connect(g1); g1.connect(ctx.destination)
      osc1.type = 'sine'; osc1.frequency.value = 660
      g1.gain.setValueAtTime(0.25, t)
      g1.gain.exponentialRampToValueAtTime(0.001, t + 0.28)
      osc1.start(t); osc1.stop(t + 0.28)

      const osc2 = ctx.createOscillator(); const g2 = ctx.createGain()
      osc2.connect(g2); g2.connect(ctx.destination)
      osc2.type = 'sine'; osc2.frequency.value = 880
      g2.gain.setValueAtTime(0.25, t + 0.35)
      g2.gain.exponentialRampToValueAtTime(0.001, t + 0.65)
      osc2.start(t + 0.35); osc2.stop(t + 0.65)
      osc2.onended = () => ctx.close()
    }
  } catch {
    // audio unavailable
  }
}

export function pickVoice(gender: 'female' | 'male'): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null
  const pool = voices.filter(v => v.lang.startsWith('en'))
  const src = pool.length > 0 ? pool : voices
  const labeled = src.find(v => v.name.toLowerCase().includes(gender))
  if (labeled) return labeled
  const named = gender === 'female'
    ? ['Samantha', 'Victoria', 'Karen', 'Moira', 'Fiona', 'Zira', 'Hazel', 'Aria', 'Susan']
    : ['Alex', 'Daniel', 'Tom', 'Fred', 'Gordon', 'David', 'Mark', 'Ryan']
  for (const n of named) {
    const v = src.find(v => v.name.includes(n))
    if (v) return v
  }
  return src[gender === 'female' ? 0 : Math.min(1, src.length - 1)] ?? null
}

export function speakText(text: string, gender: 'female' | 'male', delayMs = 0) {
  setTimeout(() => {
    try {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1.0
      const voice = pickVoice(gender)
      if (voice) utterance.voice = voice
      window.speechSynthesis.speak(utterance)
    } catch {
      // speech unavailable
    }
  }, delayMs)
}

export function playReminderAlert(
  text: string,
  sound: ReminderSound,
  voice: 'female' | 'male',
  chime: ReminderChime,
) {
  if (sound === 'mute') return
  if (sound === 'chime' || sound === 'chime+speak') playChime(chime)
  if (sound === 'speak') speakText(text, voice)
  if (sound === 'chime+speak') speakText(text, voice, 650)
}
