---
change: ui-refactor-to-prototype
design-doc: docs/superpowers/specs/2026-08-20-ui-refactor-to-prototype-design.md
base-ref: e9232eab32b296326a33447210dbb8864886dce7
---

# NetAssist UI 重构为原型 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 以 `docs/ui/netassist-app.html`（Apple 风格精密工作台）为唯一设计源，把 `src/renderer/` 全部 UI 重写为手写自定义组件，移除 antd / @ant-design/icons 依赖，像素级对齐原型外观与交互，同时保留全部真实功能（CodeMirror CR 保留、GBK 编码、粘贴保留、Ctrl+Enter / Ctrl+↑↓、快捷指令持久化、连接管理）。

**Architecture:** 组件树自上而下为 `main.tsx`（挂载 tokens.css/base.css）→ `App.tsx` → `MainLayout`（AppBar + Sidebar + Workspace）。设计令牌以 CSS 自定义属性（`design/tokens.css`）形式原样迁移自原型 `:root`；全局基元（`.btn`/`.cfg-*`/`.switch`/`.seg`/`.chip`/`.icon-btn`/`.menu`/`.modal`/`.toast` 等）放入 `design/base.css`。图标以 `components/common/Icons.tsx` 内联 SVG 注册表替换全部 `@ant-design/icons`。状态保留 `tab-store`（Zustand）+ 全部 IPC 通道；新增 `ui-store` 承载 settings/toast/侧栏 UI 态。派生数据（全局状态、侧栏过滤、统计）用纯函数实现以便单测。`CrPreservingEditor`（CodeMirror）与 `lineEnding`/`AsciiHighlighter` 原样保留，仅改外观。

**Tech Stack:** React 18 + TypeScript + Zustand + CodeMirror 6 + vitest（jsdom）。移除 antd 5 / @ant-design/icons。

## Global Constraints

- **唯一设计源**：`docs/ui/netassist-app.html`。所有类名、DOM 结构、交互、样式逐字对齐原型；CSS 迁移一律从原型对应行原样拷贝（本计划给出精确行号），只改宿主选择器（`#app`→`.app-root`、`#sidebar`→`.sidebar`、`#msg-area`→`.msg-area`、`#welcome`→`.welcome` 等）。
- **产物语言**：zh-CN。UI 文案、代码注释、commit message 全部使用简体中文。
- **保留真实功能**：CodeMirror CR/CRLF 保留、GBK 编码链路（`window.electronAPI.encoding.encodeText`）、粘贴保留、Ctrl+Enter 发送、Ctrl+↑↓ 历史、快捷指令数据与持久化、连接管理、消息上限 5000、标签上限 20（超限 `showToast` 提示）。
- **不改底层**：`src/main/`、`src/preload/`、`src/shared/` 全部只读，不新增 IPC。
- **不引入新第三方组件库**；渲染层最终移除 antd 与 @ant-design/icons。
- **保留原生窗口边框**：不做红绿灯无边框标题栏（`.traffic` 相关 CSS 不迁移）。
- **设置壳不驱动真实行为**：仅外观 + `localStorage['netassist.settings']` 持久化；面板内加注记"设置仅作外观演示，暂不影响实际行为"。
- **验证门禁**：基线 `npx tsc --noEmit -p tsconfig.web.json --composite false` 已红（约 48 个 `../../shared/types` 相对路径解析错误，全部为 `import type`，构建/测试时被 esbuild 擦除，属既有问题），因此本计划的回归门禁是 **`npm test`（vitest）** + **`npm run build`（electron-vite）**。`src/main/connections/__tests__/tcp-client-connection.test.ts` 有 1 个与本次无关的既有失败用例，不在本 change 修复范围（src/main 只读），遇到时注明即可。
- **commit 习惯**：每个 task 验收后单独 commit（中文、常规前缀，如 `feat:`/`refactor:`/`chore:`）；不得积攒。

---

## 文件结构总览

**新建：**
```
src/renderer/src/design/tokens.css            设计令牌（:root）原样迁移
src/renderer/src/design/base.css              全局基元 + reset + 响应式 + reduced-motion
src/renderer/src/components/common/Icons.tsx  图标注册表 + <Icon/>
src/renderer/src/components/common/format.ts  fmtBytes / formatTime / fmtDur
src/renderer/src/components/common/Toast.tsx  + Toast.css
src/renderer/src/components/common/Menu.tsx   + Menu.css
src/renderer/src/components/common/Modal.tsx  + Modal.css
src/renderer/src/components/common/Welcome.tsx + Welcome.css
src/renderer/src/components/layout/AppBar.tsx + AppBar.css
src/renderer/src/components/layout/Sidebar.tsx + Sidebar.css
src/renderer/src/components/messages/fmtBody.tsx       控制符可视化渲染
src/renderer/src/components/settings/SettingsModal.tsx + SettingsModal.css
src/renderer/src/store/tab-meta.ts           TYPE_META/STATUS_META/isLive/deriveGlobalStatus/statusLabelFor/filterConnections/filterCommands
src/renderer/src/store/settings-schema.ts   SETTINGS_DEFAULTS/SETTINGS_SCHEMA/storage 纯函数
src/renderer/src/store/ui-store.ts            settings/toast/侧栏 UI 态
src/renderer/src/hooks/useConnectionActions.ts  ws-header 连接/断开动作
src/renderer/src/hooks/useServerClients.ts     TCP Server 客户端订阅
```

**重写（保留文件名）：**
```
src/renderer/src/main.tsx                      去 ConfigProvider，挂 tokens/base
src/renderer/src/components/layout/MainLayout.tsx + MainLayout.css   布局壳（AppBar+Sidebar+Workspace）
src/renderer/src/components/tab/TabBar.tsx + TabBar.css               连接列表（conn-row）
src/renderer/src/components/quick-send/QuickSendPanel.tsx + QuickSendPanel.css  快捷指令（cmd-groups）
src/renderer/src/components/config/TcpClientConfig.tsx|TcpServerConfig.tsx|UdpConfig.tsx   ws-header 内联字段渲染
src/renderer/src/components/tab/TabContent.tsx + TabContent.css       工作区（ws-header+消息+统计+composer）
src/renderer/src/components/messages/MessageList.tsx + MessageList.css
src/renderer/src/components/messages/MessageItem.tsx
src/renderer/src/components/send/SendPanel.tsx + SendPanel.css        composer
src/renderer/src/components/stats/StatsBar.tsx + StatsBar.css
src/renderer/src/components/common/CrPreservingEditor.css             仅改外观对齐 .cmp-input
```

**删除：**
```
src/renderer/src/components/encoding/EncodingSelector.tsx（antd Radio，被 seg 取代）
src/renderer/src/components/encoding/HexEditor.tsx + HexEditor.css（全项目无引用）
src/renderer/src/components/encoding/WhitespaceRenderer.tsx（无引用）
```

**测试（新建/更新）：**
```
src/renderer/src/components/common/__tests__/Icons.test.tsx
src/renderer/src/components/common/__tests__/format.test.ts
src/renderer/src/components/messages/__tests__/fmtBody.test.tsx
src/renderer/src/store/__tests__/tab-meta.test.ts
src/renderer/src/store/__tests__/settings-schema.test.ts
src/renderer/src/store/__tests__/ui-store.test.ts
src/renderer/src/components/send/__tests__/sendpanel-render.test.tsx  更新 props（tabId → tab）
```
既有 `CrPreservingEditor.test.tsx` / `paste-flow.test.tsx` / `lineEnding.test.ts` / `tab-store.test.ts` 保持通过，不改动（除非 props 变更牵连，见 Task 14）。

---

## Task 1: 设计令牌与全局样式（tokens.css + base.css）

**Files:**
- Create: `src/renderer/src/design/tokens.css`
- Create: `src/renderer/src/design/base.css`
- Modify: `src/renderer/src/main.tsx`
- Modify: `src/renderer/index.html`（title 对齐原型）

**Interfaces:**
- Produces: 全局 CSS 变量 `--bg/--surface/--fg/--muted/--border/--accent/--success/--warn/--danger/--radius-*/--motion-*/--ease-standard/--focus-ring/--shadow-pop/--shadow-modal/--scrim` 与全局基元类 `.btn`/`.cfg-*`/`.switch`/`.seg`/`.chip`/`.icon-btn`/`.status-dot`/`.st-*`/`.menu`/`.modal`/`.toast`/`.ctrl`/`.sb-none`。后续所有组件样式引用 `var(--*)` 与这些基元类。

- [x] **Step 1: 创建 tokens.css** —— 从原型 `netassist-app.html` 第 10–33 行拷贝 `:root` 令牌块与全局 reset：
  - 第 10 行 `:root { ... }`（含 `--font-body` 中文栈的第 12 行覆盖）原样拷贝。
  - 第 13–20 行（`--tl-*`、`--shadow-pop`、`--shadow-modal`、`--scrim`）原样拷贝（`.traffic` 不用，但令牌保留供 modal/toast 投影使用）。
  - 第 21–33 行全局 reset 原样迁移，唯一改动：`#app { display:flex; ... }` → `.app-root { display:flex; flex-direction:column; height:100%; min-height:100vh; }`。

- [x] **Step 2: 创建 base.css** —— 按下列原型行号把共享基元类原样迁移（类名与内容逐字一致）：
  - `.ic`（行 36）、`.icon-btn`（89–93）、`.status-dot`/`.pulse`/`@keyframes pulse`/`.st-idle/.st-connecting/.st-connected/.st-listening/.st-bound/.st-error`（101–107）、`.sb-none`（142）、`.btn` 及 `.btn-primary/.btn-dark/.btn-danger/.btn-secondary/.btn-ghost/.btn-sm`（153–169）、`.cfg-sep/.cfg-field/.cfg-label/.cfg-input/.cfg-input.w-70/.cfg-input.w-60/.cfg-select`（171–180）、`.status-pill` 及 `.sp-success/.sp-warn/.sp-error`（181–185）、`.seg`（232–235）、`.switch`（236–241）、`.toolbar-sep`（242）、`.ctrl`（217）、`.chip`/`.chip-name`/`.chip-send`（251–254）、`.menu/.menu-title/.menu-item/.menu-item .mi-*/.menu-item.history-item/.menu-empty`（271–281）、`.modal-backdrop/.modal/.modal h3/.modal-sub/.field/.input/.textarea/.modal-select/.modal-actions`（283–293）、`.toast/.toast.show`（343–344）。
  - 追加 `@media (prefers-reduced-motion: reduce)`（346–349）与 `@media (max-width: 920px)`（350 行）两块响应式，改宿主：`#app`→`.app-root`、`#sidebar`→`.sidebar`。

- [x] **Step 3: main.tsx 挂载并去掉 ConfigProvider**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './design/tokens.css'
import './design/base.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [x] **Step 4: index.html 标题对齐** —— `<title>NetAssist · 网络调试助手</title>`（当前为 `NetAssist`）。

- [x] **Step 5: 验证** —— 运行 `npm test`，期望既有渲染层用例全部通过（antd 组件无 ConfigProvider 仍可用，无行为变化）。

- [x] **Step 6: Commit**

```bash
git add src/renderer/src/design src/renderer/src/main.tsx src/renderer/index.html
git commit -m "feat: 迁移原型设计令牌与全局基元样式，渲染层挂载 tokens/base.css"
```

---

## Task 2: 图标系统 Icons.tsx + 格式化工具 format.ts

**Files:**
- Create: `src/renderer/src/components/common/Icons.tsx`
- Create: `src/renderer/src/components/common/__tests__/Icons.test.tsx`
- Create: `src/renderer/src/components/common/format.ts`
- Create: `src/renderer/src/components/common/__tests__/format.test.ts`

**Interfaces:**
- Produces:
  - `type IconName`（22 个图标名）与 `Icon({ name, size?, className?, style? })`，默认渲染 `<svg className="ic">`（16×16、stroke=currentColor、strokeWidth 1.7）。
  - `fmtBytes(n: number): string`、`formatTime(ts: number): string`（`HH:mm:ss.mmm`）、`fmtDur(seconds: number): string`（`m:ss` / `h:mm:ss`）。
- Consumes: 无（纯静态）。

- [x] **Step 1: 写失败测试 `Icons.test.tsx`**

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import Icon, { type IconName } from '../Icons'

const NAMES: IconName[] = ['network','client','server','udp','plus','chevron','folder','play','pencil','trash','copy','check','x','send','split','merge','history','search','sliders','chevron-up','arrow-right','chevron-left']

describe('Icons', () => {
  it('每个图标名渲染一个带 ic 类的 svg', () => {
    for (const n of NAMES) {
      const { container } = render(React.createElement(Icon, { name: n }))
      const svg = container.querySelector('svg.ic')
      expect(svg, `name=${n}`).toBeTruthy()
      expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24')
    }
  })
  it('支持 size 与 className 覆盖', () => {
    const { container } = render(React.createElement(Icon, { name: 'plus', size: 19, className: 'conn-type-icon' }))
    const svg = container.querySelector('svg.conn-type-icon')
    expect(svg).toBeTruthy()
    expect(svg?.getAttribute('width')).toBe('19')
  })
})
```

- [x] **Step 2: 运行确认失败** —— `npx vitest run src/renderer/src/components/common/__tests__/Icons.test.tsx`，期望 FAIL（模块不存在）。

- [x] **Step 3: 实现 Icons.tsx** —— path 数据逐字取自原型 `<symbol>`（行 355–376，均为 24×24 viewBox）：

```tsx
import React from 'react'

export type IconName =
  | 'network' | 'client' | 'server' | 'udp' | 'plus' | 'chevron' | 'folder'
  | 'play' | 'pencil' | 'trash' | 'copy' | 'check' | 'x' | 'send' | 'split'
  | 'merge' | 'history' | 'search' | 'sliders' | 'chevron-up' | 'arrow-right' | 'chevron-left'

