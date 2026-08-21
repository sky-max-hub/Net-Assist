import { useEffect, useCallback } from 'react'
import { useTabStore } from '../../store/tab-store'
import { useUiStore } from '../../store/ui-store'
import { useIpcListeners, useIpc } from '../../hooks/useIpc'
import { normalizeToLf } from '../../hooks/lineEnding'
import AppBar from './AppBar'
import Sidebar from './Sidebar'
import Welcome from '../common/Welcome'
import TabContent from '../tab/TabContent'
import ToastHost from '../common/Toast'
import './MainLayout.css'

export default function MainLayout(): JSX.Element {
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const loadPersistedTabs = useTabStore((s) => s.loadPersistedTabs)
  const loadQuickSend = useTabStore((s) => s.loadQuickSend)
  const loadSettings = useUiStore((s) => s.loadSettings)
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null
  const { send } = useIpc()

  useIpcListeners()

  useEffect(() => {
    loadPersistedTabs()
    loadQuickSend()
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 快捷指令发送：沿用既有 handleQuickSend 语义（直接编码发送）
  const handleQuickSend = useCallback(async (content: string) => {
    if (!activeTab) return
    const opts = activeTab.sendOptions
    // lfToCr 时先归一化再转换，避免 CRLF 双重转换；否则原样发送（保留 CR/CRLF）
    const finalText = opts.lfToCr ? normalizeToLf(content).replace(/\n/g, '\r') : content

    let bytes: Uint8Array
    if (opts.encoding === 'gbk') {
      const encoded = await window.electronAPI.encoding.encodeText(finalText, 'gbk')
      bytes = new Uint8Array(encoded)
    } else if (opts.encoding === 'ascii') {
      bytes = new Uint8Array(finalText.split('').map((c) => c.charCodeAt(0) & 0x7f))
    } else {
      bytes = new TextEncoder().encode(finalText)
    }
    send(activeTab.id, bytes, opts.encoding)
  }, [activeTab, send])

  return (
    <div className="app-root">
      <AppBar />
      <div className="app-body">
        <Sidebar onQuickSend={handleQuickSend} />
        <main className="workspace">
          {activeTab ? <TabContent tab={activeTab} /> : <Welcome />}
        </main>
      </div>
      <ToastHost />
    </div>
  )
}
