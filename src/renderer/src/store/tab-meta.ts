import type { TabState, TabStatus, TabType, QuickSendGroup, QuickSendItem } from '../../shared/types'
import type { IconName } from '../components/common/Icons'

export interface TypeMeta { label: string; pill: string; tag: string; icon: IconName }
export interface StatusMeta { cls: string; label: string; pulse?: boolean }

export const TYPE_META: Record<TabType, TypeMeta> = {
  'tcp-client': { label: 'TCP Client', pill: 'tp-tc', tag: 'TC', icon: 'client' },
  'tcp-server': { label: 'TCP Server', pill: 'tp-ts', tag: 'TS', icon: 'server' },
  udp: { label: 'UDP', pill: 'tp-ud', tag: 'UD', icon: 'udp' }
}

export const STATUS_META: Record<TabStatus, StatusMeta> = {
  idle: { cls: 'st-idle', label: '未连接' },
  connecting: { cls: 'st-connecting', label: '连接中…', pulse: true },
  connected: { cls: 'st-connected', label: '已连接' },
  listening: { cls: 'st-listening', label: '监听中' },
  error: { cls: 'st-error', label: '错误' }
}

const LIVE_STATUSES: TabStatus[] = ['connected', 'listening']

export function isLive(tab: Pick<TabState, 'status'>): boolean {
  return LIVE_STATUSES.includes(tab.status)
}

export type GlobalStatus = { level: 'error' | 'active' | 'idle'; count: number }

export function deriveGlobalStatus(tabs: TabState[]): GlobalStatus {
  const errorCount = tabs.filter((t) => t.status === 'error').length
  if (errorCount > 0) return { level: 'error', count: errorCount }
  const activeCount = tabs.filter((t) => isLive(t)).length
  if (activeCount > 0) return { level: 'active', count: activeCount }
  return { level: 'idle', count: 0 }
}

export function statusLabelFor(tab: TabState, clientCount: number): string {
  if (tab.type === 'tcp-server' && tab.status === 'listening') return `监听中 · ${clientCount} 客户端`
  if (tab.type === 'udp' && tab.status === 'connected') {
    const localPort = 'localPort' in tab.config ? (tab.config as { localPort: number }).localPort : 0
    return `已绑定 · ${localPort}`
  }
  return STATUS_META[tab.status].label
}

export function filterConnections(tabs: TabState[], query: string): TabState[] {
  const q = query.trim().toLowerCase()
  if (!q) return tabs
  return tabs.filter((t) => t.title.toLowerCase().includes(q) || TYPE_META[t.type].label.toLowerCase().includes(q))
}

export interface FilteredGroup { group: QuickSendGroup; items: QuickSendItem[] }

export function filterCommands(groups: QuickSendGroup[], items: QuickSendItem[], query: string): FilteredGroup[] {
  const q = query.trim().toLowerCase()
  const match = (s: string) => s.toLowerCase().includes(q)
  const result: FilteredGroup[] = []
  for (const group of groups) {
    const groupItems = items.filter((it) => it.groupId === group.id)
    const matched = q ? groupItems.filter((it) => match(it.name) || match(it.content)) : groupItems
    if (!q || match(group.name) || matched.length > 0) result.push({ group, items: matched })
  }
  return result
}
