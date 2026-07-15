# Comet Design Handoff

- Change: net-assist
- Phase: design
- Mode: compact
- Context hash: c451824e9dbc9107e2f735e987df9688f15629358833c7ef19fadb701e5f47f5

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/net-assist/proposal.md

- Source: openspec/changes/net-assist/proposal.md
- Lines: 1-34
- SHA256: a25ab66e6cb1e31a4de5b8dd66f3b9f7c8328b3bbe5c10380171a5426d9bbe39

```md
## Why

现有 TCP 调试工具 tcpTester 存在界面老旧、操作繁琐、不支持多连接同时管理等问题。开发者需要同时调试多个 TCP 端口或设备时，必须反复开关窗口，效率低下。本项目旨在提供一个跨平台、现代化的 TCP/UDP 调试工具，以多 Tab 管理为杀手特性，提升网络协议调试体验。

## What Changes

- 新增 Electron 跨平台桌面应用 `net-assist`
- TCP Client 模式：连接远程服务器，发送/接收数据
- TCP Server 模式：监听本地端口，接收客户端连接并回复数据
- UDP 模式：发送和接收 UDP 数据包
- 多 Tab 管理：每个 Tab 独立运行一种模式，互不干扰
- 文本模式收发，支持 ASCII / UTF-8 / GBK 编码切换
- HEX 十六进制模式收发
- 换行符可配置（\r\n、\n、\r）
- 快捷发送：预设常用指令列表，一键发送

## Capabilities

### New Capabilities
- `tcp-client`: TCP 客户端连接管理，支持连接/断开、数据收发、编码切换
- `tcp-server`: TCP 服务端监听，支持启动/停止、客户端管理、数据回复
- `udp-socket`: UDP 数据包收发
- `multi-tab`: 多 Tab 管理，每个 Tab 独立运行 TCP Client/Server 或 UDP 模式
- `hex-editor`: HEX 十六进制数据编辑与显示
- `quick-send`: 快捷发送预设指令列表

### Modified Capabilities
<!-- 全新项目，无已有 capability 需要修改 -->

## Impact

- 全新项目，无已有代码受影响的
- 技术依赖：Electron、React/Vue 前端框架、Node.js net/dgram 模块
- 目标平台：Windows、macOS、Linux

```

## openspec/changes/net-assist/design.md

- Source: openspec/changes/net-assist/design.md
- Lines: 1-96
- SHA256: 8cee8a8cbc20aef27da05b32c2a22acac5bcf7dffcf61e41dfb7fb401875958a

[TRUNCATED]

```md
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

```

Full source: openspec/changes/net-assist/design.md

## openspec/changes/net-assist/tasks.md

- Source: openspec/changes/net-assist/tasks.md
- Lines: 1-59
- SHA256: 3cb5cebbfd83c67728bec8aec1449c612f5a8f1bedd2f94ef1b6e0ec9e4f2b82

