import Store from 'electron-store'
import type { PersistedTab, QuickSendItem, QuickSendGroup } from '../../shared/types'

interface QuickSendData {
  items: QuickSendItem[]
  groups: QuickSendGroup[]
}

interface StoreSchema {
  tabs: PersistedTab[]
  quickSend: QuickSendData
}

const store = new Store<StoreSchema>({
  name: 'config',
  defaults: {
    tabs: [],
    quickSend: { items: [], groups: [] }
  }
})

export function getTabs(): PersistedTab[] {
  try {
    const tabs = store.get('tabs', []) as PersistedTab[]
    if (!Array.isArray(tabs)) {
      console.error('[tab-store] stored tabs is not an array, returning []')
      return []
    }
    const validTypes = ['tcp-client', 'tcp-server', 'udp']
    return tabs.filter(
      (t) => {
        const valid = t &&
          typeof t.id === 'string' &&
          typeof t.title === 'string' &&
          validTypes.includes(t.type as string) &&
          typeof t.config === 'object'
        if (!valid) {
          console.warn('[tab-store] skipping invalid tab entry:', t)
        }
        return valid
      }
    )
  } catch (err) {
    console.error('[tab-store] failed to read tabs from store:', err)
    return []
  }
}

export function saveTabs(tabs: PersistedTab[]): void {
  try {
    store.set('tabs', tabs)
  } catch (err) {
    console.error('[tab-store] failed to save tabs to store:', err)
  }
}

export function getQuickSend(): QuickSendData {
  try {
    return store.get('quickSend', { items: [], groups: [] })
  } catch (err) {
    console.error('[tab-store] failed to read quickSend:', err)
    return { items: [], groups: [] }
  }
}

export function saveQuickSend(data: QuickSendData): void {
  try {
    store.set('quickSend', data)
  } catch (err) {
    console.error('[tab-store] failed to save quickSend:', err)
  }
}
