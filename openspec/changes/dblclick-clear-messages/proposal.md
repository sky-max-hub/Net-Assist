## Why

当前消息面板没有快速清空消息的途径，用户需要手动切换标签或等待新消息覆盖旧消息才能清理接收区域。新增双击清空快捷键，提升操作效率。

## What Changes

- **新增** MessageList 组件 `onDoubleClick` 事件处理，调用已有的 `clearMessages(tabId)` 一键清空当前标签消息

## Capabilities

### New Capabilities
无

### Modified Capabilities
无

## Impact

- 仅影响 `src/renderer/src/components/messages/MessageList.tsx` 一个文件
- 使用已有的 `useTabStore.clearMessages` 方法，不修改 store
