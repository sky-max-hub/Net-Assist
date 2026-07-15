import type { TabType, TabConfig, ClientInfo } from '../../shared/types'
import type {
  DataPayload
} from '../../shared/ipc-channels'
import { BrowserWindow } from 'electron'
import { TcpClientConnection } from './tcp-client-connection'
import type { TcpClientConfig } from '../../shared/types'

export class ConnectionManager {
  private connections = new Map<
    string,
    { type: TabType; config: TabConfig; cleanup: () => void }
  >()
  private tcpClients = new Map<string, TcpClientConnection>()

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
    }
  }

  setTarget(tabId: string, clientId: string | null): void {
    console.log(`set target ${tabId} -> ${clientId} (not implemented)`)
  }

  destroyAll(): void {
    for (const tabId of this.connections.keys()) {
      this.disconnect(tabId)
    }
    this.tcpClients.clear()
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
