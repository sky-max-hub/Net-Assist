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
4. 如果没有数据（首次启动或数据被清除），保持空列表
5. 调整 `tabCounter` 避免 ID 冲突（设为已恢复 tab 数量 + 1）

### 6. 默认 IP 修改

修改 `tab-store.ts` 中 `defaultConfig` 函数：

```typescript
case 'tcp-client':
  return { host: '127.0.0.1', port: 0 } as TcpClientConfig
```

同时更新 `TcpClientConfig.tsx` 中 `useState` 初始值，从 `(tab.config as TcpClientConfigType).host || ''` 改为 `(tab.config as TcpClientConfigType).host || '127.0.0.1'`。

### 7. 清空消息

在 `tab-store.ts` 中新增 `clearMessages(tabId: string)` 方法。

在 `MessageList.tsx` 中新增清空按钮，调用 `clearMessages(tabId)`。按钮可以放在消息列表顶部或底部的工具栏中。无确认弹窗，直接清空。

## Risks / Trade-offs

- **electron-store 与打包**：electron-store 需要原生模块，确认打包配置（electron-builder）正确处理。→ 已在项目中验证 electron 打包流程可用
- **数据迁移**：未来持久化数据结构变更时需要迁移逻辑。→ 当前阶段简单，后续可加版本号字段
- **tabCounter 碰撞**：恢复 tab 后 ID 生成器可能产生冲突。→ 恢复后将 `tabCounter` 设为已恢复 tab 数量

## Open Questions

- 是否需要支持"导出/导入"tab 配置？（暂不做，后续按需添加）
