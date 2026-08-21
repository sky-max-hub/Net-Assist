# Comet Design Handoff

- Change: ui-refactor-to-prototype
- Phase: design
- Mode: compact
- Context hash: a3222b5dbdd3953c7dea022f6fe3d6c4acace8d19816f6cb1f7bf61d7beddaaa

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/ui-refactor-to-prototype/proposal.md

- Source: openspec/changes/ui-refactor-to-prototype/proposal.md
- Lines: 1-40
- SHA256: 62cb6ac1e390e08bf8b1e828c6b9865438cb306aa131a515784ae196ef95e072

```md
## Why

当前渲染层 UI 基于 Ant Design 5 构建，视觉语言与交互习惯与目标产品形态（Apple 风格的精密网络调试工作台）差距明显。`docs/ui/netassist-app.html` 已沉淀出一套自洽完整的 Apple 设计系统与交互原型（设计令牌、自定义 SVG 图标、布局、弹层、设置、toast 等）。本次将整个渲染层 UI 按该原型重构，使样式与交互统一对齐原型，同时保持底层网络 / 编码 / 持久化 / IPC 逻辑完全不变。

## What Changes

- 引入 Apple 风格设计令牌（`#0071e3` 蓝、SF Pro / 苹方字体、白×浅灰节奏、克制动效、圆角与投影规范），渲染层 UI 组件全部改为手写自定义实现，移除 antd / @ant-design/icons 依赖。
- 顶部应用标题栏：应用标题 + 全局状态指示（空闲 / N 个连接活跃 / N 个连接异常）+ 设置入口。保留原生窗口边框，不做无边框红绿灯标题栏。
- 无连接时显示欢迎引导页：TCP Client / TCP Server / UDP 三张模式卡片 + 快捷键提示。
- 侧栏连接列表：状态点、类型胶囊（TC/TS/UD）、悬停关闭、双击重命名、拖拽排序、搜索过滤、折叠为图标导轨（带悬浮提示）、宽度拖拽。
- 快捷指令：分组可折叠列表（计数、hover 发送/编辑/删除、新增分组/新增指令）、发送历史菜单、chip 立即发送。
- 工作区头部：内联配置字段（按类型区分）+ 消息数 + 状态胶囊 + 连接/断开按钮 + 分屏切换。
- 消息区：合并/分屏 TX/RX 视图（列表头含清空），消息项含时间/方向/远端/字节数/复制按钮/ASCII 控制符可视化（`<CR>` `<LF>` `<TAB>`），双击清空。
- 统计条挂载：发送/接收字节、发送/接收速率、消息数、会话时长。
- 发送区：编码分段（ASCII/UTF-8/GBK）、TXT/HEX 分段、发送历史按钮、ASCII 提示、chip 行、提示行（快捷键与编码提示）；保留 CodeMirror CR 保留编辑器与粘贴保留、Ctrl+Enter / Ctrl+↑↓。
- 设置弹窗（5 分类）外观壳：按原型绘制并与原型一致的控件（switch/seg/select/number），值存入 localStorage，但不驱动真实行为。
- 菜单 / 弹窗 / Toast / 空状态统一为原型样式。
- 空状态：无连接、无消息、无匹配指令的占位提示。

## Capabilities

### New Capabilities

- `ui/welcome`: 无连接时的欢迎引导页（三模式卡片 + 快捷键提示）
- `ui/settings`: 设置弹窗外观壳（5 分类、localStorage 存储、不驱动行为）
- `ui/sidebar`: 侧栏搜索过滤与折叠为图标导轨
- `ui/shell`: 顶部应用标题栏、全局状态指示、toast 提示

### Modified Capabilities

- `multi-tab`: 连接列表视觉与交互对齐原型（类型胶囊、状态点、悬停关闭、搜索过滤、折叠导轨）
- `quick-send`: 快捷指令分组折叠列表 + chip 立即发送

## Impact

