import { useState, useCallback, useRef } from 'react'
import { Button, Space } from 'antd'
import { ColumnWidthOutlined, MergeCellsOutlined, DeleteOutlined } from '@ant-design/icons'
import type { TabState } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import TcpClientConfigPanel from '../config/TcpClientConfig'
import TcpServerConfigPanel from '../config/TcpServerConfig'
import UdpConfigPanel from '../config/UdpConfig'
import MessageList from '../messages/MessageList'
import SendPanel from '../send/SendPanel'

const MSG_MIN_PCT = 30
const MSG_MAX_PCT = 80
const SPLIT_MIN_PCT = 25
const SPLIT_MAX_PCT = 75

interface Props {
  tab: TabState
}

export default function TabContent({ tab }: Props): JSX.Element {
  const updateSendOptions = useTabStore((s) => s.updateSendOptions)
  const clearMessages = useTabStore((s) => s.clearMessages)
  const displayMode = tab.sendOptions.displayMode
  const encoding = tab.sendOptions.encoding
  const splitView = tab.sendOptions.splitView

  const [msgPct, setMsgPct] = useState(60)
  const [splitPct, setSplitPct] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)

  const startDrag = useCallback((axis: 'msg' | 'split') => (e: React.MouseEvent) => {
    e.preventDefault()
    const start = axis === 'msg' ? e.clientY : e.clientX
    const startPct = axis === 'msg' ? msgPct : splitPct

    const onMove = (ev: MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const total = axis === 'msg' ? rect.height : rect.width
      if (total <= 0) return
      const cur = axis === 'msg' ? ev.clientY : ev.clientX
      const delta = ((cur - start) / total) * 100
      const [minPct, maxPct] = axis === 'msg' ? [MSG_MIN_PCT, MSG_MAX_PCT] : [SPLIT_MIN_PCT, SPLIT_MAX_PCT]
      const pct = Math.min(maxPct, Math.max(minPct, startPct + delta))
      if (axis === 'msg') setMsgPct(pct)
      else setSplitPct(pct)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = axis === 'msg' ? 'row-resize' : 'col-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [msgPct, splitPct])

  const renderConfigPanel = (): JSX.Element | null => {
    switch (tab.type) {
      case 'tcp-client': return <TcpClientConfigPanel tab={tab} />
      case 'tcp-server': return <TcpServerConfigPanel tab={tab} />
      case 'udp': return <UdpConfigPanel tab={tab} />
      default: return null
    }
  }

  const txMessages = tab.messages.filter((m) => m.direction === 'tx')
  const rxMessages = tab.messages.filter((m) => m.direction === 'rx')

  return (
    <div key={tab.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <div style={{ flexShrink: 0 }}>{renderConfigPanel()}</div>
      <div ref={containerRef} style={{ flex: 1, minHeight: 150, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 8px', flexShrink: 0, gap: 4 }}>
          <Button type="text" danger size="small" icon={<DeleteOutlined />}
            onClick={() => clearMessages(tab.id)} disabled={tab.messages.length === 0}>清空</Button>
          <Button type="text" size="small"
            icon={splitView ? <MergeCellsOutlined /> : <ColumnWidthOutlined />}
            onClick={() => updateSendOptions(tab.id, { splitView: !splitView })}>
            {splitView ? '合并' : '分开'}
          </Button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {splitView ? (
            <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
              <div style={{ width: `${splitPct}%`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, color: '#6a9955', padding: '2px 8px', flexShrink: 0, fontWeight: 'bold' }}>TX 发送</div>
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                  <MessageList tabId={tab.id} messages={txMessages} displayMode={displayMode} encoding={encoding} />
                </div>
              </div>
              <div className="split-resize-handle" onMouseDown={startDrag('split')} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ fontSize: 11, color: '#569cd6', padding: '2px 8px', flexShrink: 0, fontWeight: 'bold' }}>RX 接收</div>
                <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                  <MessageList tabId={tab.id} messages={rxMessages} displayMode={displayMode} encoding={encoding} />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ height: '100%', overflow: 'hidden' }}>
              <MessageList tabId={tab.id} messages={tab.messages} displayMode={displayMode} encoding={encoding} />
            </div>
          )}
        </div>
      </div>
      <div className="msg-send-resize-handle" onMouseDown={startDrag('msg')} />
      <div style={{ flexShrink: 0, height: `${100 - msgPct}%`, maxHeight: `${100 - MSG_MIN_PCT}%` }}>
        <SendPanel tabId={tab.id} />
      </div>
    </div>
  )
}
