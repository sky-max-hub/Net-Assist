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
