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
