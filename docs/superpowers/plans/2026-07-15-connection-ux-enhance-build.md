---
change: connection-ux-enhance
design-doc: docs/superpowers/specs/2026-07-15-connection-ux-enhance-design.md
base-ref: 0f6ae910fb6852375ab809a5dbeb32f4e7fc1cff
---

# 连接 UX 增强 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为网络助手实现连接 tab 持久化、消息清空和 TCP 客户端默认 IP 三项 UX 增强。

**Architecture:** 在 Main Process 侧通过 electron-store（已安装 v8.1.0）持久化 tab 元数据（id/title/type/config），Renderer 侧通过 IPC 触发保存/加载。消息清空为纯 Renderer 端 Zustand 操作，默认 IP 仅修改 `defaultConfig` 和 `useState` fallback 值。

**Tech Stack:** Electron 28 + React 18 + Zustand 4 + electron-store 8 + TypeScript 5

**Global Constraints:**
- 不引入新的架构模式，沿用现有 Electron + React + Zustand 分层
- 所有 IPC 通道定义在 `src/shared/ipc-channels.ts`
- Preload 通过 `contextBridge.exposeInMainWorld('electronAPI', ...)` 暴露 API
- Renderer 端 tab 状态管理在 `src/renderer/src/store/tab-store.ts`（Zustand）
- 不持久化 status（恢复为 `'idle'`）和 messages（恢复为 `[]`）

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/shared/types.ts` | 修改 | 新增 `PersistedTab` 接口 |
| `src/shared/ipc-channels.ts` | 修改 | 新增 `STORE_LOAD_TABS`、`STORE_SAVE_TABS` 通道常量及 payload 类型 |
| `src/main/store/tab-store.ts` | 新建 | Main Process 端 electron-store 封装（getTabs / saveTabs） |
| `src/main/ipc/ipc-router.ts` | 修改 | 注册新的 store IPC handler |
| `src/main/index.ts` | 修改 | 添加 `before-quit` 保底保存 |
| `src/preload/index.ts` | 修改 | 暴露 `store.loadTabs` / `store.saveTabs` 到 renderer |
| `src/renderer/src/store/tab-store.ts` | 修改 | 持久化方法、`clearMessages`、`defaultConfig` 修改 |
| `src/renderer/src/components/layout/MainLayout.tsx` | 修改 | 启动时加载持久化 tab |
| `src/renderer/src/components/config/TcpClientConfig.tsx` | 修改 | host 初始值 fallback 到 `127.0.0.1` |
| `src/renderer/src/components/messages/MessageList.tsx` | 修改 | 添加清空按钮 |
| `src/renderer/src/components/messages/MessageList.css` | 修改 | 工具栏样式 |
| `src/renderer/src/components/tab/TabContent.tsx` | 修改 | 传递 tabId 给 MessageList |

---

### Task 1: 共享类型与 IPC 通道定义

**Files:**
- Modify: `src/shared/types.ts`
- Modify: `src/shared/ipc-channels.ts`

**Interfaces:**
- Produces: `PersistedTab` (interface), `SaveTabsPayload` (interface), `IPC_CHANNELS.STORE_LOAD_TABS`, `IPC_CHANNELS.STORE_SAVE_TABS`

- [ ] **Step 1: 在 types.ts 中新增 PersistedTab 接口**

在 `src/shared/types.ts` 的 `ClientInfo` 接口之后新增：

```typescript
export interface PersistedTab {
  id: string
  title: string
  type: TabType
  config: TabConfig
}
```

- [ ] **Step 2: 在 ipc-channels.ts 中新增 Store IPC 通道和 payload 类型**

在 `src/shared/ipc-channels.ts` 顶部 import 中新增 `PersistedTab`：

```typescript
import type { TabType, TabStatus, TabConfig, ClientInfo, PersistedTab } from './types'
```

在 `IPC_CHANNELS` 常量的 `CONN_CLIENT_LEFT` 之后新增两条通道：

```typescript
// Renderer -> Main (invoke — 需要返回值)
STORE_LOAD_TABS: 'store:load-tabs',

