import { useState } from 'react'
import type { TabState } from '../../../shared/types'
import type { DisplayMode, EncodingMode } from '../../../shared/types'
import TcpClientConfigPanel from '../config/TcpClientConfig'
import TcpServerConfigPanel from '../config/TcpServerConfig'
import UdpConfigPanel from '../config/UdpConfig'
import MessageList from '../messages/MessageList'
import SendPanel from '../send/SendPanel'

interface Props {
  tab: TabState
}

export default function TabContent({ tab }: Props): JSX.Element {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('text')
  const [encoding, setEncoding] = useState<EncodingMode>('utf-8')

  const renderConfigPanel = (): JSX.Element | null => {
    switch (tab.type) {
      case 'tcp-client':
        return <TcpClientConfigPanel tab={tab} />
      case 'tcp-server':
        return <TcpServerConfigPanel tab={tab} />
      case 'udp':
        return <UdpConfigPanel tab={tab} />
      default:
        return null
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
      <div style={{ flexShrink: 0 }}>
        {renderConfigPanel()}
      </div>
      <div style={{ flex: 1, minHeight: 150, overflow: 'hidden' }}>
        <MessageList tabId={tab.id} messages={tab.messages} displayMode={displayMode} encoding={encoding} />
      </div>
      <div style={{ flexShrink: 0 }}>
        <SendPanel tabId={tab.id} />
      </div>
    </div>
  )
}
