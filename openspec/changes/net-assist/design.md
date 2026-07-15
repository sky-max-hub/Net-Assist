## Context

`net-assist` 是一个全新的 Electron 跨平台桌面应用，目标是为网络协议开发者提供一个现代化的 TCP/UDP 调试工具。当前市场上 tcpTester 等工具界面老旧、不支持多连接同时管理（多 Tab），操作效率低下。本项目从零开始构建，无历史代码负债。

## Goals / Non-Goals

**Goals:**
- Electron 跨平台桌面应用（Windows / macOS / Linux）
- 多 Tab 管理，每个 Tab 独立运行 TCP Client / Server / UDP
- 文本模式（可切换编码 ASCII / UTF-8 / GBK）与 HEX 模式
- 换行符可配置、快捷发送预设指令
- 现代 UI，操作流畅直观

**Non-Goals:**
- 文件传输、SSL/TLS、脚本自动化、插件系统
- 定时/周期发送

## Decisions

### 1. 架构：Electron + React + TypeScript

| 方案 | 优劣 |
|------|------|
| Electron + React + TS | 生态成熟，跨平台，开发效率高，社区资源丰富 |
| Tauri + React + TS | 包体更小，但 Rust 后端学习曲线高，TCP 生态不如 Node.js 原生 |
| WPF / WinForms | 仅 Windows，不符合跨平台要求 |

**选择 Electron**：Node.js 原生 `net`/`dgram` 模块直接处理 TCP/UDP，无需额外依赖，且 Electron 跨平台打包成熟。

### 2. 进程架构

```
┌─────────────────────────────────────────────────────┐
│                   Main Process                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │TCP Server│  │TCP Client│  │    UDP Socket    │  │
│  │ (net)    │  │ (net)    │  │    (dgram)       │  │
│  └──────────┘  └──────────┘  └──────────────────┘  │
│         │              │               │            │
│         └──────────────┼───────────────┘            │
│                        │                            │
│                  ┌─────┴─────┐                      │
│                  │  IPC 桥   │                      │
│                  └─────┬─────┘                      │
└────────────────────────┼────────────────────────────┘
                         │
┌────────────────────────┼────────────────────────────┐
│                 Renderer Process                     │
│  ┌─────────────────────┴──────────────────────────┐ │
│  │                Tab Manager                      │ │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐        │ │
│  │  │ Tab 1   │  │ Tab 2   │  │ Tab 3   │  ...   │ │
│  │  │Server   │  │Client   │  │UDP      │        │ │
│  │  └─────────┘  └─────────┘  └─────────┘        │ │
│  └────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────┐ │
│  │            收发面板 + 日志区域                   │ │
│  │  [HEX/Text 切换] [编码选择] [换行符] [快捷发送] │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **Main Process**：负责所有网络 I/O（net / dgram），通过 IPC 与渲染进程通信
- **Renderer Process**：纯 UI 层，不直接操作 Socket，通过 IPC 向 Main Process 发送指令并接收数据

### 3. 前端框架：React + TypeScript

React 生态成熟，TypeScript 保证类型安全。UI 组件库选用 Ant Design（社区熟悉度高）或轻量的 shadcn/ui 风格。

### 4. 多 Tab 状态管理

每个 Tab 是一个独立的状态单元，包含：
```ts
interface TabState {
  id: string;
  title: string;
  type: 'tcp-client' | 'tcp-server' | 'udp';
  config: TcpClientConfig | TcpServerConfig | UdpConfig;
  status: 'idle' | 'connecting' | 'connected' | 'listening' | 'error';
  messages: Message[];  // 收发记录
}
```
全局用 Zustand（轻量）管理 Tab 列表和当前活跃 Tab。

### 5. IPC 通信协议

Renderer → Main（指令）：`{ type, tabId, payload }`
Main → Renderer（数据/事件）：`{ type, tabId, payload }`

事件类型包括：`connect`、`disconnect`、`data-received`、`error`、`client-connected`（Server 模式）等。

## Risks / Trade-offs

- **[Risk] 大量数据接收时 UI 卡顿** → 采用虚拟滚动渲染消息列表，单 Tab 消息上限可配置
- **[Risk] Server 模式多客户端并发** → 每客户端分配独立 socket 句柄，通过 IPC 分别推送到渲染进程
- **[Risk] Electron 打包体积较大** → 可接受，调试工具用户对包体积不敏感
