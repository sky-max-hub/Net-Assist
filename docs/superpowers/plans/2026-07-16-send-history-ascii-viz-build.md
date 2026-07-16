---
change: send-history-ascii-viz
design-doc: docs/superpowers/specs/2026-07-16-send-history-ascii-viz-design.md
base-ref: d6402036f31b46f018b8109746cb1bb047b8bb11
---

# 发送框增强 — 实施计划

## 1. ASCII 可视化

- [x] 1.1 创建 `AsciiHighlighter.tsx`：highlightAscii() + countControlChars()
- [x] 1.2 在 MessageItem.tsx 中集成 ASCII 可视化
- [x] 1.3 添加 ascii-ctrl CSS 样式到 MessageList.css

## 2. 命令历史 + 高度

- [x] 2.1 在 SendPanel.tsx 添加 history/historyIndex/draftInput 状态
- [x] 2.2 方向键 ↑↓ 处理 + 草稿保存逻辑
- [x] 2.3 发送成功后写入历史
- [x] 2.4 修改 rows 3 → 6
- [x] 2.5 添加 ASCII 控制字符预览行

## 3. 验证

- [x] 3.1 TypeScript 编译 + 构建通过
- [x] 3.2 手动验证所有功能
