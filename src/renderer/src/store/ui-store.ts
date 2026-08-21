import { create } from 'zustand'
import { SETTINGS_DEFAULTS, loadSettingsFromStorage, saveSettingsToStorage, type Settings } from './settings-schema'

interface UiStore {
  settings: Settings
  toast: string | null
  sidebarCollapsed: boolean
  sidebarFilter: string
  quickSendModalOpen: boolean
  settingsModalOpen: boolean
  settingsSnapshot: string | null

  loadSettings: () => void
  updateSetting: (key: string, value: string | number | boolean) => void
  openSettings: () => void
  closeSettings: () => void
  saveSettings: () => void
  cancelSettings: () => void
  resetSettings: () => void
  showToast: (message: string) => void
  setSidebarCollapsed: (v: boolean) => void
  setSidebarFilter: (v: string) => void
  openQuickSendModal: () => void
  closeQuickSendModal: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useUiStore = create<UiStore>((set, get) => ({
  settings: { ...SETTINGS_DEFAULTS },
  toast: null,
  sidebarCollapsed: false,
  sidebarFilter: '',
  quickSendModalOpen: false,
  settingsModalOpen: false,
  settingsSnapshot: null,

  loadSettings: () => set({ settings: loadSettingsFromStorage() }),
  updateSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
  openSettings: () => set({ settingsModalOpen: true, settingsSnapshot: JSON.stringify(get().settings) }),
  closeSettings: () => set({ settingsModalOpen: false, settingsSnapshot: null }),
  saveSettings: () => {
    saveSettingsToStorage(get().settings)
    set({ settingsModalOpen: false, settingsSnapshot: null })
  },
  cancelSettings: () => {
    const snap = get().settingsSnapshot
    set({ settings: snap ? (JSON.parse(snap) as Settings) : { ...SETTINGS_DEFAULTS }, settingsModalOpen: false, settingsSnapshot: null })
  },
  resetSettings: () => set({ settings: { ...SETTINGS_DEFAULTS } }),
  showToast: (message) => {
    set({ toast: message })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: null }), 1800)
  },
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSidebarFilter: (v) => set({ sidebarFilter: v }),
  openQuickSendModal: () => set({ quickSendModalOpen: true }),
  closeQuickSendModal: () => set({ quickSendModalOpen: false })
}))
