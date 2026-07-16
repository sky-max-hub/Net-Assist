## Context

当前 `MessageList` 组件中，工具栏和消息列表都在同一个 `overflow-y: auto` 容器内，导致"清空消息"按钮随滚动消失。

## Goals / Non-Goals

**Goals:** 工具栏固定在消息区域顶部，不随内容滚动

**Non-Goals:** 不改变按钮功能或样式

## Decisions

将组件结构从单滚动容器改为 flex 列布局：工具栏固定顶部（`flex-shrink: 0`），消息内容在独立滚动区域（`flex: 1; overflow-y: auto`）。
