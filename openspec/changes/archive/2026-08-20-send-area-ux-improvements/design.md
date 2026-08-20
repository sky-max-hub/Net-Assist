## Context

三项独立小变更均属于发送/消息区交互优化，各自通过 tweak/hotfix 流程归档。此处合并设计记录。

## Goals / Non-Goals

**Goals:**
- 发送历史可发现、易用
- 消息面板可快速清空
- 粘贴内容换行格式（CRLF/CR）完整保留

**Non-Goals:**
- 不改变消息数据结构与收发逻辑
- 不改变编码/HEX 显示逻辑

## Decisions

### 1. 发送历史：Select 下拉框（history-select-inline）

- Ant Design `Select` 原生支持 ↑↓/Enter 键盘导航
- 选中 `onChange` 即填入 TextArea
- 历史去重：`setHistory(prev => [textToSend, ...prev.filter(x => x !== textToSend)])`
- 超 30 字符截断显示，`title` 显示完整

### 2. 双击清空：onDoubleClick（dblclick-clear-messages）

- MessageList 直接 `import useTabStore` 调用 `clearMessages(tabId)`，无需 props 回调
- 双击比单击难误触，清空后可继续接收（非破坏性）
- 分屏模式按 direction 过滤清空（后续迭代用 `clearDirectionMessages`）

### 3. 粘贴保留 CR：onPaste（preserve-paste-line-endings）

- `e.clipboardData.getData('text')` 返回剪贴板原始文本（保留 `\r`）
- `e.preventDefault()` 阻止浏览器规范化，按 `selectionStart/End` 手动插入
- `requestAnimationFrame` 恢复光标到插入文本末尾
- 后续抽取 `usePreservePaste` 共享 hook 覆盖多个 TextArea

## Risks / Trade-offs

- **历史条目过长** → 截断 + title 悬停
- **双击误触** → 双击难误触，且清空非破坏性
- **粘贴仅拦截标准粘贴** → 拖拽/程序化粘贴不在范围
