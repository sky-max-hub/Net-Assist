import type { TabState } from '../../../shared/types'
import TcpClientConfigPanel from '../config/TcpClientConfig'

interface Props {
  tab: TabState
}

export default function TabContent({ tab }: Props): JSX.Element {
  const renderConfigPanel = (): JSX.Element | null => {
    switch (tab.type) {
      case 'tcp-client':
        return <TcpClientConfigPanel tab={tab} />
      case 'tcp-server':
      case 'udp':
        return (
          <div style={{ padding: 16 }}>
            {tab.type} 配置面板将在后续任务中实现
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {renderConfigPanel()}
      <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
        <p>消息区域将在后续任务实现</p>
      </div>
    </div>
  )
}
