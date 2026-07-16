## Why

默认编码应为 GBK（行业设备常用），消息项需视觉区分和原文复制功能。

## What Changes

- 默认编码 UTF-8 → GBK
- 每条消息加边框/背景区分
- 悬浮时右上角复制 icon，复制原始文本（非 ASCII 可视化处理后文本）
- 复制后右上角显示"已复制"提示 1s

## Impact

`tab-store.ts`、`MessageItem.tsx`、`MessageList.css`
