import { useEffect, useCallback, useState, useRef } from 'react'
import { useTabStore } from '../../store/tab-store'
import { useIpcListeners, useIpc } from '../../hooks/useIpc'
import { normalizeToLf } from '../../hooks/lineEnding'
import TabBar from '../tab/TabBar'
import TabContent from '../tab/TabContent'
import QuickSendPanel from '../quick-send/QuickSendPanel'
import './MainLayout.css'

const SIDEBAR_MIN = 200
const SIDEBAR_MAX = 450

export default function MainLayout(): JSX.Element {
  const { tabs, activeTabId, loadPersistedTabs, loadQuickSend } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null
  const { send } = useIpc()
  const [sidebarWidth, setSidebarWidth] = useState(240)
  const resizing = useRef(false)

  useIpcListeners()

  useEffect(() => {
    loadPersistedTabs()
    loadQuickSend()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizing.current = true
    const startX = e.clientX
    const startWidth = sidebarWidth

    const onMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX
      const w = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + delta))
      setSidebarWidth(w)
    }
    const onUp = () => {
      resizing.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [sidebarWidth])

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
    <div className="main-layout">
      <aside className="sidebar" style={{ width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth }}>
        <TabBar />
        <QuickSendPanel onSend={handleQuickSend} />
      </aside>
      <div className="sidebar-resize-handle" onMouseDown={handleMouseDown} />
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
