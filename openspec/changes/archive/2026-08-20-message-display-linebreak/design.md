## Context

`MessageItem.tsx` 当前将时间、方向、远端、字节数、内容放在同一个 `.message-item` 容器内，依赖 `white-space: pre-wrap` 内联显示。

## Goals / Non-Goals

**Goals:**
- 元信息行与内容行分行显示

**Non-Goals:**
- 不改变消息数据结构与收发逻辑
- 不改变 HEX/文本模式切换逻辑

## Decisions

### 1. 元信息与内容分行

将 `.message-content` 放入新的块级容器，使其换行到第二行。保持复制按钮逻辑不变。

### 2. 样式调整

`.message-content` 设为块级元素（`display: block`），并增加上边距或缩进，与元信息行区分。

## Risks / Trade-offs

- 无实质风险，纯显示布局调整
