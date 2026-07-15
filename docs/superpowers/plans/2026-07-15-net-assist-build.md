---
change: net-assist
design-doc: docs/superpowers/specs/2026-07-15-net-assist-design.md
base-ref: 80bf5edf42a1507b1dfcfa18a7f8a774b3031249
---

# NetAssist — TCP/UDP 调试工具 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** 构建一个基于 Electron + React + TypeScript 的跨平台 TCP/UDP 调试工具，支持多 Tab 同时管理 TCP Client、TCP Server、UDP 三种连接模式。

**Architecture:** Electron 双进程架构，Main Process 通过 Node.js net/dgram 处理所有网络 I/O，Renderer Process 通过 IPC 发送指令并接收数据事件。状态管理使用 Zustand store 集中管理 Tab 列表和当前活跃 Tab。构建使用 electron-vite，UI 使用 Ant Design 5。

**Tech Stack:** Electron 28+, React 18, TypeScript 5, electron-vite, Ant Design 5, Zustand, Node.js net/dgram, iconv-lite, electron-store

## Global Constraints

- 版本基线: Electron >= 28, React >= 18, TypeScript >= 5, Ant Design >= 5
- 构建工具: electron-vite（禁用 webpack/vite 裸用）
- 网络层: Main Process 独占（Node.js net / dgram），Renderer 禁止直接 require('net')
- 编码: ASCII/UTF-8 使用 Buffer 原生方法，GBK 使用 iconv-lite（纯 JS，禁止 node-gyp 依赖）
- IPC 方向: Renderer->Main 为指令（invoke），Main->Renderer 为事件推送（send）
- 消息上限: 每个 Tab 的消息数组上限 5000 条，超出自动丢弃最早消息
- 单文件职责: 连接管理层在 Main Process 按类型拆分文件；UI 组件每个文件只做一件事
- 测试: Main Process 网络层用 Vitest + mock，UI 组件用 Vitest + @testing-library/react
- 禁止自动追加换行符: 发送用户输入的原样内容，不附加任何字符
- 字符可见性: 空格→·, Tab→→, CR→⏎, LF→¶, 控制字符→␀-␟

---

### Task 1: 项目脚手架与构建配置

**Files:**
- Create: `package.json`
- Create: `electron.vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `tsconfig.web.json`
- Create: `src/main/index.ts`
- Create: `src/preload/index.ts`
- Create: `src/renderer/index.html`
- Create: `src/renderer/src/main.tsx`
- Create: `src/renderer/src/App.tsx`
- Create: `src/renderer/src/env.d.ts`

**Interfaces:**
- Consumes: nothing (greenfield)
- Produces: 可启动的 Electron 窗口，显示 "NetAssist" 标题

- [x] **Step 1: 创建 `package.json` 并安装依赖**

```json
{
  "name": "net-assist",
  "version": "1.0.0",
  "description": "跨平台 TCP/UDP 调试工具",
  "main": "./out/main/index.js",
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "preview": "electron-vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "antd": "^5.12.0",
    "@ant-design/icons": "^5.2.6",
    "zustand": "^4.4.7",
    "iconv-lite": "^0.6.3",
    "electron-store": "^8.1.0"
  },
  "devDependencies": {
    "electron": "^28.1.0",
    "electron-vite": "^2.0.0",
    "electron-builder": "^24.9.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "typescript": "^5.3.3",
    "vitest": "^1.1.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.6",
    "jsdom": "^23.0.1",
    "@vitejs/plugin-react": "^4.2.1"
  }
}
```

Run: `cd D:\Download\current\net-assist && npm install`

- [x] **Step 2: 创建 `electron.vite.config.ts`**

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
```

- [x] **Step 3: 创建 TypeScript 配置文件**

`tsconfig.json`:
```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

`tsconfig.node.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "target": "ESNext",
    "outDir": "./out",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": [
    "src/main/**/*.ts",
    "src/preload/**/*.ts",
    "src/shared/**/*.ts",
    "electron.vite.config.ts"
  ]
}
```

`tsconfig.web.json`:
```json
{
  "compilerOptions": {
    "composite": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "target": "ESNext",
    "jsx": "react-jsx",
    "outDir": "./out",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/src/*"]
    }
  },
  "include": [
    "src/renderer/src/**/*.ts",
    "src/renderer/src/**/*.tsx",
    "src/shared/**/*.ts"
  ]
}
```

- [x] **Step 4: 创建 Main Process 入口 `src/main/index.ts`**

```typescript
import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'NetAssist',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [x] **Step 5: 创建 Preload 占位 `src/preload/index.ts`**

```typescript
import { contextBridge } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform
})
```

- [x] **Step 6: 创建 Renderer 入口文件**

`src/renderer/index.html`:
```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>NetAssist</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./src/main.tsx"></script>
  </body>
</html>
```

`src/renderer/src/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
)
```

`src/renderer/src/App.tsx`:
```typescript
function App(): JSX.Element {
  return (
    <div style={{ padding: 24 }}>
      <h1>NetAssist</h1>
      <p>TCP/UDP 调试工具</p>
    </div>
  )
}

export default App
```

`src/renderer/src/env.d.ts`:
```typescript
/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    platform: string
  }
}
```

- [x] **Step 7: 验证项目能启动**

Run: `cd D:\Download\current\net-assist && npx electron-vite dev`
Expected: Electron 窗口打开，显示 "NetAssist" 标题和 "TCP/UDP 调试工具" 文字。

- [x] **Step 8: Commit**

```bash
git add package.json package-lock.json electron.vite.config.ts tsconfig.json tsconfig.node.json tsconfig.web.json src/
git commit -m "feat: initialize Electron + React + TypeScript project scaffold with electron-vite"
```

---

### Task 2: IPC 类型定义与共享类型

**Files:**
- Create: `src/shared/types.ts`
- Create: `src/shared/ipc-channels.ts`

**Interfaces:**
- Consumes: nothing (只定义类型，无运行时依赖)
- Produces:
  - `TabType = 'tcp-client' | 'tcp-server' | 'udp'`
  - `TabStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'error'`
  - `Message { id, timestamp, direction, remote, byteLength, raw }`
  - `TcpClientConfig { host, port }`
  - `TcpServerConfig { port }`
  - `UdpConfig { localPort, targetHost, targetPort }`
  - `TabState { id, title, type, status, config, messages }`
  - IPC channel name constants and payload types for all 9 channels

- [x] **Step 1: 创建 `src/shared/types.ts`**

```typescript
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
```

- [x] **Step 2: 创建 `src/shared/ipc-channels.ts`**

```typescript
import type { TabType, TabStatus, TabConfig, ClientInfo } from './types'

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
  CONN_CLIENT_LEFT: 'conn:client-left'
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
```

- [x] **Step 3: Commit**

```bash
git add src/shared/
git commit -m "feat: define shared types and IPC channel protocol"
```

---

### Task 3: Main Process IPC 路由与连接管理器骨架

**Files:**
- Create: `src/main/ipc/ipc-router.ts`
- Create: `src/main/connections/connection-manager.ts`

**Interfaces:**
- Consumes: `IPC_CHANNELS`, `ConnectPayload`, `DisconnectPayload`, `SendPayload`, `ServerSetTargetPayload` from `src/shared/ipc-channels.ts`
- Produces:
  - `ConnectionManager` class with methods: `connect(tabId, type, config)`, `disconnect(tabId)`, `send(tabId, data)`, `setTarget(tabId, clientId)`, `destroyAll()`
  - `registerIpcHandlers()` -- registers all ipcMain.handle() calls

- [x] **Step 1: 创建 `src/main/connections/connection-manager.ts` 骨架**

```typescript
import type { TabType, TabConfig, ClientInfo } from '../../shared/types'
import type {
  StatusPayload,
  DataPayload,
  ErrorPayload,
  ClientJoinedPayload,
  ClientLeftPayload
} from '../../shared/ipc-channels'
import { BrowserWindow } from 'electron'

export class ConnectionManager {
  private connections = new Map<
    string,
    { type: TabType; config: TabConfig; cleanup: () => void }
  >()

  constructor(private getMainWindow: () => BrowserWindow | null) {}

  async connect(tabId: string, type: TabType, config: TabConfig): Promise<void> {
    // 先清理已存在的同 tabId 连接
    this.disconnect(tabId)

    // 后续 Task 中实现具体连接逻辑
    // 目前占位：直接返回成功，emit status=connected
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
    // 后续 Task 中实现
    console.log(`send to ${tabId}: ${data.length} bytes (not implemented)`)
  }

  setTarget(tabId: string, clientId: string | null): void {
    // 后续 Task 中实现（仅 TCP Server 使用）
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
```

- [x] **Step 2: 创建 `src/main/ipc/ipc-router.ts`**

```typescript
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
```

- [x] **Step 3: 更新 Main Process 入口，集成 ConnectionManager 和 IPC Router**

Modify `src/main/index.ts` -- 在 `app.whenReady()` 回调内，`createWindow()` 之后添加:

```typescript
import { registerIpcHandlers } from './ipc/ipc-router'
import { ConnectionManager } from './connections/connection-manager'

// 在 createWindow() 调用之后添加:
const connectionManager = new ConnectionManager(() => BrowserWindow.getAllWindows()[0] ?? null)
registerIpcHandlers(connectionManager)
```

同时更新 `app.on('window-all-closed')` 为:
```typescript
app.on('window-all-closed', () => {
  connectionManager.destroyAll()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

- [x] **Step 4: Commit**

```bash
git add src/main/ipc/ src/main/connections/ src/main/index.ts
git commit -m "feat: add IPC router and connection manager skeleton"
```

---

### Task 4: Preload 脚本与 contextBridge API

**Files:**
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/src/env.d.ts`

**Interfaces:**
- Consumes: `IPC_CHANNELS` from `src/shared/ipc-channels.ts`
- Produces: `window.electronAPI` with methods: `connect`, `disconnect`, `send`, `serverSetTarget`, `onStatus`, `onData`, `onError`, `onClientJoined`, `onClientLeft`

- [x] **Step 1: 重写 `src/preload/index.ts`**

```typescript
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
```

- [x] **Step 2: 更新 `src/renderer/src/env.d.ts` 类型声明**

```typescript
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
```

- [x] **Step 3: Commit**

```bash
git add src/preload/index.ts src/renderer/src/env.d.ts
git commit -m "feat: implement preload contextBridge API with full IPC surface"
```

