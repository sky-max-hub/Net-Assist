---
comet_change: ui-refactor-to-prototype
role: technical-design
canonical_spec: openspec
---

# NetAssist UI 重构 — 深度技术设计

> 本设计是对 open 阶段 `openspec/changes/ui-refactor-to-prototype/design.md`（高层方案）的深度技术细化。动机与范围见 proposal.md；行为契约见各 delta spec。设计源：`docs/ui/netassist-app.html`（唯一设计源，Apple 风格精密工作台）。

## 1. 组件树与职责

```
design/tokens.css                   设计令牌 + 全局基元（原型 :root 与 .btn/.cfg-*/.switch/.seg/.chip/.menu/.modal 等）
main.tsx                             挂载 tokens.css、渲染 <App/>
components/common/Icons.tsx          图标注册表 + <Icon name=.../> 组件
components/common/Toast.tsx          Toast 容器 + showToast()（bottom 居中、1.8s 消失）
components/common/Menu.tsx           通用下拉菜单（absolutely positioned，点击外部/Escape 关闭）
components/common/Modal.tsx          通用弹窗（backdrop + panel + 标题/主体/操作区）
components/layout/AppBar.tsx         应用标题 + 全局状态胶囊 + 设置入口
components/layout/MainLayout.tsx     布局壳：AppBar + Sidebar + Workspace；侧栏宽度拖拽
components/layout/Sidebar.tsx        搜索框 + 折叠按钮 + 连接列表区 + 快捷指令区 + 底部版本号；折叠态渲染图标导轨
components/tab/TabBar.tsx            连接列表（conn-row：状态点/类型胶囊/标题/悬停关闭/双击重命名/拖拽排序）
components/quick-send/QuickSendPanel.tsx  快捷指令（cmd-groups 分组折叠列表 + hover 操作 + 新增/编辑 Modal）
components/tab/TabContent.tsx        工作区：ws-header + 消息区 + 统计条 + composer
components/config/*.tsx              三类配置的字段渲染函数（供 ws-header 内联使用），不再独立成区块
components/messages/MessageList.tsx  消息流（合并/分屏 TX·RX 两列，列表头 label+count+清空，双击清空）
components/messages/MessageItem.tsx  单条消息（msg-meta + msg-body，fmtBody 控制符可视化，复制按钮）
components/send/SendPanel.tsx        发送区 composer（编码/HEX/LF→CR seg·switch、发送历史、ascii-hint、chip、CodeMirror 输入、发送、提示行）
components/stats/StatsBar.tsx        统计条（发送/接收/速率/消息数/会话时长）
components/settings/SettingsModal.tsx 设置壳（5 分类，SETTINGS_SCHEMA + localStorage）
components/common/Welcome.tsx        欢迎页（三模式卡片 + 快捷键提示）
store/ui-store.ts                    新增：settings 数据、toast 队列、侧栏搜索词/折叠态（与 tab-store 分离）
```

关键点：
- `TabBar`/`QuickSendPanel` 保留组件名（对外结构稳定），内部按原型类名与 DOM 重写。
- 配置面板从独立区块移除，字段渲染逻辑内联进 `ws-header`。
- `StatsBar` 由未挂载状态接入工作区。
- 移除 `TabContent` 的分屏比例/消息高度拖拽（对齐原型固定布局），`splitPct`/`msgPct` 相关代码删除。

## 2. 设计令牌与全局样式

- `design/tokens.css` 从原型 `:root` 原样迁移 CSS 自定义属性：
  `--bg #fff / --surface #f5f5f7 / --fg #1d1d1f / --muted / --border / --accent #0071e3 / --success/warn/danger`、字体栈（SF Pro → PingFang SC → Microsoft YaHei）、圆角（`--radius-sm/md/lg/pill`）、投影（`--elev-raised`、`--shadow-pop`、`--shadow-modal`、`--scrim`）、动效（`--motion-fast/base`、`--ease-standard`）、滚动条、`--focus-ring`。
- 全局基元选择器（`.btn`、`.cfg-input`、`.cfg-select`、`.switch`、`.seg`、`.chip`、`.icon-btn`、`.status-dot`、`.menu`、`.modal`、`.toast` 等）一并放入该文件或拆 `design/base.css`，从原型 CSS 按组件类名逐个迁移。
- 挂载：`main.tsx` `import './design/tokens.css'`；组件样式文件（`.tsx` 同目录 `.css`）继续沿用，但引用 `var(--*)`。
- 保留 `@media (prefers-reduced-motion: reduce)` 与 920px 响应式。

## 3. 图标系统

