import { describe, it, expect, beforeEach } from 'vitest'
import { useTabStore } from '../tab-store'

describe('useTabStore', () => {
  beforeEach(() => {
    useTabStore.setState({ tabs: [], activeTabId: null, quickSendItems: [] })
  })

  it('creates a new tab', () => {
    const store = useTabStore.getState()
    const id = store.createTab('tcp-client')
    expect(id).toBeTruthy()
    const { tabs, activeTabId } = useTabStore.getState()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].type).toBe('tcp-client')
    expect(tabs[0].status).toBe('idle')
    expect(activeTabId).toBe(id)
  })

  it('switches active tab', () => {
    const store = useTabStore.getState()
    const id1 = store.createTab('tcp-client')
    const id2 = store.createTab('udp')
    useTabStore.getState().setActiveTab(id1!)
    expect(useTabStore.getState().activeTabId).toBe(id1)
    useTabStore.getState().setActiveTab(id2!)
    expect(useTabStore.getState().activeTabId).toBe(id2)
  })

  it('closes tab and adjusts active tab', () => {
    const store = useTabStore.getState()
    const id1 = store.createTab('tcp-client')
    const id2 = store.createTab('tcp-server')
    useTabStore.getState().closeTab(id1!)
    const { tabs, activeTabId } = useTabStore.getState()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].id).toBe(id2)
    expect(activeTabId).toBe(id2)
  })

  it('closes last tab and sets activeTabId to null', () => {
    const store = useTabStore.getState()
    const id = store.createTab('tcp-client')
    useTabStore.getState().closeTab(id!)
    const { tabs, activeTabId } = useTabStore.getState()
    expect(tabs).toHaveLength(0)
    expect(activeTabId).toBeNull()
  })

  it('adds message and enforces 5000 limit', () => {
    const store = useTabStore.getState()
    const id = store.createTab('tcp-client')!
    for (let i = 0; i < 5010; i++) {
      useTabStore.getState().addMessage(id, {
        timestamp: Date.now(),
        direction: 'rx',
        remote: '127.0.0.1:8080',
        byteLength: 4,
        raw: new ArrayBuffer(4)
      })
    }
    const tab = useTabStore.getState().tabs.find((t) => t.id === id)
    expect(tab!.messages).toHaveLength(5000)
  })

  it('adds, updates, and removes quick send items', () => {
    useTabStore.getState().addQuickSendItem({ name: 'Ping', content: 'ping\r\n' })
    expect(useTabStore.getState().quickSendItems).toHaveLength(1)
    const item = useTabStore.getState().quickSendItems[0]
    useTabStore.getState().updateQuickSendItem(item.id, { name: 'Ping v2' })
    expect(useTabStore.getState().quickSendItems[0].name).toBe('Ping v2')
    useTabStore.getState().removeQuickSendItem(item.id)
    expect(useTabStore.getState().quickSendItems).toHaveLength(0)
  })
})
