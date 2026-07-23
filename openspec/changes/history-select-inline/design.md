## Context

当前 SendPanel 的发送历史完全依赖 `↑`/`↓` 快捷键在 TextArea 中切换，用户无法直观感知历史记录的存在，且容易在编辑时误触。现改为显式的下拉框交互，提升可发现性。

## Goals / Non-Goals

**Goals:**
- 用 Select 下拉框替代快捷键切换发送历史
- 下拉框放在工具栏 LF→CR 开关右侧
- 选中历史项后填入 TextArea
- 发送历史去重（同一内容只保留一条）

**Non-Goals:**
- 不增加历史搜索/过滤功能
- 不修改历史持久化方式（历史不跨会话保存）
- 不影响 Ctrl+Enter 发送行为

## Decisions

### 1. 使用 Ant Design `Select` 组件

`Select` 原生支持键盘导航（↑↓ 切换选项、Enter 确认），无需自定义键盘处理。

**备选方案**：自定义 Dropdown + 键盘事件管理 → 增加复杂度，无额外收益。

### 2. 选中即填入（onChange 触发）

使用 `onChange` 回调，当用户通过 ↑↓ + Enter 或点击选中某一项后，立即将内容写入 TextArea。

### 3. 历史去重策略

发送时将新内容与已有历史比对：若内容相同，将已有条目移到最前（不新增）；若不同，在最前插入新条目。

```typescript
setHistory((prev) => {
  const filtered = prev.filter((item) => item !== textToSend)
  return [textToSend, ...filtered]
})
```

### 4. handleKeyDown 简化

仅保留 `Ctrl+Enter` 发送逻辑，移除所有 ↑↓ 及 draftInput/historyIndex 相关代码。

### 5. 下拉框位置

Select 放在 `<Space>` 内的 LF→CR Switch 之后：

```
[编码▼] [TXT] [LF转CR ◉] [发送历史 ▼] [合并/分开]
```

## Risks / Trade-offs

- **历史条目过长时下拉框显示不佳** → 对超过 30 字符的历史文本做截断显示，鼠标悬停时通过 `title` 查看完整内容
- **历史数量无上限** → tweak 范围不引入上限，后续可按需增加
