import { useState, useCallback } from 'react'
import { Input, Button, InputNumber, Space, Tag } from 'antd'
import { WifiOutlined, CloseOutlined } from '@ant-design/icons'
import type { UdpConfig as UdpConfigType } from '../../../shared/types'
import type { TabState } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import './TcpClientConfig.css'

interface Props { tab: TabState }

export default function UdpConfigPanel({ tab }: Props): JSX.Element {
  const { setTabConfig } = useTabStore()
  const { connect, disconnect } = useIpc()
  const config = tab.config as UdpConfigType
  const [localPort, setLocalPort] = useState<number | null>(config.localPort || null)
  const [targetHost, setTargetHost] = useState(config.targetHost || '')
  const [targetPort, setTargetPort] = useState<number | null>(config.targetPort || null)
  const [loading, setLoading] = useState(false)
  const isBound = tab.status === 'connected'

  const handleBind = useCallback(async (): Promise<void> => {
    if (localPort === null || localPort <= 0 || !targetHost.trim() || targetPort === null || targetPort <= 0) return
    const cfg: UdpConfigType = { localPort, targetHost: targetHost.trim(), targetPort }
    setTabConfig(tab.id, cfg)
    setLoading(true)
    try { await connect(tab.id, 'udp', cfg) } catch (err) { console.error('bind failed:', err) } finally { setLoading(false) }
  }, [localPort, targetHost, targetPort, tab.id, connect, setTabConfig])

  const handleClose = useCallback(async (): Promise<void> => {
    setLoading(true)
    try { await disconnect(tab.id) } catch (err) { console.error('close failed:', err) } finally { setLoading(false) }
  }, [tab.id, disconnect])

  const statusLabel: Record<string, string> = { idle: '未绑定', connected: '已绑定', error: '错误' }
  const statusColor: Record<string, string> = { idle: 'default', connected: 'success', error: 'error' }

  return (
    <div className="config-panel">
      <Space wrap>
        <span style={{ fontSize: 13, color: '#666' }}>本地:</span>
        <InputNumber placeholder="本地端口" value={localPort} onChange={(v) => setLocalPort(v)} min={1} max={65535} disabled={isBound} style={{ width: 100 }} />
        <span style={{ fontSize: 13, color: '#666' }}>目标:</span>
        <Input placeholder="目标 IP" value={targetHost} onChange={(e) => setTargetHost(e.target.value)} disabled={isBound} style={{ width: 140 }} />
        <InputNumber placeholder="目标端口" value={targetPort} onChange={(v) => setTargetPort(v)} min={1} max={65535} disabled={isBound} style={{ width: 100 }} />
        {isBound ? (
          <Button danger icon={<CloseOutlined />} onClick={handleClose} loading={loading}>关闭</Button>
        ) : (
          <Button type="primary" icon={<WifiOutlined />} onClick={handleBind} loading={loading} disabled={localPort === null || localPort <= 0 || !targetHost.trim() || targetPort === null || targetPort <= 0}>绑定</Button>
        )}
        <Tag color={statusColor[tab.status] || 'default'}>{statusLabel[tab.status] || tab.status}</Tag>
      </Space>
    </div>
  )
}
