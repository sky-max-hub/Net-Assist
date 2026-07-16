import { useEffect, useCallback } from 'react'
import { useTabStore } from '../../store/tab-store'
import { useIpcListeners, useIpc } from '../../hooks/useIpc'
import TabBar from '../tab/TabBar'
import TabContent from '../tab/TabContent'
import QuickSendPanel from '../quick-send/QuickSendPanel'
import './MainLayout.css'

export default function MainLayout(): JSX.Element {
  const { tabs, activeTabId, loadPersistedTabs } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null
  const { send } = useIpc()

  useIpcListeners()

  useEffect(() => {
    loadPersistedTabs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleQuickSend = useCallback(async (content: string) => {
    if (!activeTab) return
    const opts = activeTab.sendOptions
    const finalText = opts.lfToCr ? content.replace(/\n/g, '\r') : content

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
    <div className="main-layout">
      <aside className="sidebar">
        <TabBar />
        <QuickSendPanel onSend={handleQuickSend} />
      </aside>
      <main className="content-area">
        {activeTab ? (
          <TabContent tab={activeTab} />
        ) : (
          <div className="content-placeholder">
            <p>点击左侧 "+" 按钮新建连接</p>
          </div>
        )}
      </main>
    </div>
  )
}