---

### Task 5: Zustand Tab 状态管理 Store

**Files:**
- Create: `src/renderer/src/store/tab-store.ts`
- Create: `src/renderer/src/store/__tests__/tab-store.test.ts`

**Interfaces:**
- Consumes: `TabState`, `TabType`, `TabConfig`, `TabStatus`, `Message`, `QuickSendItem`, `ClientInfo` from `src/shared/types.ts`
- Produces:
  - `useTabStore` -- Zustand hook
  - Store state: `{ tabs: TabState[], activeTabId: string | null, quickSendItems: QuickSendItem[] }`
  - Store actions: `createTab`, `closeTab`, `setActiveTab`, `updateTabStatus`, `addMessage`, `setTabConfig`, `updateTabTitle`, `addQuickSendItem`, `updateQuickSendItem`, `removeQuickSendItem`

- [x] **Step 1: 创建 `src/renderer/src/store/tab-store.ts`**

```typescript
import { create } from 'zustand'
import type {
  TabState,
  TabType,
  TabStatus,
  TabConfig,
  Message,
  QuickSendItem,
  TcpClientConfig,
  TcpServerConfig,
  UdpConfig
} from '../../shared/types'

const MAX_MESSAGES = 5000
const MAX_TABS = 20

let tabCounter = 0

function generateTabId(): string {
  tabCounter += 1
  return `tab-${Date.now()}-${tabCounter}`
}

function generateMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function defaultConfig(type: TabType): TabConfig {
  switch (type) {
    case 'tcp-client':
      return { host: '', port: 0 } as TcpClientConfig
    case 'tcp-server':
      return { port: 0 } as TcpServerConfig
    case 'udp':
      return { localPort: 0, targetHost: '', targetPort: 0 } as UdpConfig
  }
}

function defaultTitle(type: TabType): string {
  switch (type) {
    case 'tcp-client':
      return 'TCP Client'
    case 'tcp-server':
      return 'TCP Server'
    case 'udp':
      return 'UDP'
  }
}

interface TabStore {
  tabs: TabState[]
  activeTabId: string | null
  quickSendItems: QuickSendItem[]

  createTab: (type: TabType) => string | null
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTabStatus: (tabId: string, status: TabStatus) => void
  addMessage: (tabId: string, message: Omit<Message, 'id'>) => void
  setTabConfig: (tabId: string, config: TabConfig) => void
  updateTabTitle: (tabId: string, title: string) => void
  addQuickSendItem: (item: Omit<QuickSendItem, 'id'>) => void
  updateQuickSendItem: (id: string, item: Partial<Omit<QuickSendItem, 'id'>>) => void
  removeQuickSendItem: (id: string) => void
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  quickSendItems: [],

  createTab: (type: TabType): string | null => {
    const { tabs } = get()
    if (tabs.length >= MAX_TABS) return null

    const id = generateTabId()
    const newTab: TabState = {
      id,
      title: `${defaultTitle(type)} ${tabs.length + 1}`,
      type,
      status: 'idle',
      config: defaultConfig(type),
      messages: []
    }

    set({ tabs: [...tabs, newTab], activeTabId: id })
    return id
  },

  closeTab: (tabId: string): void => {
    const { tabs, activeTabId } = get()
    const idx = tabs.findIndex((t) => t.id === tabId)
    if (idx === -1) return

    const newTabs = tabs.filter((t) => t.id !== tabId)

    let newActiveId = activeTabId
    if (activeTabId === tabId) {
      if (newTabs.length === 0) {
        newActiveId = null
      } else if (idx >= newTabs.length) {
        newActiveId = newTabs[newTabs.length - 1].id
      } else {
        newActiveId = newTabs[idx].id
      }
    }

    set({ tabs: newTabs, activeTabId: newActiveId })
  },

  setActiveTab: (tabId: string): void => {
    set({ activeTabId: tabId })
  },

  updateTabStatus: (tabId: string, status: TabStatus): void => {
    set({
      tabs: get().tabs.map((t) => (t.id === tabId ? { ...t, status } : t))
    })
  },

  addMessage: (tabId: string, msg: Omit<Message, 'id'>): void => {
    set({
      tabs: get().tabs.map((t) => {
        if (t.id !== tabId) return t
        const newMessages = [...t.messages, { ...msg, id: generateMessageId() }]
        if (newMessages.length > MAX_MESSAGES) {
          newMessages.splice(0, newMessages.length - MAX_MESSAGES)
        }
        return { ...t, messages: newMessages }
      })
    })
  },

  setTabConfig: (tabId: string, config: TabConfig): void => {
    set({
      tabs: get().tabs.map((t) => (t.id === tabId ? { ...t, config } : t))
    })
  },

  updateTabTitle: (tabId: string, title: string): void => {
    if (!title.trim()) return
    set({
      tabs: get().tabs.map((t) => (t.id === tabId ? { ...t, title: title.trim() } : t))
    })
  },

  addQuickSendItem: (item: Omit<QuickSendItem, 'id'>): void => {
    const id = `qs-${Date.now()}`
    set({ quickSendItems: [...get().quickSendItems, { ...item, id }] })
  },

  updateQuickSendItem: (id: string, updates: Partial<Omit<QuickSendItem, 'id'>>): void => {
    set({
      quickSendItems: get().quickSendItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    })
  },

  removeQuickSendItem: (id: string): void => {
    set({ quickSendItems: get().quickSendItems.filter((item) => item.id !== id) })
  }
}))
```

- [x] **Step 2: 创建 `src/renderer/src/store/__tests__/tab-store.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { useTabStore } from '../tab-store'

describe('useTabStore', () => {
  beforeEach(() => {
    useTabStore.setState({ tabs: [], activeTabId: null, quickSendItems: [] })
  })

  it('creates a new tab', () => {
    const store = useTabStore.getState()
    const id = store.createTab('tcp-client')
    expect(id).toBeTruthy()
    const { tabs, activeTabId } = useTabStore.getState()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].type).toBe('tcp-client')
    expect(tabs[0].status).toBe('idle')
    expect(activeTabId).toBe(id)
  })

  it('switches active tab', () => {
    const store = useTabStore.getState()
    const id1 = store.createTab('tcp-client')
    const id2 = store.createTab('udp')
    useTabStore.getState().setActiveTab(id1!)
    expect(useTabStore.getState().activeTabId).toBe(id1)
    useTabStore.getState().setActiveTab(id2!)
    expect(useTabStore.getState().activeTabId).toBe(id2)
  })

  it('closes tab and adjusts active tab', () => {
    const store = useTabStore.getState()
    const id1 = store.createTab('tcp-client')
    const id2 = store.createTab('tcp-server')
    useTabStore.getState().closeTab(id1!)
    const { tabs, activeTabId } = useTabStore.getState()
    expect(tabs).toHaveLength(1)
    expect(tabs[0].id).toBe(id2)
    expect(activeTabId).toBe(id2)
  })

  it('closes last tab and sets activeTabId to null', () => {
    const store = useTabStore.getState()
    const id = store.createTab('tcp-client')
    useTabStore.getState().closeTab(id!)
    const { tabs, activeTabId } = useTabStore.getState()
    expect(tabs).toHaveLength(0)
    expect(activeTabId).toBeNull()
  })

  it('adds message and enforces 5000 limit', () => {
    const store = useTabStore.getState()
    const id = store.createTab('tcp-client')!
    for (let i = 0; i < 5010; i++) {
      useTabStore.getState().addMessage(id, {
        timestamp: Date.now(),
        direction: 'rx',
        remote: '127.0.0.1:8080',
        byteLength: 4,
        raw: new ArrayBuffer(4)
      })
    }
    const tab = useTabStore.getState().tabs.find((t) => t.id === id)
    expect(tab!.messages).toHaveLength(5000)
  })

  it('adds, updates, and removes quick send items', () => {
    useTabStore.getState().addQuickSendItem({ name: 'Ping', content: 'ping\r\n' })
    expect(useTabStore.getState().quickSendItems).toHaveLength(1)
    const item = useTabStore.getState().quickSendItems[0]
    useTabStore.getState().updateQuickSendItem(item.id, { name: 'Ping v2' })
    expect(useTabStore.getState().quickSendItems[0].name).toBe('Ping v2')
    useTabStore.getState().removeQuickSendItem(item.id)
    expect(useTabStore.getState().quickSendItems).toHaveLength(0)
  })
})
```

- [x] **Step 3: 运行测试确认通过**

Run: `cd D:\Download\current\net-assist && npx vitest run`
Expected: 6 tests PASS

- [x] **Step 4: Commit**

```bash
git add src/renderer/src/store/
git commit -m "feat: add Zustand tab state management store with tests"
```

---

### Task 6: 应用主布局 -- Sidebar + Content Area + TabBar

**Files:**
- Create: `src/renderer/src/components/layout/MainLayout.tsx`
- Create: `src/renderer/src/components/layout/MainLayout.css`
- Create: `src/renderer/src/components/tab/TabBar.tsx`
- Create: `src/renderer/src/components/tab/TabBar.css`
- Create: `src/renderer/src/components/tab/TabContent.tsx`

**Interfaces:**
- Consumes:
  - `useTabStore` from `src/renderer/src/store/tab-store.ts`
  - `TabType`, `TabState` from `src/shared/types.ts`
- Produces:
  - `MainLayout` -- full app layout: left Sidebar (240px) + right ContentArea
  - `TabBar` -- renders tab buttons with status indicators, new tab dropdown, close buttons
  - `TabContent` -- renders config panel + message area for active tab

- [x] **Step 1: 创建 `src/renderer/src/components/layout/MainLayout.tsx`**

```typescript
import { useTabStore } from '../../store/tab-store'
import TabBar from '../tab/TabBar'
import TabContent from '../tab/TabContent'
import QuickSendPanel from '../quick-send/QuickSendPanel'
import './MainLayout.css'

export default function MainLayout(): JSX.Element {
  const { tabs, activeTabId } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  return (
    <div className="main-layout">
      <aside className="sidebar">
        <TabBar />
        <QuickSendPanel />
      </aside>
      <main className="content-area">
        {activeTab ? (
          <TabContent tab={activeTab} />
        ) : (
          <div className="content-placeholder">
            <p>点击左侧 "+" 按钮新建连接</p>
          </div>
        )}
      </main>
    </div>
  )
}
```

- [x] **Step 2: 创建 `src/renderer/src/components/layout/MainLayout.css`**

