// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import SendPanel from '../SendPanel'
import { useTabStore } from '../../../store/tab-store'

describe('SendPanel 渲染（防白屏回归）', () => {
  it('挂载 SendPanel 不抛异常，且渲染出 CodeMirror 编辑器', () => {
    // 预置一个 tab
    useTabStore.setState({
      tabs: [{
        id: 'tab-1',
        title: 'TCP Client 1',
        type: 'tcp-client',
        status: 'connected',
        config: { host: '127.0.0.1', port: 502 },
        messages: [],
        sendOptions: { encoding: 'utf-8', displayMode: 'text', lfToCr: false, splitView: true }
      }],
      activeTabId: 'tab-1'
    })
    // mock window.electronAPI 避免 useIpc 报错
    ;(window as any).electronAPI = {
      connect: () => Promise.resolve(),
      disconnect: () => Promise.resolve(),
      send: () => Promise.resolve(),
      serverSetTarget: () => Promise.resolve(),
      encoding: { encodeText: () => Promise.resolve([]) },
      store: { loadTabs: () => Promise.resolve([]), saveTabs: () => {} },
      quickSend: { load: () => Promise.resolve({ items: [], groups: [] }), save: () => {} }
    }
    expect(() => {
      const { container } = render(React.createElement(SendPanel, { tabId: 'tab-1' }))
      expect(container.querySelector('.cm-content')).toBeTruthy()
    }).not.toThrow()
  })
})
