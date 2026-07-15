import type { TabType, TabStatus, TabConfig, ClientInfo, PersistedTab } from './types'

// ---- Channel 名称常量 ----
export const IPC_CHANNELS = {
  // Renderer -> Main (invoke)
  CONN_CONNECT: 'conn:connect',
  CONN_DISCONNECT: 'conn:disconnect',
  CONN_SEND: 'conn:send',
  CONN_SERVER_SET_TARGET: 'conn:server-set-target',

  // Main -> Renderer (send)
  CONN_STATUS: 'conn:status',
  CONN_DATA: 'conn:data',
  CONN_ERROR: 'conn:error',
  CONN_CLIENT_JOINED: 'conn:client-joined',
  CONN_CLIENT_LEFT: 'conn:client-left',

  // Renderer -> Main (invoke — requires return value)
  STORE_LOAD_TABS: 'store:load-tabs',

  // Renderer -> Main (send — one-way notification)
  STORE_SAVE_TABS: 'store:save-tabs'
} as const

// ---- Renderer -> Main Payloads ----
export interface ConnectPayload {
  tabId: string
  type: TabType
  config: TabConfig
}

export interface DisconnectPayload {
  tabId: string
}

export interface SendPayload {
  tabId: string
  data: number[] // raw bytes as number array (ArrayBuffer 无法直接序列化)
}

export interface ServerSetTargetPayload {
  tabId: string
  clientId: string | null // null = broadcast
}

// ---- Main -> Renderer Payloads ----
export interface StatusPayload {
  tabId: string
  status: TabStatus
}

export interface DataPayload {
  tabId: string
  direction: 'tx' | 'rx'
  remote: string
  data: number[] // raw bytes
  timestamp: number
}

export interface ErrorPayload {
  tabId: string
  message: string
}

export interface ClientJoinedPayload {
  tabId: string
  client: ClientInfo
}

export interface ClientLeftPayload {
  tabId: string
  clientId: string
}

// ---- Store Payloads ----
export interface SaveTabsPayload {
  tabs: PersistedTab[]
}
