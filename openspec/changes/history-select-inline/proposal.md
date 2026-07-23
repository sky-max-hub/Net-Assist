## Why

当前发送面板通过 TextArea 的 `↑`/`↓` 快捷键切换发送历史，但这个交互方式存在两个问题：一是**不可发现**——用户无法直观看到有哪些历史记录可用；二是**容易误触**——在 TextArea 中编辑文本时，按 `↑`/`↓` 本想移动光标，却意外切换了历史内容。

## What Changes

- **移除** TextArea 中 `↑`/`↓` 切换发送历史的快捷键逻辑（`draftInput`、`historyIndex` 状态一并移除）
- **新增** 工具栏中的「发送历史」下拉框（Ant Design `Select`），位于 LF→CR 开关右侧
- **修改** 发送历史存储为去重模式：相同内容不重复保存
- **保留** `Ctrl+Enter` 发送快捷键不变

## Capabilities

### New Capabilities
<!-- 纯 UI 交互调整，不引入新的 capability spec -->
无

### Modified Capabilities
<!-- 不修改现有 spec 行为 -->
无

## Impact

- 仅影响 `src/renderer/src/components/send/SendPanel.tsx` 一个文件
- 不涉及后端 IPC、类型定义、状态管理
- 对用户无 BREAKING 变更（发送功能、编码、快捷键发送均不受影响）
