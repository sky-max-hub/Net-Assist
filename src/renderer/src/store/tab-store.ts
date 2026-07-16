import { create } from 'zustand'
import type {
  TabState,
  TabType,
  TabStatus,
  TabConfig,
  Message,
  QuickSendItem,
  QuickSendGroup,
  TcpClientConfig,
  TcpServerConfig,
  UdpConfig,
  PersistedTab
} from '../../shared/types'
import type { SendOptions } from '../../shared/types'

declare global {
  interface Window {
    electronAPI?: {
      store: {
        loadTabs: () => Promise<PersistedTab[]>
        saveTabs: (tabs: PersistedTab[]) => void
      }
    }
  }
}

function persistTabs(tabs: TabState[]): void {
  const toSave: PersistedTab[] = tabs.map((t) => ({
    id: t.id,
    title: t.title,
    type: t.type,
    config: t.config,
    sendOptions: t.sendOptions
  }))
  try {
    window.electronAPI?.store.saveTabs(toSave)
  } catch (err) {
    console.error('[tab-store] failed to save tabs:', err)
  }
}

function persistQuickSend(): void {
  const state = useTabStore.getState()
  try {
    window.electronAPI?.quickSend.save({ items: state.quickSendItems, groups: state.quickSendGroups })
  } catch (err) {
    console.error('[tab-store] failed to save quick send:', err)
  }
}

async function loadPersistedTabs(): Promise<TabState[]> {
  try {
    if (!window.electronAPI?.store) return []
    const persisted = await window.electronAPI.store.loadTabs()
    if (!persisted || persisted.length === 0) return []

    return persisted.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      status: 'idle' as const,
      config: p.config,
      messages: [],
      sendOptions: p.sendOptions || defaultSendOptions()
    }))
  } catch (err) {
    console.error('[tab-store] failed to load persisted tabs:', err)
    return []
  }
}

const MAX_MESSAGES = 5000
const MAX_TABS = 20

let tabCounter = 0

