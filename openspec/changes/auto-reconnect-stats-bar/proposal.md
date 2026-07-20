## Why

TCP 连接异常断开后需手动点重连，不便。缺少收发数据统计，无法直观了解通信状态。

## What Changes

- **自动重连**：TCP Client 断开后自动重试，可设间隔(ms)和最大次数，状态栏显示重连进度
- **统计栏**：底部状态栏实时显示 TX/RX 字节数、速率、连接时长

## Capabilities

### New Capabilities
- `auto-reconnect`: 自动重连机制
- `stats-bar`: 收发统计栏

## Impact

`connection-manager.ts`、`tcp-client-connection.ts`、types、TabContent、新 StatsBar 组件
