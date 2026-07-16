# Brainstorm Summary
- Change: split-view-tab-label
- Date: 2026-07-16

## 确认的技术方案
- splitView: boolean 加入 SendOptions，默认 true，持久化
- 分屏：两个 MessageList 并排，分别 filter TX/RX
- 合并：单个 MessageList 显示全部消息
- 切换按钮：消息区右上角 antd Button
- Tab 标签：TCP_CLIENT/TCP_SERVER/UDP + CSS min-width 加宽

## 关键取舍与风险
- 分屏时 TX/RX 各占 50% 宽度，各自独立滚动

## 测试策略
- 手动验证

## Spec Patch
无
