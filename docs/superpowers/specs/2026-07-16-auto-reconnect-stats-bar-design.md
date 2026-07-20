---
comet_change: auto-reconnect-stats-bar
role: technical-design
canonical_spec: openspec
---

# 自动重连 + 统计栏 — 技术设计

## 1. 自动重连
- `TcpClientConfig` 新增 `reconnectInterval`(ms) + `reconnectMaxRetries`
- `TcpClientConnection` 在 `socket.on('close')` 时检查是否手动断开，否则启动重连定时器
- 状态显示 `retrying (2/5)`

## 2. 统计栏
- `TabState.stats: { txBytes, rxBytes, connectedAt }`
- `connection-manager` emitData 时累加字节
- `StatsBar` 组件底部显示，每秒刷新
