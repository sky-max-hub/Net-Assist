## Context

当前渲染层 UI 基于 antd 5 构建，视觉与交互与目标原型（`docs/ui/netassist-app.html`，Apple 风格精密工作台）差距明显。原型是一份自洽完整的静态 HTML：包含设计令牌、自定义 SVG 图标、全部布局与交互。本次以原型为唯一设计源，将 `src/renderer/` 全部 UI 重构为手写自定义组件。底层网络/编码/持久化/IPC（`src/main/`、`src/preload/`、`src/shared/`）保持不变。动机见 proposal.md - Why；行为约束见各 capability spec。

## Goals / Non-Goals

**Goals:**
- 像素级对齐原型：设计令牌（`#0071e3` 蓝、白×浅灰节奏、圆角/投影/动效）、字体栈（SF Pro → PingFang SC / Microsoft YaHei）、自定义 SVG 图标、全部交互（侧栏搜索/折叠导轨、工作区头部内联配置、分屏 TX/RX、统计条、发送历史菜单、chip、欢迎页、设置壳、Toast）。
- 渲染层组件全部手写，移除 antd / @ant-design/icons 依赖。
- 保留全部真实功能：CodeMirror CR 保留编辑器、GBK 编码链路、粘贴保留、Ctrl+Enter / Ctrl+↑↓、快捷指令数据与持久化、连接管理。
- 保留原生窗口边框（不做无边框红绿灯标题栏）。

**Non-Goals:**
- 不改 `src/main/` 逻辑（除非 UI 需要只读新能力，本设计不涉及）。
- 不引入新的第三方组件库。
- 设置面板不驱动真实功能（仅外观壳 + localStorage 存储）。
- 不实现原型中不存在的行为。

## Decisions

### D1. 设计令牌与样式组织
将原型的 `:root` 令牌提取为共享 CSS 文件 `design/tokens.css`（CSS 自定义属性），所有组件样式统一引用 `var(--accent)` / `var(--surface)` 等。组件样式沿用原型类名（`.sidebar`、`.conn-row`、`.msg-row`、`.btn`、`.cfg-input`、`.switch`、`.menu`、`.modal`、`.composer` 等），从原型 CSS 原样迁移并按组件拆分文件。
- 备选：antd 主题定制 → 无法像素级贴合，否决。

### D2. 图标系统
用原型 `<symbol>` 定义的手绘线性图标作为唯一图标源。新建 `components/common/Icons.tsx`，导出 `Icon({name})` 组件（内联 `<svg><use>` 指向一个隐藏的 SVG defs 容器，或直接渲染 path），替换 `@ant-design/icons` 的全部使用点。图标名与原型 `#i-*` 一一对应（`i-network`/`i-client`/`i-server`/`i-udp`/`i-plus`/`i-chevron`/`i-copy`/`i-send`/`i-split`/`i-history`/`i-search`/`i-sliders`/`i-pencil`/`i-trash`/`i-folder`/`i-play`/`i-check`/`i-x`/`i-arrow-right`/`i-chevron-left` 等）。

### D3. antd 组件替换
按原型 DOM/CSS 手写原型中出现的基础件，替换 antd 使用点：
- Button → `.btn`（primary/dark/danger/secondary/ghost/sm）；Toggle → `.switch`；Input/Select/Number → `.cfg-input`/`.cfg-select`；Modal → `.modal`/`.modal-backdrop`；Menu/Dropdown → `.menu`/`.menu-item`；Tree/分组 → `.cmd-groups`/`.cmd-group-head`/`.cmd-list`/`.cmd-row`；Empty → `.empty-msg`/`.sb-none`；Tooltip → 自定义悬浮提示（`.rail-tip` 等）；Popconfirm → 确认弹层。
- CodeMirror 编辑器（`CrPreservingEditor`）与 `lineEnding`/`AsciiHighlighter` 保留，但消息/输入区的控制符可视化改为原型 `fmtBody` 渲染（`<CR>` `<LF>` `<TAB>` 彩色 chip + 换行）。
- 全部替换完成后从 `package.json` 移除 antd 与 @ant-design/icons。

