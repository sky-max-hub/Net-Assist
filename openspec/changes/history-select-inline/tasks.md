## 1. 修改 SendPanel 工具栏

- [x] 1.1 在工具栏 LF→CR 开关右侧添加 Ant Design `Select` 下拉框，placeholder 为「发送历史」
- [x] 1.2 下拉框 options 绑定 `history` 状态，文本超过 30 字符自动截断显示，`title` 显示完整内容
- [x] 1.3 下拉框 `onChange` 时将选中内容填入 TextArea
- [x] 1.4 无历史记录时下拉框 `disabled`

## 2. 简化 handleKeyDown

- [x] 2.1 移除 `ArrowUp`/`ArrowDown` 的键盘事件处理逻辑
- [x] 2.2 移除 `draftInput` 状态及相关恢复逻辑
- [x] 2.3 移除 `historyIndex` 状态及相关导航逻辑
- [x] 2.4 移除"任意键退出历史模式"逻辑
- [x] 2.5 保留 `Ctrl+Enter` / `Meta+Enter` 发送逻辑

## 3. 历史去重

- [x] 3.1 修改 `doSend` 中的 `setHistory` 调用，使用去重插入策略：相同内容移到最前，不重复存储

## 4. 清理

- [x] 4.1 更新 TextArea placeholder 文字，移除「↑↓ 历史」提示
- [x] 4.2 清理未使用的 import（如有）