// Renderer -> Main (send — 单向通知)
STORE_SAVE_TABS: 'store:save-tabs',
```

在文件末尾新增 payload 类型：

```typescript
// ---- Store Payloads ----
export interface SaveTabsPayload {
  tabs: PersistedTab[]
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误

- [ ] **Step 4: 提交**

```bash
git add src/shared/types.ts src/shared/ipc-channels.ts
git commit -m "feat: add PersistedTab type and store IPC channel definitions"
```

---

### Task 2: Main Process 持久化存储模块

**Files:**
- Create: `src/main/store/tab-store.ts`

**Interfaces:**
- Produces: `getTabs(): PersistedTab[]`, `saveTabs(tabs: PersistedTab[]): void`

- [ ] **Step 1: 创建 Main Process store 模块**

创建 `src/main/store/tab-store.ts`：

```typescript
import Store from 'electron-store'
import type { PersistedTab } from '../../shared/types'

interface StoreSchema {
  tabs: PersistedTab[]
}

const store = new Store<StoreSchema>({
  name: 'config',
  defaults: {
    tabs: []
  }
})

export function getTabs(): PersistedTab[] {
  try {
    const tabs = store.get('tabs', []) as PersistedTab[]
    if (!Array.isArray(tabs)) {
      console.error('[tab-store] stored tabs is not an array, returning []')
      return []
    }
    const validTypes = ['tcp-client', 'tcp-server', 'udp']
    return tabs.filter(
      (t) =>
        t &&
        typeof t.id === 'string' &&
        typeof t.title === 'string' &&
        validTypes.includes(t.type as string) &&
        typeof t.config === 'object'
    )
  } catch (err) {
    console.error('[tab-store] failed to read tabs from store:', err)
    return []
  }
}

export function saveTabs(tabs: PersistedTab[]): void {
  try {
    store.set('tabs', tabs)
  } catch (err) {
    console.error('[tab-store] failed to save tabs to store:', err)
  }
}
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误

- [ ] **Step 3: 提交**

```bash
git add src/main/store/tab-store.ts
git commit -m "feat: add main process tab persistence store (electron-store)"
```

---

### Task 3: IPC Handler 注册与 Preload 暴露

**Files:**
- Modify: `src/main/ipc/ipc-router.ts`
- Modify: `src/preload/index.ts`

**Interfaces:**
- Consumes: `getTabs()` / `saveTabs()` from `src/main/store/tab-store.ts`, `IPC_CHANNELS.STORE_LOAD_TABS`, `IPC_CHANNELS.STORE_SAVE_TABS`, `SaveTabsPayload`, `PersistedTab`
- Produces: `window.electronAPI.store.loadTabs()`, `window.electronAPI.store.saveTabs(tabs)`

- [ ] **Step 1: 在 ipc-router.ts 中注册 store IPC handler**

在 `src/main/ipc/ipc-router.ts` 的 import 区域添加：

```typescript
import { getTabs, saveTabs } from '../store/tab-store'
```

在 `ConnectPayload` 等类型导入中添加 `SaveTabsPayload`：

```typescript
import type {
  ConnectPayload,
  DisconnectPayload,
  SendPayload,
  ServerSetTargetPayload,
  SaveTabsPayload
} from '../../shared/ipc-channels'
```

在 `registerIpcHandlers` 函数末尾（`ipcMain.handle(IPC_CHANNELS.CONN_SERVER_SET_TARGET, ...)` 之后、`}` 闭合之前）添加：

```typescript
// Store
ipcMain.handle(IPC_CHANNELS.STORE_LOAD_TABS, () => {
  return getTabs()
})

ipcMain.on(IPC_CHANNELS.STORE_SAVE_TABS, (_event, payload: SaveTabsPayload) => {
  saveTabs(payload.tabs)
})
```

在 `unregisterIpcHandlers` 函数中添加清理：

```typescript
ipcMain.removeHandler(IPC_CHANNELS.STORE_LOAD_TABS)
ipcMain.removeAllListeners(IPC_CHANNELS.STORE_SAVE_TABS)
```

- [ ] **Step 2: 在 Preload 中暴露 store API**

在 `src/preload/index.ts` 的 import 区域添加：

```typescript
import type { PersistedTab } from '../shared/types'
```

在 `electronAPI` 对象中添加 `store` 属性（在 `onClientLeft` 闭合之后、对象闭合大括号之前）：

```typescript
store: {
  loadTabs: (): Promise<PersistedTab[]> => {
    return ipcRenderer.invoke(IPC_CHANNELS.STORE_LOAD_TABS)
  },
  saveTabs: (tabs: PersistedTab[]): void => {
    ipcRenderer.send(IPC_CHANNELS.STORE_SAVE_TABS, { tabs })
  }
}
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误

