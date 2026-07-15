import * as net from 'net'
import type { TcpServerConfig } from '../../shared/types'
import type { ClientInfo } from '../../shared/types'

export interface TcpServerCallbacks {
  onStatus: (status: string) => void
  onData: (data: Buffer, remote: string) => void
  onError: (message: string) => void
  onClientJoined: (client: ClientInfo) => void
  onClientLeft: (clientId: string) => void
}

export class TcpServerConnection {
  private server: net.Server | null = null
  private clients = new Map<string, net.Socket>()
  private config: TcpServerConfig | null = null
  private callbacks: TcpServerCallbacks | null = null
  private clientCounter = 0

  start(config: TcpServerConfig, callbacks: TcpServerCallbacks): void {
    this.config = config
    this.callbacks = callbacks

    this.server = net.createServer((socket) => {
      const clientId = `client-${++this.clientCounter}-${Date.now()}`
      const remoteAddress = socket.remoteAddress || 'unknown'
      const remotePort = socket.remotePort || 0
      const remote = `${remoteAddress}:${remotePort}`

      this.clients.set(clientId, socket)

      const clientInfo: ClientInfo = { id: clientId, remoteAddress, remotePort }
      callbacks.onClientJoined(clientInfo)

      socket.on('data', (data: Buffer) => {
        callbacks.onData(data, remote)
      })

      socket.on('error', (err: NodeJS.ErrnoException) => {
        callbacks.onError(`[${remote}] ${err.message}`)
      })

      socket.on('close', () => {
        this.clients.delete(clientId)
        callbacks.onClientLeft(clientId)
      })
    })

    this.server.on('error', (err: NodeJS.ErrnoException) => {
      callbacks.onStatus('error')
      if (err.code === 'EADDRINUSE') {
        callbacks.onError('端口已被占用')
      } else {
        callbacks.onError(err.message)
      }
    })

    this.server.listen(config.port, () => {
      callbacks.onStatus('listening')
    })
  }

  send(data: Buffer, clientId?: string | null): void {
    if (clientId) {
      const socket = this.clients.get(clientId)
      if (socket && !socket.destroyed) {
        socket.write(data)
      }
    } else {
      for (const [, socket] of this.clients) {
        if (!socket.destroyed) {
          socket.write(data)
        }
      }
    }
  }

  isRunning(): boolean {
    return this.server !== null && this.server.listening
  }

  stop(): void {
    for (const [, socket] of this.clients) {
      socket.destroy()
      socket.removeAllListeners()
    }
    this.clients.clear()
    if (this.server) {
      this.server.close()
      this.server.removeAllListeners()
      this.server = null
    }
  }
}
