import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReminderSound, ReminderChime } from '../types'

export type ReminderVoice = 'female' | 'male'
export type Units = 'cm' | 'in'

interface SettingsStore {
  reminderSound: ReminderSound
  setReminderSound: (sound: ReminderSound) => void
  reminderVoice: ReminderVoice
  setReminderVoice: (voice: ReminderVoice) => void
  reminderChime: ReminderChime
  setReminderChime: (chime: ReminderChime) => void
  units: Units
  setUnits: (units: Units) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      reminderSound: 'chime+speak',
      setReminderSound: (reminderSound) => set({ reminderSound }),
      reminderVoice: 'female',
      setReminderVoice: (reminderVoice) => set({ reminderVoice }),
      reminderChime: 'descend',
      setReminderChime: (reminderChime) => set({ reminderChime }),
      units: 'in',
      setUnits: (units) => set({ units }),
    }),
    { name: 'wiseknit-settings' }
  )
)