- 渲染层组件：`src/renderer/src/` 下 App、MainLayout、TabBar、TabContent、MessageList、MessageItem、SendPanel、QuickSendPanel、config/*、StatsBar、common/* 全部按原型重构。
- 样式：新增设计令牌 CSS 与各组件样式重写，移除 antd 组件与图标在渲染层的使用。
- 依赖：渲染层移除 antd、@ant-design/icons（package.json 按需处理）。
- 不改动：`src/main/`（连接管理、编码、持久化、IPC）、`src/preload/`、`src/shared/` 类型与通道定义（除非 UI 需新增只读能力）。
- 保留：CodeMirror CR 保留编辑器、GBK 编码链路、粘贴保留、Ctrl+↑↓ 发送历史、快捷指令数据、标签与快捷指令持久化。

```

## openspec/changes/ui-refactor-to-prototype/design.md

- Source: openspec/changes/ui-refactor-to-prototype/design.md
- Lines: 1-78
- SHA256: 40163196fc0809aeae0b33ede474733356a9f4366fc158d4a0269d55f4d4a348

```md
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

```

## openspec/changes/ui-refactor-to-prototype/tasks.md

- Source: openspec/changes/ui-refactor-to-prototype/tasks.md
- Lines: 1-44
- SHA256: e51607408684921b09837828e7be92962c775419fd199fbb23d7ef46c73fc5fc

```md
## 1. 设计系统基础

- [ ] 1.1 从原型 `:root` 迁移设计令牌为 `src/renderer/src/design/tokens.css`（颜色/字体栈/圆角/投影/动效/滚动条/focus），挂载到渲染层全局入口
- [ ] 1.2 实现 `components/common/Icons.tsx`（原型 `#i-*` 全部线性图标），替换渲染层 `@ant-design/icons` 使用点
- [ ] 1.3 重建全局基元样式（.btn/.cfg-input/.cfg-select/.switch/.seg/.chip 等，以原型 CSS 为源）

## 2. 应用外壳

- [ ] 2.1 实现 AppBar 组件：应用标题（NetAssist · 网络调试助手）+ 全局状态胶囊（空闲/N 个活跃/N 个异常）+ 设置入口（保留原生边框）
- [ ] 2.2 实现 Welcome 欢迎页（TCP Client / TCP Server / UDP 三模式卡片 + 快捷键提示），无标签时显示、新建后退出
- [ ] 2.3 实现 Toast 提示组件（底部居中、1.8s 自动消失）并接入操作触发点

## 3. 侧边栏

- [ ] 3.1 侧栏搜索框 + 过滤逻辑（连接按标题/类型，指令按名称/内容；无匹配占位）
- [ ] 3.2 连接列表按原型重写（状态点/类型胶囊/悬停关闭/双击重命名/拖拽排序）
- [ ] 3.3 折叠为图标导轨 + 悬浮提示（rail-conn/rail-tip，小屏 920px 自动折叠）
- [ ] 3.4 快捷指令分组可折叠列表（cmd-group-head 含计数、cmd-row hover 发送/编辑/删除、新增分组/指令）

## 4. 工作区

- [ ] 4.1 ws-header：类型图标 + 标题 + 消息数 + 内联配置字段（TCP Client=主机+端口、TCP Server=监听端口+发送目标、UDP=本地端口+目标）+ 状态胶囊 + 连接/断开 + 分屏切换
- [ ] 4.2 消息区分屏 TX/RX 视图 + 列表头（label+count+清空），合并/分屏切换，双击清空
- [ ] 4.3 消息项按原型重写（时间/方向/远端/字节数/复制按钮/`<CR>` `<LF>` `<TAB>` 控制符可视化）
- [ ] 4.4 统计条挂载到工作区（发送/接收/速率/消息数/会话时长）

## 5. 发送区

- [ ] 5.1 编码分段（ASCII/UTF-8/GBK）+ HEX 分段（TXT/HEX）+ LF→CR 开关（原型 seg/switch）
- [ ] 5.2 发送历史菜单（下拉列表，点击填入输入框），保留 Ctrl+↑↓ 历史切换
- [ ] 5.3 chips 行（快捷指令标签 + 立即发送图标）
- [ ] 5.4 发送输入区 + ascii-hint + 提示行（保留 CodeMirror CR 保留编辑器与粘贴保留）

## 6. 弹层与设置壳

- [ ] 6.1 菜单（新建连接/发送历史）与指令编辑/分组弹窗按原型实现
- [ ] 6.2 设置壳：5 分类设置弹窗（SETTINGS_SCHEMA 从原型拷贝），localStorage 存储、不驱动行为，支持取消回滚/恢复默认/依赖禁用
- [ ] 6.3 Escape 关闭菜单/弹窗；小屏（920px）响应式布局

## 7. 清理与验证

- [ ] 7.1 移除渲染层全部 antd/@ant-design/icons 使用，从 package.json 移除依赖
- [ ] 7.2 运行全部测试（vitest），确保 sendpanel/CR 保留/tab-store 等既有测试通过
- [ ] 7.3 手动验证核心验收场景：欢迎页→新建→收发→分屏→统计→设置壳→搜索→折叠导轨

```

## openspec/changes/ui-refactor-to-prototype/specs/multi-tab/spec.md

- Source: openspec/changes/ui-refactor-to-prototype/specs/multi-tab/spec.md
- Lines: 1-36
- SHA256: d49942d6c9803b3af2e67c4247a575b2306fed69c3e5eb9105966c507b1fa377

```md
## MODIFIED Requirements

### Requirement: 多 Tab 管理
系统 SHALL 支持多 Tab 同时运行，每个 Tab 独立管理一个 TCP Client、TCP Server 或 UDP 连接。连接列表按原型展示：状态点、类型胶囊（TC/TS/UD）、标题；支持搜索过滤、折叠为图标导轨、拖拽排序、双击重命名、悬停关闭。

#### Scenario: 新建 Tab
- **WHEN** 用户点击"新建连接"按钮并选择连接类型（TCP Client / TCP Server / UDP）
- **THEN** 系统创建一个新 Tab，显示对应类型的配置界面

#### Scenario: Tab 切换
- **WHEN** 用户点击不同的 Tab 标签
- **THEN** 系统切换到该 Tab 的界面，显示其状态和消息记录

#### Scenario: 关闭 Tab
- **WHEN** 用户点击 Tab 的关闭按钮（悬停显示）
- **THEN** 系统关闭该 Tab 并释放其网络资源（断开连接/停止监听/关闭绑定）

#### Scenario: 多 Tab 独立运行
- **WHEN** 用户同时运行 TCP Server Tab（监听 8888）、TCP Client Tab（连接 8888）和 UDP Tab
- **THEN** 三个 Tab 互不干扰，各自独立收发数据

#### Scenario: Tab 标题自定义
- **WHEN** 用户双击 Tab 标题
- **THEN** 系统允许编辑标题，回车或失焦后保存

#### Scenario: 拖拽排序
- **WHEN** 用户拖拽 Tab 到新位置
- **THEN** 连接顺序更新并持久化，重启后保留

#### Scenario: 搜索过滤连接
- **WHEN** 用户在侧栏搜索框输入关键词
- **THEN** 连接列表仅显示标题或类型匹配的连接

#### Scenario: 折叠为图标导轨
- **WHEN** 用户点击折叠按钮
- **THEN** 侧栏收窄为图标导轨，悬停图标显示连接名称、状态与远端提示

```

## openspec/changes/ui-refactor-to-prototype/specs/quick-send/spec.md

- Source: openspec/changes/ui-refactor-to-prototype/specs/quick-send/spec.md
- Lines: 1-32
- SHA256: cc8e40c3fe1ff5dd1263e950d266d21ffc0bcd3b3501295b4929f420d78bb2d9

```md
## MODIFIED Requirements

### Requirement: 快捷发送
系统 SHALL 支持用户预设常用指令列表，一键发送。指令按分组展示为可折叠列表，并以 chip 形式在发送区提供立即发送；发送历史以菜单形式展示。

#### Scenario: 添加快捷指令
- **WHEN** 用户在快捷指令面板点击"新增指令"并输入名称与内容
- **THEN** 系统保存该指令到对应分组

#### Scenario: 使用快捷指令发送
- **WHEN** 用户在快捷指令列表点击某条指令
- **THEN** 系统将该指令内容填入发送区并发送

#### Scenario: 编辑快捷指令
- **WHEN** 用户编辑已有的快捷指令名称或内容
- **THEN** 系统更新该指令

#### Scenario: 删除快捷指令
- **WHEN** 用户删除一条快捷指令
- **THEN** 系统从列表中移除该指令

#### Scenario: 分组折叠
- **WHEN** 用户点击分组头
- **THEN** 该分组在展开与折叠间切换，并显示组内指令条数

#### Scenario: Chip 立即发送
- **WHEN** 用户在发送区 chip 行点击某指令的发送图标
- **THEN** 系统立即发送该指令内容，无需先填入输入框

#### Scenario: 发送历史菜单
- **WHEN** 用户点击发送历史按钮
- **THEN** 弹出历史列表菜单，点击某项将其填入输入框

```
