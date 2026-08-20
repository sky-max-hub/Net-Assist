## Context

已通过 jsdom 实验验证：React 受控 textarea 设置含 CR 的 value 后，DOM 规范化为 LF，但 React state 保持 CR；用户编辑触发 onChange 后，state 被 DOM 的 LF 覆盖。

历史切换路径：`doSend` 存储 `setHistory([textToSend])`（`textToSend = input`，为 state 原始值含 CR），`Ctrl+↑` 时 `setInput(history[newIndex])`。

快捷发送路径：QuickSendPanel `onSend(item.content)` → MainLayout `handleQuickSend(content)`；SendPanel 内快捷标签 `handleQuickTag(item.content)` → `setInput(content)`。

## Goals / Non-Goals

**Goals:**
- 确保 history / 快捷发送内容在 state 层面保留 CR
- 用单元测试固化"粘贴 CR 后发送/切换/快捷发送"行为

**Non-Goals:**
- 不改变 textarea 显示行为（HTML 规范强制 LF 显示，无法也不应修改）
- 不改变 LF→CR 发送选项逻辑

## Decisions

### 1. 内容传递不规范化

历史切换 `setInput(history[i])`、快捷发送 `handleQuickSend(content)`、快捷标签 `handleQuickTag(content)` 均为直接传值，无换行转换。保持现状并确认。

### 2. 用测试固化

新增 `usePreservePaste.test.tsx`，验证：
- 粘贴含 CR 文本后 state 保留 CR
- 模拟 history 切换传递含 CR 内容，state 保留 CR

### 3. 记录固有边界

textarea 显示 LF 与编辑后 onChange 规范化为浏览器固有行为，无法用 onPaste 解决；属于已知约束，在文档中说明。

## Risks / Trade-offs

- **编辑后 CR 丢失** → 浏览器固有行为（onChange 读 DOM LF 值），无法避免；用户可在发送时使用 LF→CR 选项兜底
- 无新增依赖
