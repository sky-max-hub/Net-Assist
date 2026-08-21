import { useState } from 'react'
import type { TabState, TabConfig } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useConnectionActions } from '../../hooks/useConnectionActions'
import { useServerClients } from '../../hooks/useServerClients'
import { TYPE_META, STATUS_META, statusLabelFor } from '../../store/tab-meta'
import Icon from '../common/Icons'
import TcpClientConfigFields from '../config/TcpClientConfig'
import TcpServerConfigFields from '../config/TcpServerConfig'
import UdpConfigFields from '../config/UdpConfig'
import MessageList from '../messages/MessageList'
import StatsBar from '../stats/StatsBar'
import SendPanel from '../send/SendPanel'
import './TabContent.css'

interface Props { tab: TabState }

export default function TabContent({ tab }: Props): JSX.Element {
  const setTabConfig = useTabStore((s) => s.setTabConfig)
  const updateSendOptions = useTabStore((s) => s.updateSendOptions)
  const clients = useServerClients(tab.id)
  const [target, setTarget] = useState<string>('broadcast')
  const { live, connecting, actionLabel, loading, handleToggle } = useConnectionActions(tab)

  const onConfigChange = (config: TabConfig): void => setTabConfig(tab.id, config)
  const onTargetChange = async (clientId: string | null): Promise<void> => {
    setTarget(clientId ?? 'broadcast')
    await window.electronAPI.serverSetTarget({ tabId: tab.id, clientId })
  }

  const tm = TYPE_META[tab.type]
  const sm = STATUS_META[tab.status]
  const split = tab.sendOptions.splitView

  return (
    <>
      <div className="ws-header">
        <div className="ws-title">
          <span className="ws-type-icon"><Icon name={tm.icon} size={16} className={`ic ct-${tm.tag.toLowerCase()}`} /></span>
          <span className="conn-name-ws">{tab.title}</span>
          <span className="ws-count num">{tab.messages.length} 条</span>
        </div>
        <div className="ws-config">
          {tab.type === 'tcp-client' && <TcpClientConfigFields tab={tab} onChange={onConfigChange} />}
          {tab.type === 'tcp-server' && <TcpServerConfigFields tab={tab} clients={clients} target={target} onTargetChange={onTargetChange} onChange={onConfigChange} />}
          {tab.type === 'udp' && <UdpConfigFields tab={tab} onChange={onConfigChange} />}
        </div>
        <span className={`status-pill${live ? ' sp-success' : tab.status === 'connecting' ? ' sp-warn' : tab.status === 'error' ? ' sp-error' : ''}`}>
          <span className={`status-dot ${sm.cls}${sm.pulse ? ' pulse' : ''}`} />{statusLabelFor(tab, clients.length)}
        </span>
        <div className="spacer" />
        <div className="ws-actions">
          <button className={`btn btn-sm${live ? ' btn-danger' : ' btn-dark'}`} disabled={connecting || loading} onClick={() => handleToggle()}>
            {actionLabel}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => updateSendOptions(tab.id, { splitView: !split })}>
            <Icon name={split ? 'merge' : 'split'} size={14} /><span className="lbl">{split ? '合并' : '分屏'}</span>
          </button>
        </div>
      </div>
      <MessageList tab={tab} />
      <StatsBar tab={tab} />
      <SendPanel tab={tab} />
    </>
  )
}
