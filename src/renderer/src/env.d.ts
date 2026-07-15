/// <reference types="vite/client" />

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
} from '../../shared/ipc-channels'

type Unsubscribe = () => void

interface Window {
  electronAPI: {
    connect: (payload: ConnectPayload) => Promise<void>
    disconnect: (payload: DisconnectPayload) => Promise<void>
    send: (payload: SendPayload) => Promise<void>
    serverSetTarget: (payload: ServerSetTargetPayload) => Promise<void>
    onStatus: (callback: (payload: StatusPayload) => void) => Unsubscribe
    onData: (callback: (payload: DataPayload) => void) => Unsubscribe
    onError: (callback: (payload: ErrorPayload) => void) => Unsubscribe
    onClientJoined: (callback: (payload: ClientJoinedPayload) => void) => Unsubscribe
    onClientLeft: (callback: (payload: ClientLeftPayload) => void) => Unsubscribe
  }
}