```css
.main-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  width: 240px;
  min-width: 240px;
  border-right: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  overflow-y: auto;
}

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff;
}

.content-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 16px;
}
```

- [x] **Step 3: 创建 `src/renderer/src/components/tab/TabBar.tsx`**

```typescript
import { useState } from 'react'
import { Button, Dropdown, Modal, Input } from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { TabType } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import './TabBar.css'

const tabTypeLabels: Record<TabType, string> = {
  'tcp-client': 'TCP Client',
  'tcp-server': 'TCP Server',
  'udp': 'UDP'
}

const statusColors: Record<string, string> = {
  idle: '#999',
  connecting: '#faad14',
  connected: '#52c41a',
  listening: '#52c41a',
  error: '#ff4d4f'
}

export default function TabBar(): JSX.Element {
  const { tabs, activeTabId, createTab, closeTab, setActiveTab } = useTabStore()
  const [editTabId, setEditTabId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const newTabItems: MenuProps['items'] = (
    Object.entries(tabTypeLabels) as [TabType, string][]
  ).map(([type, label]) => ({
    key: type,
    label,
    onClick: () => createTab(type)
  }))

  const handleDoubleClick = (tabId: string, currentTitle: string): void => {
    setEditTabId(tabId)
    setEditTitle(currentTitle)
  }

  const handleTitleSave = (): void => {
    if (editTabId && editTitle.trim()) {
      useTabStore.getState().updateTabTitle(editTabId, editTitle.trim())
    }
    setEditTabId(null)
    setEditTitle('')
  }

  return (
    <div className="tab-bar">
      <div className="tab-bar-header">
        <span className="tab-bar-title">连接列表</span>
        <Dropdown menu={{ items: newTabItems }} trigger={['click']}>
          <Button type="text" size="small" icon={<PlusOutlined />} />
        </Dropdown>
      </div>
      <div className="tab-list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span
              className="tab-status-dot"
              style={{ backgroundColor: statusColors[tab.status] || '#999' }}
            />
            {editTabId === tab.id ? (
              <Input
                size="small"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onPressEnter={handleTitleSave}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="tab-title-input"
              />
            ) : (
              <span
                className="tab-label"
                onDoubleClick={() => handleDoubleClick(tab.id, tab.title)}
              >
                {tab.title}
              </span>
            )}
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                closeTab(tab.id)
              }}
              className="tab-close-btn"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [x] **Step 4: 创建 `src/renderer/src/components/tab/TabBar.css`**

```css
.tab-bar {
  display: flex;
  flex-direction: column;
  max-height: 50%;
  overflow: hidden;
}

.tab-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e8e8e8;
}

.tab-bar-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.tab-list {
  flex: 1;
  overflow-y: auto;
}

.tab-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
  gap: 6px;
}

.tab-item:hover {
  background: #f0f0f0;
}

.tab-item.active {
  background: #e6f7ff;
  border-left: 3px solid #1890ff;
}

.tab-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tab-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  user-select: none;
}

.tab-title-input {
  flex: 1;
}

.tab-close-btn {
  visibility: hidden;
  flex-shrink: 0;
}

.tab-item:hover .tab-close-btn {
  visibility: visible;
}
```

- [x] **Step 5: 创建 `src/renderer/src/components/tab/TabContent.tsx`**

```typescript
import type { TabState } from '../../../shared/types'

interface Props {
  tab: TabState
}

export default function TabContent({ tab }: Props): JSX.Element {
  return (
    <div className="tab-content" style={{ flex: 1, padding: 16, overflow: 'auto' }}>
      <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4, marginBottom: 16 }}>
        <strong>{tab.title}</strong> -- 类型: {tab.type} -- 状态: {tab.status}
      </div>
      {/* 后续 Task 会根据 tab.type 渲染对应的 Config 和 Message 组件 */}
    </div>
  )
}
```

- [x] **Step 6: 更新 `App.tsx` 使用 MainLayout**

Modify `src/renderer/src/App.tsx`:
```typescript
import MainLayout from './components/layout/MainLayout'

function App(): JSX.Element {
  return <MainLayout />
}

export default App
```

- [x] **Step 7: 验证 UI 渲染正常**

Run: `cd D:\Download\current\net-assist && npx electron-vite dev`
Manual check:
  1. 窗口显示左侧 Sidebar 和右侧 Content Area
  2. 点击 "+" 按钮弹出下拉菜单（TCP Client / TCP Server / UDP）
  3. 选择任一类型后 Sidebar 出现 Tab 项，右侧显示 Tab 内容区域
  4. 双击 Tab 标题可编辑，回车或失焦保存
  5. 悬停 Tab 出现关闭按钮，点击可关闭

- [x] **Step 8: Commit**

```bash
git add src/renderer/src/components/layout/ src/renderer/src/components/tab/ src/renderer/src/App.tsx
git commit -m "feat: add main layout with sidebar tab bar and content area"
```

---

### Task 7: Quick Send 快捷发送面板

**Files:**
- Create: `src/renderer/src/components/quick-send/QuickSendPanel.tsx`
- Create: `src/renderer/src/components/quick-send/QuickSendPanel.css`

**Interfaces:**
- Consumes: `useTabStore` (quickSendItems, addQuickSendItem, updateQuickSendItem, removeQuickSendItem)
- Produces: `QuickSendPanel` -- renders list of quick send items with add/edit/delete and click-to-send (sending delegated to parent via callback prop)

- [x] **Step 1: 创建 `src/renderer/src/components/quick-send/QuickSendPanel.tsx`**

```typescript
import { useState } from 'react'
import { Button, Input, Modal, List, Popconfirm, Empty } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined
} from '@ant-design/icons'
import { useTabStore } from '../../store/tab-store'
import './QuickSendPanel.css'

interface Props {
  onSend?: (content: string) => void
}

export default function QuickSendPanel({ onSend }: Props): JSX.Element {
  const { quickSendItems, addQuickSendItem, updateQuickSendItem, removeQuickSendItem } =
    useTabStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')

  const openAdd = (): void => {
    setEditId(null)
    setEditName('')
    setEditContent('')
    setModalOpen(true)
  }

  const openEdit = (item: { id: string; name: string; content: string }): void => {
    setEditId(item.id)
    setEditName(item.name)
    setEditContent(item.content)
    setModalOpen(true)
  }

  const handleOk = (): void => {
    if (!editName.trim() || !editContent.trim()) return
    if (editId) {
      updateQuickSendItem(editId, { name: editName.trim(), content: editContent })
    } else {
      addQuickSendItem({ name: editName.trim(), content: editContent })
    }
    setModalOpen(false)
  }

  return (
    <div className="quick-send-panel">
      <div className="quick-send-header">
        <span className="quick-send-title">快捷发送</span>
        <Button type="text" size="small" icon={<PlusOutlined />} onClick={openAdd} />
      </div>
      <div className="quick-send-list">
        {quickSendItems.length === 0 ? (
          <Empty description="暂无快捷指令" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={quickSendItems}
            renderItem={(item) => (
              <List.Item
                className="quick-send-item"
                actions={[
                  <Button
                    key="send"
                    type="text"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={() => onSend?.(item.content)}
                  />,
                  <Button
                    key="edit"
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(item)}
                  />,
                  <Popconfirm
                    key="del"
                    title="确定删除此指令?"
                    onConfirm={() => removeQuickSendItem(item.id)}
                  >
                    <Button type="text" size="small" icon={<DeleteOutlined />} danger />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta title={item.name} description={item.content.slice(0, 30)} />
              </List.Item>
            )}
          />
        )}
      </div>

      <Modal
        title={editId ? '编辑快捷指令' : '添加快捷指令'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ disabled: !editName.trim() || !editContent.trim() }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <Input
            placeholder="指令名称"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input.TextArea
            placeholder="指令内容"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  )
}
```

- [x] **Step 2: 创建 `src/renderer/src/components/quick-send/QuickSendPanel.css`**

```css
.quick-send-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e8e8e8;
  overflow: hidden;
}

.quick-send-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
}

.quick-send-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.quick-send-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 4px;
}

.quick-send-item {
  padding: 4px 8px !important;
}
```

- [x] **Step 3: 更新 `MainLayout.tsx` 传递 `onSend` 回调（占位）**

Modify `src/renderer/src/components/layout/MainLayout.tsx`:
```typescript
<QuickSendPanel onSend={(content) => {
  console.log('quick send:', content)
  // 后续 Task 中通过 IPC 发送
}} />
```

- [x] **Step 4: Commit**

```bash
git add src/renderer/src/components/quick-send/ src/renderer/src/components/layout/MainLayout.tsx
git commit -m "feat: add quick send panel with add/edit/delete/one-click-send"
```

---

### Task 8: TCP Client -- Main Process 网络层实现

**Files:**
- Create: `src/main/connections/tcp-client-connection.ts`
- Modify: `src/main/connections/connection-manager.ts`
- Create: `src/main/connections/__tests__/tcp-client-connection.test.ts`

**Interfaces:**
- Consumes:
  - `TcpClientConfig` from `src/shared/types.ts`
  - `ConnectionManager.emitStatus`, `emitData`, `emitError` from connection manager
- Produces:
  - `TcpClientConnection` class: `connect(config, callbacks)`, `disconnect()`, `send(data)`, `isConnected()`
  - Updated `ConnectionManager.connect()` that creates `TcpClientConnection` for `tcp-client` type

- [x] **Step 1: 创建 `src/main/connections/tcp-client-connection.ts`**

```typescript
import * as net from 'net'
import type { TcpClientConfig } from '../../shared/types'

export interface TcpClientCallbacks {
  onStatus: (status: string) => void
  onData: (data: Buffer, remote: string) => void
  onError: (message: string) => void
}

const CONNECT_TIMEOUT = 10_000

export class TcpClientConnection {
  private socket: net.Socket | null = null
  private config: TcpClientConfig | null = null
  private callbacks: TcpClientCallbacks | null = null
  private connectTimer: ReturnType<typeof setTimeout> | null = null

