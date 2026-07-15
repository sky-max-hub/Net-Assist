import { useEffect } from 'react'
import { useTabStore } from '../../store/tab-store'
import TabBar from '../tab/TabBar'
import TabContent from '../tab/TabContent'
import QuickSendPanel from '../quick-send/QuickSendPanel'
import './MainLayout.css'

export default function MainLayout(): JSX.Element {
  const { tabs, activeTabId, loadPersistedTabs } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  useEffect(() => {
    loadPersistedTabs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <TabBar />
        <QuickSendPanel />
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
