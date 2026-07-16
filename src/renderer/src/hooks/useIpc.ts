import { useCallback, useEffect } from 'react'
import type { TabType, TabConfig, TabStatus } from '../../shared/types'
import type {
  StatusPayload,
  DataPayload,
  ErrorPayload
} from '../../shared/ipc-channels'
import { useTabStore } from '../store/tab-store'

export function useIpcListeners(): void {
  const updateTabStatus = useTabStore((s) => s.updateTabStatus)
  const addMessage = useTabStore((s) => s.addMessage)

  useEffect(() => {
    const unsubStatus = window.electronAPI.onStatus((payload: StatusPayload) => {
      updateTabStatus(payload.tabId, payload.status as TabStatus)
    })

    const unsubData = window.electronAPI.onData((payload: DataPayload) => {
      addMessage(payload.tabId, {
        timestamp: payload.timestamp,
        direction: payload.direction,
        remote: payload.remote,
        byteLength: payload.data.length,
        raw: new Uint8Array(payload.data).buffer,
        text: payload.text
      })
    })

    const unsubError = window.electronAPI.onError((payload: ErrorPayload) => {
      console.error(`[${payload.tabId}] Error:`, payload.message)
    })

    return () => {
      unsubStatus()
      unsubData()
      unsubError()
    }
  }, [updateTabStatus, addMessage])
}

export function useIpc() {
  const connect = useCallback(
    async (tabId: string, type: TabType, config: TabConfig): Promise<void> => {
      await window.electronAPI.connect({ tabId, type, config })
    },
    []
  )

  const disconnect = useCallback(async (tabId: string): Promise<void> => {
    await window.electronAPI.disconnect({ tabId })
  }, [])

  const send = useCallback(
    async (tabId: string, data: Buffer | Uint8Array, encoding: string): Promise<void> => {
      await window.electronAPI.send({
        tabId,
        data: Array.from(data),
        encoding
      })
    },
    []
  )

  return { connect, disconnect, send }
}