function generateTabId(): string {
  tabCounter += 1
  return `tab-${Date.now()}-${tabCounter}`
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function defaultConfig(type: TabType): TabConfig {
  switch (type) {
    case 'tcp-client':
      return { host: '127.0.0.1', port: 0 } as TcpClientConfig
    case 'tcp-server':
      return { port: 0 } as TcpServerConfig
    case 'udp':
      return { localPort: 0, targetHost: '127.0.0.1', targetPort: 0 } as UdpConfig
  }
}

function defaultSendOptions(): SendOptions {
  return { encoding: 'gbk', displayMode: 'text', lfToCr: true, splitView: true }
}

function defaultTitle(type: TabType): string {
  switch (type) {
    case 'tcp-client':
      return 'TCP Client'
    case 'tcp-server':
      return 'TCP Server'
    case 'udp':
      return 'UDP'
  }
}

interface TabStore {
  tabs: TabState[]
  activeTabId: string | null
  quickSendItems: QuickSendItem[]
  quickSendGroups: QuickSendGroup[]

  createTab: (type: TabType) => string | null
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabStatus: (tabId: string, status: TabStatus) => void
  addMessage: (tabId: string, message: Omit<Message, 'id'>) => void
  setTabConfig: (tabId: string, config: TabConfig) => void
  updateTabTitle: (tabId: string, title: string) => void
  updateSendOptions: (tabId: string, options: Partial<SendOptions>) => void
  addQuickSendItem: (item: Omit<QuickSendItem, 'id'>) => void
  updateQuickSendItem: (id: string, item: Partial<Omit<QuickSendItem, 'id'>>) => void
  removeQuickSendItem: (id: string) => void
  addQuickSendGroup: (name: string) => void
  updateQuickSendGroup: (id: string, name: string) => void
  removeQuickSendGroup: (id: string) => void
  loadPersistedTabs: () => Promise<void>
  clearMessages: (tabId: string) => void
  loadQuickSend: () => Promise<void>
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  quickSendItems: [],
  quickSendGroups: [],

  createTab: (type: TabType): string | null => {
    const { tabs } = get()
    if (tabs.length >= MAX_TABS) return null

    const id = generateTabId()
    const newTab: TabState = {
      id,
      title: `${defaultTitle(type)} ${tabs.length + 1}`,
      type,
      status: 'idle',
      config: defaultConfig(type),
      messages: [],
      sendOptions: defaultSendOptions()
    }

    const newTabs = [...tabs, newTab]
    set({ tabs: newTabs, activeTabId: id })
    persistTabs(newTabs)
    return id
  },

  closeTab: (tabId: string): void => {
    const { tabs, activeTabId } = get()
    const idx = tabs.findIndex((t) => t.id === tabId)
    if (idx === -1) return

    const newTabs = tabs.filter((t) => t.id !== tabId)

    let newActiveId = activeTabId
    if (activeTabId === tabId) {
      if (newTabs.length === 0) {
        newActiveId = null
      } else if (idx >= newTabs.length) {
        newActiveId = newTabs[newTabs.length - 1].id
      } else {
        newActiveId = newTabs[idx].id
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveId })
    persistTabs(newTabs)
  },

  setActiveTab: (tabId: string): void => {
    set({ activeTabId: tabId })
  },

  updateTabStatus: (tabId: string, status: TabStatus): void => {
    set({
      tabs: get().tabs.map((t) => (t.id === tabId ? { ...t, status } : t))
    })
  },

  addMessage: (tabId: string, msg: Omit<Message, 'id'>): void => {
    set({
      tabs: get().tabs.map((t) => {
        if (t.id !== tabId) return t
        const newMessages = [...t.messages, { ...msg, id: generateMessageId() }]
        if (newMessages.length > MAX_MESSAGES) {
          newMessages.splice(0, newMessages.length - MAX_MESSAGES)
        }
        return { ...t, messages: newMessages }
      })
    })
  },

  setTabConfig: (tabId: string, config: TabConfig): void => {
    const newTabs = get().tabs.map((t) => (t.id === tabId ? { ...t, config } : t))
    set({ tabs: newTabs })
    persistTabs(newTabs)
  },

  updateTabTitle: (tabId: string, title: string): void => {
    if (!title.trim()) return
    const newTabs = get().tabs.map((t) => (t.id === tabId ? { ...t, title: title.trim() } : t))
    set({ tabs: newTabs })
    persistTabs(newTabs)
  },

  updateSendOptions: (tabId: string, options: Partial<SendOptions>): void => {
    const newTabs = get().tabs.map((t) =>
      t.id === tabId ? { ...t, sendOptions: { ...t.sendOptions, ...options } } : t
    )
    set({ tabs: newTabs })
    persistTabs(newTabs)
  },

  addQuickSendItem: (item: Omit<QuickSendItem, 'id'>): void => {
    const id = `qs-${Date.now()}`
    set({ quickSendItems: [...get().quickSendItems, { ...item, id }] })
    persistQuickSend()
  },

  updateQuickSendItem: (id: string, updates: Partial<Omit<QuickSendItem, 'id'>>): void => {
    set({
      quickSendItems: get().quickSendItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    })
    persistQuickSend()
  },

  removeQuickSendItem: (id: string): void => {
    set({ quickSendItems: get().quickSendItems.filter((item) => item.id !== id) })
    persistQuickSend()
  },

  addQuickSendGroup: (name: string): void => {
    const id = `qsg-${Date.now()}`
    set({ quickSendGroups: [...get().quickSendGroups, { id, name: name.trim() }] })
    persistQuickSend()
  },

  updateQuickSendGroup: (id: string, name: string): void => {
    set({
      quickSendGroups: get().quickSendGroups.map((g) =>
        g.id === id ? { ...g, name: name.trim() } : g
      )
    })
    persistQuickSend()
  },

  removeQuickSendGroup: (id: string): void => {
    set({
      quickSendGroups: get().quickSendGroups.filter((g) => g.id !== id),
      quickSendItems: get().quickSendItems.map((item) =>
        item.groupId === id ? { ...item, groupId: undefined } : item
      )
    })
    persistQuickSend()
  },

  loadPersistedTabs: async (): Promise<void> => {
    const restored = await loadPersistedTabs()
    if (restored.length > 0) {
      tabCounter = restored.length
      set({ tabs: restored, activeTabId: restored[0].id })
    } else {
      tabCounter = 0
    }
  },

  clearMessages: (tabId: string): void => {
    set({
      tabs: get().tabs.map((t) =>
        t.id === tabId ? { ...t, messages: [] } : t
      )
    })
  },

  loadQuickSend: async (): Promise<void> => {
    try {
      if (!window.electronAPI?.quickSend) return
      const data = await window.electronAPI.quickSend.load()
      if (data && (data.items.length > 0 || data.groups.length > 0)) {
        set({ quickSendItems: data.items, quickSendGroups: data.groups })
      }
    } catch (err) {
      console.error('[tab-store] failed to load quick send:', err)
    }
  }
}))