const PATHS: Record<IconName, React.ReactNode> = {
  network: (<><circle cx="6" cy="6" r="2.2" /><circle cx="18" cy="6" r="2.2" /><circle cx="12" cy="18" r="2.2" /><path d="M6 6h12M6 6l6 12M18 6l-6 12" /></>),
  client: (<><rect x="2.5" y="8" width="8" height="8" rx="2" /><rect x="13.5" y="8" width="8" height="8" rx="2" /><path d="M10.5 12h3" /></>),
  server: (<><rect x="4" y="4" width="16" height="6" rx="2" /><rect x="4" y="14" width="16" height="6" rx="2" /><path d="M8 7h.01M8 17h.01" /></>),
  udp: (<><circle cx="12" cy="12" r="3" /><path d="M7.5 7.5a7 7 0 0 0 0 9M16.5 7.5a7 7 0 0 1 0 9M4.5 4.5a11 11 0 0 0 0 15M19.5 4.5a11 11 0 0 1 0 15" /></>),
  plus: (<path d="M12 5v14M5 12h14" />),
  chevron: (<path d="M6 9l6 6 6-6" />),
  folder: (<path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />),
  play: (<path d="M7 5l11 7-11 7z" />),
  pencil: (<><path d="M4 20l4-1L19 7l-3-3L5 16z" /><path d="M13 6l3 3" /></>),
  trash: (<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13h10l1-13" />),
  copy: (<><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a1 1 0 0 1 1-1h10" /></>),
  check: (<path d="M5 12l5 5 9-10" />),
  x: (<path d="M6 6l12 12M18 6L6 18" />),
  send: (<path d="M21 3L11 13M21 3l-7 20-4-9-9-4z" />),
  split: (<><rect x="3" y="4" width="18" height="16" rx="2.5" /><path d="M12 4v16" /></>),
  merge: (<><rect x="3" y="4" width="18" height="16" rx="2.5" /></>),
  history: (<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>),
  search: (<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l5 5" /></>),
  sliders: (<><path d="M4 8h10M18 8h2M4 16h4M12 16h8" /><circle cx="16" cy="8" r="2" /><circle cx="10" cy="16" r="2" /></>),
  'chevron-up': (<path d="M6 15l6-6 6 6" />),
  'arrow-right': (<path d="M5 12h14M13 6l6 6-6 6" />),
  'chevron-left': (<path d="M15 6l-6 6 6 6" />)
}

interface IconProps { name: IconName; size?: number; className?: string; style?: React.CSSProperties }

export default function Icon({ name, size = 16, className, style }: IconProps): JSX.Element {
  return (
    <svg className={className ?? 'ic'} width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"
      strokeLinejoin="round" style={style} aria-hidden="true">
      {PATHS[name]}
    </svg>
  )
}
```

- [x] **Step 4: 写失败测试 `format.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { fmtBytes, formatTime, fmtDur } from '../format'

describe('format 工具', () => {
  it('fmtBytes: B / KB / MB', () => {
    expect(fmtBytes(0)).toBe('0 B')
    expect(fmtBytes(512)).toBe('512 B')
    expect(fmtBytes(2048)).toBe('2.00 KB')
    expect(fmtBytes(1048576 * 2)).toBe('2.00 MB')
  })
  it('formatTime: HH:mm:ss.mmm', () => {
    const d = new Date(2026, 0, 1, 10, 5, 9, 123)
    expect(formatTime(d.getTime())).toBe('10:05:09.123')
  })
  it('fmtDur: m:ss 与 h:mm:ss', () => {
    expect(fmtDur(198)).toBe('3:18')
    expect(fmtDur(3661)).toBe('1:01:01')
  })
})
```

- [x] **Step 5: 实现 format.ts**

```ts
export function fmtBytes(n: number): string {
  if (n >= 1048576) return (n / 1048576).toFixed(2) + ' MB'
  if (n >= 1024) return (n / 1024).toFixed(2) + ' KB'
  return n + ' B'
}

export function formatTime(ts: number): string {
  const d = new Date(ts)
  const p = (x: number, l: number) => String(x).padStart(l, '0')
  return `${p(d.getHours(), 2)}:${p(d.getMinutes(), 2)}:${p(d.getSeconds(), 2)}.${p(d.getMilliseconds(), 3)}`
}

export function fmtDur(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${ss}`
  return `${m}:${ss}`
}
```

- [x] **Step 6: 运行两个测试确认 PASS** —— `npx vitest run src/renderer/src/components/common/__tests__/Icons.test.tsx src/renderer/src/components/common/__tests__/format.test.ts`。

- [x] **Step 7: Commit**

```bash
git add src/renderer/src/components/common/Icons.tsx src/renderer/src/components/common/format.ts src/renderer/src/components/common/__tests__/
git commit -m "feat: 新增原型图标注册表与格式化工具"
```

---

## Task 3: tab-meta 纯逻辑（状态/类型元数据 + 派生函数）

**Files:**
- Create: `src/renderer/src/store/tab-meta.ts`
- Create: `src/renderer/src/store/__tests__/tab-meta.test.ts`

**Interfaces:**
- Consumes: `TabState/TabStatus/TabType/QuickSendGroup/QuickSendItem`（`../../shared/types`，type-only）、`IconName`（`../components/common/Icons`）。
- Produces:
  - `TYPE_META: Record<TabType, { label; pill; tag; icon: IconName }>`
  - `STATUS_META: Record<TabStatus, { cls; label; pulse?: boolean }>`
  - `isLive(tab): boolean`
  - `deriveGlobalStatus(tabs): { level: 'error'|'active'|'idle'; count: number }`
  - `statusLabelFor(tab, clientCount): string`
  - `filterConnections(tabs, query): TabState[]`
  - `FilteredGroup = { group: QuickSendGroup; items: QuickSendItem[] }` 与 `filterCommands(groups, items, query): FilteredGroup[]`

- [ ] **Step 1: 写失败测试 `tab-meta.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import type { TabState } from '../../shared/types'
import { deriveGlobalStatus, isLive, statusLabelFor, filterConnections, filterCommands } from '../tab-meta'

function tab(over: Partial<TabState>): TabState {
  return {
    id: 't', title: 'T', type: 'tcp-client', status: 'idle',
    config: { host: '127.0.0.1', port: 1 }, messages: [],
    sendOptions: { encoding: 'utf-8', displayMode: 'text', lfToCr: false, splitView: false },
    ...over
  }
}

describe('tab-meta 派生逻辑', () => {
  it('deriveGlobalStatus: error 优先 → active → idle', () => {
    expect(deriveGlobalStatus([tab({ status: 'error' })]).level).toBe('error')
    expect(deriveGlobalStatus([tab({ status: 'error' }), tab({ status: 'connected' })]).level).toBe('error')
    expect(deriveGlobalStatus([tab({ status: 'connected' }), tab({ status: 'listening' })]).level).toBe('active')
    expect(deriveGlobalStatus([tab({ status: 'idle' })]).level).toBe('idle')
    expect(deriveGlobalStatus([tab({ status: 'connected' })]).count).toBe(1)
  })
  it('isLive: connected/listening 为活跃', () => {
    expect(isLive(tab({ status: 'connected' }))).toBe(true)
    expect(isLive(tab({ status: 'listening' }))).toBe(true)
    expect(isLive(tab({ status: 'idle' }))).toBe(false)
  })
  it('statusLabelFor: tcp-server 监听与 udp 绑定特例', () => {
    expect(statusLabelFor(tab({ type: 'tcp-server', status: 'listening' }), 2)).toBe('监听中 · 2 客户端')
    expect(statusLabelFor(tab({ type: 'udp', status: 'connected', config: { localPort: 9000, targetHost: '127.0.0.1', targetPort: 1 } }), 0)).toBe('已绑定 · 9000')
    expect(statusLabelFor(tab({ status: 'connected' }), 0)).toBe('已连接')
  })
  it('filterConnections: 按标题或类型标签匹配', () => {
    const tabs = [tab({ id: 'a', title: '串口助手', type: 'udp' }), tab({ id: 'b', title: 'TCP Client 1' })]
    expect(filterConnections(tabs, '串口')).toHaveLength(1)
    expect(filterConnections(tabs, 'udp')).toHaveLength(1)
    expect(filterConnections(tabs, 'zzz')).toHaveLength(0)
    expect(filterConnections(tabs, '')).toHaveLength(2)
  })
  it('filterCommands: 组名匹配或组内指令匹配时保留', () => {
    const groups = [{ id: 'g1', name: 'Modbus' }, { id: 'g2', name: '其他' }]
    const items = [
      { id: 'i1', name: '读寄存器', content: '01 03', groupId: 'g1' },
      { id: 'i2', name: '心跳', content: 'AT+PING', groupId: 'g2' }
    ]
    const res = filterCommands(groups, items, 'AT+')
    expect(res).toHaveLength(1)
    expect(res[0].group.id).toBe('g2')
    expect(res[0].items).toHaveLength(1)
    expect(filterCommands(groups, items, '')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: 运行确认失败** —— `npx vitest run src/renderer/src/store/__tests__/tab-meta.test.ts`。

- [ ] **Step 3: 实现 tab-meta.ts**

```ts
import type { TabState, TabStatus, TabType, QuickSendGroup, QuickSendItem } from '../../shared/types'
import type { IconName } from '../components/common/Icons'

export interface TypeMeta { label: string; pill: string; tag: string; icon: IconName }
export interface StatusMeta { cls: string; label: string; pulse?: boolean }

export const TYPE_META: Record<TabType, TypeMeta> = {
  'tcp-client': { label: 'TCP Client', pill: 'tp-tc', tag: 'TC', icon: 'client' },
  'tcp-server': { label: 'TCP Server', pill: 'tp-ts', tag: 'TS', icon: 'server' },
  udp: { label: 'UDP', pill: 'tp-ud', tag: 'UD', icon: 'udp' }
}

export const STATUS_META: Record<TabStatus, StatusMeta> = {
  idle: { cls: 'st-idle', label: '未连接' },
  connecting: { cls: 'st-connecting', label: '连接中…', pulse: true },
  connected: { cls: 'st-connected', label: '已连接' },
  listening: { cls: 'st-listening', label: '监听中' },
  error: { cls: 'st-error', label: '错误' }
}

const LIVE_STATUSES: TabStatus[] = ['connected', 'listening']

export function isLive(tab: Pick<TabState, 'status'>): boolean {
  return LIVE_STATUSES.includes(tab.status)
}

export type GlobalStatus = { level: 'error' | 'active' | 'idle'; count: number }

export function deriveGlobalStatus(tabs: TabState[]): GlobalStatus {
  const errorCount = tabs.filter((t) => t.status === 'error').length
  if (errorCount > 0) return { level: 'error', count: errorCount }
  const activeCount = tabs.filter((t) => isLive(t)).length
  if (activeCount > 0) return { level: 'active', count: activeCount }
  return { level: 'idle', count: 0 }
}

export function statusLabelFor(tab: TabState, clientCount: number): string {
  if (tab.type === 'tcp-server' && tab.status === 'listening') return `监听中 · ${clientCount} 客户端`
  if (tab.type === 'udp' && tab.status === 'connected') {
    const localPort = 'localPort' in tab.config ? (tab.config as { localPort: number }).localPort : 0
    return `已绑定 · ${localPort}`
  }
  return STATUS_META[tab.status].label
}

export function filterConnections(tabs: TabState[], query: string): TabState[] {
  const q = query.trim().toLowerCase()
  if (!q) return tabs
  return tabs.filter((t) => t.title.toLowerCase().includes(q) || TYPE_META[t.type].label.toLowerCase().includes(q))
}

export interface FilteredGroup { group: QuickSendGroup; items: QuickSendItem[] }

export function filterCommands(groups: QuickSendGroup[], items: QuickSendItem[], query: string): FilteredGroup[] {
  const q = query.trim().toLowerCase()
  const match = (s: string) => s.toLowerCase().includes(q)
  const result: FilteredGroup[] = []
  for (const group of groups) {
    const groupItems = items.filter((it) => it.groupId === group.id)
    const matched = q ? groupItems.filter((it) => match(it.name) || match(it.content)) : groupItems
    if (!q || match(group.name) || matched.length > 0) result.push({ group, items: matched })
  }
  return result
}
```

- [ ] **Step 4: 运行确认 PASS** —— `npx vitest run src/renderer/src/store/__tests__/tab-meta.test.ts`。

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/store/tab-meta.ts src/renderer/src/store/__tests__/tab-meta.test.ts
git commit -m "feat: 状态/类型元数据与派生纯函数（全局状态、过滤）"
```

---

## Task 4: settings-schema（设置默认值/Schema/存储纯函数）

**Files:**
- Create: `src/renderer/src/store/settings-schema.ts`
- Create: `src/renderer/src/store/__tests__/settings-schema.test.ts`

**Interfaces:**
- Produces:
  - `type Settings = Record<string, string | number | boolean>`
  - `SETTINGS_DEFAULTS: Settings`
  - `SETTINGS_SCHEMA: SettingsCategory[]`（结构：category → groups → items{type,key,label,desc?,min?,max?,depends?,options?}）
  - `loadSettingsFromStorage(): Settings`、`saveSettingsToStorage(s: Settings): void`

- [ ] **Step 1: 写失败测试 `settings-schema.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { SETTINGS_DEFAULTS, SETTINGS_SCHEMA, loadSettingsFromStorage, saveSettingsToStorage } from '../settings-schema'

const KEY = 'netassist.settings'

beforeEach(() => localStorage.clear())

describe('settings-schema', () => {
  it('默认值覆盖 5 个分类核心键', () => {
    expect(SETTINGS_DEFAULTS.maxTabs).toBe(20)
    expect(SETTINGS_DEFAULTS.msgLimit).toBe(5000)
    expect(SETTINGS_DEFAULTS.defaultEnc).toBe('UTF-8')
    expect(SETTINGS_DEFAULTS.quickTagsCount).toBe(5)
  })
  it('Schema 含 5 分类且每项 key 在默认值中有值', () => {
    expect(SETTINGS_SCHEMA).toHaveLength(5)
    for (const cat of SETTINGS_SCHEMA) {
      for (const g of cat.groups) for (const it of g.items) expect(SETTINGS_DEFAULTS, `${it.key}`).toHaveProperty(it.key)
    }
  })
  it('save/load 往返：缺省用默认补齐', () => {
    saveSettingsToStorage({ maxTabs: 30 })
    const s = loadSettingsFromStorage()
    expect(s.maxTabs).toBe(30)
    expect(s.msgLimit).toBe(5000)
  })
  it('load 容错坏 JSON', () => {
    localStorage.setItem(KEY, '{bad json')
    expect(loadSettingsFromStorage().maxTabs).toBe(20)
  })
})
```

- [ ] **Step 2: 运行确认失败。**

- [ ] **Step 3: 实现 settings-schema.ts** —— 数据逐字取自原型：`SETTINGS_DEFAULTS`（行 1340–1346）、`SETTINGS_SCHEMA`（行 1347–1403）。类型定义与存储函数：

```ts
export type Settings = Record<string, string | number | boolean>

export interface SettingsItem {
  type: 'switch' | 'seg' | 'select' | 'number'
  key: string
  label: string
  desc?: string
  min?: number
  max?: number
  depends?: string
  options?: (string | [string | number, string])[]
}
export interface SettingsGroup { title: string; items: SettingsItem[] }
export interface SettingsCategory { key: string; label: string; icon: string; groups: SettingsGroup[] }

export const SETTINGS_DEFAULTS: Settings = {
  restoreTabs: true, autoConnect: false, closeConfirm: true, maxTabs: 20, uiLang: 'zh-CN',
  msgLimit: 5000, timeFormat: 'ms', autoScroll: true, wrapLines: true, hexUppercase: true, hexCols: 16,
  defaultEnc: 'UTF-8', lfcrDefault: false, sendAfterClear: true, historyLimit: 50, historyPersist: false, quickTagsCount: 5,
  autoReconnect: false, reconnectDelay: 3, reconnectMax: 5, connTimeout: 3000, keepalive: false, udpRetry: false,
  exportFormat: 'TXT', autoLog: false, logRetention: 30, logLevel: 'info'
}

export const SETTINGS_SCHEMA: SettingsCategory[] = [
  { key: 'general', label: '通用', icon: 'sliders', groups: [
    { title: '会话', items: [
      { type: 'switch', key: 'restoreTabs', label: '启动时恢复上次会话', desc: '重启后保留标签与连接配置' },
      { type: 'switch', key: 'autoConnect', label: '启动时自动连接', desc: '对上次会话中的活动连接自动重连' },
      { type: 'switch', key: 'closeConfirm', label: '关闭标签时确认', desc: '关闭已连接的标签前弹出确认' },
      { type: 'number', key: 'maxTabs', label: '标签数量上限', min: 1, max: 50 },
      { type: 'select', key: 'uiLang', label: '界面语言', options: [['zh-CN', '简体中文'], ['en', 'English']] }
    ] }
  ] },
  { key: 'messages', label: '消息', icon: 'copy', groups: [
    { title: '消息流', items: [
      { type: 'select', key: 'msgLimit', label: '单标签消息上限', options: [[1000, '1000 条'], [5000, '5000 条'], [10000, '10000 条']] },
      { type: 'select', key: 'timeFormat', label: '时间戳格式', options: [['ms', 'HH:mm:ss.mmm'], ['s', 'HH:mm:ss']] },
      { type: 'switch', key: 'autoScroll', label: '自动滚动到底部', desc: '新消息到达时跟随滚动' },
      { type: 'switch', key: 'wrapLines', label: '长消息自动换行' }
    ] },
    { title: 'HEX 显示', items: [
      { type: 'switch', key: 'hexUppercase', label: 'HEX 大写显示', desc: '十六进制字节使用大写字母' },
      { type: 'select', key: 'hexCols', label: '每行字节数', options: [[8, '8 字节'], [16, '16 字节'], [32, '32 字节']] }
    ] }
  ] },
  { key: 'send', label: '发送', icon: 'send', groups: [
    { title: '发送', items: [
      { type: 'seg', key: 'defaultEnc', label: '默认发送编码', options: ['ASCII', 'UTF-8', 'GBK'] },
      { type: 'switch', key: 'lfcrDefault', label: '新建连接 LF→CR 默认开启' },
      { type: 'switch', key: 'sendAfterClear', label: '发送后清空输入框' }
    ] },
    { title: '发送历史', items: [
      { type: 'select', key: 'historyLimit', label: '历史保留条数', options: [[20, '20 条'], [50, '50 条'], [100, '100 条']] },
      { type: 'switch', key: 'historyPersist', label: '跨会话保留', desc: '重启后仍可 Ctrl+↑↓ 回溯' },
      { type: 'select', key: 'quickTagsCount', label: '快捷指令标签数量', options: [[3, '3 个'], [5, '5 个'], [8, '8 个']] }
    ] }
  ] },
  { key: 'connection', label: '连接', icon: 'network', groups: [
    { title: 'TCP', items: [
      { type: 'switch', key: 'autoReconnect', label: '自动重连', desc: '连接意外断开后自动重试' },
      { type: 'number', key: 'reconnectDelay', label: '重连间隔（秒）', min: 1, max: 60, depends: 'autoReconnect' },
      { type: 'number', key: 'reconnectMax', label: '最大重试次数', min: 0, max: 99, depends: 'autoReconnect' },
      { type: 'select', key: 'connTimeout', label: '连接超时', options: [[1000, '1 秒'], [3000, '3 秒'], [5000, '5 秒'], [10000, '10 秒']] },
      { type: 'switch', key: 'keepalive', label: 'TCP Keepalive', desc: '定期发送探测包保持连接' }
    ] },
    { title: 'UDP', items: [
      { type: 'switch', key: 'udpRetry', label: '绑定失败自动重试' }
    ] }
  ] },
  { key: 'log', label: '日志与导出', icon: 'history', groups: [
    { title: '导出', items: [
      { type: 'seg', key: 'exportFormat', label: '消息导出格式', options: ['TXT', 'JSON', 'CSV'] },
      { type: 'switch', key: 'autoLog', label: '自动保存会话日志' }
    ] },
    { title: '日志', items: [
      { type: 'select', key: 'logRetention', label: '日志保留时长', options: [[7, '7 天'], [30, '30 天'], [90, '90 天']] },
      { type: 'select', key: 'logLevel', label: '日志级别', options: [['error', '错误'], ['warn', '警告'], ['info', '信息'], ['debug', '调试']] }
    ] }
  ] }
]

const STORAGE_KEY = 'netassist.settings'

export function saveSettingsToStorage(s: Settings): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* 忽略配额等错误 */ }
}

export function loadSettingsFromStorage(): Settings {
  const base: Settings = { ...SETTINGS_DEFAULTS }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>
      Object.assign(base, parsed)
    }
  } catch { /* 坏 JSON 忽略，用默认 */ }
  return base
}
```

- [ ] **Step 4: 运行确认 PASS。**

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/store/settings-schema.ts src/renderer/src/store/__tests__/settings-schema.test.ts
git commit -m "feat: 设置 Schema/默认值与 localStorage 存储纯函数"
```

---

## Task 5: ui-store（settings/toast/侧栏 UI 态）

**Files:**
- Create: `src/renderer/src/store/ui-store.ts`
- Create: `src/renderer/src/store/__tests__/ui-store.test.ts`

**Interfaces:**
- Consumes: `SETTINGS_DEFAULTS`、`loadSettingsFromStorage`、`saveSettingsToStorage`、`Settings`（Task 4）。
- Produces:
  - `useUiStore`：`settings`、`toast: string | null`、`sidebarCollapsed`、`sidebarFilter`、`quickSendModalOpen`、`settingsModalOpen`、`settingsSnapshot: string | null`
  - 动作：`loadSettings/updateSetting/openSettings/closeSettings/saveSettings/cancelSettings/resetSettings/showToast/setSidebarCollapsed/setSidebarFilter/openQuickSendModal/closeQuickSendModal`
  - `showToast(msg)`：底部居中，1.8s 自动消失（单实例，重入重置计时器）。

- [ ] **Step 1: 写失败测试 `ui-store.test.ts`**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useUiStore } from '../ui-store'
import { SETTINGS_DEFAULTS, saveSettingsToStorage } from '../settings-schema'

beforeEach(() => { localStorage.clear(); vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

describe('ui-store', () => {
  it('showToast 显示并在 1.8s 后清除（单实例）', () => {
    useUiStore.setState({ toast: null })
    useUiStore.getState().showToast('已保存')
    expect(useUiStore.getState().toast).toBe('已保存')
    vi.advanceTimersByTime(1800)
    expect(useUiStore.getState().toast).toBeNull()
  })
  it('updateSetting 更新 settings', () => {
    useUiStore.getState().updateSetting('maxTabs', 33)
    expect(useUiStore.getState().settings.maxTabs).toBe(33)
  })
  it('saveSettings 写入 localStorage 并关闭弹窗', () => {
    useUiStore.setState({ settingsModalOpen: true, settings: { ...SETTINGS_DEFAULTS, maxTabs: 8 } })
    useUiStore.getState().saveSettings()
    expect(useUiStore.getState().settingsModalOpen).toBe(false)
    expect(JSON.parse(localStorage.getItem('netassist.settings')!).maxTabs).toBe(8)
  })
  it('cancelSettings 回滚到打开时快照', () => {
    saveSettingsToStorage({ ...SETTINGS_DEFAULTS, maxTabs: 20 })
    useUiStore.getState().loadSettings()
    useUiStore.getState().openSettings()          // 快照 maxTabs=20
    useUiStore.getState().updateSetting('maxTabs', 99)
    useUiStore.getState().cancelSettings()
    expect(useUiStore.getState().settings.maxTabs).toBe(20)
    expect(useUiStore.getState().settingsModalOpen).toBe(false)
  })
  it('resetSettings 恢复默认', () => {
    useUiStore.setState({ settings: { ...SETTINGS_DEFAULTS, maxTabs: 5 } })
    useUiStore.getState().resetSettings()
    expect(useUiStore.getState().settings.maxTabs).toBe(20)
  })
})
```

- [ ] **Step 2: 运行确认失败。**

- [ ] **Step 3: 实现 ui-store.ts**

```ts
import { create } from 'zustand'
import { SETTINGS_DEFAULTS, loadSettingsFromStorage, saveSettingsToStorage, type Settings } from './settings-schema'

interface UiStore {
  settings: Settings
  toast: string | null
  sidebarCollapsed: boolean
  sidebarFilter: string
  quickSendModalOpen: boolean
  settingsModalOpen: boolean
  settingsSnapshot: string | null

  loadSettings: () => void
  updateSetting: (key: string, value: string | number | boolean) => void
  openSettings: () => void
  closeSettings: () => void
  saveSettings: () => void
  cancelSettings: () => void
  resetSettings: () => void
  showToast: (message: string) => void
  setSidebarCollapsed: (v: boolean) => void
  setSidebarFilter: (v: string) => void
  openQuickSendModal: () => void
  closeQuickSendModal: () => void
}

let toastTimer: ReturnType<typeof setTimeout> | null = null

export const useUiStore = create<UiStore>((set, get) => ({
  settings: { ...SETTINGS_DEFAULTS },
  toast: null,
  sidebarCollapsed: false,
  sidebarFilter: '',
  quickSendModalOpen: false,
  settingsModalOpen: false,
  settingsSnapshot: null,

  loadSettings: () => set({ settings: loadSettingsFromStorage() }),
  updateSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),
  openSettings: () => set({ settingsModalOpen: true, settingsSnapshot: JSON.stringify(get().settings) }),
  closeSettings: () => set({ settingsModalOpen: false, settingsSnapshot: null }),
  saveSettings: () => {
    saveSettingsToStorage(get().settings)
    set({ settingsModalOpen: false, settingsSnapshot: null })
  },
  cancelSettings: () => {
    const snap = get().settingsSnapshot
    set({ settings: snap ? (JSON.parse(snap) as Settings) : { ...SETTINGS_DEFAULTS }, settingsModalOpen: false, settingsSnapshot: null })
  },
  resetSettings: () => set({ settings: { ...SETTINGS_DEFAULTS } }),
  showToast: (message) => {
    set({ toast: message })
    if (toastTimer) clearTimeout(toastTimer)
    toastTimer = setTimeout(() => set({ toast: null }), 1800)
  },
  setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
  setSidebarFilter: (v) => set({ sidebarFilter: v }),
  openQuickSendModal: () => set({ quickSendModalOpen: true }),
  closeQuickSendModal: () => set({ quickSendModalOpen: false })
}))
```

- [ ] **Step 4: 运行确认 PASS。**

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/store/ui-store.ts src/renderer/src/store/__tests__/ui-store.test.ts
git commit -m "feat: 新增 ui-store（settings/toast/侧栏 UI 态）"
```

---

## Task 6: 通用组件 Toast / Menu / Modal

**Files:**
- Create: `src/renderer/src/components/common/Toast.tsx` + `Toast.css`
- Create: `src/renderer/src/components/common/Menu.tsx` + `Menu.css`
- Create: `src/renderer/src/components/common/Modal.tsx` + `Modal.css`

**Interfaces:**
- Consumes: `useUiStore`（toast）；React `createPortal`。
- Produces:
  - `ToastHost()`：渲染 `.toast.show`（toast 非空时）。
  - `Menu({ title?, style, onClose, children })`：`.menu` 浮层，点击外部/Escape 关闭；`menuPosition(anchor: DOMRect): React.CSSProperties`（`{ top: bottom+6, left: max(8, right-216) }`）。
  - `Modal({ title, sub?, onClose, children, actions? })`：`.modal-backdrop` + `.modal`，Escape/点背景关闭。

- [ ] **Step 1: 创建 Toast.tsx + Toast.css**

```tsx
import { useUiStore } from '../../store/ui-store'
import './Toast.css'

export default function ToastHost(): JSX.Element {
  const toast = useUiStore((s) => s.toast)
  return <>{toast && <div className="toast show" data-testid="toast">{toast}</div>}</>
}
```
`Toast.css`：从原型 `.toast`/`.toast.show`（行 343–344）原样拷贝。

- [ ] **Step 2: 创建 Menu.tsx + Menu.css**

```tsx
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './Menu.css'

interface MenuProps {
  title?: string
  style: React.CSSProperties
  onClose: () => void
  children: React.ReactNode
}

export default function Menu({ title, style, onClose, children }: MenuProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey) }
  }, [onClose])
  return createPortal(
    <div className="menu" ref={ref} style={style}>
      {title && <div className="menu-title">{title}</div>}
      {children}
    </div>,
    document.body
  )
}

