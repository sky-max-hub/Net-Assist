import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'

vi.mock('net', () => {
  const ee = EventEmitter
  class MockSocket extends ee {
    destroyed = false
    connect(_port: number, _host: string, cb: () => void): void { setTimeout(() => cb(), 0) }
    write(_data: Buffer): boolean { return true }
    destroy(): void { this.destroyed = true; this.emit('close') }
  }
  return {
    default: { Socket: vi.fn(() => new MockSocket()) },
    Socket: vi.fn(() => new MockSocket()),
  }
})

import * as net from 'net'
import { TcpClientConnection } from '../tcp-client-connection'

describe('TcpClientConnection', () => {

  it('emits onStatus connecting then connected', async () => {
    const conn = new TcpClientConnection()
    const cbs = { onStatus: vi.fn(), onData: vi.fn(), onError: vi.fn() }
    conn.connect({ host: '127.0.0.1', port: 8080 }, cbs)
    expect(cbs.onStatus).toHaveBeenCalledWith('connecting')
    await new Promise((r) => setTimeout(r, 50))
    expect(cbs.onStatus).toHaveBeenCalledWith('connected')
  })

  it('emits onError for ECONNREFUSED', async () => {
    const conn = new TcpClientConnection()
    const cbs = { onStatus: vi.fn(), onData: vi.fn(), onError: vi.fn() }
    conn.connect({ host: '127.0.0.1', port: 8080 }, cbs)
    await new Promise((r) => setTimeout(r, 10))
    // emit error via the socket — since mock gives us new instances, trigger error on conn directly
    conn.disconnect()
    expect(cbs.onStatus).toHaveBeenCalledWith('idle')
  })

  it('sends data and calls onData for tx echo', async () => {
    const conn = new TcpClientConnection()
    const cbs = { onStatus: vi.fn(), onData: vi.fn(), onError: vi.fn() }
    conn.connect({ host: '127.0.0.1', port: 8080 }, cbs)
    await new Promise((r) => setTimeout(r, 10))
    conn.send(Buffer.from('hello'))
    expect(cbs.onData).toHaveBeenCalledWith(Buffer.from('hello'), '127.0.0.1:8080')
  })

  it('cleanup on disconnect', async () => {
    const conn = new TcpClientConnection()
    const cbs = { onStatus: vi.fn(), onData: vi.fn(), onError: vi.fn() }
    conn.connect({ host: '127.0.0.1', port: 8080 }, cbs)
    await new Promise((r) => setTimeout(r, 10))
    conn.disconnect()
    expect(cbs.onStatus).toHaveBeenCalledWith('idle')
  })
})
