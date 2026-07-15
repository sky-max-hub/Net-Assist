import type { TabType, TabConfig, ClientInfo } from '../../shared/types'
import type {
  DataPayload
} from '../../shared/ipc-channels'
import { BrowserWindow } from 'electron'

export class ConnectionManager {
  private connections = new Map<
    string,
    { type: TabType; config: TabConfig; cleanup: () => void }
  >()

  constructor(private getMainWindow: () => BrowserWindow | null) {}

  async connect(tabId: string, type: TabType, config: TabConfig): Promise<void> {
    this.disconnect(tabId)
    this.emitStatus(tabId, 'connected')
  }

  disconnect(tabId: string): void {
    const existing = this.connections.get(tabId)
    if (existing) {
      existing.cleanup()
      this.connections.delete(tabId)
    }
  }

  send(tabId: string, data: number[]): void {
    console.log(`send to ${tabId}: ${data.length} bytes (not implemented)`)
  }

  setTarget(tabId: string, clientId: string | null): void {
    console.log(`set target ${tabId} -> ${clientId} (not implemented)`)
  }

  destroyAll(): void {
    for (const tabId of this.connections.keys()) {
      this.disconnect(tabId)
    }
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
