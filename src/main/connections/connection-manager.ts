import type { TabType, TabConfig, ClientInfo } from '../../shared/types'
import type { DataPayload } from '../../shared/ipc-channels'
import { BrowserWindow } from 'electron'
import { TcpClientConnection } from './tcp-client-connection'
import { TcpServerConnection } from './tcp-server-connection'
import { UdpConnection } from './udp-connection'
import type { TcpClientConfig, TcpServerConfig, UdpConfig } from '../../shared/types'

export class ConnectionManager {
  private connections = new Map<
    string,
    { type: TabType; config: TabConfig; cleanup: () => void }
  >()
  private tcpClients = new Map<string, TcpClientConnection>()
  private tcpServers = new Map<string, TcpServerConnection>()
  private serverTargets = new Map<string, string | null>()
  private udpSockets = new Map<string, UdpConnection>()

  constructor(private getMainWindow: () => BrowserWindow | null) {}

  async connect(tabId: string, type: TabType, config: TabConfig): Promise<void> {
    this.disconnect(tabId)

    if (type === 'tcp-client') {
      const tcpConfig = config as TcpClientConfig
      const tcpClient = new TcpClientConnection()
      this.tcpClients.set(tabId, tcpClient)

      this.connections.set(tabId, {
        type,
        config,
        cleanup: () => {
          tcpClient.disconnect()
          this.tcpClients.delete(tabId)
        }
      })

      tcpClient.connect(tcpConfig, {
        onStatus: (status) => {
          this.emitStatus(tabId, status)
        },
        onData: (data: Buffer, remote: string) => {
          this.emitData(tabId, {
            direction: 'rx',
            remote,
            data: Array.from(data),
            timestamp: Date.now()
          })
        },
        onError: (message: string) => {
          this.emitError(tabId, message)
        }
      })
    } else if (type === 'tcp-server') {
      const srvConfig = config as TcpServerConfig
      const tcpServer = new TcpServerConnection()
      this.tcpServers.set(tabId, tcpServer)
      this.serverTargets.set(tabId, null)

      this.connections.set(tabId, {
        type,
        config,
        cleanup: () => {
          tcpServer.stop()
          this.tcpServers.delete(tabId)
          this.serverTargets.delete(tabId)
        }
      })

      tcpServer.start(srvConfig, {
        onStatus: (status) => this.emitStatus(tabId, status),
        onData: (data: Buffer, remote: string) => {
          this.emitData(tabId, { direction: 'rx', remote, data: Array.from(data), timestamp: Date.now() })
        },
        onError: (message: string) => this.emitError(tabId, message),
        onClientJoined: (client: ClientInfo) => this.emitClientJoined(tabId, client),
        onClientLeft: (clientId: string) => this.emitClientLeft(tabId, clientId)
      })
    } else if (type === 'udp') {
      const udpConfig = config as UdpConfig
      const udpConn = new UdpConnection()
      this.udpSockets.set(tabId, udpConn)

      this.connections.set(tabId, {
        type,
        config,
        cleanup: () => {
          udpConn.close()
          this.udpSockets.delete(tabId)
        }
      })

      udpConn.bind(udpConfig, {
        onStatus: (status) => this.emitStatus(tabId, status),
        onData: (data: Buffer, remote: string) => {
          this.emitData(tabId, { direction: 'rx', remote, data: Array.from(data), timestamp: Date.now() })
        },
        onError: (message: string) => this.emitError(tabId, message)
      })
    }
  }

  disconnect(tabId: string): void {
    const existing = this.connections.get(tabId)
    if (existing) {
      existing.cleanup()
      this.connections.delete(tabId)
    }
  }

  send(tabId: string, data: number[]): void {
    const buffer = Buffer.from(data)
    const conn = this.connections.get(tabId)
    if (!conn) return

    if (conn.type === 'tcp-client') {
      const tcpClient = this.tcpClients.get(tabId)
      if (tcpClient?.isConnected()) {
        const tcpConfig = conn.config as TcpClientConfig
        tcpClient.send(buffer)
        this.emitData(tabId, {
          direction: 'tx',
          remote: `${tcpConfig.host}:${tcpConfig.port}`,
          data: data,
          timestamp: Date.now()
        })
      }
    } else if (conn.type === 'tcp-server') {
      const tcpServer = this.tcpServers.get(tabId)
      if (tcpServer?.isRunning()) {
        const targetClientId = this.serverTargets.get(tabId) ?? null
        tcpServer.send(buffer, targetClientId)
        this.emitData(tabId, {
          direction: 'tx',
          remote: targetClientId || 'broadcast',
          data: data,
          timestamp: Date.now()
        })
      }
    } else if (conn.type === 'udp') {
      const udpConn = this.udpSockets.get(tabId)
      if (udpConn?.isBound()) {
        udpConn.send(buffer)
        const udpConfig = conn.config as UdpConfig
        this.emitData(tabId, {
          direction: 'tx',
          remote: `${udpConfig.targetHost}:${udpConfig.targetPort}`,
          data: data,
          timestamp: Date.now()
        })
      }
    }
  }

  setTarget(tabId: string, clientId: string | null): void {
    this.serverTargets.set(tabId, clientId)
  }

  destroyAll(): void {
    for (const tabId of this.connections.keys()) {
      this.disconnect(tabId)
    }
    this.tcpClients.clear()
    this.tcpServers.clear()
    this.serverTargets.clear()
    this.udpSockets.clear()
  }

  private emit(tabId: string, channel: string, payload: Record<string, unknown>): void {
    const win = this.getMainWindow()
    if (win && !win.isDestroyed()) {
      win.webContents.send(channel, { tabId, ...payload })
    }
  }

  emitStatus(tabId: string, status: string): void {
    this.emit(tabId, 'conn:status', { status })
  }

  emitData(tabId: string, payload: Omit<DataPayload, 'tabId'>): void {
    this.emit(tabId, 'conn:data', payload as unknown as Record<string, unknown>)
  }

  emitError(tabId: string, message: string): void {
    this.emit(tabId, 'conn:error', { message })
  }

  emitClientJoined(tabId: string, client: ClientInfo): void {
    this.emit(tabId, 'conn:client-joined', { client } as unknown as Record<string, unknown>)
  }

  emitClientLeft(tabId: string, clientId: string): void {
    this.emit(tabId, 'conn:client-left', { clientId })
  }
}
