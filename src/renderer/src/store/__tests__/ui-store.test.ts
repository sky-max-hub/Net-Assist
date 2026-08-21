// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useUiStore } from '../ui-store'
import { SETTINGS_DEFAULTS, saveSettingsToStorage } from '../settings-schema'

beforeEach(() => { localStorage.clear(); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('ui-store', () => {
  it('showToast 显示并在 1.8s 后清除（单实例）', () => {
    useUiStore.setState({ toast: null })
    useUiStore.getState().showToast('已保存')
    expect(useUiStore.getState().toast).toBe('已保存')
    vi.advanceTimersByTime(1800)
    expect(useUiStore.getState().toast).toBeNull()
  })
  it('updateSetting 更新 settings', () => {
    useUiStore.getState().updateSetting('maxTabs', 33)
    expect(useUiStore.getState().settings.maxTabs).toBe(33)
  })
  it('saveSettings 写入 localStorage 并关闭弹窗', () => {
    useUiStore.setState({ settingsModalOpen: true, settings: { ...SETTINGS_DEFAULTS, maxTabs: 8 } })
    useUiStore.getState().saveSettings()
    expect(useUiStore.getState().settingsModalOpen).toBe(false)
    expect(JSON.parse(localStorage.getItem('netassist.settings')!).maxTabs).toBe(8)
  })
  it('cancelSettings 回滚到打开时快照', () => {
    saveSettingsToStorage({ ...SETTINGS_DEFAULTS, maxTabs: 20 })
    useUiStore.getState().loadSettings()
    useUiStore.getState().openSettings()          // 快照 maxTabs=20
    useUiStore.getState().updateSetting('maxTabs', 99)
    useUiStore.getState().cancelSettings()
    expect(useUiStore.getState().settings.maxTabs).toBe(20)
    expect(useUiStore.getState().settingsModalOpen).toBe(false)
  })
  it('resetSettings 恢复默认', () => {
    useUiStore.setState({ settings: { ...SETTINGS_DEFAULTS, maxTabs: 5 } })
    useUiStore.getState().resetSettings()
    expect(useUiStore.getState().settings.maxTabs).toBe(20)
  })
})