- `components/common/Icons.tsx`：以原型 `<symbol>` 的 `viewBox` + path 数据建立 `IconName → path(s)` 注册表，导出 `<Icon name="network" size={16}/>`，内部渲染 `<svg class="ic">`。图标名与原型 `#i-*` 一一对应（network/client/server/udp/plus/chevron/folder/play/pencil/trash/copy/check/x/send/split/merge/history/search/sliders/chevron-up/chevron-left/arrow-right）。
- 替换点：`TabBar`（Plus/Close）、`SendPanel`（Send/Clear/ColumnWidth/Merge）、`MessageItem`（Copy/Check）、`QuickSendPanel`（Plus/Edit/Delete/Send/FolderAdd）、`TabContent`（Delete）等所有 `@ant-design/icons` 使用。

## 4. 应用外壳

### AppBar
- DOM：`.titlebar`（无红绿灯，原生边框）→ `.app-title`（Icon network + "NetAssist" + `.at-sub` 网络调试助手）+ `.title-right`（`.global-status` 胶囊 + 设置 icon-btn）。
- 全局状态派生（纯函数 `deriveGlobalStatus(tabs)`）：任一 tab `status==='error'` → 红点"N 个连接异常"（优先）；否则活跃数 `[connected, listening, bound]` → 绿点"N 个连接活跃"；否则灰点"空闲"。
- 设置按钮打开 SettingsModal。

### Welcome
- 无标签（`tabs.length===0`）时工作区显示 `.welcome`：eyebrow + h1 + lead + `.mode-grid` 三卡片（data-type）+ `.kbd-hint`。
- 交互：卡片点击/键盘（Enter/空格，见全局 keydown）→ `createTab(type)` 并进入工作区。

### Toast
- `ui-store` 维护 `toasts` 队列；`showToast(msg)` 设置底部居中 `.toast.show`，1.8s 后移除。
- 触发点：新建连接、发送、连接/断开、保存指令、删除等操作结果。

## 5. 侧边栏

### 搜索与折叠
- `.sb-search`：`.search-box`（Icon search + input）+ 折叠 icon-btn（chevron-left，折叠时旋转 180°）。
- `filter` state：按连接标题/类型标签过滤 `conn-list`；按指令名称/内容过滤 `cmd-groups`；无匹配显示 `.sb-none`。
- `collapsed` state：加 `.collapsed` 类 → 隐藏搜索/正文/底栏，渲染 `.sb-rail`（rail-conn：类型图标 + 状态点，悬浮 `.rail-tip` 显示名称/状态/远端）。小屏 920px 自动折叠。
- 宽度拖拽：沿用 MainLayout 的 `sb-resize`（224–440px）。

### 连接列表（TabBar 重写）
- `.conn-row`：状态点（`.st-*` + pulse）、`.conn-type-icon`（类型色）、`.conn-name`、hover 显示 `.conn-close`（关闭并断开）。
- 双击 `.conn-name` → inline input 重命名（回车/失焦保存，Escape 还原）；拖拽排序 + 持久化；点击切换 active。

### 快捷指令（QuickSendPanel 重写）
- `.cmd-groups`：每组 `.cmd-group-head`（chevron 折叠旋转、folder 图标、名称、`.count`）+ 展开时 `.cmd-list` 的 `.cmd-row`（名称 + hover 的 发送/编辑/删除 icon-btn）。
- 头部 `.sb-actions`：新增分组（folder）+ 新增指令（plus）。
- 指令编辑 Modal：名称 input + 内容 CodeMirror（保留 CR）+ 分组 select；分组 Modal：名称 input。
- 发送：`.cmd-row` 点击发送 / `.play-btn` 立即发送；chip 在 composer 另行处理。

## 6. 工作区

### ws-header
- `.ws-title`：类型图标 + 标题 + `.ws-count`（消息数）。
- `.ws-config`：按 `tab.type` 内联渲染 `.cfg-field`（label + `.cfg-input`/`.cfg-select`），数据读写 `tab.config`（store `updateTabConfig`），连接中禁用（`disabled`）。
  - tcp-client：主机 + 端口；tcp-server：监听端口 + 发送目标 select（广播/客户端列表）；udp：本地端口 + 目标主机 + 目标端口。
- `.status-pill`：状态文案（连接中…/已连接/监听中·N 客户端/已绑定·端口/错误）。
- `.ws-actions`：连接/断开按钮（未连接 `.btn-dark`、连接中禁用、已连接 `.btn-danger`；文案按类型）+ 分屏切换按钮（split/merge 图标 + "分屏/合并"）。

### 消息区
- 合并模式：单一 `.msg-list`；分屏模式：`.msg-area.split` 两列 `.msg-col`（`.msg-col-head`：label + count + 清空按钮）。分屏比例固定 1fr 1fr（无拖拽）。
- 双击消息面板清空（分屏下按所在列清空 TX/RX，合并清空全部）。
- 自动滚动到底部。

