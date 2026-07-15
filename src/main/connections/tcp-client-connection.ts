import * as net from 'net'
import type { TcpClientConfig } from '../../shared/types'

export interface TcpClientCallbacks {
  onStatus: (status: string) => void
  onData: (data: Buffer, remote: string) => void
  onError: (message: string) => void
}

const CONNECT_TIMEOUT = 10_000

export class TcpClientConnection {
  private socket: net.Socket | null = null
  private config: TcpClientConfig | null = null
  private callbacks: TcpClientCallbacks | null = null
  private connectTimer: ReturnType<typeof setTimeout> | null = null

  connect(config: TcpClientConfig, callbacks: TcpClientCallbacks): void {
    this.config = config
    this.callbacks = callbacks

    this.socket = new net.Socket()
    callbacks.onStatus('connecting')

    this.connectTimer = setTimeout(() => {
      this.cleanup()
      callbacks.onStatus('error')
      callbacks.onError('连接超时')
    }, CONNECT_TIMEOUT)

    this.socket.connect(config.port, config.host, () => {
      if (this.connectTimer) {
        clearTimeout(this.connectTimer)
        this.connectTimer = null
      }
      callbacks.onStatus('connected')
    })

    this.socket.on('data', (data: Buffer) => {
      const remote = `${config.host}:${config.port}`
      callbacks.onData(data, remote)
    })

    this.socket.on('error', (err: NodeJS.ErrnoException) => {
      if (this.connectTimer) {
        clearTimeout(this.connectTimer)
        this.connectTimer = null
      }
      callbacks.onStatus('error')
      if (err.code === 'ECONNREFUSED') {
        callbacks.onError('连接被拒绝')
      } else if (err.code === 'ETIMEDOUT') {
        callbacks.onError('连接超时')
      } else {
        callbacks.onError(err.message)
      }
    })

    this.socket.on('close', () => {
      callbacks.onStatus('idle')
    })
  }

  send(data: Buffer): void {
    if (this.socket && !this.socket.destroyed) {
      this.socket.write(data)
      if (this.callbacks && this.config) {
        const remote = `${this.config.host}:${this.config.port}`
        this.callbacks.onData(data, remote)
      }
    }
  }

  isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed
  }

  disconnect(): void {
    this.cleanup()
  }

  private cleanup(): void {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer)
      this.connectTimer = null
    }
    if (this.socket) {
      this.socket.destroy()
      this.socket.removeAllListeners()
      this.socket = null
    }
  }
}
