## Why

快捷指令（QuickSendPanel）的内容输入框缺少 `onPaste` 换行保留处理。用户将含 `\r`（CR）换行的内容粘贴到快捷指令内容时，浏览器将 `\r\n`/`\r` 规范化为 `\n`，保存后从快捷指令发送时 CR 丢失。之前的修复只覆盖了发送框（SendPanel），未覆盖快捷指令内容框。

## What Changes

- **新增** 共享 hook `usePreservePaste`：拦截 `onPaste`，从 `clipboardData.getData('text')` 读取原始文本，`preventDefault()` 阻止浏览器规范化，按光标位置原样插入
- **修改** QuickSendPanel 内容输入框使用该 hook，修复快捷指令粘贴 CR 丢失
- **重构** SendPanel 改用同一 hook，消除重复实现

## Capabilities

### New Capabilities
无

### Modified Capabilities
无

## Impact

- `src/renderer/src/hooks/usePreservePaste.ts`：新增共享 hook
- `src/renderer/src/components/quick-send/QuickSendPanel.tsx`：内容 TextArea 绑定 onPaste
- `src/renderer/src/components/send/SendPanel.tsx`：改用共享 hook（行为不变）
