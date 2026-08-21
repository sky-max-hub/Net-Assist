import { describe, it, expect } from 'vitest'
import type { TabState } from '../../shared/types'
import { deriveGlobalStatus, isLive, statusLabelFor, filterConnections, filterCommands } from '../tab-meta'

function tab(over: Partial<TabState>): TabState {
  return {
    id: 't', title: 'T', type: 'tcp-client', status: 'idle',
    config: { host: '127.0.0.1', port: 1 }, messages: [],
    sendOptions: { encoding: 'utf-8', displayMode: 'text', lfToCr: false, splitView: false },
    ...over
  }
}

describe('tab-meta 派生逻辑', () => {
  it('deriveGlobalStatus: error 优先 → active → idle', () => {
    expect(deriveGlobalStatus([tab({ status: 'error' })]).level).toBe('error')
    expect(deriveGlobalStatus([tab({ status: 'error' }), tab({ status: 'connected' })]).level).toBe('error')
    expect(deriveGlobalStatus([tab({ status: 'connected' }), tab({ status: 'listening' })]).level).toBe('active')
    expect(deriveGlobalStatus([tab({ status: 'idle' })]).level).toBe('idle')
    expect(deriveGlobalStatus([tab({ status: 'connected' })]).count).toBe(1)
  })
  it('isLive: connected/listening 为活跃', () => {
    expect(isLive(tab({ status: 'connected' }))).toBe(true)
    expect(isLive(tab({ status: 'listening' }))).toBe(true)
    expect(isLive(tab({ status: 'idle' }))).toBe(false)
  })
  it('statusLabelFor: tcp-server 监听与 udp 绑定特例', () => {
    expect(statusLabelFor(tab({ type: 'tcp-server', status: 'listening' }), 2)).toBe('监听中 · 2 客户端')
    expect(statusLabelFor(tab({ type: 'udp', status: 'connected', config: { localPort: 9000, targetHost: '127.0.0.1', targetPort: 1 } }), 0)).toBe('已绑定 · 9000')
    expect(statusLabelFor(tab({ status: 'connected' }), 0)).toBe('已连接')
  })
  it('filterConnections: 按标题或类型标签匹配', () => {
    const tabs = [tab({ id: 'a', title: '串口助手', type: 'udp' }), tab({ id: 'b', title: 'TCP Client 1' })]
    expect(filterConnections(tabs, '串口')).toHaveLength(1)
    expect(filterConnections(tabs, 'udp')).toHaveLength(1)
    expect(filterConnections(tabs, 'zzz')).toHaveLength(0)
    expect(filterConnections(tabs, '')).toHaveLength(2)
  })
  it('filterCommands: 组名匹配或组内指令匹配时保留', () => {
    const groups = [{ id: 'g1', name: 'Modbus' }, { id: 'g2', name: '其他' }]
    const items = [
      { id: 'i1', name: '读寄存器', content: '01 03', groupId: 'g1' },
      { id: 'i2', name: '心跳', content: 'AT+PING', groupId: 'g2' }
    ]
    const res = filterCommands(groups, items, 'AT+')
    expect(res).toHaveLength(1)
    expect(res[0].group.id).toBe('g2')
    expect(res[0].items).toHaveLength(1)
    expect(filterCommands(groups, items, '')).toHaveLength(2)
  })
})