### MessageItem
- DOM 按原型：`.msg-row.{tx|rx|sys}` → `.msg-meta`（时间 `[HH:mm:ss.mmm]`、方向 →/←、`.msg-peer`、`.msg-bytes`、hover 复制按钮 `.msg-copy` + copied 态 check）+ `.msg-body`。
- 内容渲染采用原型 `fmtBody`：hex 模式原样；文本模式把 `\r\n`/`\r`/`\n`/`\t` 替换为 `<CR>` `<LF>` `<TAB>` 控制符 chip + 换行。方向色：tx 绿 / rx 蓝（原型 `--success` / `--accent-active`）。

### StatsBar
- 数据源：`tab.messages` 统计 tx/rx 字节 + 会话时长（`stats.connectedAt`）+ 速率窗口（1s 采样）。按原型展示 发送/接收/发送速率/接收速率/消息数/会话时长。
- 挂载位置：消息区与 composer 之间（`.stats`）。

## 7. 发送区 composer

- `.cmp-toolbar`：`.seg#enc-seg`（ASCII/UTF-8/GBK，`sendOptions.encoding`）+ 分隔 + `.seg#hex-seg`（TXT/HEX，`displayMode`）+ 分隔 + 发送历史按钮（打开历史菜单）+ `.spacer` + `.ascii-hint` + 发送按钮（`tb-send`）。
- LF→CR：保留在工具栏为 `.switch`（`sendOptions.lfToCr`），作为原型必要的补全。
- `.cmp-chips`：`quickSendItems`（按 `quickTagsCount`，默认 5）渲染 `.chip`（名称 + `.chip-send` 立即发送图标）；点击 chip 填入输入框。
- 输入：`CrPreservingEditor`（CodeMirror）外观套 `.cmp-input`；keymap：Ctrl/Mod+Enter 发送、Ctrl/Mod+↑↓ 历史；粘贴保留 CR；未连接时禁用、placeholder"请先建立连接"。
- `.cmp-hint`：`Ctrl+Enter 发送`、`Ctrl+↑↓ 历史`、`双击消息面板清空`、`.spacer`、`.enc-hint`（编码 + LF→CR/HEX 状态）。

## 8. 弹层与设置壳

- 通用 `.menu`（新建连接菜单：tcp-client/tcp-server/udp；发送历史菜单：最近 N 条，点击填入）+ `.modal`（指令编辑/分组）。
- `SettingsModal`：原型 `SETTINGS_SCHEMA` 5 分类（通用/消息/发送/连接/日志与导出），`renderSettings` 渲染左侧 `.settings-cat` 分类栏 + 右侧 `.set-row`（label/desc/control），`setControlHtml` 支持 switch/seg/select/number，`depends` 禁用。数据存 `ui-store.settings`，保存写 `localStorage['netassist.settings']`，取消回滚快照，恢复默认。**不驱动真实行为**。
- Escape 关闭最上层菜单/弹窗；点击 backdrop 关闭弹窗。

## 9. 数据流与状态

- 保留 `tab-store`（tabs/messages/quickSend/ipc）与全部 IPC 通道；不新增 IPC。
- 新增 `ui-store`（zustand）：`settings`、`toasts`、`sidebar`（collapsed/filter）、`settingsModalOpen` 等 UI 态。
- 全局状态、统计条均为派生数据（纯函数），便于单测。

## 10. 边界条件

- 无标签 → Welcome；无消息 → `.empty-msg`（含 kbd 提示）；搜索无匹配 → `.sb-none`。
- 未连接：配置输入、发送输入禁用；连接中：按钮文案"连接中…"禁用。
- 全局状态：error 优先于 active。
- 消息上限 5000、标签上限 20（toast 提示）；粘贴保留 CR/CRLF；`lfToCr` 转换遵循现有 `normalizeToLf` 语义。
- TCP Server 发送目标：监听中无客户端时仅"广播"项。

## 11. 测试策略

- 既有测试全部保持通过：sendpanel-render（仅断言 CodeMirror `.cm-content`）、CrPreservingEditor、paste-flow、lineEnding、tab-store。
- 新增纯逻辑单测：`deriveGlobalStatus`、侧栏搜索过滤函数、设置壳 localStorage 读写/取消回滚/恢复默认。
- 手动验收（任务 7.3）：欢迎页→新建→收发→分屏→统计→设置壳→搜索→折叠导轨。

## 12. 风险与缓解

| 风险 | 缓解 |
|------|------|
| antd 全量替换量大、样式回归 | 按 tasks 5 批迁移，每批独立运行；既有测试作回归护栏；批次内逐任务 commit |
| 移除拖拽分割条被误认为功能回退 | 已在 proposal/spec 明确对齐原型；brainstorm 已确认 |
| CodeMirror 与 textarea 视觉差异 | CSS 套 `.cmp-input` 外观；行为以 CR 保留为优先 |
| 设置壳不生效可能误导 | spec 明确"不驱动行为"；面板可加注记文案 |
| ws-header 内联配置空间变窄 | 原型 flex-wrap + `.cfg-input.w-70/.w-60` 宽度规范 |
