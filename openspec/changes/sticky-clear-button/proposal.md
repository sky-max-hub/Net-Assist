## Why

消息接收界面的"清空消息"按钮位于 `.message-list` 滚动容器内部，随消息列表滚动而消失，不便使用。

## What Changes

- 调整 `MessageList.tsx` 结构：工具栏固定在容器顶部，消息内容在独立滚动区域
- 调整 `MessageList.css`：新增滚动容器样式

## Capabilities

无新增或修改 capability

## Impact

- `MessageList.tsx`、`MessageList.css`
