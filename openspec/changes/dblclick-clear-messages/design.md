## Context

`clearMessages(tabId)` 方法已存在于 `useTabStore` 中，但消息面板未暴露清空入口。MessageList 当前接收 `tabId` 但未使用（`tabId: _tabId`）。

## Goals / Non-Goals

**Goals:**
- 双击 `.message-list` 容器时调用 `clearMessages(tabId)`

**Non-Goals:**
- 不增加确认弹窗
- 不增加清空按钮

## Decisions

### 1. 直接在 MessageList 中调用 store

MessageList 直接 `import { useTabStore }` 调用 `clearMessages`，无需通过 props 传递回调。简洁直接，与 SendPanel 等组件使用 store 的方式一致。

### 2. 使用 `onDoubleClick` 事件

React 原生 `onDoubleClick` 事件，无需自定义键盘处理。

## Risks / Trade-offs

- **误触风险** → 双击比单击难误触，且仅对已连接/监听状态下的标签有实际消息，清空后可继续接收（非破坏性操作）
