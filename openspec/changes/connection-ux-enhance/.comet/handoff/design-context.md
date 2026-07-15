# Comet Design Handoff

- Change: connection-ux-enhance
- Phase: design
- Mode: compact
- Context hash: 60b27988192d5dfc31cab45af9bca60440d093d75fef8593c12dc306c212d54d

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/connection-ux-enhance/proposal.md

- Source: openspec/changes/connection-ux-enhance/proposal.md
- Lines: 1-25
- SHA256: cc0bdf6d77217768598fa099ea34791382190cd8293fbe8f1b42176343265d2e

```md
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

```

## openspec/changes/connection-ux-enhance/design.md

- Source: openspec/changes/connection-ux-enhance/design.md
- Lines: 1-109
- SHA256: a5eb591fd28896f0a6a637a581ab183e48070bc4aecaf9de1ab0da59c6ede5a0

[TRUNCATED]

```md
## Context

当前 `tab-store.ts` (Zustand) 和 `connection-manager.ts` (Main Process) 中所有 tab 和连接状态均为内存存储，应用退出后全部丢失。需增加持久化层，使 tab 列表在应用重启后自动恢复。

应用为 Electron 架构，Main Process 可访问文件系统，Renderer Process 通过 IPC 与 Main Process 通信。持久化存储放在 Main Process，Renderer 通过 IPC 读写。

## Goals / Non-Goals

**Goals:**
- tab 列表（id、type、title、config）在应用退出/重启后自动恢复
- 消息接收区支持清空当前 tab 所有消息
- 新建 TCP Client 时 host 默认显示 `127.0.0.1`

**Non-Goals:**
- 不持久化消息历史
- 不持久化连接状态（恢复后均为 idle）
- 不跨 tab 清空消息
- 不改变端口默认值

## Decisions

### 1. 持久化方案：electron-store

使用 `electron-store` 作为持久化存储方案。

**理由：**
- Electron 生态成熟方案，API 简洁（`store.get` / `store.set`）
- 自动处理 JSON 序列化、文件路径、原子写入
- 支持加密（未来可扩展）
- 文件默认存储在 `app.getPath('userData')` 下，跨平台一致

**替代方案：**
- 手动 JSON 文件：需要自行处理序列化、路径、原子写入，增加样板代码
- SQLite：过于重量级，当前数据结构简单，无查询需求

### 2. 保存时机：实时保存 + 退出保底

在 tab 增删和配置变更时实时触发保存，同时在 `app.on('before-quit')` 做保底保存。

**理由：**
- 实时保存防止应用崩溃时数据丢失
- 退出保底覆盖边界情况

**触发保存的操作：**
- `createTab` — 创建 tab 后保存
- `closeTab` — 关闭 tab 后保存
- `setTabConfig` — 更新配置后保存
- `updateTabTitle` — 更新标题后保存（标题是可持久化的信息之一）

### 3. IPC 通道设计

| 通道 | 方向 | 用途 |
|------|------|------|
| `store:load-tabs` | Renderer → Main → Renderer | 启动时加载持久化的 tab 列表 |
| `store:save-tabs` | Renderer → Main | tab 变更时保存 tab 列表 |

Main Process 暴露 `ipcMain.handle('store:load-tabs', ...)` 和 `ipcMain.on('store:save-tabs', ...)`。

### 4. 持久化数据结构

```typescript
interface PersistedTab {
  id: string
  title: string
  type: TabType
  config: TabConfig
}

// electron-store key: "tabs"
// value: PersistedTab[]
```

保存字段：id、title、type、config。不保存 status（恢复为 idle）、messages（恢复为空数组）。

### 5. 恢复逻辑

应用启动时：
1. Renderer 发起 `store:load-tabs` IPC 调用
2. Main Process 从 electron-store 读取 tabs 数据
3. 如果有数据，用 `set({ tabs: restoredTabs, activeTabId: tabs[0].id })` 恢复

```

Full source: openspec/changes/connection-ux-enhance/design.md

## openspec/changes/connection-ux-enhance/tasks.md

- Source: openspec/changes/connection-ux-enhance/tasks.md
- Lines: 1-32
- SHA256: 2d618238839e7cf82e2384d7e8d44095f1e3da3cfc55086908f17f39ae5629d1

```md
## 1. 依赖安装与 IPC 通道

- [ ] 1.1 安装 electron-store 依赖
- [ ] 1.2 在 Main Process 中初始化 electron-store 实例
- [ ] 1.3 注册 `store:load-tabs` IPC handler（返回持久化的 tab 列表）
- [ ] 1.4 注册 `store:save-tabs` IPC handler（保存 tab 列表到 electron-store）
- [ ] 1.5 在 shared/ipc-channels.ts 中新增 IPC 通道常量定义

## 2. 持久化核心逻辑

- [ ] 2.1 在 tab-store.ts 中新增持久化相关的 IPC 调用方法（loadPersistedTabs、saveTabs）
- [ ] 2.2 修改 createTab：创建 tab 后自动触发 saveTabs
- [ ] 2.3 修改 closeTab：关闭 tab 后自动触发 saveTabs
- [ ] 2.4 修改 setTabConfig：更新配置后自动触发 saveTabs
- [ ] 2.5 修改 updateTabTitle：更新标题后自动触发 saveTabs
- [ ] 2.6 应用启动时调用 loadPersistedTabs 恢复 tab 列表，并调整 tabCounter 避免 ID 冲突

## 3. TCP 客户端默认 IP

- [ ] 3.1 修改 tab-store.ts 中 defaultConfig 函数：tcp-client 的 host 默认值改为 `127.0.0.1`
- [ ] 3.2 修改 TcpClientConfig.tsx 中 host 的 useState 初始值：`host || '127.0.0.1'`

## 4. 消息清空功能

- [ ] 4.1 在 tab-store.ts 中新增 clearMessages(tabId) 方法
- [ ] 4.2 在消息接收区顶部/底部增加「清空消息」按钮，调用 clearMessages

## 5. 验证与收尾

- [ ] 5.1 手动验证：创建多个 tab → 关闭应用 → 重新打开 → 确认 tab 恢复且状态为 idle
- [ ] 5.2 手动验证：在 TCP Client 中发送/接收消息 → 点击清空 → 确认消息清空且其他 tab 不受影响
- [ ] 5.3 手动验证：新建 TCP Client → 确认 host 默认显示 127.0.0.1

```
