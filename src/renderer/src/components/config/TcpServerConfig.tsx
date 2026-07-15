import { useState, useCallback, useEffect } from 'react'
import { Input, Button, InputNumber, Space, Tag, Select } from 'antd'
import { PlayCircleOutlined, StopOutlined } from '@ant-design/icons'
import type { TcpServerConfig as TcpServerConfigType } from '../../../shared/types'
import type { TabState, ClientInfo } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import './TcpClientConfig.css'

interface Props { tab: TabState }

export default function TcpServerConfigPanel({ tab }: Props): JSX.Element {
  const { setTabConfig } = useTabStore()
  const { connect, disconnect } = useIpc()
  const [port, setPort] = useState<number | null>((tab.config as TcpServerConfigType).port || null)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<ClientInfo[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('broadcast')
  const isListening = tab.status === 'listening'

  useEffect(() => {
    const unsubJoin = window.electronAPI.onClientJoined((payload) => {
      if (payload.tabId === tab.id) setClients((prev) => [...prev, payload.client])
    })
    const unsubLeft = window.electronAPI.onClientLeft((payload) => {
      if (payload.tabId === tab.id) setClients((prev) => prev.filter((c) => c.id !== payload.clientId))
    })
    return () => { unsubJoin(); unsubLeft() }
  }, [tab.id])

  const handleStart = useCallback(async (): Promise<void> => {
    if (port === null || port <= 0) return
    const config: TcpServerConfigType = { port }
    setTabConfig(tab.id, config)
    setLoading(true)
    try {
      await connect(tab.id, 'tcp-server', config)
      setClients([])
      setSelectedClient('broadcast')
    } catch (err) { console.error('start server failed:', err) } finally { setLoading(false) }
  }, [port, tab.id, connect, setTabConfig])

  const handleStop = useCallback(async (): Promise<void> => {
    setLoading(true)
    try { await disconnect(tab.id); setClients([]); setSelectedClient('broadcast') }
    catch (err) { console.error('stop server failed:', err) } finally { setLoading(false) }
  }, [tab.id, disconnect])

  const handleTargetChange = useCallback(async (value: string): Promise<void> => {
    setSelectedClient(value)
    await window.electronAPI.serverSetTarget({ tabId: tab.id, clientId: value === 'broadcast' ? null : value })
  }, [tab.id])

  const statusLabel: Record<string, string> = { idle: '未启动', listening: '监听中', error: '错误' }
  const statusColor: Record<string, string> = { idle: 'default', listening: 'success', error: 'error' }

  return (
    <div className="config-panel">
      <Space wrap>
        <InputNumber placeholder="监听端口" value={port} onChange={(v) => setPort(v)} min={1} max={65535} disabled={isListening} style={{ width: 120 }} />
        {isListening ? (
          <Button danger icon={<StopOutlined />} onClick={handleStop} loading={loading}>停止监听</Button>
        ) : (
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStart} loading={loading} disabled={port === null || port <= 0}>开始监听</Button>
        )}
        <Tag color={statusColor[tab.status] || 'default'}>{statusLabel[tab.status] || tab.status}</Tag>
      </Space>
      {isListening && clients.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Space>
            <span style={{ fontSize: 13, color: '#666' }}>发送目标:</span>
            <Select value={selectedClient} onChange={handleTargetChange} size="small" style={{ width: 220 }}
              options={[{ value: 'broadcast', label: '广播所有客户端' }, ...clients.map((c) => ({ value: c.id, label: `${c.remoteAddress}:${c.remotePort}` }))]}
            />
          </Space>
        </div>
      )}
    </div>
  )
}
