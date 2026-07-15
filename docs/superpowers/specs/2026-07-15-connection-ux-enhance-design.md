---
comet_change: connection-ux-enhance
role: technical-design
canonical_spec: openspec
---

# 连接 UX 增强 — 技术设计

## 1. 概述

对网络助手应用进行三项 UX 改进：连接 tab 列表持久化、消息清空功能、TCP 客户端默认 IP。所有改动围绕现有 Electron + React + Zustand 架构，不引入新的架构模式。

## 2. 持久化存储

### 2.1 技术选型：electron-store

使用 `electron-store` 作为持久化方案，安装在 Main Process 侧。

**关键决策理由：**
- API 简洁（`store.get(key)` / `store.set(key, value)`），无需处理文件 I/O 细节
- 自动 JSON 序列化/反序列化
- 自动原子写入（写入临时文件 → rename），防止写入中断损坏数据
- 文件路径默认 `app.getPath('userData')/config.json`，跨平台一致

### 2.2 模块结构

```
src/main/store/
  └─ tab-store.ts        # 封装 electron-store 实例
      ├─ getTabs(): PersistedTab[]
      └─ saveTabs(tabs: PersistedTab[]): void
```

`getTabs` 从 store 读取 `tabs` 键并做基本验证后返回；`saveTabs` 将 tab 列表写入 store 的 `tabs` 键。

### 2.3 数据结构

```typescript
interface PersistedTab {
  id: string
  title: string
  type: TabType       // 'tcp-client' | 'tcp-server' | 'udp'
  config: TabConfig   // TcpClientConfig | TcpServerConfig | UdpConfig
}
```

**持久化范围：** id、title、type、config
**不持久化：** status（恢复为 `'idle'`）、messages（恢复为 `[]`）

### 2.4 保存时机

| 触发点 | 位置 | 说明 |
|--------|------|------|
| `createTab` | tab-store.ts | 创建新 tab 后 |
| `closeTab` | tab-store.ts | 关闭 tab 后 |
| `setTabConfig` | tab-store.ts | 更新配置后 |
| `updateTabTitle` | tab-store.ts | 更新标题后 |
| `app.before-quit` | Main Process | 应用退出前保底保存 |

实时保存保证崩溃时数据不丢失；`before-quit` 覆盖正常退出场景。

### 2.5 恢复逻辑

应用启动时，React 组件挂载后通过 `useEffect` 触发：

```
useEffect → loadPersistedTabs() IPC → Main: store.getTabs()
  ├─ 有数据 → set({ tabs: restoredTabs, activeTabId: tabs[0].id })
  │           tabCounter = tabs.length
  └─ 无数据 → 保持空列表
```

恢复后的 tab 状态均为 `idle`，消息列表为空，连接状态由用户手动触发。

## 3. IPC 通道

### 3.1 通道定义

沿用现有模式在 `src/shared/ipc-channels.ts` 中新增：

```typescript
// Renderer → Main (invoke — 需要返回值)
STORE_LOAD_TABS: 'store:load-tabs',

// Renderer → Main (send — 单向通知)
STORE_SAVE_TABS: 'store:save-tabs',
```

### 3.2 Payload 类型

```typescript
// store:save-tabs payload
interface SaveTabsPayload {
  tabs: PersistedTab[]
}

// store:load-tabs 无 payload（无参数调用）
// 返回值：PersistedTab[]
```

### 3.3 调用链

```
Renderer (tab-store.ts)
  └─ window.electron.store.loadTabs() → invoke('store:load-tabs')
  └─ window.electron.store.saveTabs(tabs) → send('store:save-tabs', { tabs })

Preload (src/preload/index.ts)
  └─ contextBridge.exposeInMainWorld('electron', { store: { loadTabs, saveTabs } })

Main Process (src/main/ipc/ipc-router.ts)
  └─ ipcMain.handle('store:load-tabs', () => tabStore.getTabs())
  └─ ipcMain.on('store:save-tabs', (_, payload) => tabStore.saveTabs(payload.tabs))
```

## 4. 默认 IP

### 4.1 defaultConfig 修改

`tab-store.ts` 中 `defaultConfig` 函数：

```typescript
case 'tcp-client':
  return { host: '127.0.0.1', port: 0 } as TcpClientConfig
  // 原值: { host: '', port: 0 }
```

### 4.2 UI 初始值

`TcpClientConfig.tsx` 中 `useState` 初始值：

```typescript
const [host, setHost] = useState(
  (tab.config as TcpClientConfigType).host || '127.0.0.1'
)
// 原值: (tab.config as TcpClientConfigType).host || ''
```

`|| '127.0.0.1'` 保证：新建 tab 时 config.host 为空字符串，fallback 到 `127.0.0.1`；恢复持久化 tab 的已有 host 不受影响（非空字符串不触发 fallback）。

## 5. 清空消息

### 5.1 tab-store 新增方法

```typescript
clearMessages: (tabId: string): void => {
  set({
    tabs: get().tabs.map((t) =>
      t.id === tabId ? { ...t, messages: [] } : t
    )
  })
}
```

### 5.2 UI 按钮

`MessageList.tsx` 顶部增加清空按钮：

```tsx
// 在消息列表容器头部
<div className="message-list-toolbar">
  <Button
    type="text"
    danger
    size="small"
    icon={<DeleteOutlined />}
    onClick={() => clearMessages(tabId)}
    disabled={messages.length === 0}
  >
    清空消息
  </Button>
</div>
```

- 无消息时按钮禁用
- 点击直接清空，无确认弹窗
- 只清空当前 tab，不影响其他 tab

## 6. 错误处理

| 场景 | 策略 |
|------|------|
| electron-store 文件损坏 | JSON.parse 异常 → 返回空数组，console.error 记录 |
| IPC 调用失败 | catch → 静默降级，不阻塞 UI |
| 恢复的 tab type 无效 | 过滤跳过该 tab，不中断恢复流程 |
| electron-store 模块缺失 | 编译时检查，缺失报错阻止构建 |
| 首次启动（无数据） | 返回空数组，保持空 tab 列表 |

## 7. 文件变更清单

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `package.json` | 新增依赖 | `electron-store` |
| `src/main/store/tab-store.ts` | 新建 | Main Process 持久化存储模块 |
| `src/main/ipc/ipc-router.ts` | 修改 | 注册新的 IPC handler |
| `src/preload/index.ts` | 修改 | 暴露 store API 到 renderer |
| `src/shared/ipc-channels.ts` | 修改 | 新增通道常量与 payload 类型 |
| `src/renderer/src/store/tab-store.ts` | 修改 | 持久化方法、clearMessages、defaultConfig |
| `src/renderer/src/components/config/TcpClientConfig.tsx` | 修改 | host 初始值 |
| `src/renderer/src/components/messages/MessageList.tsx` | 修改 | 清空按钮 |
| `src/renderer/src/components/messages/MessageList.css` | 修改 | 工具栏样式 |
