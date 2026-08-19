## 1. 修复 SendPanel 粘贴行为

- [x] 1.1 引入 `useRef`，为 TextArea 添加 ref 以访问底层 textarea 的 selectionStart/selectionEnd
- [x] 1.2 新增 `handlePaste` 回调：从 `e.clipboardData.getData('text')` 读取原始文本，`preventDefault()` 阻止默认规范化，按光标位置插入原始文本
- [x] 1.3 在 TextArea 上绑定 `onPaste={handlePaste}`，并在插入后恢复光标位置
- [x] 1.4 验证：复制含 `\r` 换行的文本粘贴到发送框，内容保持 `\r` 不变