export function menuPosition(anchor: DOMRect): React.CSSProperties {
  return { top: anchor.bottom + 6, left: Math.max(8, anchor.right - 216) }
}
```
`Menu.css`：从原型 `.menu/.menu-title/.menu-item/.menu-item .mi-*/.menu-item.history-item/.menu-empty`（行 271–281）原样拷贝（已在 base.css 中的可不重复）。

- [ ] **Step 3: 创建 Modal.tsx + Modal.css**

```tsx
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

interface ModalProps {
  title: string
  sub?: string
  onClose: () => void
  children: React.ReactNode
  actions?: React.ReactNode
}

export default function Modal({ title, sub, onClose, children, actions }: ModalProps): JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        {title && <h3>{title}</h3>}
        {sub && <p className="modal-sub">{sub}</p>}
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>,
    document.body
  )
}
```
`Modal.css`：从原型 `.modal-backdrop/.modal/.modal h3/.modal-sub/.field/.input/.textarea/.modal-select/.modal-actions`（行 283–293）原样拷贝（已在 base.css 中的可不重复）。

- [ ] **Step 4: 验证** —— `npm test`；`npm run build` 通过。

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/common/Toast.tsx src/renderer/src/components/common/Toast.css src/renderer/src/components/common/Menu.tsx src/renderer/src/components/common/Menu.css src/renderer/src/components/common/Modal.tsx src/renderer/src/components/common/Modal.css
git commit -m "feat: 通用 Toast/Menu/Modal 组件"
```

---

## Task 7: AppBar（应用外壳头部）+ Welcome（欢迎页）

**Files:**
- Create: `src/renderer/src/components/layout/AppBar.tsx` + `AppBar.css`
- Create: `src/renderer/src/components/common/Welcome.tsx` + `Welcome.css`

**Interfaces:**
- Consumes: `useTabStore`（tabs）、`deriveGlobalStatus`（Task 3）、`useUiStore.openSettings`、`Icon`、`createTab`。
- Produces:
  - `AppBar()`：`.titlebar` → `.app-title`（Icon network + "NetAssist" + `.at-sub` 网络调试助手）+ `.title-right`（`.global-status` 胶囊 + 设置 icon-btn）。
  - `Welcome()`：无标签时显示；三模式卡片（TCP Client/TCP Server/UDP）+ 快捷键提示；卡片点击/Enter/空格 → `createTab(type)`。

- [ ] **Step 1: 创建 AppBar.tsx + AppBar.css**

