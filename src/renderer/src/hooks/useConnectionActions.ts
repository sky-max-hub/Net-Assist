import { useState, useCallback } from 'react'
import type { TabState } from '../../shared/types'
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

  const handleToggle = useCallback(async (): Promise<void> => {
    if (connecting) return
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
