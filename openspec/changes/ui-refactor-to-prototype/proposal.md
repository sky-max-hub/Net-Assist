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
