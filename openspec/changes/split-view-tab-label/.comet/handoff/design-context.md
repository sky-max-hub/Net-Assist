# Comet Design Handoff

- Change: split-view-tab-label
- Phase: design
- Mode: compact
- Context hash: 7a76abee8ac9f197d8a539dcd39c5e66f22e4970b915790d0b2649b2466d75d1

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/split-view-tab-label/proposal.md

- Source: openspec/changes/split-view-tab-label/proposal.md
- Lines: 1-20
- SHA256: c76fb1896d685051e125304aeb5251ea915f05b5fcc338e10d813d139d0f26e2

```md
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

```

## openspec/changes/split-view-tab-label/design.md

- Source: openspec/changes/split-view-tab-label/design.md
- Lines: 1-20
- SHA256: da2f321c8dda9fc8a6060ec3439e052d1193f71826dfda05cc1aa47f7c65d46e

```md
## Context

TX/RX 消息当前在一个列表中按时间排序混排。Tab 标签用缩写。

## Goals / Non-Goals

**Goals:** 分屏/合并切换、按钮持久化、Tab 完整标签
**Non-Goals:** 不改变消息解码逻辑

## Decisions

### 分屏视图
- `SendOptions` 新增 `splitView: boolean`，默认 `true`
- 分屏模式：两个 MessageList 并排，分别过滤 TX/RX
- 合并模式：单个 MessageList 显示全部
- 切换按钮放在消息区右上角

### Tab 标签
- `defaultTitle` 返回 `TCP_CLIENT` / `TCP_SERVER` / `UDP`
- Tab CSS min-width 加宽

```

## openspec/changes/split-view-tab-label/tasks.md

- Source: openspec/changes/split-view-tab-label/tasks.md
- Lines: 1-20
- SHA256: b49bf0a22c8ae76d347c8e7f51c68c64ed00aed6296d01dd27100fb8eea4ffad

```md
## 1. 数据层

- [ ] 1.1 SendOptions 新增 splitView: boolean（默认 true）
- [ ] 1.2 defaultSendOptions + PersistedTab 同步更新

## 2. 分屏视图

- [ ] 2.1 创建 SplitMessageList 组件（分屏/合并切换逻辑）
- [ ] 2.2 TabContent 集成 SplitMessageList，替代原 MessageList
- [ ] 2.3 切换按钮 + CSS

## 3. Tab 标签

- [ ] 3.1 defaultTitle 改为完整标签 TCP_CLIENT/TCP_SERVER/UDP
- [ ] 3.2 Tab CSS 加宽 min-width

## 4. 验证

- [ ] 4.1 TypeScript 编译 + 构建通过
- [ ] 4.2 手动验证分屏/合并切换、持久化、Tab 标签

```
