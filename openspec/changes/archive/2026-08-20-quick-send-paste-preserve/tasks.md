## 1. 抽取共享 hook

- [x] 1.1 新建 `src/renderer/src/hooks/usePreservePaste.ts`：导出 `usePreservePaste(setValue)`，返回 onPaste 处理器

## 2. QuickSendPanel 接入

- [x] 2.1 QuickSendPanel 内容 TextArea 绑定 `onPaste`，粘贴保留 CR

## 3. SendPanel 重构

- [x] 3.1 SendPanel 改用 `usePreservePaste`，移除内联 `handlePaste`

## 4. 验证

- [x] 4.1 验证快捷指令粘贴含 CR 内容后保存发送，CR 保留
- [x] 4.2 验证发送框粘贴行为与之前一致
