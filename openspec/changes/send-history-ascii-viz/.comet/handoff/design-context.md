# Comet Design Handoff

- Change: send-history-ascii-viz
- Phase: design
- Mode: compact
- Context hash: 481ab3109d5ab4800b83efdd47c73419f5dfa1309cbf3c77199ecd0e95e6c3d1

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/send-history-ascii-viz/proposal.md

- Source: openspec/changes/send-history-ascii-viz/proposal.md
- Lines: 1-24
- SHA256: 025fa1cb01947a44b65fb871f9f055e2c4cd8f2e7eab296fdaf9bd79f5c3a0a3

```md
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

```

## openspec/changes/send-history-ascii-viz/design.md

- Source: openspec/changes/send-history-ascii-viz/design.md
- Lines: 1-63
- SHA256: b40c7683c009b9d6fc4ad492a651fb0ee5304010dc19cf44029d97273610c2f6

```md
## Context

发送面板 (`SendPanel.tsx`) 使用 antd `Input.TextArea` 输入文本。消息列表 (`MessageList.tsx` → `MessageItem.tsx`) 渲染收发数据。TCP 协议传输的是原始字节，包含 ASCII 控制字符（如 `\r\n` 作为换行符），当前这些字符在 UI 中不可见。

## Goals / Non-Goals

**Goals:**
- 每个 tab 独立维护发送历史（栈：先入先出逻辑，↑ 导航到更早的消息）
- 输入高度 6 行
- 输入框和消息显示中 ASCII 控制字符渲染为 `<ABBR>` 格式

**Non-Goals:**
- 不持久化历史
- 不改变编码/解码逻辑
- 不影响实际传输字节

## Decisions

### 1. 命令历史存储

使用 `useState<string[]>` + `useState<number>` 在 `SendPanel` 组件内存储历史。

```typescript
const [history, setHistory] = useState<string[]>([])
const [historyIndex, setHistoryIndex] = useState<number>(-1)
```

发送成功后 `unshift` 到历史数组头部，重置 index 到 -1。↑ 键递增 index 取 `history[index]`，↓ 键递减。到边界停止。

### 2. ASCII 控制字符可视化

创建 `AsciiHighlighter` 工具函数/组件，将文本中的控制字符替换为带样式的 `<span>` 标签。

控制字符范围：0x00-0x1F (NUL ~ US) + 0x7F (DEL)

映射示例：
| 字符 | 缩写 | 颜色 |
|------|------|------|
| `\0` (0x00) | NUL | 灰色 |
| `\t` (0x09) | TAB | 绿色 |
| `\n` (0x0A) | LF | 绿色 |
| `\r` (0x0D) | CR | 绿色 |
| `\x1B` (0x1B) | ESC | 橙色 |
| `\x7F` (0x7F) | DEL | 红色 |

React 渲染时，使用 `dangerouslySetInnerHTML` 将 `<span class="ascii-ctrl">` 片段注入。

### 3. 输入框 ASCII 可视化

输入框使用 `Input.TextArea` 无法直接渲染 HTML。采用**覆盖层**方案：在 TextArea 之上叠加一个透明的 `div`，实时同步文本内容并渲染 ASCII 标签。用户实际在 TextArea 中编辑原始文本，覆盖层显示视觉增强后的效果。

或者更简单的方案：在消息显示区做 ASCII 可视化，输入框保持纯文本但增加一个预览行显示可视化效果。

**简化方案**：消息显示区做完整 ASCII 可视化。输入框在发送前不做可视化（保持原始编辑），但在 TextArea 下方增加一行小字预览显示 ASCII 控制字符计数或高亮提示。

### 4. 高度

`rows={6}` 替代当前 `rows={3}`。

## Risks / Trade-offs

- 覆盖层方案可能引入输入框和覆盖层的同步延迟 → 优先简化方案
- `dangerouslySetInnerHTML` 有 XSS 风险 → 严格控制内容来源（仅控制字符映射，不插入用户输入）

```

## openspec/changes/send-history-ascii-viz/tasks.md

- Source: openspec/changes/send-history-ascii-viz/tasks.md
- Lines: 1-23
- SHA256: cdceaf85bb6803a169df80867fdd9c041a12604cc9ef996ef504d4ba65b2ca75

```md
## 1. ASCII 控制字符可视化

- [ ] 1.1 创建 `AsciiHighlighter.tsx` 工具组件/函数：将控制字符(0x00-0x1F+0x7F)映射为 `<ABBR>` 标签
- [ ] 1.2 在 `MessageItem.tsx` 中集成 ASCII 可视化渲染（消息显示区域）
- [ ] 1.3 添加 `.ascii-ctrl` CSS 样式（高亮颜色：CR/LF/TAB 绿色、ESC 橙色、DEL 红色、其余灰色）

## 2. 发送命令历史

- [ ] 2.1 在 `SendPanel.tsx` 中添加 `history` 和 `historyIndex` 状态
- [ ] 2.2 发送成功后保存到历史（unshift 到头部），重置 index
- [ ] 2.3 处理方向键 ↑/↓：从历史中取回/前进文本，显示到输入框
- [ ] 2.4 边界处理：无历史、最旧/最新位置约束
- [ ] 2.5 修改前手动保存当前输入（首次按↑时保存草稿）
- [ ] 2.6 修改输入框 rows 从 3 → 6

## 3. 输入框 ASCII 预览

- [ ] 3.1 在 TextArea 下方增加一行 ASCII 控制字符提示（计数摘要，如"3 个控制字符: CR, LF, TAB"）

## 4. 验证与收尾

- [ ] 4.1 TypeScript 编译 + 构建通过
- [ ] 4.2 手动验证：命令历史 ↑↓ 导航、高度 6 行、控制字符可视化

```
