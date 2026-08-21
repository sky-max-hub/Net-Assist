# Brainstorm Summary

- Change: ui-refactor-to-prototype
- Date: 2026-08-20

## 确认的技术方案

- 以 `docs/ui/netassist-app.html` 为唯一设计源，渲染层 UI 全部改为手写自定义组件；保留原生窗口边框；设置面板仅外观壳（localStorage 存储、不驱动行为）；保持一个 change；不引入新组件库。
- 设计令牌迁移为 `design/tokens.css`（CSS 自定义属性），组件类名沿用原型（`.sidebar`/`.conn-row`/`.msg-row`/`.btn`/`.cfg-input`/`.switch`/`.menu`/`.modal`/`.composer` 等）。
- 图标用原型 `<symbol>` 手绘线性图标，实现 `components/common/Icons.tsx` 替换 `@ant-design/icons`。
- 布局：AppBar（应用标题+全局状态+设置入口）→ Sidebar（搜索/折叠导轨/连接列表/快捷指令）→ Workspace（ws-header 内联配置/分屏消息/统计条/composer）。
- 保留 CodeMirror CR 保留编辑器、GBK 编码、粘贴保留、Ctrl+Enter/Ctrl+↑↓、快捷指令数据与持久化、连接管理。
- 配置面板移入 ws-header 内联字段；分屏 TX/RX 列表头；统计条挂载；发送历史菜单；chip 立即发送；欢迎页；设置壳；Toast。
- 移除渲染层 antd/@ant-design/icons 依赖。

## 关键取舍与风险

- [决策] 移除当前实现的拖拽分割条（分屏比例/消息区高度），对齐原型固定布局。**状态：已确认**（Step 1c 用户回复"继续"，接受推荐项）。
- [决策] LF→CR 开关保留在发送区工具栏（原型 HTML 未显式展示但 JS 引用 `#lfcr`），作为对原型的必要补全。
- [风险] antd 全量替换工作量大 → 按 5 批迁移、每批独立运行；既有测试（sendpanel/CR/tab-store/lineEnding）作回归护栏。
- [风险] CodeMirror 与原型 textarea 视觉差异 → 通过 CSS 使外观贴近 `.cmp-input`。
- [风险] 设置壳 localStorage 值不生效可能误导 → 已在 spec 明确"不驱动行为"，设置面板内可加注记。
- [风险] 原型消息渲染 `fmtBody` 与现有 `AsciiHighlighter` 差异 → 消息区改用原型 `fmtBody`（`<CR>` `<LF>` `<TAB>` chip + 换行）。

## 测试策略

- 保留既有测试全部通过（sendpanel-render 仅断言 CodeMirror `.cm-content`，antd 无关，不受影响）。
- 新增纯逻辑单测：设置壳 localStorage 读写、侧栏搜索过滤函数、全局状态派生（空闲/活跃/异常）。
- 手动验收（任务 7.3）：欢迎页→新建→收发→分屏→统计→设置壳→搜索→折叠导轨。

## Spec Patch

- 无。现有 6 个 delta spec（ui/welcome、ui/settings、ui/sidebar、ui/shell、multi-tab、quick-send）已覆盖行为需求；拖拽分割条移除、LF→CR 开关位置属实现细节，不改变 spec。