```md
## 1. 项目初始化

- [ ] 1.1 初始化 Electron + React + TypeScript 项目骨架（Vite 构建）
- [ ] 1.2 配置 Main Process / Preload / Renderer 三层目录结构
- [ ] 1.3 安装基础依赖（antd、zustand、electron-builder）

## 2. IPC 通信基础设施

- [ ] 2.1 定义 IPC 通道常量与类型接口（指令/事件/数据）
- [ ] 2.2 实现 Main Process 侧 IPC 处理器注册与分发
- [ ] 2.3 实现 Preload 脚本，暴露安全的 contextBridge API
- [ ] 2.4 实现 Renderer 侧 IPC 调用 hooks（useIpc）

## 3. 多 Tab 管理

- [ ] 3.1 实现 Tab 状态管理（Zustand store）：创建、切换、关闭、标题编辑
- [ ] 3.2 实现 Tab 栏 UI 组件（TabBar）：新建按钮、Tab 标签、关闭按钮
- [ ] 3.3 实现 Tab 内容面板：根据 Tab 类型渲染对应配置/收发组件

## 4. TCP Client

- [ ] 4.1 Main Process：net 模块封装，connect / disconnect / send / onData
- [ ] 4.2 Renderer：TCP Client 配置面板 UI（IP 输入、端口输入、连接/断开按钮）
- [ ] 4.3 Renderer：收发消息面板 UI（发送区、接收区、消息列表、编码选择）

## 5. TCP Server

- [ ] 5.1 Main Process：net.createServer 封装，listen / stop / 客户端管理 / send / onData
- [ ] 5.2 Renderer：TCP Server 配置面板 UI（端口输入、启动/停止按钮、客户端列表）
- [ ] 5.3 Renderer：Server 收发面板 UI（选择目标客户端、发送区、接收区、消息列表）

## 6. UDP

- [ ] 6.1 Main Process：dgram 模块封装，bind / close / send / onMessage
- [ ] 6.2 Renderer：UDP 配置面板 UI（本地端口、目标 IP、目标端口、绑定/关闭按钮）
- [ ] 6.3 Renderer：UDP 收发面板 UI（发送区、接收区、消息列表）

## 7. 文本编码与 HEX 模式

- [ ] 7.1 实现文本编码切换组件（ASCII / UTF-8 / GBK），Main Process 侧编解码逻辑
- [ ] 7.2 实现 HEX 编辑器组件：输入校验、字节转换、显示格式化
- [ ] 7.3 实现消息列表中文本/HEX 模式切换显示

## 8. 快捷发送

- [ ] 8.1 实现快捷指令数据存储（localStorage / electron-store）
- [ ] 8.2 实现快捷发送面板 UI：列表展示、添加/编辑/删除、一键发送

## 9. 换行符配置

- [ ] 9.1 实现换行符选择组件（\r\n、\n、\r）
- [ ] 9.2 发送时自动追加选定换行符

## 10. UI 完善与集成

- [ ] 10.1 应用主布局（Tab 栏 + 配置面板 + 收发面板 + 快捷发送面板）
- [ ] 10.2 消息日志区域：时间戳、方向标识（发送/接收）、来源标识
- [ ] 10.3 连接状态指示与错误提示
- [ ] 10.4 应用图标与窗口标题

```

## openspec/changes/net-assist/specs/hex-editor/spec.md

- Source: openspec/changes/net-assist/specs/hex-editor/spec.md
- Lines: 1-20
- SHA256: 9c63e947ebd4506bec3939149946a8cd059771b2333e06c1450df96cdfaa5263

```md
## ADDED Requirements

### Requirement: HEX 模式显示
系统 SHALL 支持以十六进制格式显示收发数据。

#### Scenario: 切换到 HEX 显示
- **WHEN** 用户在收发面板中选择 HEX 显示模式
- **THEN** 接收到的数据显示为十六进制格式（如 `AA BB CC`）

#### Scenario: HEX 模式发送
- **WHEN** 用户在 HEX 模式下输入十六进制字符串（如 `AA BB CC`）并发送
- **THEN** 系统将十六进制转换为原始字节发送

#### Scenario: HEX 输入校验
- **WHEN** 用户在 HEX 模式下输入非法十六进制字符
- **THEN** 系统提示输入格式错误

#### Scenario: 文本模式与 HEX 模式切换
- **WHEN** 用户在文本模式和 HEX 模式之间切换
- **THEN** 已存在的消息按当前模式重新渲染，新消息按当前模式显示

```

## openspec/changes/net-assist/specs/multi-tab/spec.md

- Source: openspec/changes/net-assist/specs/multi-tab/spec.md
- Lines: 1-24
- SHA256: 78813fdf19c32921aed268f37abd9d342569172253e4c6acde04948e00e79f18

