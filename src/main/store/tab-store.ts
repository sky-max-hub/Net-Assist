import Store from 'electron-store'
import type { PersistedTab } from '../../shared/types'

interface StoreSchema {
  tabs: PersistedTab[]
}

const store = new Store<StoreSchema>({
  name: 'config',
  defaults: {
    tabs: []
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
      (t) =>
        t &&
        typeof t.id === 'string' &&
        typeof t.title === 'string' &&
        validTypes.includes(t.type as string) &&
        typeof t.config === 'object'
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
