import { useState, useCallback } from 'react'
import type { TabState, TcpClientConfig, TcpServerConfig, UdpConfig } from '../../shared/types'
import { useTabStore } from '../store/tab-store'
import { useIpc } from './useIpc'
import { isLive } from '../store/tab-meta'
import { useUiStore } from '../store/ui-store'

export function useConnectionActions(tab: TabState): {
  live: boolean
  connecting: boolean
  actionLabel: string
  loading: boolean
  handleToggle: () => Promise<void>
} {
  const { connect, disconnect } = useIpc()
  const setTabConfig = useTabStore((s) => s.setTabConfig)
  const updateTabStatus = useTabStore((s) => s.updateTabStatus)
  const [loading, setLoading] = useState(false)

  const live = isLive(tab)
  const connecting = tab.status === 'connecting'

  const actionLabel = live
    ? (tab.type === 'tcp-server' ? '停止监听' : tab.type === 'udp' ? '关闭' : '断开')
    : connecting
      ? '连接中…'
      : (tab.type === 'tcp-server' ? '开始监听' : tab.type === 'udp' ? '绑定' : '连接')

  // 连接前校验配置：端口/主机无效时不发起连接，避免连到非法端口被拒绝
  const configValid = ((): boolean => {
    if (tab.type === 'tcp-client') {
      const c = tab.config as TcpClientConfig
      return c.host.trim() !== '' && c.port >= 1 && c.port <= 65535
    }
    if (tab.type === 'tcp-server') {
      const c = tab.config as TcpServerConfig
      return c.port >= 1 && c.port <= 65535
    }
    const c = tab.config as UdpConfig
    return c.localPort >= 1 && c.localPort <= 65535 &&
      c.targetHost.trim() !== '' && c.targetPort >= 1 && c.targetPort <= 65535
  })()

  const handleToggle = useCallback(async (): Promise<void> => {
    if (connecting) return
    if (!live && !configValid) {
      useUiStore.getState().showToast('连接配置无效，请检查主机/端口')
      return
    }
    setLoading(true)
    try {
      if (live) {
        updateTabStatus(tab.id, 'idle')
        await disconnect(tab.id)
        useUiStore.getState().showToast('已断开')
      } else {
        setTabConfig(tab.id, tab.config)
        await connect(tab.id, tab.type, tab.config)
      }
    } catch (err) {
      console.error('connection action failed:', err)
    } finally {
      setLoading(false)
    }
  }, [tab, live, connecting, connect, disconnect, setTabConfig, updateTabStatus])

  return { live, connecting, actionLabel, loading, handleToggle }
}
