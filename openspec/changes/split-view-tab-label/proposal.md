## Why

消息列表 TX/RX 混排不利于对比分析收发数据。Tab 标签缩写（如 CLI）不够直观。需增加分屏视图切换和完整标签展示。

## What Changes

- **消息分屏切换**：消息区右上角新增切换按钮，分开展示（TX 左/RX 右）和合并展示（时间排序混排），默认分屏。`splitView: boolean` 保存到 `SendOptions` 持久化
- **Tab 标签优化**：Tab 项加宽，标签显示 `TCP_CLIENT` / `TCP_SERVER` / `UDP`

## Capabilities

### New Capabilities
- `split-message-view`: TX/RX 消息分屏/合并切换

### Modified Capabilities
无

## Impact

- `SendOptions` + `SplitView` 组件 + `MessageList` 布局 + `TabBar` 样式
