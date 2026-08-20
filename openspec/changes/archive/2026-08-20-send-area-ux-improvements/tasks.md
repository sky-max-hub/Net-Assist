## 1. 发送历史下拉框（history-select-inline）

- [x] 1.1 工具栏 LF→CR 开关右侧添加 Ant Design `Select` 下拉框，placeholder「发送历史」
- [x] 1.2 options 绑定 `history`，超 30 字符截断，`title` 显示完整
- [x] 1.3 `onChange` 选中内容填入 TextArea
- [x] 1.4 无历史时下拉框 `disabled`
- [x] 1.5 简化 handleKeyDown（移除 ↑↓ 导航、draftInput、historyIndex）
- [x] 1.6 保留 Ctrl+Enter / Meta+Enter 发送
- [x] 1.7 历史去重插入
- [x] 1.8 更新 placeholder、清理 import

## 2. 双击清空消息（dblclick-clear-messages）

- [x] 2.1 MessageList 启用 `tabId` 参数
- [x] 2.2 导入 `useTabStore`，获取 `clearMessages`
- [x] 2.3 `.message-list` 添加 `onDoubleClick` → `clearMessages(tabId)`
- [x] 2.4 仅 `messages.length > 0` 时响应
- [x] 2.5 分屏模式按 direction 过滤清空（TX/RX 各自）

## 3. 粘贴保留 CR（preserve-paste-line-endings）

- [x] 3.1 SendPanel TextArea 新增 `handlePaste`：`clipboardData.getData('text')` + `preventDefault` + 光标插入
- [x] 3.2 绑定 `onPaste`，插入后恢复光标
- [x] 3.3 验证复制含 `\r` 换行粘贴后内容保持 `\r`

## 4. 验证

- [x] 4.1 三个变更均通过构建与测试
- [x] 4.2 验证报告合并（见 `docs/superpowers/reports/2026-08-20-send-area-ux-improvements-verify.md`）