### D4. 布局重构
```
AppBar（应用标题 + 全局状态胶囊 + 设置按钮）——原生边框，非红绿灯
└─ MainLayout
   ├─ Sidebar（搜索 + 折叠按钮 + 连接列表 + 快捷指令分组 + 底部版本号）
   │    ├─ 展开态：完整列表；折叠态：图标导轨（rail-conn + rail-tip）
   ├─ Workspace
   │    ├─ 无标签：Welcome（三模式卡片 + 快捷键提示）
   │    └─ 有标签：ws-header（类型图标 + 标题 + 消息数 + 内联配置字段 + 状态胶囊 + 连接/断开 + 分屏）
   │              msg-area（合并/分屏 TX/RX 列表头 + 消息项）
   │              stats（发送/接收/速率/消息数/会话时长）
   │              composer（编码 seg + HEX seg + 发送历史 + ascii-hint + 发送 + chips + 提示行）
```
- 配置面板从独立区块**移入 ws-header 内联**（原型行为）：TCP Client=主机+端口，TCP Server=监听端口+发送目标，UDP=本地端口+目标主机+目标端口。
- `TabBar` 对应原型"连接列表"，`QuickSendPanel` 对应原型"快捷指令"，均按原型类名重写。

### D5. 状态管理
- 保留 `tab-store`（Zustand）管理标签/连接/消息/快捷指令，IPC 桥不变。
- 新增 UI 状态：侧栏宽度/折叠态、搜索词（`MainLayout`/`Sidebar` 本地 state）；设置壳数据（独立 `settings-store` 或组件内，localStorage 持久化，key 沿用原型 `netassist.settings`）。全局状态指示与统计条数据从现有 store/IPC 状态派生，不新增 IPC。

### D6. 弹层与反馈
- 菜单（新建连接/发送历史）、指令编辑/分组 Modal、Toast 均按原型实现；`Escape` 关闭菜单/弹窗；Toast 底部居中 1.8s 自动消失。
- 新建连接菜单、chip 立即发送、发送历史菜单、双击消息区清空、侧栏宽度拖拽等交互按原型实现。

## Risks / Trade-offs

- [antd 全量替换工作量大、样式回归风险] → 按 D4 的分区拆分为任务，每个任务可独立运行验证；测试覆盖发送面板渲染等关键路径。
- [CodeMirror 与原型 textarea 视觉差异] → 保留 CodeMirror 以满足 CR 保留这一既有行为要求（spec 依赖）；通过 CSS 使其外观贴近 `.cmp-input`。
- [设置壳 localStorage 值可能误导用户以为生效] → 设置面板内注明"外观壳"或在设计评审中确认文案；spec 已明确不驱动行为。
- [原型内联配置移入 ws-header 导致空间变窄] → 沿用原型 flex-wrap 与 `.cfg-input.w-70`/`.w-60` 宽度规范，必要时横向滚动。

## Migration Plan

按任务分批落地，每批可独立运行：
1. 设计令牌 + 图标集 + AppBar + Welcome + 布局骨架（含空状态）
2. 侧栏（搜索/折叠/连接列表/快捷指令分组）
3. 工作区头部内联配置 + 消息区（分屏/消息项/统计条挂载）
4. 发送区（编码/HEX/历史菜单/chip/提示行）
5. 弹层（菜单/弹窗/设置壳/Toast）+ antd 清理与依赖移除

回滚策略：单次 git revert 即可回退整个 change；各任务独立 commit，便于部分回退。行为测试（发送面板渲染、CR 保留、tab-store）保持通过作为回归护栏。

## Open Questions

- 无会改变 spec/任务的待决问题。设置壳的精确设置项列表以原型 `SETTINGS_SCHEMA` 为准，可在实现期直接拷贝。
