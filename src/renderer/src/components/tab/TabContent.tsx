import { Button, Space } from 'antd'
import { ColumnWidthOutlined, MergeCellsOutlined, DeleteOutlined } from '@ant-design/icons'
import type { TabState } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import TcpClientConfigPanel from '../config/TcpClientConfig'
import TcpServerConfigPanel from '../config/TcpServerConfig'
import UdpConfigPanel from '../config/UdpConfig'
import MessageList from '../messages/MessageList'
import SendPanel from '../send/SendPanel'

interface Props {
  tab: TabState
}

export default function TabContent({ tab }: Props): JSX.Element {
  const updateSendOptions = useTabStore((s) => s.updateSendOptions)
  const clearMessages = useTabStore((s) => s.clearMessages)
  const displayMode = tab.sendOptions.displayMode
  const encoding = tab.sendOptions.encoding
  const splitView = tab.sendOptions.splitView

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
      <div style={{ flex: 1, minHeight: 150, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '2px 8px', flexShrink: 0 }}>
          <Space size="small">
            <Button
              type="text"
              danger
              size="small"
              icon={<DeleteOutlined />}
              onClick={() => clearMessages(tab.id)}
              disabled={tab.messages.length === 0}
            >
              清空
            </Button>
            <Button
              type="text"
              size="small"
              icon={splitView ? <MergeCellsOutlined /> : <ColumnWidthOutlined />}
              onClick={() => updateSendOptions(tab.id, { splitView: !splitView })}
            >
              {splitView ? '合并' : '分开'}
            </Button>
          </Space>
        </div>
        {splitView ? (
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: '1px solid #333' }}>
              <div style={{ fontSize: 11, color: '#6a9955', padding: '2px 8px', flexShrink: 0, fontWeight: 'bold' }}>TX 发送</div>
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <MessageList tabId={tab.id} messages={txMessages} displayMode={displayMode} encoding={encoding} />
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <div style={{ fontSize: 11, color: '#569cd6', padding: '2px 8px', flexShrink: 0, fontWeight: 'bold' }}>RX 接收</div>
              <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <MessageList tabId={tab.id} messages={rxMessages} displayMode={displayMode} encoding={encoding} />
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <MessageList tabId={tab.id} messages={tab.messages} displayMode={displayMode} encoding={encoding} />
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}><SendPanel tabId={tab.id} /></div>
    </div>
  )
}
