## 1. 修改 MessageList 组件

- [x] 1.1 取消 `tabId` 参数的 `_` 前缀，使其被实际使用
- [x] 1.2 导入 `useTabStore`，获取 `clearMessages` 方法
- [x] 1.3 在 `.message-list` 容器上添加 `onDoubleClick` 处理，调用 `clearMessages(tabId)`
- [x] 1.4 仅在 `messages.length > 0` 时响应双击（无消息时跳过，避免无效调用）
