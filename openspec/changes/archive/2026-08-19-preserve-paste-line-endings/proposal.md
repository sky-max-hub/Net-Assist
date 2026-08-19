## Why

发送框（SendPanel 的 TextArea）在粘贴内容时，浏览器会默认将粘贴文本中的换行符 `\r\n`/`\r` 规范化为 `\n`。当用户复制的内容包含 CR（回车）换行时，粘贴后格式丢失，导致发送内容与用户复制的原始格式不一致。

## What Changes

- **新增** SendPanel TextArea 的 `onPaste` 事件处理
- 从 `e.clipboardData.getData('text')` 读取剪贴板原始文本（保留 `\r`），按原样插入到光标位置
- `preventDefault()` 阻止浏览器默认的换行规范化行为
- 修复后：用户复制什么，就粘贴什么

## Capabilities

### New Capabilities
无

### Modified Capabilities
无

## Impact

- 仅影响 `src/renderer/src/components/send/SendPanel.tsx` 一个文件
- 不涉及后端、IPC、类型定义