- [ ] **Step 4: 提交**

```bash
git add src/main/ipc/ipc-router.ts src/preload/index.ts
git commit -m "feat: register store IPC handlers and expose store API in preload"
```

---

### Task 4: Main Process 退出前保底保存

**Files:**
- Modify: `src/main/index.ts`

**Interfaces:**
- Consumes: `saveTabs` from `src/main/store/tab-store.ts`

- [ ] **Step 1: 在 index.ts 中添加 before-quit 保底保存**

在 `src/main/index.ts` 的 import 区域，`import { ConnectionManager }` 之后添加：

```typescript
import { saveTabs } from './store/tab-store'
```

在 `app.whenReady().then(...)` 回调内、`createWindow()` 之后、`app.on('activate', ...)` 之前添加：

```typescript
app.on('before-quit', () => {
  // Tab 数据在 renderer 端每次 createTab/closeTab/setTabConfig/updateTabTitle 时已实时保存。
  // electron-store 写入为同步操作，正常退出时数据已在磁盘 — 此处为保底占位。
})
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误

- [ ] **Step 3: 提交**

```bash
git add src/main/index.ts
git commit -m "feat: add before-quit safeguard for tab persistence"
```

---

### Task 5: Renderer 端持久化逻辑（tab-store 修改）

**Files:**
- Modify: `src/renderer/src/store/tab-store.ts`

**Interfaces:**
- Consumes: `window.electronAPI.store.loadTabs()`, `window.electronAPI.store.saveTabs()`, `PersistedTab`
- Produces: `loadPersistedTabs(): Promise<void>`, 修改后的 `createTab`, `closeTab`, `setTabConfig`, `updateTabTitle`（均自动触发 saveTabs）、`clearMessages(tabId)`

- [ ] **Step 1: 添加类型声明和持久化辅助函数**

在 `src/renderer/src/store/tab-store.ts` 的 import 区域添加 `PersistedTab` 类型：

```typescript
import type { PersistedTab } from '../../shared/types'
```

在现有 import 之后、`MAX_MESSAGES` 之前添加 window 类型声明和 persistTabs 辅助函数：

```typescript
declare global {
  interface Window {
    electronAPI?: {
      store: {
        loadTabs: () => Promise<PersistedTab[]>
        saveTabs: (tabs: PersistedTab[]) => void
      }
    }
  }
}

function persistTabs(tabs: TabState[]): void {
  const toSave: PersistedTab[] = tabs.map((t) => ({
    id: t.id,
    title: t.title,
    type: t.type,
    config: t.config
  }))
  try {
    window.electronAPI?.store.saveTabs(toSave)
  } catch (err) {
    console.error('[tab-store] failed to save tabs:', err)
  }
}

