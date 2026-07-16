## Why

当前消息发送框缺少终端式的命令历史功能，无法方便地重新发送之前的消息。输入区域较小（3 行），不够可视。ASCII 控制字符（如 CR、LF、TAB、ESC 等）在输入和显示中不可见。需要三项增强提升交互体验。

## What Changes

- **命令历史**：方向键 ↑/↓ 在已发送消息历史中导航，每个 tab 独立维护、会话内有效
- **输入高度**：TextArea 默认行数从 3 → 6
- **ASCII 控制字符可视化**：0x00-0x1F 和 0x7F DEL 在输入框和消息显示中渲染为缩写标签（如 `<CR>`、`<LF>`、`<TAB>`），高亮颜色区分。仅影响显示，不改变传输内容。

## Capabilities

### New Capabilities
- `send-history`: 发送消息历史导航（↑/↓ 方向键），per-tab 独立历史
- `ascii-visualization`: ASCII 控制字符在输入框和消息显示中的可视化渲染

### Modified Capabilities
无

## Impact

- `SendPanel.tsx`：历史存储、方向键处理、rows=6
- `MessageList.tsx` / `MessageItem.tsx`：ASCII 可视化渲染
- 新建 `src/renderer/src/components/common/AsciiHighlighter.tsx`：通用 ASCII 标签渲染函数/组件