```tsx
import { useTabStore } from '../../store/tab-store'
import { deriveGlobalStatus } from '../../store/tab-meta'
import { useUiStore } from '../../store/ui-store'
import Icon from '../common/Icons'
import './AppBar.css'

const STATUS_TEXT: Record<'idle' | 'active' | 'error', { cls: string; text: (n: number) => string }> = {
  idle: { cls: 'st-idle', text: () => '空闲' },
  active: { cls: 'st-connected', text: (n) => `${n} 个连接活跃` },
  error: { cls: 'st-error', text: (n) => `${n} 个连接异常` }
}

export default function AppBar(): JSX.Element {
  const tabs = useTabStore((s) => s.tabs)
  const openSettings = useUiStore((s) => s.openSettings)
  const gs = deriveGlobalStatus(tabs)
  const meta = STATUS_TEXT[gs.level]
  return (
    <header className="titlebar">
      <div className="app-title">
        <Icon name="network" size={19} />
        NetAssist <span className="at-sub">网络调试助手</span>
      </div>
      <div className="title-right">
        <div className="global-status"><span className={`dot ${meta.cls}`} />{meta.text(gs.count)}</div>
        <button className="icon-btn" title="设置" aria-label="设置" onClick={openSettings}><Icon name="sliders" /></button>
      </div>
    </header>
  )
}
```
`AppBar.css`：从原型 `.titlebar`（行 38）、`.app-title`（44–46）、`.title-right`（47）、`.global-status`（48–49）原样拷贝，**不**迁移 `.traffic`（保留原生边框）。

- [ ] **Step 2: 创建 Welcome.tsx + Welcome.css**

```tsx
import type { TabType } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useUiStore } from '../../store/ui-store'
import { TYPE_META } from '../../store/tab-meta'
import Icon, { type IconName } from './Icons'
import './Welcome.css'

const MODES: { type: TabType; icon: IconName; desc: string }[] = [
  { type: 'tcp-client', icon: 'client', desc: '连接远程主机，收发文本与十六进制数据。' },
  { type: 'tcp-server', icon: 'server', desc: '本地监听，管理多个客户端并支持单播与广播。' },
  { type: 'udp', icon: 'udp', desc: '绑定本地端口，向指定目标定向收发。' }
]

export default function Welcome(): JSX.Element {
  const createTab = useTabStore((s) => s.createTab)
  const newTab = (type: TabType) => {
    const id = createTab(type)
    if (id) useUiStore.getState().showToast(`已创建 ${TYPE_META[type].label}`)
  }
  return (
    <section className="welcome">
      <div className="welcome-inner">
        <p className="eyebrow">NETASSIST · TCP/UDP 调试</p>
        <h1>从一个连接开始调试</h1>
        <p className="lead">支持 TCP Client / TCP Server / UDP 三种模式；多标签、多编码、HEX 查看与快捷指令，让协议调试更顺手。</p>
        <div className="mode-grid">
          {MODES.map((m) => (
            <div key={m.type} className="mode-card" tabIndex={0} role="button"
              onClick={() => newTab(m.type)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); newTab(m.type) } }}>
              <div className="mc-icon"><Icon name={m.icon} size={19} /></div>
              <h3>{TYPE_META[m.type].label}</h3>
              <p>{m.desc}</p>
              <span className="mc-action">新建连接 <Icon name="arrow-right" size={13} /></span>
            </div>
          ))}
        </div>
        <div className="kbd-hint">
          <span><kbd>Ctrl</kbd> + <kbd>Enter</kbd> 发送</span>
          <span><kbd>Ctrl</kbd> + <kbd>↑↓</kbd> 发送历史</span>
          <span>双击消息面板清空</span>
        </div>
      </div>
    </section>
  )
}
```
`Welcome.css`：从原型 `.welcome` 区块（行 324–341）原样拷贝。

- [ ] **Step 3: 验证** —— `npm run build` 通过（AppBar/Welcome 尚未接线，仅编译）。

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/layout/AppBar.tsx src/renderer/src/components/layout/AppBar.css src/renderer/src/components/common/Welcome.tsx src/renderer/src/components/common/Welcome.css
git commit -m "feat: AppBar 应用壳与 Welcome 欢迎页"
```

---

## Task 8: MainLayout + Sidebar 布局壳（搜索/折叠/rail/宽度拖拽）

**Files:**
- Create: `src/renderer/src/components/layout/Sidebar.tsx` + `Sidebar.css`
- Modify: `src/renderer/src/components/layout/MainLayout.tsx`（重写）
- Modify: `src/renderer/src/components/layout/MainLayout.css`（重写）

**Interfaces:**
- Consumes: `useTabStore`（tabs/activeTabId/setActiveTab/loadPersistedTabs/loadQuickSend）、`useUiStore`（sidebarCollapsed/sidebarFilter）、`useIpcListeners`、`TabBar`（Task 9，先用旧组件过渡）、`QuickSendPanel`（Task 10）、`TabContent`、`Welcome`、`AppBar`、`ToastHost`、`Icon`。
- Produces: `MainLayout()` 新布局壳 + `Sidebar()` 侧栏（搜索、折叠、rail、宽度拖拽、连接列表区、快捷指令区、底部版本号）。

- [ ] **Step 1: 重写 MainLayout.css** —— 布局壳样式：

```css
.app-body { flex: 1; display: flex; min-height: 0; }
.workspace { flex: 1; min-width: 0; display: flex; flex-direction: column; background: var(--bg); overflow: hidden; }
```
（`.app-root` 已在 tokens.css 定义；删除旧 `.main-layout/.sidebar-resize-handle/.msg-send-resize-handle/.split-resize-handle/.content-area/.content-placeholder` 等全部旧规则。）

- [ ] **Step 2: 创建 Sidebar.tsx + Sidebar.css**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useTabStore } from '../../store/tab-store'
import { useUiStore } from '../../store/ui-store'
import { STATUS_META, TYPE_META } from '../../store/tab-meta'
import Icon from '../common/Icons'
import TabBar from '../tab/TabBar'
import QuickSendPanel from '../quick-send/QuickSendPanel'
import './Sidebar.css'

const SIDEBAR_MIN = 224
const SIDEBAR_MAX = 440

interface Props { onQuickSend: (content: string) => void }

export default function Sidebar({ onQuickSend }: Props): JSX.Element {
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const setActiveTab = useTabStore((s) => s.setActiveTab)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed)
  const setFilter = useUiStore((s) => s.setSidebarFilter)
  const [width, setWidth] = useState(292)
  const resizing = useRef(false)

  // 小屏 920px 自动折叠
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 920px)')
    setCollapsed(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setCollapsed])

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault()
    resizing.current = true
    const startX = e.clientX
    const startW = width
    const onMove = (ev: MouseEvent) => setWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW + (ev.clientX - startX))))
    const onUp = () => { resizing.current = false; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp) }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`} style={{ width }}>
      <div className="sb-resize" onMouseDown={startResize} title="拖拽调整宽度" />
      <div className="sb-search">
        <div className="search-box">
          <Icon name="search" size={14} />
          <input type="text" placeholder="筛选连接或指令" autoComplete="off"
            onChange={(e) => setFilter(e.target.value)} />
        </div>
        <button className="icon-btn sb-toggle-btn" title={collapsed ? '展开侧栏' : '收起侧栏'} aria-label="收起/展开侧栏"
          aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
          <Icon name="chevron-left" />
        </button>
      </div>
      <div className="sb-rail">
        {tabs.length === 0 ? <div className="rail-empty">+</div> : tabs.map((t) => {
          const sm = STATUS_META[t.status]
          return (
            <button key={t.id} className={`rail-conn${t.id === activeTabId ? ' active' : ''}`} aria-label={t.title}
              onClick={() => setActiveTab(t.id)}>
              <Icon name={TYPE_META[t.type].icon} size={17} className={`ic ct-${TYPE_META[t.type].tag.toLowerCase()}`} />
              <span className={`rail-dot ${sm.cls}${sm.pulse ? ' pulse' : ''}`} />
            </button>
          )
        })}
      </div>
      <div className="sb-body">
        <TabBar />
        <QuickSendPanel onSend={onQuickSend} />
      </div>
      <div className="sb-foot"><span>NetAssist v2.0</span></div>
    </aside>
  )
}
```
> 说明：rail 悬浮 `.rail-tip` 为增强项，见 Step 5（可选，若时间紧可先渲染 rail 本体，tip 在小屏体验验收时补）。

`Sidebar.css`：从原型 `.sidebar`（行 53）、`.sb-resize`（54–55）、`.sb-search`（56）、`.search-box`（57–62）、`.sb-body`（63）、`.sb-toggle-btn`（64–65）、`.sidebar` transition（66–67）、`.collapsed`（68–72）、`.sb-rail`（73–74）、`.rail-conn`（75–78）、`.rail-dot`（79）、`.rail-empty`（80）、`.rail-tip`（81–84）、`.sb-section`（85）、`.sb-head`（86–88）、`.sb-foot`（141）原样迁移；`#sidebar` → `.sidebar`。

- [ ] **Step 3: 重写 MainLayout.tsx**

```tsx
import { useEffect, useCallback } from 'react'
import { useTabStore } from '../../store/tab-store'
import { useUiStore } from '../../store/ui-store'
import { useIpcListeners, useIpc } from '../../hooks/useIpc'
import { normalizeToLf } from '../../hooks/lineEnding'
import AppBar from './AppBar'
import Sidebar from './Sidebar'
import Welcome from '../common/Welcome'
import TabContent from '../tab/TabContent'
import ToastHost from '../common/Toast'
import './MainLayout.css'

export default function MainLayout(): JSX.Element {
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const loadPersistedTabs = useTabStore((s) => s.loadPersistedTabs)
  const loadQuickSend = useTabStore((s) => s.loadQuickSend)
  const loadSettings = useUiStore((s) => s.loadSettings)
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null
  const { send } = useIpc()

  useIpcListeners()

  useEffect(() => {
    loadPersistedTabs()
    loadQuickSend()
    loadSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 快捷指令发送：沿用既有 handleQuickSend 语义（直接编码发送）
  const handleQuickSend = useCallback(async (content: string) => {
    if (!activeTab) return
    const opts = activeTab.sendOptions
    const finalText = opts.lfToCr ? normalizeToLf(content).replace(/\n/g, '\r') : content
    let bytes: Uint8Array
    if (opts.encoding === 'gbk') {
      const encoded = await window.electronAPI.encoding.encodeText(finalText, 'gbk')
      bytes = new Uint8Array(encoded)
    } else if (opts.encoding === 'ascii') {
      bytes = new Uint8Array(finalText.split('').map((c) => c.charCodeAt(0) & 0x7f))
    } else {
      bytes = new TextEncoder().encode(finalText)
    }
    send(activeTab.id, bytes, opts.encoding)
  }, [activeTab, send])

  return (
    <div className="app-root">
      <AppBar />
      <div className="app-body">
        <Sidebar onQuickSend={handleQuickSend} />
        <main className="workspace">
          {activeTab ? <TabContent tab={activeTab} /> : <Welcome />}
        </main>
      </div>
      <ToastHost />
    </div>
  )
}
```

- [ ] **Step 4: 验证** —— `npm run build` 通过；`npm test` 中既有渲染层用例通过（此时 TabBar/QuickSendPanel/TabContent 仍为旧 antd 实现，仅换壳）。

- [ ] **Step 5: rail 悬浮提示（可选增强）** —— 在 `Sidebar` 中加 `railTip` state（`{ left, top, name, label }`），`onMouseEnter` rail-conn 时设置、`onMouseLeave` 清除，渲染 `<div className="rail-tip" style={{left, top}}>`（内容：`.rt-name` 名称 + `.rt-meta` 状态点 + 状态文案）。CSS 已含 `.rail-tip`。

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/layout/MainLayout.tsx src/renderer/src/components/layout/MainLayout.css src/renderer/src/components/layout/Sidebar.tsx src/renderer/src/components/layout/Sidebar.css
git commit -m "refactor: 布局壳重构为 AppBar+Sidebar+Workspace，侧栏搜索/折叠/rail"
```

---

## Task 9: TabBar 连接列表重写（conn-row）

**Files:**
- Modify: `src/renderer/src/components/tab/TabBar.tsx`（重写）
- Modify: `src/renderer/src/components/tab/TabBar.css`（重写）

**Interfaces:**
- Consumes: `useTabStore`（tabs/activeTabId/createTab/closeTab/reorderTabs/setActiveTab/updateTabTitle）、`useIpc.disconnect`、`useUiStore`（sidebarFilter/showToast）、`filterConnections`、`TYPE_META/STATUS_META`、`Icon`、`Menu/menuPosition`。
- Produces: `TabBar()` 渲染 `.sb-section`（连接列表）：`+` icon-btn 弹新建菜单；`.conn-row` 列表（状态点/类型图标/名称/悬停关闭/双击重命名/拖拽排序）；空态 `.sb-none`。

- [ ] **Step 1: 重写 TabBar.tsx**

```tsx
import { useState } from 'react'
import type { TabType } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import { useUiStore } from '../../store/ui-store'
import { TYPE_META, STATUS_META, filterConnections } from '../../store/tab-meta'
import Icon, { type IconName } from '../common/Icons'
import Menu, { menuPosition } from '../common/Menu'
import './TabBar.css'

const NEW_TAB_ITEMS: { type: TabType; icon: IconName; title: string; desc: string }[] = [
  { type: 'tcp-client', icon: 'client', title: 'TCP Client', desc: '连接远程主机' },
  { type: 'tcp-server', icon: 'server', title: 'TCP Server', desc: '本地监听服务' },
  { type: 'udp', icon: 'udp', title: 'UDP', desc: '无连接定向收发' }
]

