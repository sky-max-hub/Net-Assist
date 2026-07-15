import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/ipc-channels'
import type {
  ConnectPayload,
  DisconnectPayload,
  SendPayload,
  ServerSetTargetPayload,
  StatusPayload,
  DataPayload,
  ErrorPayload,
  ClientJoinedPayload,
  ClientLeftPayload
} from '../shared/ipc-channels'

const electronAPI = {
  // Renderer -> Main (invoke)
  connect: (payload: ConnectPayload): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CONN_CONNECT, payload)
  },

  disconnect: (payload: DisconnectPayload): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CONN_DISCONNECT, payload)
  },

  send: (payload: SendPayload): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CONN_SEND, payload)
  },

  serverSetTarget: (payload: ServerSetTargetPayload): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CONN_SERVER_SET_TARGET, payload)
  },

  // Main -> Renderer (listeners)
  onStatus: (callback: (payload: StatusPayload) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: StatusPayload): void =>
      callback(payload)
    ipcRenderer.on(IPC_CHANNELS.CONN_STATUS, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CONN_STATUS, handler)
  },

  onData: (callback: (payload: DataPayload) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: DataPayload): void =>
      callback(payload)
    ipcRenderer.on(IPC_CHANNELS.CONN_DATA, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CONN_DATA, handler)
  },

  onError: (callback: (payload: ErrorPayload) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: ErrorPayload): void =>
      callback(payload)
    ipcRenderer.on(IPC_CHANNELS.CONN_ERROR, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CONN_ERROR, handler)
  },

  onClientJoined: (callback: (payload: ClientJoinedPayload) => void): (() => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: ClientJoinedPayload
    ): void => callback(payload)
    ipcRenderer.on(IPC_CHANNELS.CONN_CLIENT_JOINED, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CONN_CLIENT_JOINED, handler)
  },

  onClientLeft: (callback: (payload: ClientLeftPayload) => void): (() => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      payload: ClientLeftPayload
    ): void => callback(payload)
    ipcRenderer.on(IPC_CHANNELS.CONN_CLIENT_LEFT, handler)
    return () => ipcRenderer.removeListener(IPC_CHANNELS.CONN_CLIENT_LEFT, handler)
  }
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)