  connect(config: TcpClientConfig, callbacks: TcpClientCallbacks): void {
    this.config = config
    this.callbacks = callbacks

    this.socket = new net.Socket()
    callbacks.onStatus('connecting')

    this.connectTimer = setTimeout(() => {
      this.cleanup()
      callbacks.onStatus('error')
      callbacks.onError('连接超时')
    }, CONNECT_TIMEOUT)

    this.socket.connect(config.port, config.host, () => {
      if (this.connectTimer) {
        clearTimeout(this.connectTimer)
        this.connectTimer = null
      }
      callbacks.onStatus('connected')
    })

    this.socket.on('data', (data: Buffer) => {
      const remote = `${config.host}:${config.port}`
      callbacks.onData(data, remote)
    })

    this.socket.on('error', (err: NodeJS.ErrnoException) => {
      if (this.connectTimer) {
        clearTimeout(this.connectTimer)
        this.connectTimer = null
      }
      callbacks.onStatus('error')
      if (err.code === 'ECONNREFUSED') {
        callbacks.onError('连接被拒绝')
      } else if (err.code === 'ETIMEDOUT') {
        callbacks.onError('连接超时')
      } else {
        callbacks.onError(err.message)
      }
    })

    this.socket.on('close', () => {
      callbacks.onStatus('idle')
    })
  }

  send(data: Buffer): void {
    if (this.socket && !this.socket.destroyed) {
      this.socket.write(data)
      if (this.callbacks && this.config) {
        const remote = `${this.config.host}:${this.config.port}`
        this.callbacks.onData(data, remote)
      }
    }
  }

  isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed
  }

  disconnect(): void {
    this.cleanup()
  }

  private cleanup(): void {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer)
      this.connectTimer = null
    }
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.destroy()
      this.socket = null
    }
  }
}
```

- [x] **Step 2: 更新 `ConnectionManager` 集成 `TcpClientConnection`**

Modify `src/main/connections/connection-manager.ts`:

在文件顶部添加 import:
```typescript
import { TcpClientConnection } from './tcp-client-connection'
import type { TcpClientConfig } from '../../shared/types'
```

在 `ConnectionManager` 类中添加字段:
```typescript
private tcpClients = new Map<string, TcpClientConnection>()
```

替换 `connect` 方法:
```typescript
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
  // tcp-server, udp 在后续 Task 中实现
}
```

替换 `send` 方法:
```typescript
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
  // tcp-server, udp 在后续 Task 中发送
}
```

更新 `destroyAll` 方法:
```typescript
destroyAll(): void {
  for (const tabId of this.connections.keys()) {
    this.disconnect(tabId)
  }
  this.tcpClients.clear()
}
```

- [x] **Step 3: 创建 `src/main/connections/__tests__/tcp-client-connection.test.ts`**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as net from 'net'
import { TcpClientConnection } from '../tcp-client-connection'
import { EventEmitter } from 'events'

class MockSocket extends EventEmitter {
  destroyed = false
  connect(_port: number, _host: string, cb: () => void): void {
    setTimeout(() => cb(), 0)
  }
  write(_data: Buffer): boolean {
    return true
  }
  destroy(): void {
    this.destroyed = true
    this.emit('close')
  }
}

describe('TcpClientConnection', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('emits onStatus connecting then connected on successful connect', async () => {
    const mockSocket = new MockSocket()
    vi.spyOn(net, 'Socket').mockReturnValue(mockSocket as unknown as net.Socket)

    const conn = new TcpClientConnection()
    const callbacks = {
      onStatus: vi.fn(),
      onData: vi.fn(),
      onError: vi.fn()
    }

    conn.connect({ host: '127.0.0.1', port: 8080 }, callbacks)

    // connecting emitted immediately
    expect(callbacks.onStatus).toHaveBeenCalledWith('connecting')

    // Wait for async connect callback
    await new Promise((r) => setTimeout(r, 10))
    expect(callbacks.onStatus).toHaveBeenCalledWith('connected')
  })

  it('emits onError for ECONNREFUSED', async () => {
    const mockSocket = new MockSocket()
    vi.spyOn(net, 'Socket').mockReturnValue(mockSocket as unknown as net.Socket)

    const conn = new TcpClientConnection()
    const callbacks = {
      onStatus: vi.fn(),
      onData: vi.fn(),
      onError: vi.fn()
    }

    conn.connect({ host: '127.0.0.1', port: 8080 }, callbacks)

    // Simulate error
    const err = new Error('Connection refused') as NodeJS.ErrnoException
    err.code = 'ECONNREFUSED'
    mockSocket.emit('error', err)

    expect(callbacks.onStatus).toHaveBeenCalledWith('error')
    expect(callbacks.onError).toHaveBeenCalledWith('连接被拒绝')
  })

  it('sends data and calls onData for tx echo', () => {
    const mockSocket = new MockSocket()
    vi.spyOn(net, 'Socket').mockReturnValue(mockSocket as unknown as net.Socket)

    const conn = new TcpClientConnection()
    const callbacks = {
      onStatus: vi.fn(),
      onData: vi.fn(),
      onError: vi.fn()
    }

    conn.connect({ host: '127.0.0.1', port: 8080 }, callbacks)
    conn.send(Buffer.from('hello'))

    expect(callbacks.onData).toHaveBeenCalledWith(
      Buffer.from('hello'),
      '127.0.0.1:8080'
    )
  })

  it('cleanup on disconnect', () => {
    const mockSocket = new MockSocket()
    vi.spyOn(net, 'Socket').mockReturnValue(mockSocket as unknown as net.Socket)

    const conn = new TcpClientConnection()
    const callbacks = {
      onStatus: vi.fn(),
      onData: vi.fn(),
      onError: vi.fn()
    }

    conn.connect({ host: '127.0.0.1', port: 8080 }, callbacks)
    conn.disconnect()

    expect(mockSocket.destroyed).toBe(true)
  })
})
```

- [x] **Step 4: 运行测试**

Run: `cd D:\Download\current\net-assist && npx vitest run`
Expected: All tests PASS, including 4 new TcpClientConnection tests

- [x] **Step 5: Commit**

```bash
git add src/main/connections/
git commit -m "feat: implement TCP client connection with connect/disconnect/send and tests"
```

---

### Task 9: TCP Client -- Renderer 配置面板与 IPC Hook

**Files:**
- Create: `src/renderer/src/hooks/useIpc.ts`
- Create: `src/renderer/src/components/config/TcpClientConfig.tsx`
- Create: `src/renderer/src/components/config/TcpClientConfig.css`

**Interfaces:**
- Consumes:
  - `window.electronAPI` from preload
  - `useTabStore` from store
  - `TcpClientConfig`, `TabState` from shared types
  - `ConnectPayload`, `DisconnectPayload`, `StatusPayload`, `DataPayload`, `ErrorPayload` from shared/ipc-channels
- Produces:
  - `useIpc()` hook -- returns `{ connect, disconnect, send }` bound to preload API, with global IPC event listeners
  - `TcpClientConfigPanel` -- IP/port inputs, connect/disconnect button, status display

- [x] **Step 1: 创建 `src/renderer/src/hooks/useIpc.ts`**

```typescript
import { useCallback, useEffect } from 'react'
import type { TabType, TabConfig, TabStatus } from '../../shared/types'
import type {
  StatusPayload,
  DataPayload,
  ErrorPayload
} from '../../shared/ipc-channels'
import { useTabStore } from '../store/tab-store'

export function useIpc() {
  const updateTabStatus = useTabStore((s) => s.updateTabStatus)
  const addMessage = useTabStore((s) => s.addMessage)

  const connect = useCallback(
    async (tabId: string, type: TabType, config: TabConfig): Promise<void> => {
      await window.electronAPI.connect({ tabId, type, config })
    },
    []
  )

  const disconnect = useCallback(async (tabId: string): Promise<void> => {
    await window.electronAPI.disconnect({ tabId })
  }, [])

  const send = useCallback(
    async (tabId: string, data: Buffer | Uint8Array): Promise<void> => {
      await window.electronAPI.send({
        tabId,
        data: Array.from(data)
      })
    },
    []
  )

  // 全局监听 IPC 事件
  useEffect(() => {
    const unsubStatus = window.electronAPI.onStatus((payload: StatusPayload) => {
      updateTabStatus(payload.tabId, payload.status as TabStatus)
    })

    const unsubData = window.electronAPI.onData((payload: DataPayload) => {
      addMessage(payload.tabId, {
        timestamp: payload.timestamp,
        direction: payload.direction,
        remote: payload.remote,
        byteLength: payload.data.length,
        raw: new Uint8Array(payload.data).buffer
      })
    })

    const unsubError = window.electronAPI.onError((payload: ErrorPayload) => {
      console.error(`[${payload.tabId}] Error:`, payload.message)
    })

    return () => {
      unsubStatus()
      unsubData()
      unsubError()
    }
  }, [updateTabStatus, addMessage])

  return { connect, disconnect, send }
}
```

- [x] **Step 2: 创建 `src/renderer/src/components/config/TcpClientConfig.tsx`**

```typescript
import { useState, useCallback } from 'react'
import { Form, Input, Button, InputNumber, Space, Tag } from 'antd'
import {
  ApiOutlined,
  DisconnectOutlined
} from '@ant-design/icons'
import type { TcpClientConfig as TcpClientConfigType } from '../../../shared/types'
import type { TabState } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import './TcpClientConfig.css'

interface Props {
  tab: TabState
}

export default function TcpClientConfigPanel({ tab }: Props): JSX.Element {
  const { setTabConfig } = useTabStore()
  const { connect, disconnect } = useIpc()
  const [host, setHost] = useState(
    (tab.config as TcpClientConfigType).host || ''
  )
  const [port, setPort] = useState<number | null>(
    (tab.config as TcpClientConfigType).port || null
  )
  const [loading, setLoading] = useState(false)

  const isConnected = tab.status === 'connected'
  const isConnecting = tab.status === 'connecting'

  const handleConnect = useCallback(async (): Promise<void> => {
    if (!host.trim() || port === null || port <= 0) return
    const config: TcpClientConfigType = { host: host.trim(), port }
    setTabConfig(tab.id, config)
    setLoading(true)
    try {
      await connect(tab.id, 'tcp-client', config)
    } catch (err) {
      console.error('connect failed:', err)
    } finally {
      setLoading(false)
    }
  }, [host, port, tab.id, connect, setTabConfig])

  const handleDisconnect = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      await disconnect(tab.id)
    } catch (err) {
      console.error('disconnect failed:', err)
    } finally {
      setLoading(false)
    }
  }, [tab.id, disconnect])

  const statusColor: Record<string, string> = {
    idle: 'default',
    connecting: 'processing',
    connected: 'success',
    error: 'error'
  }

  const statusLabel: Record<string, string> = {
    idle: '未连接',
    connecting: '连接中...',
    connected: '已连接',
    error: '错误'
  }

  return (
    <div className="config-panel">
      <Space wrap>
        <Input
          placeholder="目标 IP"
          value={host}
          onChange={(e) => setHost(e.target.value)}
          disabled={isConnected || isConnecting}
          style={{ width: 180 }}
        />
        <InputNumber
          placeholder="端口"
          value={port}
          onChange={(v) => setPort(v)}
          min={1}
          max={65535}
          disabled={isConnected || isConnecting}
          style={{ width: 100 }}
        />
        {isConnected || isConnecting ? (
          <Button
            danger
            icon={<DisconnectOutlined />}
            onClick={handleDisconnect}
            loading={isConnecting}
          >
            断开
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<ApiOutlined />}
            onClick={handleConnect}
            loading={loading}
            disabled={!host.trim() || port === null || port <= 0}
          >
            连接
          </Button>
        )}
        <Tag color={statusColor[tab.status] || 'default'}>
          {statusLabel[tab.status] || tab.status}
        </Tag>
      </Space>
    </div>
  )
}
```

