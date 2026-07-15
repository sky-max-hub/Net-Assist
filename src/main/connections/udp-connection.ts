import * as dgram from 'dgram'
import type { UdpConfig } from '../../shared/types'

export interface UdpCallbacks {
  onStatus: (status: string) => void
  onData: (data: Buffer, remote: string) => void
  onError: (message: string) => void
}

export class UdpConnection {
  private socket: dgram.Socket | null = null
  private config: UdpConfig | null = null
  private callbacks: UdpCallbacks | null = null

  bind(config: UdpConfig, callbacks: UdpCallbacks): void {
    this.config = config
    this.callbacks = callbacks
    this.socket = dgram.createSocket('udp4')

    this.socket.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
      callbacks.onData(data, `${rinfo.address}:${rinfo.port}`)
    })

    this.socket.on('error', (err: NodeJS.ErrnoException) => {
      callbacks.onStatus('error')
      if (err.code === 'EADDRINUSE') {
        callbacks.onError('端口已被占用')
      } else {
        callbacks.onError(err.message)
      }
    })

    this.socket.on('close', () => {
      callbacks.onStatus('idle')
    })

    this.socket.bind(config.localPort, () => {
      callbacks.onStatus('connected')
    })
  }

  send(data: Buffer): void {
    if (!this.socket || !this.config) return
    this.socket.send(data, this.config.targetPort, this.config.targetHost, (err) => {
      if (err && this.callbacks) {
        this.callbacks.onError(err.message)
      }
    })
    if (this.callbacks) {
      const remote = `${this.config.targetHost}:${this.config.targetPort}`
      this.callbacks.onData(data, remote)
    }
  }

  isBound(): boolean {
    return this.socket !== null
  }

  close(): void {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.close()
      this.socket = null
    }
  }
}
