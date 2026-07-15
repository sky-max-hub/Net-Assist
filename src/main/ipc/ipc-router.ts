import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/ipc-channels'
import type {
  ConnectPayload,
  DisconnectPayload,
  SendPayload,
  ServerSetTargetPayload
} from '../../shared/ipc-channels'
import { ConnectionManager } from '../connections/connection-manager'

export function registerIpcHandlers(connectionManager: ConnectionManager): void {
  ipcMain.handle(
    IPC_CHANNELS.CONN_CONNECT,
    async (_event, payload: ConnectPayload) => {
      await connectionManager.connect(payload.tabId, payload.type, payload.config)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONN_DISCONNECT,
    async (_event, payload: DisconnectPayload) => {
      connectionManager.disconnect(payload.tabId)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONN_SEND,
    async (_event, payload: SendPayload) => {
      connectionManager.send(payload.tabId, payload.data)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.CONN_SERVER_SET_TARGET,
    async (_event, payload: ServerSetTargetPayload) => {
      connectionManager.setTarget(payload.tabId, payload.clientId)
    }
  )
}

export function unregisterIpcHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.CONN_CONNECT)
  ipcMain.removeHandler(IPC_CHANNELS.CONN_DISCONNECT)
  ipcMain.removeHandler(IPC_CHANNELS.CONN_SEND)
  ipcMain.removeHandler(IPC_CHANNELS.CONN_SERVER_SET_TARGET)
}