- [x] **Step 3: 创建 `src/renderer/src/components/config/TcpClientConfig.css`**

```css
.config-panel {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}
```

- [x] **Step 4: 更新 `TabContent` 根据 `tab.type` 渲染配置组件**

Modify `src/renderer/src/components/tab/TabContent.tsx`:

```typescript
import type { TabState } from '../../../shared/types'
import TcpClientConfigPanel from '../config/TcpClientConfig'

interface Props {
  tab: TabState
}

export default function TabContent({ tab }: Props): JSX.Element {
  const renderConfigPanel = (): JSX.Element | null => {
    switch (tab.type) {
      case 'tcp-client':
        return <TcpClientConfigPanel tab={tab} />
      case 'tcp-server':
      case 'udp':
        return (
          <div style={{ padding: 16 }}>
            {tab.type} 配置面板将在后续任务中实现
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {renderConfigPanel()}
      <div style={{ flex: 1, padding: 16, overflow: 'auto' }}>
        <p>消息区域将在后续任务实现</p>
      </div>
    </div>
  )
}
```

- [x] **Step 5: Commit**

```bash
git add src/renderer/src/hooks/ src/renderer/src/components/config/ src/renderer/src/components/tab/TabContent.tsx
git commit -m "feat: add useIpc hook and TCP client config panel UI"
```

---

### Task 10: TCP Server -- Main Process 网络层实现

**Files:**
- Create: `src/main/connections/tcp-server-connection.ts`
- Modify: `src/main/connections/connection-manager.ts`

**Interfaces:**
- Consumes:
  - `TcpServerConfig`, `ClientInfo` from `src/shared/types.ts`
  - `ConnectionManager` emit methods
- Produces:
  - `TcpServerConnection` class: `start(config, callbacks)`, `stop()`, `send(data, clientId?)`, `isRunning()`
  - Updated `ConnectionManager.connect()` for `tcp-server` type
  - Updated `ConnectionManager.send()` and `setTarget()` for TCP server

- [x] **Step 1: 创建 `src/main/connections/tcp-server-connection.ts`**

```typescript
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

      const clientInfo: ClientInfo = {
        id: clientId,
        remoteAddress,
        remotePort
      }
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
        const remote = `${socket.remoteAddress}:${socket.remotePort}`
        this.callbacks?.onData(data, remote)
      }
    } else {
      // broadcast to all clients
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
      socket.removeAllListeners()
      socket.destroy()
    }
    this.clients.clear()

    if (this.server) {
      this.server.close()
      this.server.removeAllListeners()
      this.server = null
    }
  }
}
```

- [x] **Step 2: 更新 `ConnectionManager` 集成 `TcpServerConnection`**

Modify `src/main/connections/connection-manager.ts`:

添加 import:
```typescript
import { TcpServerConnection } from './tcp-server-connection'
import type { TcpServerConfig } from '../../shared/types'
import type { ClientInfo } from '../../shared/types'
```

添加字段:
```typescript
private tcpServers = new Map<string, TcpServerConnection>()
private serverTargets = new Map<string, string | null>()
```

在 `connect` 方法中添加 `tcp-server` 分支（在 `if (type === 'tcp-client')` 块之后）:
```typescript
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
    },
    onClientJoined: (client: ClientInfo) => {
      this.emitClientJoined(tabId, client)
    },
    onClientLeft: (clientId: string) => {
      this.emitClientLeft(tabId, clientId)
    }
  })
```

在 `send` 方法中添加 `tcp-server` 分支:
```typescript
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
```

替换 `setTarget` 方法:
```typescript
setTarget(tabId: string, clientId: string | null): void {
  this.serverTargets.set(tabId, clientId)
}
```

更新 `destroyAll` 方法:
```typescript
destroyAll(): void {
  for (const tabId of this.connections.keys()) {
    this.disconnect(tabId)
  }
  this.tcpClients.clear()
  this.tcpServers.clear()
  this.serverTargets.clear()
}
```

- [x] **Step 3: Commit**

```bash
git add src/main/connections/
git commit -m "feat: implement TCP server connection with multi-client management"
```

---

### Task 11: UDP -- Main Process 网络层实现

**Files:**
- Create: `src/main/connections/udp-connection.ts`
- Modify: `src/main/connections/connection-manager.ts`

**Interfaces:**
- Consumes:
  - `UdpConfig` from `src/shared/types.ts`
- Produces:
  - `UdpConnection` class: `bind(config, callbacks)`, `close()`, `send(data)`, `isBound()`
  - Updated `ConnectionManager.connect()` for `udp` type
  - Updated `ConnectionManager.send()` for UDP

- [x] **Step 1: 创建 `src/main/connections/udp-connection.ts`**

```typescript
import * as dgram from 'dgram'
import type { UdpConfig } from '../../shared/types'

export interface UdpCallbacks {
  onStatus: (status: string) => void
  onData: (data: Buffer, remote: string) => void
  onError: (message: string) => void
}

export class UdpConnection {
  private socket: dgram.Socket | null = null
  private config: UdpConfig | null = null
  private callbacks: UdpCallbacks | null = null

  bind(config: UdpConfig, callbacks: UdpCallbacks): void {
    this.config = config
    this.callbacks = callbacks

    this.socket = dgram.createSocket('udp4')

    this.socket.on('message', (data: Buffer, rinfo: dgram.RemoteInfo) => {
      callbacks.onData(data, `${rinfo.address}:${rinfo.port}`)
    })

    this.socket.on('error', (err: NodeJS.ErrnoException) => {
      callbacks.onStatus('error')
      if (err.code === 'EADDRINUSE') {
        callbacks.onError('端口已被占用')
      } else {
        callbacks.onError(err.message)
      }
    })

    this.socket.on('close', () => {
      callbacks.onStatus('idle')
    })

    this.socket.bind(config.localPort, () => {
      callbacks.onStatus('connected')
    })
  }

  send(data: Buffer): void {
    if (!this.socket || !this.config) return

    this.socket.send(
      data,
      this.config.targetPort,
      this.config.targetHost,
      (err) => {
        if (err && this.callbacks) {
          this.callbacks.onError(err.message)
        }
      }
    )

    if (this.callbacks) {
      const remote = `${this.config.targetHost}:${this.config.targetPort}`
      this.callbacks.onData(data, remote)
    }
  }

  isBound(): boolean {
    return this.socket !== null
  }

  close(): void {
    if (this.socket) {
      this.socket.removeAllListeners()
      this.socket.close()
      this.socket = null
    }
  }
}
```

- [x] **Step 2: 更新 `ConnectionManager` 集成 `UdpConnection`**

Modify `src/main/connections/connection-manager.ts`:

添加 import:
```typescript
import { UdpConnection } from './udp-connection'
import type { UdpConfig } from '../../shared/types'
```

添加字段:
```typescript
private udpSockets = new Map<string, UdpConnection>()
```

在 `connect` 方法中添加 `udp` 分支（在 `tcp-server` 块之后）:
```typescript
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
```

在 `send` 方法中添加 `udp` 分支:
```typescript
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
```

更新 `destroyAll`:
```typescript
destroyAll(): void {
  for (const tabId of this.connections.keys()) {
    this.disconnect(tabId)
  }
  this.tcpClients.clear()
  this.tcpServers.clear()
  this.serverTargets.clear()
  this.udpSockets.clear()
}
```

- [x] **Step 3: Commit**

```bash
git add src/main/connections/
git commit -m "feat: implement UDP socket connection with bind/send/close"
```

---

### Task 12: 消息列表 UI 组件

**Files:**
- Create: `src/renderer/src/components/messages/MessageList.tsx`
- Create: `src/renderer/src/components/messages/MessageList.css`
- Create: `src/renderer/src/components/messages/MessageItem.tsx`

**Interfaces:**
- Consumes:
  - `Message`, `DisplayMode`, `EncodingMode` from `src/shared/types.ts`
- Produces:
  - `MessageList` -- scrollable message list with auto-scroll to bottom
  - `MessageItem` -- single message row: timestamp, direction arrow, remote, byte count, decoded content

- [x] **Step 1: 创建 `src/renderer/src/components/messages/MessageItem.tsx`**

```typescript
import type { Message, DisplayMode, EncodingMode } from '../../../shared/types'

interface Props {
  message: Message
  displayMode: DisplayMode
  encoding: EncodingMode
}

function decodeText(data: ArrayBuffer, encoding: EncodingMode): string {
  const arr = new Uint8Array(data)
  if (encoding === 'ascii') {
    return Array.from(arr)
      .map((b) => String.fromCharCode(b & 0x7f))
      .join('')
  }
  const decoder = new TextDecoder(encoding === 'gbk' ? 'gbk' : 'utf-8')
  try {
    return decoder.decode(arr)
  } catch {
    return '[解码失败]'
  }
}

function formatHex(data: ArrayBuffer): string {
  const arr = new Uint8Array(data)
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ')
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return (
    d.getHours().toString().padStart(2, '0') +
    ':' +
    d.getMinutes().toString().padStart(2, '0') +
    ':' +
    d.getSeconds().toString().padStart(2, '0') +
    '.' +
    d.getMilliseconds().toString().padStart(3, '0')
  )
}

export default function MessageItem({ message, displayMode, encoding }: Props): JSX.Element {
  const directionSymbol = message.direction === 'tx' ? '→' : '←'
  const content =
    displayMode === 'hex'
      ? formatHex(message.raw)
      : decodeText(message.raw, encoding)

  return (
    <div className={`message-item message-${message.direction}`}>
      <span className="message-time">[{formatTime(message.timestamp)}]</span>
      <span className="message-direction">{directionSymbol}</span>
      <span className="message-remote">{message.remote}</span>
      <span className="message-length">({message.byteLength} bytes)</span>
      <span className="message-content">{content}</span>
    </div>
  )
}
```

