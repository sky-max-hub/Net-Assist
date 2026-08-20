## Why

本 change 汇总「发送区与消息区 UX 改进」的三项独立小变更：

1. **发送历史下拉框**（history-select-inline）：原 TextArea `↑`/`↓` 快捷键切换历史不可发现、易误触，改为显式下拉框。
2. **双击清空消息**（dblclick-clear-messages）：消息面板缺少快速清空途径，双击一键清空。
3. **粘贴保留 CRLF/CR**（preserve-paste-line-endings）：浏览器 textarea 将粘贴的 `\r\n`/`\r` 规范化为 `\n`，导致发送内容与复制的原始格式不一致。

## What Changes

### 1. 发送历史下拉框（history-select-inline）

- 移除 TextArea `↑`/`↓` 历史切换快捷键逻辑（`draftInput`/`historyIndex` 一并移除）
- 工具栏新增「发送历史」下拉框（Ant Design `Select`，位于 LF→CR 右侧）
- 发送历史去重（相同内容移到最前不重复）

> **说明**：该变更最终被回退（回退提交 5558f4a0），保留 TextArea `↑`/`↓` 历史切换（后改为 Ctrl+↑↓）。此处仅保留设计记录。

### 2. 双击清空消息（dblclick-clear-messages）

- MessageList 新增 `onDoubleClick` 事件，调用已有 `clearMessages(tabId)` 一键清空当前标签消息
- 分屏模式下双击 TX/RX 面板仅清空对应方向（后续迭代）

### 3. 粘贴保留 CRLF/CR（preserve-paste-line-endings）

- SendPanel TextArea 新增 `onPaste` 处理：从 `clipboardData.getData('text')` 读取原始文本（保留 `\r`），`preventDefault()` 阻止浏览器规范化，按光标位置原样插入
- 后续扩展为共享 hook `usePreservePaste`，覆盖快捷指令内容框

## Capabilities

### New Capabilities
无

### Modified Capabilities
无

## Impact

- 涉及 `SendPanel.tsx`、`MessageList.tsx`、`TabContent.tsx`、`QuickSendPanel.tsx`
- 不涉及后端 IPC、类型定义、状态管理
