## 自动重连
- TCP Client `close` 事件触发重连逻辑
- 配置项：`reconnectInterval`(ms, 默认 3000) + `reconnectMaxRetries`(默认 0=不限)
- 状态显示：`connecting (retry 2/5)`
- 用户手动断开时不触发重连

## 统计栏
- TabState 新增 `stats: { txBytes, rxBytes, connectedAt }`
- emitData 时更新统计
- StatsBar 组件显示：TX 12.3KB | RX 8.1KB | 速率 1.2KB/s | 时长 00:05:32
- 每秒更新速率显示（setInterval）
