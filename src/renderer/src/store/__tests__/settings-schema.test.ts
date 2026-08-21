// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { SETTINGS_DEFAULTS, SETTINGS_SCHEMA, loadSettingsFromStorage, saveSettingsToStorage } from '../settings-schema'

const KEY = 'netassist.settings'

beforeEach(() => localStorage.clear())

describe('settings-schema', () => {
  it('默认值覆盖 5 个分类核心键', () => {
    expect(SETTINGS_DEFAULTS.maxTabs).toBe(20)
    expect(SETTINGS_DEFAULTS.msgLimit).toBe(5000)
    expect(SETTINGS_DEFAULTS.defaultEnc).toBe('UTF-8')
    expect(SETTINGS_DEFAULTS.quickTagsCount).toBe(5)
  })
  it('Schema 含 5 分类且每项 key 在默认值中有值', () => {
    expect(SETTINGS_SCHEMA).toHaveLength(5)
    for (const cat of SETTINGS_SCHEMA) {
      for (const g of cat.groups) for (const it of g.items) expect(SETTINGS_DEFAULTS, `${it.key}`).toHaveProperty(it.key)
    }
  })
  it('save/load 往返：缺省用默认补齐', () => {
    saveSettingsToStorage({ maxTabs: 30 })
    const s = loadSettingsFromStorage()
    expect(s.maxTabs).toBe(30)
    expect(s.msgLimit).toBe(5000)
  })
  it('load 容错坏 JSON', () => {
    localStorage.setItem(KEY, '{bad json')
    expect(loadSettingsFromStorage().maxTabs).toBe(20)
  })
})