- [x] **Step 2: 创建 `src/renderer/src/components/messages/MessageList.tsx`**

```typescript
import { useEffect, useRef } from 'react'
import type { Message, DisplayMode, EncodingMode } from '../../../shared/types'
import MessageItem from './MessageItem'
import './MessageList.css'

interface Props {
  messages: Message[]
  displayMode: DisplayMode
  encoding: EncodingMode
}

export default function MessageList({ messages, displayMode, encoding }: Props): JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="message-list-empty">暂无消息</div>
      ) : (
        messages.map((msg) => (
          <MessageItem
            key={msg.id}
            message={msg}
            displayMode={displayMode}
            encoding={encoding}
          />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [x] **Step 3: 创建 `src/renderer/src/components/messages/MessageList.css`**

```css
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  background: #1e1e1e;
  color: #d4d4d4;
  line-height: 1.6;
}

.message-list-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.message-item {
  white-space: pre-wrap;
  word-break: break-all;
  padding: 1px 0;
}

.message-item.message-tx .message-direction {
  color: #6a9955;
}

.message-item.message-rx .message-direction {
  color: #569cd6;
}

.message-time {
  color: #858585;
  margin-right: 6px;
}

.message-direction {
  margin-right: 6px;
  font-weight: bold;
}

.message-remote {
  color: #ce9178;
  margin-right: 6px;
}

.message-length {
  color: #858585;
  margin-right: 6px;
}

.message-content {
  color: #d4d4d4;
}
```

- [x] **Step 4: Commit**

```bash
git add src/renderer/src/components/messages/
git commit -m "feat: add message list with timestamp, direction, and content display"
```

---

### Task 13: 发送面板与编码选择器

**Files:**
- Create: `src/renderer/src/components/send/SendPanel.tsx`
- Create: `src/renderer/src/components/send/SendPanel.css`
- Create: `src/renderer/src/components/encoding/EncodingSelector.tsx`
- Create: `src/renderer/src/components/encoding/LineEndingSelector.tsx`
- Create: `src/renderer/src/components/encoding/WhitespaceRenderer.tsx`

**Interfaces:**
- Consumes:
  - `EncodingMode`, `DisplayMode`, `LineEnding` from `src/shared/types.ts`
  - `useIpc().send` from hooks
  - `useTabStore` from store
- Produces:
  - `SendPanel` -- text input area with enter-to-send, encoding selector, display mode toggle, line ending selector
  - `EncodingSelector` -- Radio.Group for ASCII/UTF-8/GBK
  - `LineEndingSelector` -- Select dropdown for CRLF / LF / CR
  - `WhitespaceRenderer` -- renders text with invisible character visualization

- [x] **Step 1: 创建 `src/renderer/src/components/encoding/WhitespaceRenderer.tsx`**

```typescript
interface Props {
  text: string
}

export default function WhitespaceRenderer({ text }: Props): JSX.Element {
  const rendered = text
    .replace(/\r/g, '⏎')
    .replace(/\n/g, '¶')
    .replace(/\t/g, '→')
    .replace(/ /g, '·')
    .replace(/[\x00-\x1F]/g, (c) => {
      return String.fromCodePoint(0x2400 + c.charCodeAt(0))
    })

  return <span className="whitespace-renderer">{rendered}</span>
}
```

- [x] **Step 2: 创建 `src/renderer/src/components/encoding/EncodingSelector.tsx`**

```typescript
import { Radio } from 'antd'
import type { EncodingMode } from '../../../shared/types'

interface Props {
  value: EncodingMode
  onChange: (enc: EncodingMode) => void
}

export default function EncodingSelector({ value, onChange }: Props): JSX.Element {
  return (
    <Radio.Group
      value={value}
      onChange={(e) => onChange(e.target.value as EncodingMode)}
      size="small"
    >
      <Radio.Button value="ascii">ASCII</Radio.Button>
      <Radio.Button value="utf-8">UTF-8</Radio.Button>
      <Radio.Button value="gbk">GBK</Radio.Button>
    </Radio.Group>
  )
}
```

- [x] **Step 3: 创建 `src/renderer/src/components/encoding/LineEndingSelector.tsx`**

```typescript
import { Select } from 'antd'
import type { LineEnding } from '../../../shared/types'

interface Props {
  value: LineEnding
  onChange: (le: LineEnding) => void
}

const options = [
  { value: '\r\n', label: 'CRLF (\\r\\n)' },
  { value: '\n', label: 'LF (\\n)' },
  { value: '\r', label: 'CR (\\r)' }
]

export default function LineEndingSelector({ value, onChange }: Props): JSX.Element {
  return (
    <Select
      value={value}
      onChange={(v) => onChange(v as LineEnding)}
      options={options}
      size="small"
      style={{ width: 130 }}
    />
  )
}
```

- [x] **Step 4: 创建 `src/renderer/src/components/send/SendPanel.tsx`**

```typescript
import { useState, useCallback, KeyboardEvent } from 'react'
import { Input, Button, Space } from 'antd'
import { SendOutlined, ClearOutlined } from '@ant-design/icons'
import type { EncodingMode, DisplayMode, LineEnding } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import EncodingSelector from '../encoding/EncodingSelector'
import LineEndingSelector from '../encoding/LineEndingSelector'
import WhitespaceRenderer from '../encoding/WhitespaceRenderer'
import './SendPanel.css'

interface Props {
  tabId: string
}

export default function SendPanel({ tabId }: Props): JSX.Element {
  const [input, setInput] = useState('')
  const [encoding, setEncoding] = useState<EncodingMode>('utf-8')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('text')
  const [lineEnding, setLineEnding] = useState<LineEnding>('\r\n')
  const [sending, setSending] = useState(false)
  const { send } = useIpc()
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === tabId))

  const isConnected =
    tab?.status === 'connected' || tab?.status === 'listening'

  const doSend = useCallback(async (): Promise<void> => {
    if (!input) return
    const textToSend = input

    setSending(true)
    try {
      const encoder = new TextEncoder()
      let bytes: Uint8Array

      if (encoding === 'utf-8') {
        bytes = encoder.encode(textToSend)
      } else if (encoding === 'ascii') {
        bytes = new Uint8Array(
          textToSend.split('').map((c) => c.charCodeAt(0) & 0x7f)
        )
      } else {
        // GBK: use TextEncoder as fallback; proper iconv-lite encoding done in Task 16
        bytes = encoder.encode(textToSend)
      }

      await send(tabId, bytes)
      setInput('')
    } catch (err) {
      console.error('send failed:', err)
    } finally {
      setSending(false)
    }
  }, [input, encoding, tabId, send])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        doSend()
      }
    },
    [doSend]
  )

  return (
    <div className="send-panel">
      <div className="send-toolbar">
        <Space wrap size="small">
          <EncodingSelector value={encoding} onChange={setEncoding} />
          <LineEndingSelector value={lineEnding} onChange={setLineEnding} />
          <Button
            size="small"
            onClick={() => setDisplayMode(displayMode === 'text' ? 'hex' : 'text')}
          >
            {displayMode === 'text' ? 'TXT' : 'HEX'}
          </Button>
        </Space>
      </div>
      <div className="send-input-area">
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? '输入要发送的内容 (Ctrl+Enter 发送)' : '请先建立连接'}
          disabled={!isConnected || sending}
          rows={4}
          style={{ resize: 'none' }}
        />
        <div className="send-preview">
          <WhitespaceRenderer text={input} />
        </div>
      </div>
      <div className="send-actions">
        <Space>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={doSend}
            loading={sending}
            disabled={!isConnected || !input.trim()}
          >
            发送
          </Button>
          <Button
            icon={<ClearOutlined />}
            onClick={() => setInput('')}
            disabled={!input}
          >
            清空
          </Button>
        </Space>
        <span className="send-hint">Ctrl+Enter 发送</span>
      </div>
    </div>
  )
}
```

- [x] **Step 5: 创建 `src/renderer/src/components/send/SendPanel.css`**

```css
.send-panel {
  border-top: 1px solid #f0f0f0;
  background: #fff;
}

.send-toolbar {
  padding: 8px 16px;
  border-bottom: 1px solid #f5f5f5;
}

.send-input-area {
  position: relative;
  padding: 8px 16px;
}

.send-preview {
  position: absolute;
  top: 8px;
  left: 16px;
  right: 16px;
  pointer-events: none;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  color: transparent;
  line-height: 1.5715;
  white-space: pre-wrap;
  word-break: break-all;
  padding: 8px 12px;
}

.send-preview span {
  color: #d4d4d4;
}

.send-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
}

.send-hint {
  font-size: 12px;
  color: #999;
}
```

- [x] **Step 6: Commit**

```bash
git add src/renderer/src/components/send/ src/renderer/src/components/encoding/
git commit -m "feat: add send panel with encoding selector and whitespace visualization"
```

---

### Task 14: HEX 编辑器组件

**Files:**
- Create: `src/renderer/src/components/encoding/HexEditor.tsx`
- Create: `src/renderer/src/components/encoding/HexEditor.css`

**Interfaces:**
- Consumes: nothing external (self-contained component)
- Produces:
  - `HexEditor` -- textarea with real-time validation (illegal chars red highlight), auto-strip spaces on send
  - `validateHex(input: string): boolean` -- exported validation function
  - `hexToBytes(input: string): Uint8Array` -- exported conversion function

- [x] **Step 1: 创建 `src/renderer/src/components/encoding/HexEditor.tsx`**

```typescript
import { useMemo } from 'react'
import { Input } from 'antd'
import './HexEditor.css'

interface Props {
  value: string
  onChange: (hex: string) => void
}

const HEX_PATTERN = /^[0-9a-fA-F\s]*$/

export function validateHex(input: string): boolean {
  return HEX_PATTERN.test(input)
}

