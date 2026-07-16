export type TabType = 'tcp-client' | 'tcp-server' | 'udp'

export type TabStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'error'

export type MessageDirection = 'tx' | 'rx'

export type EncodingMode = 'ascii' | 'utf-8' | 'gbk'

export type DisplayMode = 'text' | 'hex'

export type LineEnding = '\r\n' | '\n' | '\r'

export interface Message {
  id: string
  timestamp: number
  direction: MessageDirection
  remote: string // "192.168.1.1:502"
  byteLength: number
  raw: ArrayBuffer
  text: string // pre-decoded text
}

export interface TcpClientConfig {
  host: string
  port: number
}

export interface TcpServerConfig {
  port: number
}

export interface UdpConfig {
  localPort: number
  targetHost: string
  targetPort: number
}

export type TabConfig = TcpClientConfig | TcpServerConfig | UdpConfig

export interface TabState {
  id: string
  title: string
  type: TabType
  status: TabStatus
  config: TabConfig
  messages: Message[]
  sendOptions: SendOptions
}

export interface SendOptions {
  encoding: EncodingMode
  displayMode: DisplayMode
  lfToCr: boolean
}

export interface QuickSendItem {
  id: string
  name: string
  content: string
}

export interface ClientInfo {
  id: string
  remoteAddress: string
  remotePort: number
}

export interface PersistedTab {
  id: string
  title: string
  type: TabType
  config: TabConfig
  sendOptions: SendOptions
}
