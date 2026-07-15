import { useState, useCallback } from 'react'
import { Form, Input, Button, InputNumber, Space, Tag } from 'antd'
import { ApiOutlined, DisconnectOutlined } from '@ant-design/icons'
import type { TcpClientConfig as TcpClientConfigType } from '../../../shared/types'
import type { TabState } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import './TcpClientConfig.css'

interface Props {
  tab: TabState
}

export default function TcpClientConfigPanel({ tab }: Props): JSX.Element {
  const { setTabConfig } = useTabStore()
  const { connect, disconnect } = useIpc()
  const [host, setHost] = useState((tab.config as TcpClientConfigType).host || '')
  const [port, setPort] = useState<number | null>((tab.config as TcpClientConfigType).port || null)
  const [loading, setLoading] = useState(false)

  const isConnected = tab.status === 'connected'
  const isConnecting = tab.status === 'connecting'

  const handleConnect = useCallback(async (): Promise<void> => {
    if (!host.trim() || port === null || port <= 0) return
    const config: TcpClientConfigType = { host: host.trim(), port }
    setTabConfig(tab.id, config)
    setLoading(true)
    try {
      await connect(tab.id, 'tcp-client', config)
    } catch (err) {
      console.error('connect failed:', err)
    } finally {
      setLoading(false)
    }
  }, [host, port, tab.id, connect, setTabConfig])

  const handleDisconnect = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      await disconnect(tab.id)
    } catch (err) {
      console.error('disconnect failed:', err)
    } finally {
      setLoading(false)
    }
  }, [tab.id, disconnect])

  const statusColor: Record<string, string> = {
    idle: 'default',
    connecting: 'processing',
    connected: 'success',
    error: 'error'
  }
  const statusLabel: Record<string, string> = {
    idle: '未连接',
    connecting: '连接中...',
    connected: '已连接',
    error: '错误'
  }

  return (
    <div className="config-panel">
      <Space wrap>
        <Input
          placeholder="目标 IP"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          disabled={isConnected || isConnecting}
          style={{ width: 180 }}
        />
        <InputNumber
          placeholder="端口"
          value={port}
          onChange={(v) => setPort(v)}
          min={1}
          max={65535}
          disabled={isConnected || isConnecting}
          style={{ width: 100 }}
        />
        {isConnected || isConnecting ? (
          <Button danger icon={<DisconnectOutlined />} onClick={handleDisconnect} loading={isConnecting}>
            断开
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<ApiOutlined />}
            onClick={handleConnect}
            loading={loading}
            disabled={!host.trim() || port === null || port <= 0}
          >
            连接
          </Button>
        )}
        <Tag color={statusColor[tab.status] || 'default'}>{statusLabel[tab.status] || tab.status}</Tag>
      </Space>
    </div>
  )
}