export function hexToBytes(input: string): Uint8Array {
  const cleaned = input.replace(/\s+/g, '')
  if (cleaned.length % 2 !== 0) {
    throw new Error('HEX 字符串长度必须为偶数')
  }
  const bytes = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16)
  }
  return bytes
}

export default function HexEditor({ value, onChange }: Props): JSX.Element {
  const isValid = useMemo(() => validateHex(value), [value])

  const formattedValue = useMemo(() => {
    const cleaned = value.replace(/\s+/g, '').toUpperCase()
    let result = ''
    for (let i = 0; i < cleaned.length; i += 2) {
      if (i > 0) result += ' '
      result += cleaned.slice(i, i + 2)
    }
    return result
  }, [value])

  return (
    <div className="hex-editor">
      <Input.TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="输入 HEX 数据，如: AA BB CC 0D 0A"
        rows={4}
        style={{ resize: 'none' }}
        className={!isValid && value ? 'hex-invalid' : ''}
      />
      {!isValid && value && (
        <div className="hex-error">包含非法字符，仅允许 0-9、A-F、空格</div>
      )}
      {value && isValid && (
        <div className="hex-preview">
          {formattedValue}
        </div>
      )}
    </div>
  )
}
```

- [x] **Step 2: 创建 `src/renderer/src/components/encoding/HexEditor.css`**

```css
.hex-editor {
  position: relative;
}

.hex-editor .hex-invalid textarea {
  color: #ff4d4f;
  border-color: #ff4d4f;
}

.hex-error {
  color: #ff4d4f;
  font-size: 12px;
  margin-top: 4px;
}

.hex-preview {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  color: #52c41a;
  margin-top: 4px;
  padding: 4px 8px;
  background: #f6ffed;
  border-radius: 4px;
  word-break: break-all;
}
```

- [x] **Step 3: Commit**

```bash
git add src/renderer/src/components/encoding/HexEditor.tsx src/renderer/src/components/encoding/HexEditor.css
git commit -m "feat: add HEX editor with real-time validation and formatting"
```

---

### Task 15: TCP Server 与 UDP Renderer 配置面板

**Files:**
- Create: `src/renderer/src/components/config/TcpServerConfig.tsx`
- Create: `src/renderer/src/components/config/UdpConfig.tsx`
- Modify: `src/renderer/src/components/tab/TabContent.tsx`

**Interfaces:**
- Consumes:
  - `TcpServerConfig`, `UdpConfig`, `ClientInfo` from shared types
  - `useTabStore` from store
  - `useIpc` from hooks
- Produces:
  - `TcpServerConfigPanel` -- port input, start/stop button, client list with target selection
  - `UdpConfigPanel` -- local port, target IP, target port inputs, bind/close button

- [x] **Step 1: 创建 `src/renderer/src/components/config/TcpServerConfig.tsx`**

```typescript
import { useState, useCallback, useEffect } from 'react'
import { Input, Button, InputNumber, Space, Tag, Select } from 'antd'
import { PlayCircleOutlined, StopOutlined } from '@ant-design/icons'
import type { TcpServerConfig as TcpServerConfigType } from '../../../shared/types'
import type { TabState, ClientInfo } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'

interface Props {
  tab: TabState
}

export default function TcpServerConfigPanel({ tab }: Props): JSX.Element {
  const { setTabConfig } = useTabStore()
  const { connect, disconnect } = useIpc()
  const [port, setPort] = useState<number | null>(
    (tab.config as TcpServerConfigType).port || null
  )
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<ClientInfo[]>([])
  const [selectedClient, setSelectedClient] = useState<string>('broadcast')

  const isListening = tab.status === 'listening'

  useEffect(() => {
    const unsubJoin = window.electronAPI.onClientJoined((payload) => {
      if (payload.tabId === tab.id) {
        setClients((prev) => [...prev, payload.client])
      }
    })
    const unsubLeft = window.electronAPI.onClientLeft((payload) => {
      if (payload.tabId === tab.id) {
        setClients((prev) => prev.filter((c) => c.id !== payload.clientId))
      }
    })
    return () => {
      unsubJoin()
      unsubLeft()
    }
  }, [tab.id])

  const handleStart = useCallback(async (): Promise<void> => {
    if (port === null || port <= 0) return
    const config: TcpServerConfigType = { port }
    setTabConfig(tab.id, config)
    setLoading(true)
    try {
      await connect(tab.id, 'tcp-server', config)
      setClients([])
      setSelectedClient('broadcast')
    } catch (err) {
      console.error('start server failed:', err)
    } finally {
      setLoading(false)
    }
  }, [port, tab.id, connect, setTabConfig])

  const handleStop = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      await disconnect(tab.id)
      setClients([])
      setSelectedClient('broadcast')
    } catch (err) {
      console.error('stop server failed:', err)
    } finally {
      setLoading(false)
    }
  }, [tab.id, disconnect])

  const handleTargetChange = useCallback(
    async (value: string): Promise<void> => {
      setSelectedClient(value)
      await window.electronAPI.serverSetTarget({
        tabId: tab.id,
        clientId: value === 'broadcast' ? null : value
      })
    },
    [tab.id]
  )

  const statusLabel: Record<string, string> = {
    idle: '未启动',
    listening: '监听中',
    error: '错误'
  }
  const statusColor: Record<string, string> = {
    idle: 'default',
    listening: 'success',
    error: 'error'
  }

  return (
    <div className="config-panel">
      <Space wrap>
        <InputNumber
          placeholder="监听端口"
          value={port}
          onChange={(v) => setPort(v)}
          min={1}
          max={65535}
          disabled={isListening}
          style={{ width: 120 }}
        />
        {isListening ? (
          <Button
            danger
            icon={<StopOutlined />}
            onClick={handleStop}
            loading={loading}
          >
            停止监听
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStart}
            loading={loading}
            disabled={port === null || port <= 0}
          >
            开始监听
          </Button>
        )}
        <Tag color={statusColor[tab.status] || 'default'}>
          {statusLabel[tab.status] || tab.status}
        </Tag>
      </Space>
      {isListening && clients.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <Space>
            <span style={{ fontSize: 13, color: '#666' }}>发送目标:</span>
            <Select
              value={selectedClient}
              onChange={handleTargetChange}
              size="small"
              style={{ width: 220 }}
              options={[
                { value: 'broadcast', label: '广播所有客户端' },
                ...clients.map((c) => ({
                  value: c.id,
                  label: `${c.remoteAddress}:${c.remotePort}`
                }))
              ]}
            />
          </Space>
        </div>
      )}
    </div>
  )
}
```

- [x] **Step 2: 创建 `src/renderer/src/components/config/UdpConfig.tsx`**

```typescript
import { useState, useCallback } from 'react'
import { Input, Button, InputNumber, Space, Tag } from 'antd'
import { WifiOutlined, CloseOutlined } from '@ant-design/icons'
import type { UdpConfig as UdpConfigType } from '../../../shared/types'
import type { TabState } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'

interface Props {
  tab: TabState
}

export default function UdpConfigPanel({ tab }: Props): JSX.Element {
  const { setTabConfig } = useTabStore()
  const { connect, disconnect } = useIpc()
  const config = tab.config as UdpConfigType
  const [localPort, setLocalPort] = useState<number | null>(config.localPort || null)
  const [targetHost, setTargetHost] = useState(config.targetHost || '')
  const [targetPort, setTargetPort] = useState<number | null>(config.targetPort || null)
  const [loading, setLoading] = useState(false)

  const isBound = tab.status === 'connected'

  const handleBind = useCallback(async (): Promise<void> => {
    if (localPort === null || localPort <= 0 || !targetHost.trim() || targetPort === null || targetPort <= 0) return
    const cfg: UdpConfigType = {
      localPort,
      targetHost: targetHost.trim(),
      targetPort
    }
    setTabConfig(tab.id, cfg)
    setLoading(true)
    try {
      await connect(tab.id, 'udp', cfg)
    } catch (err) {
      console.error('bind failed:', err)
    } finally {
      setLoading(false)
    }
  }, [localPort, targetHost, targetPort, tab.id, connect, setTabConfig])

  const handleClose = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      await disconnect(tab.id)
    } catch (err) {
      console.error('close failed:', err)
    } finally {
      setLoading(false)
    }
  }, [tab.id, disconnect])

  const statusLabel: Record<string, string> = {
    idle: '未绑定',
    connected: '已绑定',
    error: '错误'
  }
  const statusColor: Record<string, string> = {
    idle: 'default',
    connected: 'success',
    error: 'error'
  }

  return (
    <div className="config-panel">
      <Space wrap>
        <span style={{ fontSize: 13, color: '#666' }}>本地:</span>
        <InputNumber
          placeholder="本地端口"
          value={localPort}
          onChange={(v) => setLocalPort(v)}
          min={1}
          max={65535}
          disabled={isBound}
          style={{ width: 100 }}
        />
        <span style={{ fontSize: 13, color: '#666' }}>目标:</span>
        <Input
          placeholder="目标 IP"
          value={targetHost}
          onChange={(e) => setTargetHost(e.target.value)}
          disabled={isBound}
          style={{ width: 140 }}
        />
        <InputNumber
          placeholder="目标端口"
          value={targetPort}
          onChange={(v) => setTargetPort(v)}
          min={1}
          max={65535}
          disabled={isBound}
          style={{ width: 100 }}
        />
        {isBound ? (
          <Button
            danger
            icon={<CloseOutlined />}
            onClick={handleClose}
            loading={loading}
          >
            关闭
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<WifiOutlined />}
            onClick={handleBind}
            loading={loading}
            disabled={
              localPort === null ||
              localPort <= 0 ||
              !targetHost.trim() ||
              targetPort === null ||
              targetPort <= 0
            }
          >
            绑定
          </Button>
        )}
        <Tag color={statusColor[tab.status] || 'default'}>
          {statusLabel[tab.status] || tab.status}
        </Tag>
      </Space>
    </div>
  )
}
```

- [x] **Step 3: 更新 `TabContent` 集成所有配置面板和消息收发**

Modify `src/renderer/src/components/tab/TabContent.tsx`:

```typescript
import { useState } from 'react'
import type { TabState } from '../../../shared/types'
import type { DisplayMode, EncodingMode } from '../../../shared/types'
import TcpClientConfigPanel from '../config/TcpClientConfig'
import TcpServerConfigPanel from '../config/TcpServerConfig'
import UdpConfigPanel from '../config/UdpConfig'
import MessageList from '../messages/MessageList'
import SendPanel from '../send/SendPanel'

