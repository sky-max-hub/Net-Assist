## Context

`connection-manager.send()` 调用 `tcpClient.send()` 后已通过 `emitData` 正确记录 'tx' 消息。但 `TcpClientConnection.send()` 内部额外调用 `callbacks.onData()` 产生一条 'rx' 假消息。同理 server 端也存在此问题。

## Fix

移除两个 Connection 类 `send()` 方法中的 `callbacks.onData()` 调用，发送行为的数据记录统一由 `connection-manager.send()` 负责。
