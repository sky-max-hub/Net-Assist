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

  const handleQuickSend = useCallback((content: string) => {
    if (!activeTab) return
    const encoder = new TextEncoder()
    send(activeTab.id, encoder.encode(content), activeTab.sendOptions.encoding)
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