```md
## ADDED Requirements

### Requirement: 多 Tab 管理
系统 SHALL 支持多 Tab 同时运行，每个 Tab 独立管理一个 TCP Client、TCP Server 或 UDP 连接。

#### Scenario: 新建 Tab
- **WHEN** 用户点击"新建连接"按钮并选择连接类型（TCP Client / TCP Server / UDP）
- **THEN** 系统创建一个新 Tab，显示对应类型的配置界面

#### Scenario: Tab 切换
- **WHEN** 用户点击不同的 Tab 标签
- **THEN** 系统切换到该 Tab 的界面，显示其状态和消息记录

#### Scenario: 关闭 Tab
- **WHEN** 用户点击 Tab 的关闭按钮
- **THEN** 系统关闭该 Tab 并释放其网络资源（断开连接/停止监听/关闭绑定）

#### Scenario: 多 Tab 独立运行
- **WHEN** 用户同时运行 TCP Server Tab（监听 8888）、TCP Client Tab（连接 8888）和 UDP Tab
- **THEN** 三个 Tab 互不干扰，各自独立收发数据

#### Scenario: Tab 标题自定义
- **WHEN** 用户新建 Tab 时
- **THEN** 系统自动生成标题（如"TCP Client: host:port"），用户可双击修改

```

## openspec/changes/net-assist/specs/quick-send/spec.md

- Source: openspec/changes/net-assist/specs/quick-send/spec.md
- Lines: 1-42
- SHA256: f7605cd59a9d9e22855ea62a53498316a1a72210a3c354c59473c305ddcdff94

```md
## ADDED Requirements

### Requirement: 快捷发送
系统 SHALL 支持用户预设常用指令列表，一键发送。

#### Scenario: 添加快捷指令
- **WHEN** 用户在快捷发送面板中点击"添加"并输入指令名称和内容
- **THEN** 系统保存该指令到快捷发送列表

#### Scenario: 使用快捷指令发送
- **WHEN** 用户在快捷发送列表中点击某条指令
- **THEN** 系统将该指令内容填入发送区并发送

#### Scenario: 编辑快捷指令
- **WHEN** 用户编辑已有的快捷指令名称或内容
- **THEN** 系统更新该指令

#### Scenario: 删除快捷指令
- **WHEN** 用户删除一条快捷指令
- **THEN** 系统从列表中移除该指令

### Requirement: 字符可见性
系统 SHALL 在发送输入区中以可视化符号显示不可见字符，帮助用户确认实际发送内容。

#### Scenario: 空格可见
- **WHEN** 用户在输入区输入空格
- **THEN** 空格显示为中点符号（·），实际发送时为原始空格字符

#### Scenario: 换行符可见
- **WHEN** 用户在输入区输入回车换行
- **THEN** CR 显示为 ⏎，LF 显示为 ¶，实际发送时为原始换行符

#### Scenario: Tab 可见
- **WHEN** 用户在输入区输入 Tab 字符
- **THEN** Tab 显示为箭头符号（→），实际发送时为原始 Tab 字符

### Requirement: 原样发送
系统 SHALL 将用户输入的数据原样发送，不自动追加任何字符（包括换行符）。

#### Scenario: 不追加换行符
- **WHEN** 用户输入数据并点击发送
- **THEN** 系统仅发送用户输入的内容，不在末尾自动追加换行符

```

## openspec/changes/net-assist/specs/tcp-client/spec.md

- Source: openspec/changes/net-assist/specs/tcp-client/spec.md
- Lines: 1-35
- SHA256: 6e8c24a6e7447981556b99a34f59bda3e43c5207d9519c364c31382ddbf333f1

