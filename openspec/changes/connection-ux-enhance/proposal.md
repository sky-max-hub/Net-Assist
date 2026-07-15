## Why

当前网络助手应用的连接列表和 tab 配置仅在内存中维护，应用重启后所有已创建的连接 tab 全部丢失，用户需要重新创建和配置每个连接，体验不佳。此外，消息接收区缺少清空操作，TCP 客户端新建时 IP 地址默认为空，需要三项 UX 改进来提升日常使用效率。

## What Changes

- **连接列表持久化**：自动保存已创建的 tab 列表（类型、配置如 IP/端口、标题），应用重启后自动恢复，连接状态统一为"未连接"
- **消息清空功能**：消息接收区增加清空按钮，一键清除当前 tab 的所有消息，无需确认框
- **TCP 客户端默认 IP**：新建 TCP Client 时 host 字段默认显示 `127.0.0.1`，端口仍需手动填写

## Capabilities

### New Capabilities
- `connection-persistence`: 连接 tab 列表的持久化存储与恢复，不包含消息历史和连接状态
- `message-clear`: 当前 tab 消息的一键清空操作

### Modified Capabilities
- `tcp-client`: TCP 客户端新建时 host 默认值从空字符串变更为 `127.0.0.1`

## Impact

- **Renderer**: `tab-store.ts`（新增持久化加载/保存、clearMessages 方法、defaultConfig 修改）、`TcpClientConfig.tsx`（host 初始值）、`MessageList.tsx`（清空按钮）
- **Main Process**: 新增持久化存储模块（electron-store）、IPC 通道（加载/保存 tab 列表）
- **Shared**: 可能需要新增 IPC 通道类型定义
- **依赖**: 新增 `electron-store` 依赖
