import { useState, useEffect } from 'react'
import type { ClientInfo } from '../../shared/types'

export function useServerClients(tabId: string): ClientInfo[] {
  const [clients, setClients] = useState<ClientInfo[]>([])
  useEffect(() => {
    const unsubJoin = window.electronAPI.onClientJoined((p) => { if (p.tabId === tabId) setClients((prev) => [...prev, p.client]) })
    const unsubLeft = window.electronAPI.onClientLeft((p) => { if (p.tabId === tabId) setClients((prev) => prev.filter((c) => c.id !== p.clientId)) })
    return () => { unsubJoin(); unsubLeft() }
  }, [tabId])
  return clients
}