```md
## ADDED Requirements

### Requirement: TCP 客户端连接
系统 SHALL 支持以 TCP 客户端模式连接远程服务器，发送数据并接收响应。

#### Scenario: 成功连接
- **WHEN** 用户在 TCP Client Tab 中输入目标 IP 和端口，点击"连接"
- **THEN** 系统建立 TCP 连接，状态显示"已连接"

#### Scenario: 连接失败
- **WHEN** 用户尝试连接不可达的目标地址
- **THEN** 系统显示连接失败的错误信息

#### Scenario: 发送文本数据
- **WHEN** 用户在已连接的 TCP Client Tab 中输入文本并点击"发送"
- **THEN** 系统将文本按当前编码转换后发送，并在消息列表中显示已发送的内容和时间

#### Scenario: 接收数据
- **WHEN** TCP 连接的远端发送数据
- **THEN** 系统在消息列表中显示接收到的数据、时间和来源

#### Scenario: 断开连接
- **WHEN** 用户在已连接状态下点击"断开"
- **THEN** 系统关闭 TCP 连接，状态显示"未连接"

### Requirement: 文本编码切换
系统 SHALL 支持在文本模式下切换 ASCII、UTF-8、GBK 编码进行收发。

#### Scenario: 编码切换后发送
- **WHEN** 用户选择 GBK 编码并发送中文文本
- **THEN** 系统以 GBK 编码转换文本为字节后发送

#### Scenario: 编码切换后接收
- **WHEN** 用户选择 UTF-8 编码并接收到数据
- **THEN** 系统以 UTF-8 编码将接收到的字节解码为文本显示

```

## openspec/changes/net-assist/specs/tcp-server/spec.md

- Source: openspec/changes/net-assist/specs/tcp-server/spec.md
- Lines: 1-28
- SHA256: 94321daf49a91cfbe0426b6d629b3d738468430e66217e939d56b96323df6fcb

```md
## ADDED Requirements

### Requirement: TCP 服务端监听
系统 SHALL 支持以 TCP 服务端模式监听本地端口，接收客户端连接并回复数据。

#### Scenario: 启动监听
- **WHEN** 用户在 TCP Server Tab 中输入端口号并点击"开始监听"
- **THEN** 系统开始监听指定端口，状态显示"监听中"

#### Scenario: 客户端连接
- **WHEN** 有客户端连接到正在监听的 TCP Server
- **THEN** 系统在客户端列表中显示该连接的 IP 和端口信息

#### Scenario: 向指定客户端发送数据
- **WHEN** 用户选择一个已连接的客户端并发送数据
- **THEN** 系统向该客户端发送数据，消息列表中记录已发送内容

#### Scenario: 接收客户端数据
- **WHEN** 已连接的客户端向 Server 发送数据
- **THEN** 系统在消息列表中显示接收到的数据、时间和来源客户端

#### Scenario: 停止监听
- **WHEN** 用户点击"停止监听"
- **THEN** 系统关闭所有客户端连接并停止监听，状态显示"已停止"

#### Scenario: 客户端断开
- **WHEN** 已连接的客户端断开连接
- **THEN** 系统从客户端列表中移除该客户端，并在消息列表中记录断开事件

```

## openspec/changes/net-assist/specs/udp-socket/spec.md

- Source: openspec/changes/net-assist/specs/udp-socket/spec.md
- Lines: 1-20
- SHA256: 92921ad83b10bbee50cf6f912d98867aef7c87262a1d109299e9442d1a09b85e

```md
## ADDED Requirements

### Requirement: UDP 数据收发
系统 SHALL 支持以 UDP 模式发送和接收数据包。

#### Scenario: 绑定本地端口
- **WHEN** 用户在 UDP Tab 中输入本地端口并点击"绑定"
- **THEN** 系统绑定指定端口，状态显示"已绑定"

#### Scenario: 发送 UDP 数据
- **WHEN** 用户在 UDP Tab 中输入目标 IP、端口和数据，点击"发送"
- **THEN** 系统向目标地址发送 UDP 数据包，消息列表中记录已发送内容

#### Scenario: 接收 UDP 数据
- **WHEN** 系统在绑定的 UDP 端口上接收到数据包
- **THEN** 系统在消息列表中显示接收到的数据和来源 IP 端口

#### Scenario: 关闭绑定
- **WHEN** 用户点击"关闭"按钮
- **THEN** 系统关闭 UDP 绑定，状态显示"未绑定"

```
