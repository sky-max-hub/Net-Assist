import { create } from 'zustand'
import type {
  TabState,
  TabType,
  TabStatus,
  TabConfig,
  Message,
  QuickSendItem,
  TcpClientConfig,
  TcpServerConfig,
  UdpConfig
} from '../../shared/types'

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
      return { host: '', port: 0 } as TcpClientConfig
    case 'tcp-server':
      return { port: 0 } as TcpServerConfig
    case 'udp':
      return { localPort: 0, targetHost: '', targetPort: 0 } as UdpConfig
  }
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

  createTab: (type: TabType) => string | null
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabStatus: (tabId: string, status: TabStatus) => void
  addMessage: (tabId: string, message: Omit<Message, 'id'>) => void
  setTabConfig: (tabId: string, config: TabConfig) => void
  updateTabTitle: (tabId: string, title: string) => void
  addQuickSendItem: (item: Omit<QuickSendItem, 'id'>) => void
  updateQuickSendItem: (id: string, item: Partial<Omit<QuickSendItem, 'id'>>) => void
  removeQuickSendItem: (id: string) => void
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  quickSendItems: [],

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
      messages: []
    }

    set({ tabs: [...tabs, newTab], activeTabId: id })
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
    set({
      tabs: get().tabs.map((t) => (t.id === tabId ? { ...t, config } : t))
    })
  },

  updateTabTitle: (tabId: string, title: string): void => {
    if (!title.trim()) return
    set({
      tabs: get().tabs.map((t) => (t.id === tabId ? { ...t, title: title.trim() } : t))
    })
  },

  addQuickSendItem: (item: Omit<QuickSendItem, 'id'>): void => {
    const id = `qs-${Date.now()}`
    set({ quickSendItems: [...get().quickSendItems, { ...item, id }] })
  },

  updateQuickSendItem: (id: string, updates: Partial<Omit<QuickSendItem, 'id'>>): void => {
    set({
      quickSendItems: get().quickSendItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    })
  },

  removeQuickSendItem: (id: string): void => {
    set({ quickSendItems: get().quickSendItems.filter((item) => item.id !== id) })
  }
}))
