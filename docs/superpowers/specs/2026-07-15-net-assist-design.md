---
comet_change: net-assist
role: technical-design
canonical_spec: openspec
---

# NetAssist — TCP/UDP 调试工具 技术设计文档

## 架构总览

Electron 双进程架构：Main Process 负责所有网络 I/O，Renderer Process 负责 UI 渲染。

```
Main Process                          Renderer Process
┌──────────────────────┐              ┌──────────────────────────┐
│  ConnectionManager    │    IPC      │  Zustand Store            │
│  TcpClientConnection  │◄──────────►│  tabs[] / activeTabId     │
│  TcpServerConnection  │            │                           │
│  UdpConnection        │            │  ┌────────┐ ┌───────────┐ │
│  IPC Router           │            │  │Sidebar │ │Content    │ │
└──────────────────────┘              │  │Tab列表  │ │Area       │ │
                                      │  │快捷发送│ │配置+收发  │ │
                                      │  └────────┘ └───────────┘ │
                                      └──────────────────────────┘
```

## UI 布局

左侧 Sidebar (240px) + 右侧 Content Area：

- **Sidebar**: Tab 列表（含状态指示）+ 快捷发送面板
- **Content Area**: 连接配置栏（按类型动态切换）+ 消息日志 + 发送区

## 数据模型

```typescript
type TabType = 'tcp-client' | 'tcp-server' | 'udp';
type TabStatus = 'idle' | 'connecting' | 'connected' | 'listening' | 'error';

interface Message {
  id: string;
  timestamp: number;
  direction: 'tx' | 'rx';
  remote: string;           // "192.168.1.1:502"
  byteLength: number;
  raw: ArrayBuffer;
}

interface TabState {
  id: string;
  title: string;
  type: TabType;
  status: TabStatus;
  config: TcpClientConfig | TcpServerConfig | UdpConfig;
  messages: Message[];      // 上限 5000
}
```

## IPC 协议

双向通信，Renderer→Main 为指令，Main→Renderer 为事件：

| 方向 | Channel | 用途 |
|------|---------|------|
| R→M | `conn:connect` | 创建连接/开始监听/绑定 |
| R→M | `conn:disconnect` | 断开/停止/关闭 |
| R→M | `conn:send` | 发送数据 |
| R→M | `conn:server-set-target` | Server 选择目标客户端 |
| M→R | `conn:status` | 状态变更通知 |
| M→R | `conn:data` | 收发数据事件 |
| M→R | `conn:error` | 错误通知 |
| M→R | `conn:client-joined` | Server 有新客户端连接 |
| M→R | `conn:client-left` | Server 有客户端断开 |

## 编码处理

- **ASCII / UTF-8**: Node.js `Buffer` 原生方法
- **GBK**: `iconv-lite`（纯 JS，无 node-gyp 依赖）
- **HEX**: `Buffer.from(hexStr, 'hex')` 发送，`buf.toString('hex')` 显示
- 接收数据始终保留 `ArrayBuffer` 原始字节，显示时按模式解码

## HEX 编辑器

- 16 列 HEX 网格 + ASCII 对照行
- 输入规则：空格分隔或连续 HEX 均可
- 非法字符实时红色高亮，发送按钮禁用
- 发送前自动去空格转 Buffer

## 字符可见性

| 字符 | 显示 |
|------|------|
| 空格 | · |
| Tab | → |
| CR | ⏎ |
| LF | ¶ |
| 其他控制字符 | ␀-␟ |

## 消息显示

格式：`[HH:MM:SS.mmm] →/← IP:Port (N bytes) 内容`

发送方向为 `→`，接收方向为 `←`。消息上限 5000 条，超出自动丢弃最早消息。

## TCP Server 多客户端

支持两种发送目标：选择指定客户端 或 广播所有客户端。

## 错误处理

| 场景 | 处理 |
|------|------|
| ECONNREFUSED | 状态→error，提示"连接被拒绝" |
| 连接超时 (10s) | 状态→error，提示"连接超时" |
| EADDRINUSE | 状态→error，提示"端口已被占用" |
| 解码失败 | 该条消息回退 HEX 显示，标注"解码失败" |

## 技术栈

| 层 | 选型 |
|----|------|
| 框架 | Electron 28+ |
| 前端 | React 18 + TypeScript 5 |
| 构建 | electron-vite |
| UI | Ant Design 5 |
| 状态 | Zustand |
| 网络 | Node.js net / dgram |
| 持久化 | electron-store |
| GBK | iconv-lite |

## 测试策略

- **Main Process 网络层**: Vitest + mock net/dgram 单元测试
- **IPC 通信**: 集成测试
- **UI 组件**: Vitest + @testing-library/react
- **端到端**: 手动测试真实 TCP 交互 + 多 Tab 并发
