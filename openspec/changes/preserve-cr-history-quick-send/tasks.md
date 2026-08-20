## 1. 审查并确认内容传递路径

- [x] 1.1 审查 SendPanel 历史切换 `setInput(history[i])`，确认不做换行规范化
- [x] 1.2 审查 MainLayout `handleQuickSend` 与 QuickSendPanel `onSend`，确认内容原样传递
- [x] 1.3 审查 SendPanel 快捷标签 `handleQuickTag`，确认内容原样传递

## 2. 新增单元测试

- [x] 2.1 新建 `src/renderer/src/hooks/__tests__/usePreservePaste.test.tsx`：验证粘贴含 CR 文本后 state 保留 CR
- [x] 2.2 测试模拟 history 切换传递含 CR 内容，state 保留 CR

## 3. 验证

- [x] 3.1 运行全部测试通过
- [x] 3.2 构建通过