async function loadPersistedTabs(): Promise<TabState[]> {
  try {
    if (!window.electronAPI?.store) return []
    const persisted = await window.electronAPI.store.loadTabs()
    if (!persisted || persisted.length === 0) return []

    return persisted.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      status: 'idle' as const,
      config: p.config,
      messages: []
    }))
  } catch (err) {
    console.error('[tab-store] failed to load persisted tabs:', err)
    return []
  }
}
```

- [ ] **Step 2: 在 TabStore interface 中添加新方法**

在 `TabStore` interface 的 `removeQuickSendItem` 之后、闭合大括号之前添加：

```typescript
loadPersistedTabs: () => Promise<void>
clearMessages: (tabId: string) => void
```

- [ ] **Step 3: 在 create 函数中添加实现**

在 `create<TabStore>((set, get) => ({` 的函数体内，`removeQuickSendItem` 之后添加两个方法实现：

```typescript
loadPersistedTabs: async (): Promise<void> => {
  const restored = await loadPersistedTabs()
  if (restored.length > 0) {
    tabCounter = restored.length
    set({ tabs: restored, activeTabId: restored[0].id })
  }
},

clearMessages: (tabId: string): void => {
  set({
    tabs: get().tabs.map((t) =>
      t.id === tabId ? { ...t, messages: [] } : t
    )
  })
},
```

- [ ] **Step 4: 修改 createTab —— 创建后自动触发 persistTabs**

将现有的 `createTab` 方法修改为：

```typescript
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

  const newTabs = [...tabs, newTab]
  set({ tabs: newTabs, activeTabId: id })
  persistTabs(newTabs)
  return id
},
```

- [ ] **Step 5: 修改 closeTab —— 关闭后自动触发 persistTabs**

将现有的 `closeTab` 方法中的 `set({ tabs: newTabs, activeTabId: newActiveId })` 行改为：

```typescript
set({ tabs: newTabs, activeTabId: newActiveId })
persistTabs(newTabs)
```

在 `set(...)` 之后立即添加 `persistTabs(newTabs)`。

- [ ] **Step 6: 修改 setTabConfig —— 更新后自动触发 persistTabs**

将现有的 `setTabConfig` 方法修改为：

```typescript
setTabConfig: (tabId: string, config: TabConfig): void => {
  const newTabs = get().tabs.map((t) => (t.id === tabId ? { ...t, config } : t))
  set({ tabs: newTabs })
  persistTabs(newTabs)
},
```

- [ ] **Step 7: 修改 updateTabTitle —— 更新后自动触发 persistTabs**

将现有的 `updateTabTitle` 方法修改为：

```typescript
updateTabTitle: (tabId: string, title: string): void => {
  if (!title.trim()) return
  const newTabs = get().tabs.map((t) => (t.id === tabId ? { ...t, title: title.trim() } : t))
  set({ tabs: newTabs })
  persistTabs(newTabs)
},
```

- [ ] **Step 8: 修改 defaultConfig —— TCP 客户端默认 IP**

将 `defaultConfig` 函数中 `tcp-client` case 的 host 从 `''` 改为 `'127.0.0.1'`：

```typescript
case 'tcp-client':
  return { host: '127.0.0.1', port: 0 } as TcpClientConfig
```

- [ ] **Step 9: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误

- [ ] **Step 10: 提交**

```bash
git add src/renderer/src/store/tab-store.ts
git commit -m "feat: add tab persistence, clearMessages, and default TCP client IP to renderer store"
```

---

### Task 6: 启动时恢复持久化 Tab

**Files:**
- Modify: `src/renderer/src/components/layout/MainLayout.tsx`

**Interfaces:**
- Consumes: `useTabStore().loadPersistedTabs()`

- [ ] **Step 1: 在 MainLayout 中加 useEffect 加载持久化 tab**

在 `src/renderer/src/components/layout/MainLayout.tsx` 中，修改 import 和组件。

将：
```typescript
import { useTabStore } from '../../store/tab-store'
```

不变。在 React import 中添加 `useEffect`：

```typescript
import { useEffect } from 'react'
```

修改组件函数体，从 `useTabStore` 中解构 `loadPersistedTabs`，并添加 useEffect：

```typescript
export default function MainLayout(): JSX.Element {
  const { tabs, activeTabId, loadPersistedTabs } = useTabStore()
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null

  useEffect(() => {
    loadPersistedTabs()
  }, [])

  return (
    // ... 其余 JSX 不变
```

原有的：
```typescript
const { tabs, activeTabId } = useTabStore()
```

改为：
```typescript
const { tabs, activeTabId, loadPersistedTabs } = useTabStore()
```

并在 `const activeTab = ...` 之后添加 `useEffect`。

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误

- [ ] **Step 3: 提交**

```bash
git add src/renderer/src/components/layout/MainLayout.tsx
git commit -m "feat: restore persisted tabs on app startup"
```

---

### Task 7: TCP 客户端默认 IP UI 修改

**Files:**
- Modify: `src/renderer/src/components/config/TcpClientConfig.tsx`

**Interfaces:**
- Consumes: `TcpClientConfig` (types.ts)

- [ ] **Step 1: 修改 host 的 useState fallback 值**

在 `src/renderer/src/components/config/TcpClientConfig.tsx` 中，修改 `host` 的 `useState` 初始值。

将：
```typescript
const [host, setHost] = useState((tab.config as TcpClientConfigType).host || '')
```

改为：
```typescript
const [host, setHost] = useState(
  (tab.config as TcpClientConfigType).host || '127.0.0.1'
)
```

- [ ] **Step 2: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误

- [ ] **Step 3: 提交**

```bash
git add src/renderer/src/components/config/TcpClientConfig.tsx
git commit -m "feat: default TCP client host to 127.0.0.1"
```

---

### Task 8: 消息清空按钮

**Files:**
- Modify: `src/renderer/src/components/messages/MessageList.tsx`
- Modify: `src/renderer/src/components/messages/MessageList.css`
- Modify: `src/renderer/src/components/tab/TabContent.tsx`

**Interfaces:**
- Consumes: `useTabStore().clearMessages(tabId)`, `tabId` (通过 Props 传入)

- [ ] **Step 1: 修改 MessageList 组件**

将 `src/renderer/src/components/messages/MessageList.tsx` 完整替换为：

```tsx
import { useEffect, useRef } from 'react'
import { Button } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import type { Message, DisplayMode, EncodingMode } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import MessageItem from './MessageItem'
import './MessageList.css'

interface Props {
  tabId: string
  messages: Message[]
  displayMode: DisplayMode
  encoding: EncodingMode
}

export default function MessageList({ tabId, messages, displayMode, encoding }: Props): JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null)
  const clearMessages = useTabStore((s) => s.clearMessages)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="message-list">
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
      {messages.length === 0 ? (
        <div className="message-list-empty">暂无消息</div>
      ) : (
        messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} displayMode={displayMode} encoding={encoding} />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 2: 添加工具栏 CSS 样式**

在 `src/renderer/src/components/messages/MessageList.css` 文件开头新增：

```css
.message-list-toolbar {
  display: flex;
  justify-content: flex-end;
  padding: 4px 0;
  border-bottom: 1px solid #333;
  margin-bottom: 4px;
}
```

- [ ] **Step 3: 修改 TabContent 传入 tabId**

在 `src/renderer/src/components/tab/TabContent.tsx` 中，修改 `MessageList` 的调用。

将：
```tsx
<MessageList messages={tab.messages} displayMode={displayMode} encoding={encoding} />
```

改为：
```tsx
<MessageList tabId={tab.id} messages={tab.messages} displayMode={displayMode} encoding={encoding} />
```

- [ ] **Step 4: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

预期：无类型错误

- [ ] **Step 5: 提交**

```bash
git add src/renderer/src/components/messages/MessageList.tsx src/renderer/src/components/messages/MessageList.css src/renderer/src/components/tab/TabContent.tsx
git commit -m "feat: add clear messages button to message list"
```

---

### Task 9: 手动验证（端到端测试清单）

- [ ] **Step 1: 验证 Tab 持久化**

1. 启动应用 `npm run dev`
2. 创建多个不同类型的 tab（TCP Client、TCP Server、UDP）
3. 修改某些 tab 的标题（双击编辑）
4. 在 TCP Client 中输入 IP 和端口
5. 关闭应用
6. 重新启动应用
7. 确认：所有 tab 恢复，标题正确，配置正确，状态为 `idle`（灰色圆点），消息列表为空

- [ ] **Step 2: 验证 Tab 删除持久化**

1. 在恢复的 tab 基础上，关闭其中一个 tab
2. 关闭应用再重新打开
3. 确认：被关闭的 tab 不再出现

- [ ] **Step 3: 验证消息清空**

1. 在 TCP Client 中连接并发送/接收消息
2. 点击"清空消息"按钮
3. 确认：当前 tab 消息清空
4. 切换到其他 tab
5. 确认：其他 tab 消息未受影响

- [ ] **Step 4: 验证默认 IP**

1. 新建 TCP Client tab
2. 确认：host 输入框默认显示 `127.0.0.1`
3. 输入一个自定义 IP 并连接
4. 关闭应用重新打开
5. 确认：该 tab 的 host 仍为自定义 IP（非 `127.0.0.1`）

- [ ] **Step 5: 验证空消息时清空按钮禁用**

1. 新建 tab（消息为空）
2. 确认：清空消息按钮处于禁用状态
3. 发送消息后再清空
4. 确认：清空后按钮重新变为禁用

- [ ] **Step 6: 验证首次启动（无持久化数据）**

1. 删除 `%APPDATA%/net-assist/config.json`（Windows）或 `~/Library/Application Support/net-assist/config.json`（macOS）
2. 启动应用
3. 确认：空 tab 列表，显示"点击左侧 '+' 按钮新建连接"
