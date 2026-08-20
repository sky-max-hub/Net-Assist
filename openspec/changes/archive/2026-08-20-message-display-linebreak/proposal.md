## Why

当前消息显示框中，每条消息的元信息（时间、方向、远端地址、字节数）与消息内容连在一行显示，长内容难以阅读，头部与内容界限不清。需要将元信息与内容分为两行，提升可读性。

## What Changes

- **修改** `MessageItem` 组件布局：元信息行 `[时间]→远端(字节数)` 单独一行，消息内容换行后显示在下一行
- 显示格式：`[08:55:52.629]→127.0.0.1:2001(438 bytes)` + 换行 + 消息具体内容
- TX/RX 消息均采用此格式

## Capabilities

### New Capabilities
无

### Modified Capabilities
无

## Impact

- 仅影响 `src/renderer/src/components/messages/MessageItem.tsx` 及其样式 `MessageList.css`
- 不影响消息数据结构、发送/接收逻辑