export default function TabBar(): JSX.Element {
  const { tabs, activeTabId, createTab, closeTab, reorderTabs, setActiveTab } = useTabStore()
  const { disconnect } = useIpc()
  const filter = useUiStore((s) => s.sidebarFilter)
  const [newMenu, setNewMenu] = useState<React.CSSProperties | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const visible = filterConnections(tabs, filter)

  const handleClose = async (id: string) => { try { await disconnect(id) } catch { /* 强制关闭 */ } closeTab(id) }

  const commitRename = () => {
    if (renameId && renameValue.trim()) useTabStore.getState().updateTabTitle(renameId, renameValue.trim())
    setRenameId(null)
  }

  return (
    <section className="sb-section">
      <div className="sb-head">
        <h2>连接列表</h2>
        <div className="sb-actions">
          <button className="icon-btn" title="新建连接" aria-label="新建连接"
            onClick={(e) => setNewMenu(menuPosition((e.currentTarget as HTMLElement).getBoundingClientRect()))}>
            <Icon name="plus" />
          </button>
        </div>
      </div>
      <div className="conn-list">
        {visible.length === 0 ? (
          <div className="sb-none">没有匹配的连接</div>
        ) : visible.map((tab) => {
          const sm = STATUS_META[tab.status]
          const tm = TYPE_META[tab.type]
          return (
            <div key={tab.id}
              className={`conn-row${tab.id === activeTabId ? ' active' : ''}${dragOverId === tab.id && dragId !== tab.id ? ' drag-over' : ''}`}
              draggable tabIndex={0} title={`${tm.label} · ${sm.label}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(tab.id) } }}
              onDragStart={(e) => { setDragId(tab.id); e.dataTransfer.effectAllowed = 'move' }}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(tab.id) }}
              onDrop={(e) => {
                e.preventDefault()
                if (dragId && dragId !== tab.id) {
                  const from = tabs.findIndex((t) => t.id === dragId)
                  const to = tabs.findIndex((t) => t.id === tab.id)
                  if (from > -1 && to > -1) reorderTabs(from, to)
                }
                setDragId(null); setDragOverId(null)
              }}
              onDragEnd={() => { setDragId(null); setDragOverId(null) }}>
              <span className={`status-dot ${sm.cls}${sm.pulse ? ' pulse' : ''}`} />
              <Icon name={tm.icon} size={15} className={`conn-type-icon ct-${tm.tag.toLowerCase()}`} />
              {renameId === tab.id ? (
                <input className="conn-name renaming" autoFocus value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setRenameValue(tab.title); (e.target as HTMLInputElement).blur() } }}
                  onClick={(e) => e.stopPropagation()} />
              ) : (
                <span className="conn-name" onDoubleClick={(e) => { e.stopPropagation(); setRenameId(tab.id); setRenameValue(tab.title) }}>{tab.title}</span>
              )}
              <button className="icon-btn conn-close" title="关闭并断开" aria-label="关闭"
                onClick={(e) => { e.stopPropagation(); handleClose(tab.id) }}>
                <Icon name="x" />
              </button>
            </div>
          )
        })}
      </div>
      {newMenu && (
        <Menu title="新建连接" style={newMenu} onClose={() => setNewMenu(null)}>
          {NEW_TAB_ITEMS.map((it) => (
            <div key={it.type} className="menu-item" onClick={() => {
              const id = createTab(it.type)
              if (id) useUiStore.getState().showToast(`已创建 ${TYPE_META[it.type].label}`)
              setNewMenu(null)
            }}>
              <span className="mi-icon"><Icon name={it.icon} /></span>
              <span className="mi-text"><span className="mi-title">{it.title}</span><br /><span className="mi-desc">{it.desc}</span></span>
            </div>
          ))}
        </Menu>
      )}
    </section>
  )
}
```

- [ ] **Step 2: 重写 TabBar.css** —— 从原型 `.conn-list`（行 95）、`.conn-row`（96–100）、`.conn-type-icon`（112）、`.ct-tc/.ct-ts/.ct-ud`（115–117）、`.conn-name`（118–119）、`.conn-close`（120–122）原样迁移。

- [ ] **Step 3: 验证** —— `npm run build` 通过；`npm test` 通过。

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/tab/TabBar.tsx src/renderer/src/components/tab/TabBar.css
git commit -m "refactor: 连接列表按原型重写（状态点/类型图标/重命名/拖拽排序/新建菜单）"
```

---

## Task 10: QuickSendPanel 快捷指令重写（cmd-groups）

**Files:**
- Modify: `src/renderer/src/components/quick-send/QuickSendPanel.tsx`（重写）
- Modify: `src/renderer/src/components/quick-send/QuickSendPanel.css`（重写）

**Interfaces:**
- Consumes: `useTabStore`（quickSendItems/quickSendGroups/add/update/remove item & group）、`useUiStore`（sidebarFilter/showToast/quickSendModalOpen/closeQuickSendModal/openQuickSendModal）、`filterCommands`、`Icon`、`Modal`、`CrPreservingEditor`、`onSend` prop。
- Produces: `QuickSendPanel({ onSend })` 渲染 `.sb-section`（快捷指令）：`.sb-head`（+分组 folder、+指令 plus）；`.cmd-groups`（每组 `.cmd-group-head` chev+folder+名称+`.count`，展开 `.cmd-list` 的 `.cmd-row` 名称+hover 发送/编辑/删除）；指令编辑 Modal（名称 input + 内容 CodeMirror + 分组 select）；分组 Modal（名称 input）；未分组指令归入隐式"未分组"组；空态 `.sb-none`。

- [ ] **Step 1: 重写 QuickSendPanel.tsx**

```tsx
import { useEffect, useRef, useState } from 'react'
import { useTabStore } from '../../store/tab-store'
import { useUiStore } from '../../store/ui-store'
import { filterCommands } from '../../store/tab-meta'
import Icon from '../common/Icons'
import Modal from '../common/Modal'
import CrPreservingEditor, { type CrPreservingEditorHandle } from '../common/CrPreservingEditor'
import './QuickSendPanel.css'

interface Props { onSend: (content: string) => void }

export default function QuickSendPanel({ onSend }: Props): JSX.Element {
  const { quickSendItems, quickSendGroups, addQuickSendItem, updateQuickSendItem, removeQuickSendItem, addQuickSendGroup } = useTabStore()
  const filter = useUiStore((s) => s.sidebarFilter)
  const quickSendModalOpen = useUiStore((s) => s.quickSendModalOpen)
  const closeQuickSendModal = useUiStore((s) => s.closeQuickSendModal)

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(quickSendGroups.map((g) => g.id)))
  const [editTarget, setEditTarget] = useState<{ id?: string; groupId?: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editGroupId, setEditGroupId] = useState('')
  const [groupModal, setGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const contentRef = useRef<CrPreservingEditorHandle>(null)

  useEffect(() => { contentRef.current?.setValue(editContent) }, [editContent])

  const groups = filterCommands(quickSendGroups, quickSendItems, filter)
  const q = filter.trim().toLowerCase()
  const ungrouped = quickSendItems
    .filter((it) => !it.groupId)
    .filter((it) => !q || it.name.toLowerCase().includes(q) || it.content.toLowerCase().includes(q))

  const openAdd = (groupId?: string) => { setEditTarget(groupId ? { groupId } : {}); setEditName(''); setEditContent(''); setEditGroupId(groupId ?? quickSendGroups[0]?.id ?? ''); useUiStore.getState().openQuickSendModal() }
  const openEdit = (item: { id: string; name: string; content: string; groupId?: string }) => { setEditTarget({ id: item.id }); setEditName(item.name); setEditContent(item.content); setEditGroupId(item.groupId ?? ''); useUiStore.getState().openQuickSendModal() }

  const saveItem = () => {
    if (!editName.trim() || !editContent.trim()) { useUiStore.getState().showToast('名称与内容不能为空'); return }
    if (editTarget?.id) updateQuickSendItem(editTarget.id, { name: editName.trim(), content: editContent, groupId: editGroupId || undefined })
    else addQuickSendItem({ name: editName.trim(), content: editContent, groupId: editGroupId || undefined })
    closeQuickSendModal(); useUiStore.getState().showToast('已保存')
  }

  const saveGroup = () => {
    if (!groupName.trim()) return
    addQuickSendGroup(groupName.trim())
    setGroupModal(false); useUiStore.getState().showToast('已创建分组')
  }

  const toggle = (gid: string) => setOpenGroups((prev) => { const n = new Set(prev); n.has(gid) ? n.delete(gid) : n.add(gid); return n })

  const renderGroup = (gid: string, name: string, items: typeof quickSendItems, collapsible: boolean) => {
    const open = !collapsible || openGroups.has(gid)
    return (
      <div className="cmd-group" key={gid}>
        <div className="cmd-group-head" tabIndex={0} onClick={() => { if (collapsible) toggle(gid) }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (collapsible) toggle(gid) } }}>
          {collapsible && <Icon name="chevron" size={12} className={`ic chev${open ? '' : ' rot'}`} />}
          <Icon name="folder" size={13} style={{ color: 'var(--meta)' }} />
          <span>{name}</span><span className="count">{items.length}</span>
        </div>
        {open && (
          <div className="cmd-list">
            {items.length === 0 ? <div className="sb-none" style={{ padding: '6px 0 6px 24px' }}>暂无指令</div> : items.map((c) => (
              <div key={c.id} className="cmd-row" tabIndex={0} title="点击发送"
                onClick={() => onSend(c.content)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSend(c.content) } }}>
                <span className="cmd-name">{c.name}</span>
                <span className="cmd-preview">{c.content.replace(/[\r\n]/g, ' ')}</span>
                <span className="cmd-actions">
                  <button className="icon-btn play-btn" title="发送" aria-label="发送" onClick={(e) => { e.stopPropagation(); onSend(c.content) }}><Icon name="play" size={13} /></button>
                  <button className="icon-btn" title="编辑" aria-label="编辑" onClick={(e) => { e.stopPropagation(); openEdit(c) }}><Icon name="pencil" size={13} /></button>
                  <button className="icon-btn" title="删除" aria-label="删除" onClick={(e) => { e.stopPropagation(); removeQuickSendItem(c.id); useUiStore.getState().showToast('已删除') }}><Icon name="trash" size={13} /></button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="sb-section">
      <div className="sb-head">
        <h2>快捷指令</h2>
        <div className="sb-actions">
          <button className="icon-btn" title="新建分组" aria-label="新建分组" onClick={() => { setGroupModal(true); setGroupName('') }}><Icon name="folder" /></button>
          <button className="icon-btn" title="新增指令" aria-label="新增指令" onClick={() => openAdd()}><Icon name="plus" /></button>
        </div>
      </div>
      <div className="cmd-groups">
        {groups.map(({ group, items }) => renderGroup(group.id, group.name, items, true))}
        {ungrouped.length > 0 && renderGroup('__ungrouped__', '未分组', ungrouped, false)}
        {groups.length === 0 && ungrouped.length === 0 && <div className="sb-none">没有匹配的指令</div>}
      </div>

      {quickSendModalOpen && (
        <Modal title={editTarget?.id ? '编辑指令' : '新增指令'} sub="将常用指令保存到快捷发送，点击即可发送。"
          onClose={closeQuickSendModal}
          actions={<>
            <button className="btn btn-ghost" onClick={closeQuickSendModal}>取消</button>
            <button className="btn btn-dark" onClick={saveItem}>保存</button>
          </>}>
          <div className="field"><label>指令名称</label><input className="input" value={editName} placeholder="例如:读取保持寄存器" onChange={(e) => setEditName(e.target.value)} /></div>
          <div className="field"><label>指令内容</label><CrPreservingEditor ref={contentRef} initialValue={editContent} onChange={setEditContent} placeholder="支持文本与 HEX，如:01 03 00 00 00 0A C5 CD" /></div>
          <div className="field"><label>所属分组</label>
            <select className="modal-select" value={editGroupId} onChange={(e) => setEditGroupId(e.target.value)}>
              {quickSendGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {groupModal && (
        <Modal title="新建分组" sub="创建指令分组。" onClose={() => setGroupModal(false)}
          actions={<>
            <button className="btn btn-ghost" onClick={() => setGroupModal(false)}>取消</button>
            <button className="btn btn-dark" onClick={saveGroup}>保存</button>
          </>}>
          <div className="field"><label>分组名称</label><input className="input" value={groupName} placeholder="例如:Modbus 指令" onChange={(e) => setGroupName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveGroup() }} /></div>
        </Modal>
      )}
    </section>
  )
}
```

- [ ] **Step 2: 重写 QuickSendPanel.css** —— 从原型 `.cmd-groups`（行 124）、`.cmd-group-head`（125–129）、`.cmd-list`（130）、`.cmd-row`（131–140，含 `.cmd-preview`/`.cmd-actions`/`.play-btn`）原样迁移。删除全部 `.ant-tree-*`/`.quick-send-*` 旧规则。

- [ ] **Step 3: 验证** —— `npm run build` 通过；`npm test` 通过（`sendpanel-render` 此时仍走旧 SendPanel，无影响）。

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/quick-send/QuickSendPanel.tsx src/renderer/src/components/quick-send/QuickSendPanel.css
git commit -m "refactor: 快捷指令按原型重写（分组折叠/hover 操作/编辑弹窗）"
```

---

## Task 11: 配置字段内联渲染 + 连接动作 hook

**Files:**
- Create: `src/renderer/src/hooks/useConnectionActions.ts`
- Create: `src/renderer/src/hooks/useServerClients.ts`
- Modify: `src/renderer/src/components/config/TcpClientConfig.tsx`（重写为字段渲染组件）
- Modify: `src/renderer/src/components/config/TcpServerConfig.tsx`（重写）
- Modify: `src/renderer/src/components/config/UdpConfig.tsx`（重写）
- Modify: `src/renderer/src/components/config/TcpClientConfig.css`（清空；字段样式由 base.css 提供）

**Interfaces:**
- Consumes: `useTabStore`（setTabConfig）、`useIpc`（connect/disconnect）、`isLive`、`ClientInfo`。
- Produces:
  - `useConnectionActions(tab)` → `{ live, connecting, actionLabel, loading, handleToggle }`
  - `useServerClients(tabId)` → `ClientInfo[]`
  - `TcpClientConfigFields({ tab, onChange })`、`TcpServerConfigFields({ tab, clients, target, onTargetChange, onChange })`、`UdpConfigFields({ tab, onChange })`：渲染 `.cfg-field` 内联字段，live 时 disabled；`onChange(config)` 由 TabContent 调 `setTabConfig`。

- [ ] **Step 1: 创建 useConnectionActions.ts**

```ts
import { useState, useCallback } from 'react'
import type { TabState } from '../../shared/types'
import { useTabStore } from '../store/tab-store'
import { useIpc } from './useIpc'
import { isLive } from '../store/tab-meta'
import { useUiStore } from '../store/ui-store'

export function useConnectionActions(tab: TabState) {
  const { connect, disconnect } = useIpc()
  const setTabConfig = useTabStore((s) => s.setTabConfig)
  const updateTabStatus = useTabStore((s) => s.updateTabStatus)
  const [loading, setLoading] = useState(false)

  const live = isLive(tab)
  const connecting = tab.status === 'connecting'

  const actionLabel = live
    ? (tab.type === 'tcp-server' ? '停止监听' : tab.type === 'udp' ? '关闭' : '断开')
    : connecting
      ? '连接中…'
      : (tab.type === 'tcp-server' ? '开始监听' : tab.type === 'udp' ? '绑定' : '连接')

  const handleToggle = useCallback(async () => {
    if (connecting) return
    setLoading(true)
    try {
      if (live) {
        updateTabStatus(tab.id, 'idle')
        await disconnect(tab.id)
        useUiStore.getState().showToast('已断开')
      } else {
        setTabConfig(tab.id, tab.config)
        await connect(tab.id, tab.type, tab.config)
      }
    } catch (err) {
      console.error('connection action failed:', err)
    } finally {
      setLoading(false)
    }
  }, [tab, live, connecting, connect, disconnect, setTabConfig, updateTabStatus])

  return { live, connecting, actionLabel, loading, handleToggle }
}
```

- [ ] **Step 2: 创建 useServerClients.ts**

```ts
import { useState, useEffect } from 'react'
import type { ClientInfo } from '../../shared/types'

export function useServerClients(tabId: string): ClientInfo[] {
  const [clients, setClients] = useState<ClientInfo[]>([])
  useEffect(() => {
    const unsubJoin = window.electronAPI.onClientJoined((p) => { if (p.tabId === tabId) setClients((prev) => [...prev, p.client]) })
    const unsubLeft = window.electronAPI.onClientLeft((p) => { if (p.tabId === tabId) setClients((prev) => prev.filter((c) => c.id !== p.clientId)) })
    return () => { unsubJoin(); unsubLeft() }
  }, [tabId])
  return clients
}
```

- [ ] **Step 3: 重写三个 config 组件为字段渲染**

```tsx
// TcpClientConfig.tsx
import type { TabState, TcpClientConfig as TcpClientConfigType } from '../../../shared/types'
import { isLive } from '../../store/tab-meta'

interface Props { tab: TabState; onChange: (config: TcpClientConfigType) => void }

export default function TcpClientConfigFields({ tab, onChange }: Props): JSX.Element {
  const cfg = tab.config as TcpClientConfigType
  const disabled = isLive(tab)
  return (
    <>
      <span className="cfg-field">
        <span className="cfg-label">主机</span>
        <input className="cfg-input w-70" value={cfg.host} spellCheck={false} disabled={disabled}
          onChange={(e) => onChange({ ...cfg, host: e.target.value })} />
      </span>
      <span className="cfg-field">
        <span className="cfg-label">端口</span>
        <input className="cfg-input w-70" type="number" min={1} max={65535} value={cfg.port || ''} disabled={disabled}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (Number.isFinite(v) && v >= 1 && v <= 65535) onChange({ ...cfg, port: v }) }} />
      </span>
    </>
  )
}
```

```tsx
// TcpServerConfig.tsx
import type { TabState, TcpServerConfig as TcpServerConfigType, ClientInfo } from '../../../shared/types'
import { isLive } from '../../store/tab-meta'

interface Props {
  tab: TabState
  clients: ClientInfo[]
  target: string
  onTargetChange: (clientId: string | null) => void
  onChange: (config: TcpServerConfigType) => void
}

export default function TcpServerConfigFields({ tab, clients, target, onTargetChange, onChange }: Props): JSX.Element {
  const cfg = tab.config as TcpServerConfigType
  const live = isLive(tab)
  return (
    <>
      <span className="cfg-field">
        <span className="cfg-label">监听端口</span>
        <input className="cfg-input w-70" type="number" min={1} max={65535} value={cfg.port || ''} disabled={live}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (Number.isFinite(v) && v >= 1 && v <= 65535) onChange({ ...cfg, port: v }) }} />
      </span>
      <span className="cfg-field">
        <span className="cfg-label">发送目标</span>
        <select className="cfg-select" value={target} disabled={!live}
          onChange={(e) => onTargetChange(e.target.value === 'broadcast' ? null : e.target.value)}>
          <option value="broadcast">广播所有客户端</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.remoteAddress}:{c.remotePort}</option>)}
        </select>
      </span>
    </>
  )
}
```

```tsx
// UdpConfig.tsx
import type { TabState, UdpConfig as UdpConfigType } from '../../../shared/types'
import { isLive } from '../../store/tab-meta'

interface Props { tab: TabState; onChange: (config: UdpConfigType) => void }

export default function UdpConfigFields({ tab, onChange }: Props): JSX.Element {
  const cfg = tab.config as UdpConfigType
  const disabled = isLive(tab)
  return (
    <>
      <span className="cfg-field">
        <span className="cfg-label">本地</span>
        <input className="cfg-input w-60" type="number" min={1} max={65535} value={cfg.localPort || ''} disabled={disabled}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (Number.isFinite(v) && v >= 1 && v <= 65535) onChange({ ...cfg, localPort: v }) }} />
      </span>
      <span className="cfg-field">
        <span className="cfg-label">目标</span>
        <input className="cfg-input w-70" value={cfg.targetHost} spellCheck={false} disabled={disabled}
          onChange={(e) => onChange({ ...cfg, targetHost: e.target.value })} />
        <span className="cfg-sep" />
        <input className="cfg-input w-70" type="number" min={1} max={65535} value={cfg.targetPort || ''} disabled={disabled}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (Number.isFinite(v) && v >= 1 && v <= 65535) onChange({ ...cfg, targetPort: v }) }} />
      </span>
    </>
  )
}
```
清空 `TcpClientConfig.css`（字段样式来自 base.css `.cfg-*`）。

- [ ] **Step 4: 验证** —— `npm run build` 通过（TabContent 尚未接线新字段，编译期验证导出签名）。

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/hooks/useConnectionActions.ts src/renderer/src/hooks/useServerClients.ts src/renderer/src/components/config/
git commit -m "refactor: ws-header 内联配置字段渲染与连接动作 hook"
```

---

## Task 12: 消息区重写（MessageList / MessageItem / fmtBody）

**Files:**
- Create: `src/renderer/src/components/messages/fmtBody.tsx`
- Create: `src/renderer/src/components/messages/__tests__/fmtBody.test.tsx`
- Modify: `src/renderer/src/components/messages/MessageList.tsx`（重写）
- Modify: `src/renderer/src/components/messages/MessageItem.tsx`（重写）
- Modify: `src/renderer/src/components/messages/MessageList.css`（重写）

**Interfaces:**
- Consumes: `useTabStore`（clearMessages/clearDirectionMessages）、`TabState/Message/DisplayMode`、`formatTime`、`Icon`。
- Produces:
  - `renderMessageBody(text, mode: 'text'|'hex'): React.ReactNode[]`（`<CR>/<LF>/<TAB>` chip + 换行；hex 原样）。
  - `MessageList({ tab })`：`.msg-area`（分屏两列 `.msg-col` 含 `.msg-col-head` 清空按钮，或合并单列），双击所在列清空，空态 `.empty-msg`，自动滚动底部。
  - `MessageItem({ message, displayMode })`：`.msg-row.{tx|rx}`，`.msg-meta`（`[时间]` →/← peer bytes 复制按钮）+ `.msg-body`。

- [ ] **Step 1: 写失败测试 `fmtBody.test.tsx`**

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { renderMessageBody } from '../fmtBody'

function htmlOf(nodes: React.ReactNode[]): string {
  const { container } = render(React.createElement('span', null, nodes))
  return container.innerHTML
}

describe('fmtBody 控制符可视化', () => {
  it('CRLF → <CR><LF> + 换行', () => {
    expect(htmlOf(renderMessageBody('A\r\nB', 'text'))).toContain('<span class="ctrl">&lt;CR&gt;</span>')
    expect(htmlOf(renderMessageBody('A\r\nB', 'text'))).toContain('<span class="ctrl">&lt;LF&gt;</span>')
  })
  it('单 CR / 单 LF 各自成 chip + 换行', () => {
    expect(htmlOf(renderMessageBody('A\rB', 'text'))).toContain('&lt;CR&gt;')
    expect(htmlOf(renderMessageBody('A\nB', 'text'))).toContain('&lt;LF&gt;')
  })
  it('TAB → <TAB> chip', () => {
    expect(htmlOf(renderMessageBody('a\tb', 'text'))).toContain('&lt;TAB&gt;')
  })
  it('hex 模式原样输出', () => {
    expect(htmlOf(renderMessageBody('01 03 00 0A', 'hex'))).toBe('01 03 00 0A')
  })
})
```

- [ ] **Step 2: 运行确认失败。**

- [ ] **Step 3: 实现 fmtBody.tsx**

```tsx
import React from 'react'

function ctrl(label: string, key: number): React.ReactNode {
  return <span className="ctrl" key={key}>{`<${label}>`}</span>
}

export function renderMessageBody(text: string, mode: 'text' | 'hex'): React.ReactNode[] {
  if (mode === 'hex') return [text]
  const nodes: React.ReactNode[] = []
  let key = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code === 0x0d && i + 1 < text.length && text.charCodeAt(i + 1) === 0x0a) {
      nodes.push(ctrl('CR', key++)); nodes.push(ctrl('LF', key++)); nodes.push(<br key={key++} />); i++
    } else if (code === 0x0d) {
      nodes.push(ctrl('CR', key++)); nodes.push(<br key={key++} />)
    } else if (code === 0x0a) {
      nodes.push(ctrl('LF', key++)); nodes.push(<br key={key++} />)
    } else if (code === 0x09) {
      nodes.push(ctrl('TAB', key++))
    } else {
      nodes.push(text[i])
    }
  }
  return nodes
}
```

- [ ] **Step 4: 运行确认 PASS。**

- [ ] **Step 5: 重写 MessageItem.tsx**

```tsx
import { useState, useCallback } from 'react'
import type { Message, DisplayMode } from '../../../shared/types'
import { formatTime } from '../common/format'
import { renderMessageBody } from './fmtBody'
import Icon from '../common/Icons'

interface Props { message: Message; displayMode: DisplayMode }

function formatHex(data: ArrayBuffer): string {
  const arr = new Uint8Array(data)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

export default function MessageItem({ message, displayMode }: Props): JSX.Element {
  const [copied, setCopied] = useState(false)
  const dirSymbol = message.direction === 'tx' ? '→' : '←'
  const body = displayMode === 'hex' ? formatHex(message.raw) : message.text || ''
  const copyText = message.text || (message.raw ? new TextDecoder('utf-8').decode(message.raw) : '')

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    } catch { /* 剪贴板不可用时静默 */ }
  }, [copyText])

  return (
    <div className={`msg-row ${message.direction}`}>
      <div className="msg-meta">
        <span className="msg-time">[{formatTime(message.timestamp)}]</span>
        <span className="msg-dir">{dirSymbol}</span>
        <span className="msg-peer">{message.remote}</span>
        <span className="msg-bytes">({message.byteLength} bytes)</span>
        <button className={`icon-btn msg-copy${copied ? ' copied' : ''}`} title="复制原文" aria-label="复制" onClick={handleCopy}>
          {copied ? <Icon name="check" /> : <Icon name="copy" />}
        </button>
      </div>
      <div className="msg-body">{renderMessageBody(body, displayMode)}</div>
    </div>
  )
}
```

- [ ] **Step 6: 重写 MessageList.tsx**

```tsx
import { useEffect, useRef } from 'react'
import type { TabState, Message } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import MessageItem from './MessageItem'
import './MessageList.css'

interface Props { tab: TabState }

function Column({ label, cls, messages, displayMode, onClear }: { label: string; cls: string; messages: Message[]; displayMode: TabState['sendOptions']['displayMode']; onClear: () => void }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [messages.length])
  return (
    <div className={`msg-col ${cls}`} ref={ref} onDoubleClick={onClear}>
      <div className="msg-col-head">
        <span className="mch-label">{label}</span><span className="mch-count">{messages.length} 条</span>
        <span className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onClear() }} disabled={messages.length === 0}>清空</button>
      </div>
      <div className="msg-list">
        {messages.length === 0 ? <div className="empty-msg">暂无数据<span className="em-kbd">连接后收发数据将显示在这里</span></div>
          : messages.map((m) => <MessageItem key={m.id} message={m} displayMode={displayMode} />)}
      </div>
    </div>
  )
}

export default function MessageList({ tab }: Props): JSX.Element {
  const clearMessages = useTabStore((s) => s.clearMessages)
  const clearDirectionMessages = useTabStore((s) => s.clearDirectionMessages)
  const areaRef = useRef<HTMLDivElement>(null)
  const split = tab.sendOptions.splitView
  const displayMode = tab.sendOptions.displayMode
  const tx = tab.messages.filter((m) => m.direction === 'tx')
  const rx = tab.messages.filter((m) => m.direction === 'rx')

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight
  }, [tab.messages.length, split])

  if (split) {
    return (
      <div className="msg-area split">
        <Column label="TX 发送" cls="tx-col" messages={tx} displayMode={displayMode} onClear={() => clearDirectionMessages(tab.id, 'tx')} />
        <Column label="RX 接收" cls="rx-col" messages={rx} displayMode={displayMode} onClear={() => clearDirectionMessages(tab.id, 'rx')} />
      </div>
    )
  }
  return (
    <div className="msg-area" ref={areaRef} onDoubleClick={() => clearMessages(tab.id)}>
      <div className="msg-list">
        {tab.messages.length === 0 ? <div className="empty-msg">暂无消息<span className="em-kbd">连接后收发数据将显示在这里</span></div>
          : tab.messages.map((m) => <MessageItem key={m.id} message={m} displayMode={displayMode} />)}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: 重写 MessageList.css** —— 从原型 `.msg-area`（188–198）、`.msg-row`（199–204）、`.msg-meta`（205–215）、`.msg-body`（216）、`.empty-msg`（218–219）原样迁移。删除旧 `.message-*`/`.ascii-*` 规则（`AsciiHighlighter` 仍导出但不再用于消息渲染；`countControlChars` 继续用于 ascii-hint）。

- [ ] **Step 8: 验证** —— `npm test`（新增 fmtBody 用例 + 既有通过）；`npm run build` 通过。

- [ ] **Step 9: Commit**

```bash
git add src/renderer/src/components/messages/fmtBody.tsx src/renderer/src/components/messages/__tests__/fmtBody.test.tsx src/renderer/src/components/messages/MessageList.tsx src/renderer/src/components/messages/MessageItem.tsx src/renderer/src/components/messages/MessageList.css
git commit -m "refactor: 消息区按原型重写（分屏/控制符可视化/复制）"
```

---

## Task 13: StatsBar 统计条

**Files:**
- Modify: `src/renderer/src/components/stats/StatsBar.tsx`（重写）
- Modify: `src/renderer/src/components/stats/StatsBar.css`（重写）

**Interfaces:**
- Consumes: `TabState`、`isLive`、`fmtBytes`、`fmtDur`。
- Produces: `StatsBar({ tab })`：`.stats` 条（发送/接收/发送速率/接收速率/消息/会话时长）。数据由 `tab.messages` 派生（按方向求和 bytes + 计数），速率与时长用 1s 采样窗口（本地 state）。

- [ ] **Step 1: 重写 StatsBar.tsx**

```tsx
import { useEffect, useState } from 'react'
import type { TabState } from '../../../shared/types'
import { isLive } from '../../store/tab-meta'
import { fmtBytes, fmtDur } from '../common/format'
import './StatsBar.css'

export default function StatsBar({ tab }: { tab: TabState }): JSX.Element {
  const live = isLive(tab)
  const [rates, setRates] = useState({ tx: 0, rx: 0 })
  const [dur, setDur] = useState(0)

  const txBytes = tab.messages.filter((m) => m.direction === 'tx').reduce((a, m) => a + m.byteLength, 0)
  const rxBytes = tab.messages.filter((m) => m.direction === 'rx').reduce((a, m) => a + m.byteLength, 0)

  useEffect(() => {
    if (!live) return
    let prevTx = txBytes, prevRx = rxBytes, seconds = 0
    const timer = setInterval(() => {
      setRates({ tx: txBytes - prevTx, rx: rxBytes - prevRx })
      prevTx = txBytes; prevRx = rxBytes
      seconds += 1
      setDur(seconds)
    }, 1000)
    return () => clearInterval(timer)
  }, [live, txBytes, rxBytes])

  return (
    <div className="stats">
      <span className="st"><span className="st-label">发送</span><span className="st-val tx">{fmtBytes(txBytes)}</span></span>
      <span className="st"><span className="st-label">接收</span><span className="st-val rx">{fmtBytes(rxBytes)}</span></span>
      <span className="st"><span className="st-label">发送速率</span><span className="st-val">{fmtBytes(rates.tx)}/s</span></span>
      <span className="st"><span className="st-label">接收速率</span><span className="st-val">{fmtBytes(rates.rx)}/s</span></span>
      <span className="st"><span className="st-label">消息</span><span className="st-val">{tab.messages.length}</span></span>
      <span className="spacer" />
      <span className="dur">会话时长 <span className="st-val">{fmtDur(dur)}</span></span>
    </div>
  )
}
```

- [ ] **Step 2: 重写 StatsBar.css** —— 从原型 `.stats`（221–228）原样迁移。删除旧 `.stats-bar` 规则。

- [ ] **Step 3: 验证** —— `npm run build` 通过。

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/stats/StatsBar.tsx src/renderer/src/components/stats/StatsBar.css
git commit -m "refactor: 统计条按原型重写并派生自消息数据"
```

---

## Task 14: SendPanel 发送区 composer 重写

**Files:**
- Modify: `src/renderer/src/components/send/SendPanel.tsx`（重写）
- Modify: `src/renderer/src/components/send/SendPanel.css`（重写）
- Modify: `src/renderer/src/components/send/__tests__/sendpanel-render.test.tsx`（更新 props）
- Modify: `src/renderer/src/components/common/CrPreservingEditor.css`（改外观对齐 `.cmp-input`）

**Interfaces:**
- Consumes: `TabState`、`useTabStore`（updateSendOptions/quickSendItems）、`useIpc.send`、`normalizeToLf`、`countControlChars`、`CrPreservingEditor`、`Icon`、`Menu/menuPosition`、`useUiStore`（settings.quickTagsCount/showToast/openQuickSendModal）。
- Produces: `SendPanel({ tab })`：`.composer`（编码 seg + HEX seg + LF→CR switch + 发送历史按钮 + spacer + ascii-hint + tb-send；chips；CrPreservingEditor 输入 + 右侧发送按钮；hint 行）。保留 `doSend` 编码分支、Ctrl+Enter/Ctrl+↑↓ 历史、历史菜单（点击填入）。

- [ ] **Step 1: 更新 `sendpanel-render.test.tsx`** —— props 由 `tabId` 改为 `tab`，断言仍为 `.cm-content`：

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import SendPanel from '../SendPanel'
import { useTabStore } from '../../../store/tab-store'

describe('SendPanel 渲染（防白屏回归）', () => {
  it('挂载 SendPanel 不抛异常，且渲染出 CodeMirror 编辑器', () => {
    useTabStore.setState({
      tabs: [{
        id: 'tab-1', title: 'TCP Client 1', type: 'tcp-client', status: 'connected',
        config: { host: '127.0.0.1', port: 502 }, messages: [],
        sendOptions: { encoding: 'utf-8', displayMode: 'text', lfToCr: false, splitView: true }
      }],
      activeTabId: 'tab-1'
    })
    ;(window as any).electronAPI = {
      connect: () => Promise.resolve(), disconnect: () => Promise.resolve(), send: () => Promise.resolve(),
      serverSetTarget: () => Promise.resolve(), encoding: { encodeText: () => Promise.resolve([]) },
      store: { loadTabs: () => Promise.resolve([]), saveTabs: () => {} },
      quickSend: { load: () => Promise.resolve({ items: [], groups: [] }), save: () => {} }
    }
    const tab = useTabStore.getState().tabs[0]
    expect(() => {
      const { container } = render(React.createElement(SendPanel, { tab }))
      expect(container.querySelector('.cm-content')).toBeTruthy()
    }).not.toThrow()
  })
})
```

- [ ] **Step 2: 重写 SendPanel.tsx**

```tsx
import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import type { KeyBinding } from '@codemirror/view'
import type { TabState } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import { normalizeToLf } from '../../hooks/lineEnding'
import { countControlChars } from '../common/AsciiHighlighter'
import CrPreservingEditor, { type CrPreservingEditorHandle } from '../common/CrPreservingEditor'
import { useUiStore } from '../../store/ui-store'
import { isLive } from '../../store/tab-meta'
import Icon from '../common/Icons'
import Menu, { menuPosition } from '../common/Menu'
import './SendPanel.css'

const ENCODINGS = ['ASCII', 'UTF-8', 'GBK'] as const

export default function SendPanel({ tab }: { tab: TabState }): JSX.Element {
  const tabId = tab.id
  const updateSendOptions = useTabStore((s) => s.updateSendOptions)
  const quickSendItems = useTabStore((s) => s.quickSendItems)
  const quickTagsCount = (useUiStore((s) => s.settings.quickTagsCount) as number) || 5
  const showToast = useUiStore((s) => s.showToast)
  const openQuickSendModal = useUiStore((s) => s.openQuickSendModal)
  const { send } = useIpc()

  const encoding = tab.sendOptions.encoding
  const displayMode = tab.sendOptions.displayMode
  const lfToCr = tab.sendOptions.lfToCr
  const isConnected = isLive(tab)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [draftInput, setDraftInput] = useState('')
  const [historyMenu, setHistoryMenu] = useState<React.CSSProperties | null>(null)
  const editorRef = useRef<CrPreservingEditorHandle>(null)

  useEffect(() => { editorRef.current?.setValue(input) }, [input])

  const doSend = useCallback(async (): Promise<void> => {
    if (!input) return
    const textToSend = input
    setSending(true)
    try {
      const finalText = lfToCr ? normalizeToLf(textToSend).replace(/\n/g, '\r') : textToSend
      let bytes: Uint8Array
      if (encoding === 'gbk') {
        const encoded = await window.electronAPI.encoding.encodeText(finalText, 'gbk')
        bytes = new Uint8Array(encoded)
      } else if (encoding === 'ascii') {
        bytes = new Uint8Array(finalText.split('').map((c) => c.charCodeAt(0) & 0x7f))
      } else {
        bytes = new TextEncoder().encode(finalText)
      }
      await send(tabId, bytes, encoding)
      setHistory((prev) => [textToSend, ...prev])
      setHistoryIndex(-1); setDraftInput(''); setInput('')
      showToast('已发送')
    } catch (err) { console.error('send failed:', err) } finally { setSending(false) }
  }, [input, encoding, tabId, send, lfToCr, showToast])

  const historyUp = useCallback((): void => {
    if (history.length === 0) return
    if (historyIndex === -1) setDraftInput(input)
    const idx = Math.min(historyIndex + 1, history.length - 1)
    setHistoryIndex(idx)
    setInput(history[idx])
  }, [history, historyIndex, input])

  const historyDown = useCallback((): void => {
    if (history.length === 0) return
    if (historyIndex <= 0) { setHistoryIndex(-1); setInput(draftInput); setDraftInput('') }
    else { const idx = historyIndex - 1; setHistoryIndex(idx); setInput(history[idx]) }
  }, [history, historyIndex, draftInput])

  const handlersRef = useRef({ doSend, historyUp, historyDown })
  handlersRef.current = { doSend, historyUp, historyDown }

  const sendKeymap = useMemo<KeyBinding[]>(() => [
    { key: 'Mod-Enter', run: () => { handlersRef.current.doSend(); return true } },
    { key: 'Mod-ArrowUp', run: () => { handlersRef.current.historyUp(); return true } },
    { key: 'Mod-ArrowDown', run: () => { handlersRef.current.historyDown(); return true } }
  ], [])

  const chips = quickSendItems.slice(0, quickTagsCount)

  const fill = (content: string) => { setInput(content); editorRef.current?.focus() }
  const chipSend = (content: string) => { if (isConnected) { setInput(content); handlersRef.current.doSend() } else showToast('请先建立连接') }

  const ctrlHits = countControlChars(input)
  const asciiHint = ctrlHits.length ? `ASCII: ${ctrlHits.join(', ')}` : ''
  const encHint = encoding + (lfToCr ? ' · LF→CR' : '') + (displayMode === 'hex' ? ' · HEX' : '')

  return (
    <div className="composer">
      <div className="cmp-toolbar">
        <div className="seg" role="group" aria-label="编码">
          {ENCODINGS.map((e) => (
            <button key={e} className={encoding === e ? 'active' : ''} onClick={() => updateSendOptions(tabId, { encoding: e })}>{e}</button>
          ))}
        </div>
        <div className="toolbar-sep" />
        <div className="seg" role="group" aria-label="显示格式">
          <button className={displayMode === 'text' ? 'active' : ''} title="文本" onClick={() => updateSendOptions(tabId, { displayMode: 'text' })}>TXT</button>
          <button className={displayMode === 'hex' ? 'active' : ''} title="十六进制" onClick={() => updateSendOptions(tabId, { displayMode: 'hex' })}>HEX</button>
        </div>
        <div className="toolbar-sep" />
        <label className="switch">
          <input type="checkbox" checked={lfToCr} onChange={(e) => updateSendOptions(tabId, { lfToCr: e.target.checked })} />
          <span className="track" />LF→CR
        </label>
        <button className="cmp-history-btn" title="发送历史 (Ctrl+↑↓)" onClick={(e) => setHistoryMenu(menuPosition((e.currentTarget as HTMLElement).getBoundingClientRect()))}>
          <Icon name="history" size={13} />发送历史
        </button>
        <div className="spacer" />
        <span className="ascii-hint">{asciiHint}</span>
        <button className="btn btn-secondary btn-sm tb-send" title="发送 (Ctrl+Enter)" disabled={!isConnected || !input.trim() || sending} onClick={() => doSend()}>
          <Icon name="send" size={14} />发送
        </button>
      </div>

      {chips.length > 0 ? (
        <div className="cmp-chips">
          {chips.map((c) => (
            <span key={c.id} className="chip" title="点击填入发送框" onClick={() => fill(c.content)}>
              <span className="chip-name">{c.name}</span>
              <Icon name="play" size={12} className="chip-send" />
            </span>
          ))}
        </div>
      ) : (
        <div className="cmp-chips">
          <span className="chip" onClick={openQuickSendModal}>+ 添加快捷指令</span>
        </div>
      )}

      <div className="cmp-row">
        <CrPreservingEditor
          ref={editorRef}
          initialValue={input}
          onChange={setInput}
          extraKeymap={sendKeymap}
          placeholder={isConnected ? '输入要发送的内容 (Ctrl+Enter 发送 · Ctrl+↑↓ 历史)' : '请先建立连接'}
          disabled={!isConnected || sending}
          className="cmp-input"
        />
        <div className="cmp-send-col">
          <button className="btn-send" disabled={!isConnected || !input.trim() || sending} onClick={() => doSend()}>
            <Icon name="send" size={16} />发送
          </button>
        </div>
      </div>

      <div className="cmp-hint">
        <span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> 发送</span>
        <span><kbd>Ctrl</kbd>+<kbd>↑↓</kbd> 历史</span>
        <span>双击消息面板清空</span>
        <span className="spacer" />
        <span className="enc-hint">{encHint}</span>
      </div>

      {historyMenu && (
        <Menu title="发送历史" style={historyMenu} onClose={() => setHistoryMenu(null)}>
          {history.length === 0
            ? <div className="menu-empty">暂无历史 · Ctrl+↑↓ 回溯</div>
            : history.slice(0, 8).map((h) => (
                <div key={h} className="menu-item history-item" onClick={() => { fill(h); setHistoryMenu(null) }}>{h}</div>
              ))}
        </Menu>
      )}
    </div>
  )
}
```
> 说明：chip 点击填入输入框（原型行为）；立即发送通过 QuickSendPanel 的 play 按钮/指令行实现（原型 `chip-send` 为增强项，如需保留可将图标单独包一层 onClick 调用 `chipSend`）。

- [ ] **Step 3: 重写 SendPanel.css** —— 从原型 `.composer`（行 230）、`.cmp-toolbar`（231）、`.cmp-history-btn`（244–246）、`.tb-send`（247–249）、`.cmp-chips`（250）、`.cmp-row`（255）、`.cmp-input`（256–259）、`.cmp-send-col`（260）、`.btn-send`（261–265）、`.cmp-hint`（266–269）原样迁移。

- [ ] **Step 4: 更新 CrPreservingEditor.css** —— 使 CodeMirror 外观贴合 `.cmp-input`：白底、1px `var(--border)`、`border-radius: 10px`、`var(--font-mono)` 12.5px、`min-height:72px; max-height:150px`、focus 时 `border-color: var(--accent)` + `var(--focus-ring)`、disabled 灰化。保留 `.cm-cursor`/`.cm-selectionBackground` 但颜色改用 `var(--accent)`。

- [ ] **Step 5: 验证** —— `npx vitest run src/renderer/src/components/send/__tests__/sendpanel-render.test.tsx` PASS（.cm-content 仍在）；`npm test` 全绿；`npm run build` 通过。

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src/components/send/SendPanel.tsx src/renderer/src/components/send/SendPanel.css src/renderer/src/components/send/__tests__/sendpanel-render.test.tsx src/renderer/src/components/common/CrPreservingEditor.css
git commit -m "refactor: 发送区按原型重写（seg/switch/chips/历史菜单/提示行）"
```

---

## Task 15: TabContent 工作区组装（ws-header / 分屏 / 清空）

**Files:**
- Create: `src/renderer/src/components/tab/TabContent.css`
- Modify: `src/renderer/src/components/tab/TabContent.tsx`（重写）

**Interfaces:**
- Consumes: `TabState`、`useTabStore`（updateSendOptions）、`useConnectionActions`、`useServerClients`、`statusLabelFor`、`TYPE_META`、`STATUS_META`、`Icon`、`TcpClientConfigFields/TcpServerConfigFields/UdpConfigFields`、`MessageList`、`StatsBar`、`SendPanel`。
- Produces: `TabContent({ tab })`：`.ws-header`（类型图标+标题+消息数 → 内联配置字段 → 状态 pill → 连接/断开按钮 + 分屏切换按钮）+ `MessageList` + `StatsBar` + `SendPanel`。移除原 `msgPct/splitPct` 拖拽与分屏比例。

- [ ] **Step 1: 创建 TabContent.css** —— 从原型 `.ws-header`（行 146）、`.ws-title`（147–148）、`.ws-config`（149–150）、`.ws-header .spacer`（150）、`.ws-actions`（151）、`.ws-count`（187）原样迁移（`.workspace` 已在 MainLayout.css）。

- [ ] **Step 2: 重写 TabContent.tsx**

```tsx
import { useState } from 'react'
import type { TabState, TabConfig } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useConnectionActions } from '../../hooks/useConnectionActions'
import { useServerClients } from '../../hooks/useServerClients'
import { TYPE_META, STATUS_META, statusLabelFor } from '../../store/tab-meta'
import Icon from '../common/Icons'
import TcpClientConfigFields from '../config/TcpClientConfig'
import TcpServerConfigFields from '../config/TcpServerConfig'
import UdpConfigFields from '../config/UdpConfig'
import MessageList from '../messages/MessageList'
import StatsBar from '../stats/StatsBar'
import SendPanel from '../send/SendPanel'
import './TabContent.css'

interface Props { tab: TabState }

export default function TabContent({ tab }: Props): JSX.Element {
  const setTabConfig = useTabStore((s) => s.setTabConfig)
  const updateSendOptions = useTabStore((s) => s.updateSendOptions)
  const clients = useServerClients(tab.id)
  const [target, setTarget] = useState<string>('broadcast')
  const { live, connecting, actionLabel, loading, handleToggle } = useConnectionActions(tab)

  const onConfigChange = (config: TabConfig) => setTabConfig(tab.id, config)
  const onTargetChange = async (clientId: string | null) => {
    setTarget(clientId ?? 'broadcast')
    await window.electronAPI.serverSetTarget({ tabId: tab.id, clientId })
  }

  const tm = TYPE_META[tab.type]
  const sm = STATUS_META[tab.status]
  const split = tab.sendOptions.splitView

  return (
    <>
      <div className="ws-header">
        <div className="ws-title">
          <span className="ws-type-icon"><Icon name={tm.icon} size={16} className={`ic ct-${tm.tag.toLowerCase()}`} /></span>
          <span className="conn-name-ws">{tab.title}</span>
          <span className="ws-count num">{tab.messages.length} 条</span>
        </div>
        <div className="ws-config">
          {tab.type === 'tcp-client' && <TcpClientConfigFields tab={tab} onChange={onConfigChange} />}
          {tab.type === 'tcp-server' && <TcpServerConfigFields tab={tab} clients={clients} target={target} onTargetChange={onTargetChange} onChange={onConfigChange} />}
          {tab.type === 'udp' && <UdpConfigFields tab={tab} onChange={onConfigChange} />}
        </div>
        <span className={`status-pill${live ? ' sp-success' : tab.status === 'connecting' ? ' sp-warn' : tab.status === 'error' ? ' sp-error' : ''}`}>
          <span className={`status-dot ${sm.cls}${sm.pulse ? ' pulse' : ''}`} />{statusLabelFor(tab, clients.length)}
        </span>
        <div className="spacer" />
        <div className="ws-actions">
          <button className={`btn btn-sm${live ? ' btn-danger' : ' btn-dark'}`} disabled={connecting || loading} onClick={() => handleToggle()}>
            {actionLabel}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => updateSendOptions(tab.id, { splitView: !split })}>
            <Icon name={split ? 'merge' : 'split'} size={14} /><span className="lbl">{split ? '合并' : '分屏'}</span>
          </button>
        </div>
      </div>
      <MessageList tab={tab} />
      <StatsBar tab={tab} />
      <SendPanel tab={tab} />
    </>
  )
}
```

- [ ] **Step 3: 验证** —— `npm run build` 通过；`npm test` 全绿；`npm run dev` 手工冒烟（新建连接→收发→分屏→清空→统计）。

- [ ] **Step 4: Commit**

```bash
git add src/renderer/src/components/tab/TabContent.tsx src/renderer/src/components/tab/TabContent.css
git commit -m "refactor: 工作区按原型组装（ws-header 内联配置/分屏/统计/发送）"
```

---

## Task 16: SettingsModal 设置壳

**Files:**
- Create: `src/renderer/src/components/settings/SettingsModal.tsx`
- Create: `src/renderer/src/components/settings/SettingsModal.css`

**Interfaces:**
- Consumes: `useUiStore`（settingsModalOpen/settings/updateSetting/closeSettings/saveSettings/cancelSettings/resetSettings/showToast）、`SETTINGS_SCHEMA`、`Icon`。
- Produces: `SettingsModal()`：`.modal-backdrop` + `.settings-modal`（head：设置+sub+关闭；body：`.settings-rail` 分类 + `.settings-panel` 行；foot：恢复默认/取消/保存）。`renderControl(item)` 渲染 switch/seg/select/number，`depends` 禁用；面板注记"设置仅作外观演示，暂不影响实际行为"。

- [ ] **Step 1: 创建 SettingsModal.tsx**

```tsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useUiStore } from '../../store/ui-store'
import { SETTINGS_SCHEMA, type SettingsItem } from '../../store/settings-schema'
import Icon from '../common/Icons'
import './SettingsModal.css'

function renderControl(item: SettingsItem, value: string | number | boolean, disabled: boolean, onChange: (v: string | number | boolean) => void): JSX.Element {
  if (item.type === 'switch') {
    return (
      <label className="switch">
        <input type="checkbox" checked={Boolean(value)} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="track" />
      </label>
    )
  }
  if (item.type === 'seg') {
    return (
      <div className="seg">
        {(item.options as string[]).map((o) => (
          <button key={o} type="button" className={value === o ? 'active' : ''} disabled={disabled} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    )
  }
  if (item.type === 'select') {
    return (
      <select className="cfg-select" disabled={disabled} value={String(value)}
        onChange={(e) => {
          const found = (item.options as [string | number, string][]).find(([v]) => String(v) === e.target.value)
          onChange(typeof found?.[0] === 'number' ? Number(e.target.value) : e.target.value)
        }}>
        {(item.options as [string | number, string][]).map(([v, l]) => <option key={String(v)} value={v}>{l}</option>)}
      </select>
    )
  }
  return (
    <input className="cfg-input w-number" type="number" min={item.min} max={item.max} value={String(value)} disabled={disabled}
      onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(Math.max(item.min ?? 0, Math.min(item.max ?? 9999, n))) }} />
  )
}

export default function SettingsModal(): JSX.Element | null {
  const open = useUiStore((s) => s.settingsModalOpen)
  const settings = useUiStore((s) => s.settings)
  const updateSetting = useUiStore((s) => s.updateSetting)
  const close = useUiStore((s) => s.closeSettings)
  const save = useUiStore((s) => s.saveSettings)
  const cancel = useUiStore((s) => s.cancelSettings)
  const reset = useUiStore((s) => s.resetSettings)
  const showToast = useUiStore((s) => s.showToast)
  const [catKey, setCatKey] = useState('general')

  if (!open) return null
  const cat = SETTINGS_SCHEMA.find((c) => c.key === catKey) ?? SETTINGS_SCHEMA[0]

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="settings-modal" onKeyDown={(e) => { if (e.key === 'Escape') close() }}>
        <div className="settings-head">
          <h3>设置</h3><span className="sub">NetAssist · 偏好与行为</span>
          <button className="icon-btn close" title="关闭" aria-label="关闭" onClick={close}><Icon name="x" /></button>
        </div>
        <div className="settings-body">
          <div className="settings-rail">
            {SETTINGS_SCHEMA.map((c) => (
              <button key={c.key} className={`settings-cat${c.key === catKey ? ' active' : ''}`} onClick={() => setCatKey(c.key)}>
                <Icon name={c.icon as 'sliders' | 'copy' | 'send' | 'network' | 'history'} size={15} />{c.label}
              </button>
            ))}
          </div>
          <div className="settings-panel">
            <div className="set-group-title">注：设置仅作外观演示，暂不影响实际行为</div>
            {cat.groups.map((g) => (
              <div key={g.title}>
                <div className="set-group-title">{g.title}</div>
                {g.items.map((item) => {
                  const disabled = item.depends ? !settings[item.depends] : false
                  return (
                    <div key={item.key} className={`set-row${disabled ? ' disabled' : ''}`}>
                      <div className="set-info">
                        <div className="set-label">{item.label}</div>
                        {item.desc && <div className="set-desc">{item.desc}</div>}
                      </div>
                      <div className="set-control">{renderControl(item, settings[item.key], disabled, (v) => updateSetting(item.key, v))}</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="settings-foot">
          <button className="btn btn-ghost btn-sm" onClick={reset}>恢复默认</button>
          <span className="spacer" />
          <button className="btn btn-secondary" onClick={cancel}>取消</button>
          <button className="btn btn-primary" onClick={() => { save(); showToast('设置已保存') }}>保存</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
```

- [ ] **Step 2: 创建 SettingsModal.css** —— 从原型 `.settings-modal`（行 296）、`.settings-head`（297–300）、`.settings-body`（301）、`.settings-rail`（302）、`.settings-cat`（303–306）、`.settings-panel`（307）、`.set-group-title`（308）、`.set-row`（309–320）、`.settings-foot`（321–322）原样迁移。

- [ ] **Step 3: 挂载** —— 在 `MainLayout` 中 `import SettingsModal from '../components/settings/SettingsModal'` 并渲染 `<SettingsModal />`（与 `<ToastHost />` 并列）。

- [ ] **Step 4: 验证** —— `npm run build` 通过；`npm run dev` 打开设置→切换分类→改值→取消/恢复默认/保存→刷新后 localStorage 生效。

- [ ] **Step 5: Commit**

```bash
git add src/renderer/src/components/settings/SettingsModal.tsx src/renderer/src/components/settings/SettingsModal.css src/renderer/src/components/layout/MainLayout.tsx
git commit -m "feat: 设置壳（5 分类/localStorage/取消回滚/恢复默认）"
```

---

## Task 17: antd 清理 + 依赖移除 + 全量验证 + 手动验收

**Files:**
- Modify: 全渲染层（删除全部 `antd` / `@ant-design/icons` import）
- Modify: `package.json`（移除 `antd`、`@ant-design/icons`）
- Delete: `src/renderer/src/components/encoding/EncodingSelector.tsx`
- Delete: `src/renderer/src/components/encoding/HexEditor.tsx`、`HexEditor.css`
- Delete: `src/renderer/src/components/encoding/WhitespaceRenderer.tsx`

**Interfaces:**
- 约束：渲染层不得再出现 `from 'antd'` / `from '@ant-design/icons'`。

- [ ] **Step 1: 全局扫描并清除**

```bash
grep -rn "from 'antd'\|@ant-design/icons" src/renderer/src
```
预期在 Task 1–16 完成后输出为空；若有残留逐文件替换为手写组件。删除 `EncodingSelector.tsx`、`HexEditor.tsx`、`HexEditor.css`、`WhitespaceRenderer.tsx`（均无引用）。

- [ ] **Step 2: 移除依赖** —— 从 `package.json` `dependencies` 删除 `"antd"` 与 `"@ant-design/icons"` 两行；运行 `npm install`（或 `pnpm install`）更新锁文件。

- [ ] **Step 3: 全量测试** —— `npm test`，期望：既有渲染层用例（sendpanel-render、CrPreservingEditor、paste-flow、lineEnding、tab-store）与新增用例（Icons/format/tab-meta/settings-schema/ui-store/fmtBody）全部 PASS；`src/main/connections/tcp-client-connection.test.ts` 的既有失败保持原样（src/main 只读，不在本 change 范围），确认无新增失败。

- [ ] **Step 4: 构建** —— `npm run build`，期望 electron-vite 三端全部构建成功。

- [ ] **Step 5: 手动验收（对应 tasks.md 7.3 场景）** —— `npm run dev` 逐项核对：
  1. 欢迎页显示三模式卡片，点击 TCP Client 进入工作区，标题/图标/消息数正确；
  2. ws-header 内联配置字段可编辑、连接中禁用；连接→断开有 toast 提示；
  3. 发送文本（含 `\r\n`）后 TX 消息出现，`<CR>`/`<LF>` 控制符可视化；接收 RX 列着色正确；
  4. 分屏切换：TX/RX 两列列表头 count+清空，双击所在列清空；合并模式双击清空全部；
  5. 统计条显示发送/接收/速率/消息/时长；
  6. 发送历史：Ctrl+↑↓ 回溯、历史菜单点击填入；
  7. chip 行：点击填入，无指令时显示"+ 添加快捷指令"；
  8. 设置壳：5 分类切换、改值保存/取消回滚/恢复默认、刷新后 localStorage 保留；
  9. 侧栏搜索过滤连接与指令（无匹配 `.sb-none`）；折叠为图标导轨 + 悬浮提示；
  10. 小屏 920px 自动折叠；`prefers-reduced-motion` 下动效关闭；
  11. 状态胶囊：全空闲→"空闲"，连接中→"N 个连接活跃"，error→"N 个连接异常"。

- [ ] **Step 6: Commit**

```bash
git add src/renderer/src package.json
git commit -m "chore: 移除 antd/@ant-design/icons 依赖并清理孤儿组件"
```
（若 `package-lock.json` 或 `pnpm-lock.yaml` 存在，一并加入 commit。）

---

## 自审（Self-Review）

**Spec 覆盖对照（tasks.md 7 组 → 任务）：**
- 1.1 tokens.css → Task 1；1.2 Icons → Task 2；1.3 全局基元 → Task 1。
- 2.1 AppBar → Task 7；2.2 Welcome → Task 7；2.3 Toast → Task 6（触发点散见于各任务 showToast 调用）。
- 3.1 搜索过滤 → Task 3（纯函数）+ Task 8（接线）；3.2 连接列表 → Task 9；3.3 折叠导轨 → Task 8；3.4 快捷指令 → Task 10。
- 4.1 ws-header 内联配置 → Task 11 + Task 15；4.2 分屏消息区 → Task 12 + Task 15；4.3 消息项 → Task 12；4.4 统计条 → Task 13 + Task 15。
- 5.1 编码/HEX/LF→CR → Task 14；5.2 发送历史 → Task 14；5.3 chips → Task 14；5.4 输入区+提示行 → Task 14。
- 6.1 菜单/弹窗 → Task 6 + Task 9/10/14；6.2 设置壳 → Task 4/5 + Task 16；6.3 Escape/响应式 → Task 6（Escape）、Task 1（base.css 响应式）+ Task 8（920px 自动折叠）。
- 7.1 antd 移除 → Task 17；7.2 测试 → 各任务 + Task 17 Step 3；7.3 手动验收 → Task 17 Step 5。

**占位符扫描：** 无 "TBD/TODO/implement later"；CSS 迁移均给出原型精确行号；组件代码均给出可执行 JSX/TS。唯一有意标注的选项是 Task 8 Step 5 的 rail-tip（标记为可选增强，验收清单已含）。

**类型一致性：** `IconName`（Task 2）被 `tab-meta.TYPE_META.icon`（Task 3）引用；`deriveGlobalStatus`/`filterConnections`/`filterCommands` 签名在 Task 3 定义并被 Task 7/8/9/10 消费，命名统一；`showToast`（Task 5）在 Task 7/9/10/14/16 触发，签名 `(msg: string)` 一致；`isLive`/`statusLabelFor` 被 Task 11/13/15 消费；`MessageList({tab})`/`StatsBar({tab})`/`SendPanel({tab})` 均以整表 `TabState` 为 props，与 Task 15 组装一致；`setTabConfig` 为既有 store 方法（设计文档称 `updateTabConfig`，实现沿用现状 `setTabConfig`）。

**已知基线问题（不阻塞，须在交接时说明）：** `npx tsc` 基线已红（shared/types 相对路径解析），回归以 `npm test` + `npm run build` 为准；`src/main` 有 1 个与本 change 无关的既有失败用例。
