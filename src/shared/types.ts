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