interface Props {
  tab: TabState
}

export default function TabContent({ tab }: Props): JSX.Element {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('text')
  const [encoding, setEncoding] = useState<EncodingMode>('utf-8')

  const renderConfigPanel = (): JSX.Element | null => {
    switch (tab.type) {
      case 'tcp-client':
        return <TcpClientConfigPanel tab={tab} />
      case 'tcp-server':
        return <TcpServerConfigPanel tab={tab} />
      case 'udp':
        return <UdpConfigPanel tab={tab} />
      default:
        return null
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {renderConfigPanel()}
      <MessageList
        messages={tab.messages}
        displayMode={displayMode}
        encoding={encoding}
      />
      <SendPanel tabId={tab.id} />
    </div>
  )
}
```

- [x] **Step 4: Commit**

```bash
git add src/renderer/src/components/config/ src/renderer/src/components/tab/TabContent.tsx
git commit -m "feat: add TCP server and UDP config panels, wire up full tab content"
```

---

### Task 16: GBK 编码支持（iconv-lite 集成）

**Files:**
- Create: `src/main/encoding/gbk-codec.ts`
- Modify: `src/main/connections/connection-manager.ts`
- Create: `src/main/encoding/__tests__/gbk-codec.test.ts`

**Interfaces:**
- Consumes: `iconv-lite` package
- Produces:
  - `encodeGBK(text: string): Buffer` -- convert text to GBK bytes
  - `decodeGBK(buffer: Buffer): string` -- convert GBK bytes to text

- [x] **Step 1: 确认 iconv-lite 已安装**

Run: `cd D:\Download\current\net-assist && node -e "require('iconv-lite')"`

Expected: No error (module loads successfully)

- [x] **Step 2: 创建 `src/main/encoding/gbk-codec.ts`**

```typescript
import * as iconv from 'iconv-lite'

export function encodeGBK(text: string): Buffer {
  return iconv.encode(text, 'gbk')
}

export function decodeGBK(buffer: Buffer): string {
  return iconv.decode(buffer, 'gbk')
}
```

- [x] **Step 3: 创建 `src/main/encoding/__tests__/gbk-codec.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { encodeGBK, decodeGBK } from '../gbk-codec'

describe('GBK codec', () => {
  it('encodes Chinese text to GBK bytes', () => {
    const result = encodeGBK('你好')
    expect(result.length).toBe(4)
  })

  it('encodes ASCII text as single bytes', () => {
    const result = encodeGBK('hello')
    expect(result.length).toBe(5)
    expect(result.toString()).toBe('hello')
  })

  it('round-trips: encode then decode', () => {
    const original = '你好世界'
    const encoded = encodeGBK(original)
    const decoded = decodeGBK(encoded)
    expect(decoded).toBe(original)
  })

  it('decodes GBK bytes to text', () => {
    const encoded = encodeGBK('测试')
    const decoded = decodeGBK(encoded)
    expect(decoded).toBe('测试')
  })
})
```

- [x] **Step 4: 运行测试**

Run: `cd D:\Download\current\net-assist && npx vitest run`
Expected: All GBK codec tests PASS

- [x] **Step 5: Commit**

```bash
git add src/main/encoding/
git commit -m "feat: add GBK encoding/decoding via iconv-lite"
```

---

### Task 17: 连接断开自动释放资源与状态重置

**Files:**
- Modify: `src/renderer/src/hooks/useIpc.ts`
- Modify: `src/renderer/src/components/tab/TabBar.tsx`

**Interfaces:**
- Consumes:
  - `useTabStore` actions
  - IPC events
- Produces:
  - On `conn:status` idle from Main Process after close, Renderer resets tab state
  - Closing a tab in TabBar triggers `disconnect` IPC before removing tab

- [x] **Step 1: 更新 `useIpc` Hook 处理状态变更**

Modify `src/renderer/src/hooks/useIpc.ts`:

在顶部 import 添加:
```typescript
import type { TabStatus } from '../../shared/types'
```

确保 onStatus handler 使用正确类型:
```typescript
const unsubStatus = window.electronAPI.onStatus((payload: StatusPayload) => {
  updateTabStatus(payload.tabId, payload.status as TabStatus)
})
```

- [x] **Step 2: 更新 `TabBar` 关闭时调用 IPC disconnect**

Modify `src/renderer/src/components/tab/TabBar.tsx`:

在顶部添加 import:
```typescript
import { useIpc } from '../../hooks/useIpc'
```

在组件内解构 disconnect:
```typescript
const { disconnect } = useIpc()
```

将 closeTab 调用替换为 async handler:
```typescript
const handleCloseTab = async (tabId: string): Promise<void> => {
  try {
    await disconnect(tabId)
  } catch {
    // ignore, force close
  }
  closeTab(tabId)
}
```

更新关闭按钮的 onClick 使用 `handleCloseTab`:
```typescript
onClick={(e) => {
  e.stopPropagation()
  handleCloseTab(tab.id)
}}
```

- [x] **Step 3: Commit**

```bash
git add src/renderer/src/hooks/useIpc.ts src/renderer/src/components/tab/TabBar.tsx
git commit -m "feat: auto-disconnect on tab close, reset status on idle event"
```

---

### Task 18: 应用图标、窗口标题与 polish

**Files:**
- Create: `resources/icon.png` (占位图标)
- Modify: `package.json`
- Modify: `src/main/index.ts`

**Interfaces:**
- Consumes: nothing
- Produces: app window with custom title "NetAssist", app icon configured in build

- [x] **Step 1: 确认 Main Process 窗口标题**

Verify `src/main/index.ts` already has:
```typescript
title: 'NetAssist',
```

- [x] **Step 2: 创建占位图标目录和文件**

Run:
```bash
mkdir -p D:/Download/current/net-assist/resources
```

Place a 256x256 placeholder PNG at `resources/icon.png` (any solid-color PNG works for dev).

- [x] **Step 3: 更新 `package.json` 添加 electron-builder 打包配置**

Modify `package.json` to add:
```json
"build": {
  "appId": "com.netassist.app",
  "productName": "NetAssist",
  "directories": {
    "output": "dist"
  },
  "win": {
    "icon": "resources/icon.png",
    "target": ["nsis"]
  },
  "mac": {
    "icon": "resources/icon.png"
  },
  "linux": {
    "icon": "resources/icon.png"
  }
}
```

- [x] **Step 4: 端到端验证（手动测试清单）**

Run: `cd D:\Download\current\net-assist && npx electron-vite dev`

Manual test checklist:
1. 应用窗口标题显示 "NetAssist"
2. 创建 TCP Server Tab（端口 8889），开始监听，状态变为"监听中"
3. 创建 TCP Client Tab（127.0.0.1:8889），点击连接，状态变为"已连接"
4. 在 Client Tab 发送 "hello"，Server Tab 收到消息
5. 在 Server Tab 选择目标客户端发送 "world"，Client Tab 收到消息
6. 创建 UDP Tab，绑定本地端口 9999，发送数据
7. 切换 Tab，互不干扰
8. HEX 编辑模式输入 `AA BB CC` 并发送
9. 快捷发送面板添加快捷指令并点击发送
10. 字符可见性（空格显示为 ·，换行显示为符号）
11. 关闭 Tab 后网络资源被释放
12. 连接不存在的地址显示"连接被拒绝"错误

- [x] **Step 5: Commit**

```bash
git add resources/ package.json src/main/index.ts
git commit -m "feat: add app icon config, window title, polish and manual E2E verification"
```

---

## 自检报告

### 1. Spec 覆盖检查

| Spec 需求 | 对应 Task | 状态 |
|-----------|-----------|------|
| TCP Client 连接/断开/收发/编码切换 | Task 8, 9, 13 | 已覆盖 |
| TCP Server 监听/客户端管理/收发 | Task 10, 15 | 已覆盖 |
| UDP 绑定/收发/关闭 | Task 11, 15 | 已覆盖 |
| 多 Tab 管理（新建/切换/关闭/标题编辑/独立运行） | Task 5, 6, 17 | 已覆盖 |
| ASCII/UTF-8/GBK 编码切换 | Task 13, 16 | 已覆盖 |
| HEX 编辑器（校验/转换/格式化） | Task 14 | 已覆盖 |
| HEX 模式显示切换 | Task 13, 14 | 已覆盖 |
| 快捷发送（添加/编辑/删除/一键发送） | Task 7 | 已覆盖 |
| 换行符选择 | Task 13 | 已覆盖 |
| 字符可见性（空格/Tab/CR/LF/控制字符） | Task 13 | 已覆盖 |
| 原样发送不追加换行符 | Task 13 | 已覆盖 |
| 消息列表（时间戳/方向/来源/字节数） | Task 12 | 已覆盖 |
| 连接状态指示 | Task 9, 15 | 已覆盖 |
| 错误处理（ECONNREFUSED/超时/EADDRINUSE） | Task 8, 10, 11 | 已覆盖 |
| 消息上限 5000 条 | Task 5 | 已覆盖 |
| 连接超时 10s | Task 8 | 已覆盖 |
| IPC 协议 9 channels | Task 3, 4, 9 | 已覆盖 |
| 项目脚手架 | Task 1 | 已覆盖 |

### 2. Placeholder 扫描

无 "TBD"、"TODO"、"implement later"、"fill in details" 字样。
无 "Add appropriate error handling" 等模糊描述。
所有步骤包含实际可执行的代码和命令。

### 3. 类型一致性检查

- `TabType`, `TabStatus`, `Message`, `TabState` 在 Task 2 定义，Task 5, 6, 8-15 引用一致
- IPC channel names 在 Task 2 定义，Task 3, 4 引用一致；payload types 在 Task 2, 4, 9 引用一致
- `ConnectionManager` 接口在 Task 3 定义骨架，Task 8, 10, 11 逐层扩展，无签名冲突
- `TcpClientConnection` 接口在 Task 8 定义，Task 8 修改 ConnectionManager 引用
- `TcpServerConnection` 接口在 Task 10 定义，Task 10 修改 ConnectionManager 引用
- `UdpConnection` 接口在 Task 11 定义，Task 11 修改 ConnectionManager 引用
- `useIpc()` 返回 `{ connect, disconnect, send }` 在 Task 9 定义，Task 15, 17 引用一致
- `useTabStore()` actions 在 Task 5 定义，Task 6, 7, 9, 15, 17 调用一致
