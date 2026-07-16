## Why

TCP 发送一次报文，消息列表显示 3 条相同记录（相同时间戳相同内容）。发送时途径 2 条记录（callback 误标 rx + connection-manager 正确的 tx），加上服务器 echo 回的数据共 3 条。

**根因**：`TcpClientConnection.send()` 和 `TcpServerConnection.send()` 内部调用了 `callbacks.onData()`，而 `connection-manager.send()` 已经显式 `emitData({direction: 'tx'})`，导致每条发送产生两次记录。

## What Changes

- 移除 `tcp-client-connection.ts` 中 `send()` 的 `callbacks.onData()` 调用
- 移除 `tcp-server-connection.ts` 中 `send()` 的 `callbacks.onData()` 调用

## Impact

- `src/main/connections/tcp-client-connection.ts`
- `src/main/connections/tcp-server-connection.ts`
