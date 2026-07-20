# Comet Design Handoff

- Change: auto-reconnect-stats-bar
- Phase: design
- Mode: compact
- Context hash: 753ac644ddcb43b3493c04fead3c280e5f68d81f857a4cb6601c16a46aac4b40

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/auto-reconnect-stats-bar/proposal.md

- Source: openspec/changes/auto-reconnect-stats-bar/proposal.md
- Lines: 1-18
- SHA256: b9ffd5a7c17f1de0668e96362df3913203cf59d59e1d095dd0e3f6c4ec20ec87

```md
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

```

## openspec/changes/auto-reconnect-stats-bar/design.md

- Source: openspec/changes/auto-reconnect-stats-bar/design.md
- Lines: 1-11
- SHA256: e361e32f4231ebcc3f007ddb008022eb09757411e17f6af137819bac82a65abb

```md
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

```

## openspec/changes/auto-reconnect-stats-bar/tasks.md

- Source: openspec/changes/auto-reconnect-stats-bar/tasks.md
- Lines: 1-12
- SHA256: 684c15d5c936eaf4c3bf20536e7ef43f1d0673e96a8b7d98318ccf625c1ec072

```md
## 1. 自动重连
- [ ] 1.1 TcpClientConnection 新增重连配置和逻辑
- [ ] 1.2 TcpClientConfig 面板新增重连设置 UI
- [ ] 1.3 手动断开 vs 异常断开的区分

## 2. 统计栏
- [ ] 2.1 TabState 新增 stats 字段 + store 更新方法
- [ ] 2.2 connection-manager emitData 时统计字节
- [ ] 2.3 StatsBar 组件 + 每秒刷新速率

## 3. 验证
- [ ] 3.1 TypeScript 编译 + 构建通过

```
