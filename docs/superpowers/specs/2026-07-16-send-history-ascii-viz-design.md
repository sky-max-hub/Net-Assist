---
comet_change: send-history-ascii-viz
role: technical-design
canonical_spec: openspec
---

# 发送框增强 — 技术设计

## 1. ASCII 控制字符可视化

### 1.1 工具函数

创建 `src/renderer/src/components/common/AsciiHighlighter.tsx`：

```typescript
const ASCII_NAMES: Record<number, string> = {
  0x00: 'NUL', 0x01: 'SOH', 0x02: 'STX', 0x03: 'ETX',
  0x04: 'EOT', 0x05: 'ENQ', 0x06: 'ACK', 0x07: 'BEL',
  0x08: 'BS',  0x09: 'TAB', 0x0A: 'LF',  0x0B: 'VT',
  0x0C: 'FF',  0x0D: 'CR',  0x0E: 'SO',  0x0F: 'SI',
  0x10: 'DLE', 0x11: 'DC1', 0x12: 'DC2', 0x13: 'DC3',
  0x14: 'DC4', 0x15: 'NAK', 0x16: 'SYN', 0x17: 'ETB',
  0x18: 'CAN', 0x19: 'EM',  0x1A: 'SUB', 0x1B: 'ESC',
  0x1C: 'FS',  0x1D: 'GS',  0x1E: 'RS',  0x1F: 'US',
  0x7F: 'DEL'
}

function getAsciiClass(code: number): string {
  if (code === 0x0A || code === 0x0D) return 'crlf'
  if (code === 0x09) return 'tab'
  if (code === 0x1B) return 'esc'
  if (code === 0x7F) return 'del'
  return 'other'
}

export function highlightAscii(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code <= 0x1F || code === 0x7F) {
      const name = ASCII_NAMES[code] || `0x${code.toString(16)}`
      result.push(
        <span key={i} className={`ascii-ctrl ascii-${getAsciiClass(code)}`}>
          &lt;{name}&gt;
        </span>
      )
    } else {
      result.push(text[i])
    }
  }
  return result
}

export function countControlChars(text: string): string[] {
  const names: string[] = []
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code <= 0x1F || code === 0x7F) {
      names.push(ASCII_NAMES[code] || `0x${code.toString(16)}`)
    }
  }
  return names
}
```

### 1.2 消息显示集成

在 `MessageItem.tsx` 中，文本模式渲染时调用 `highlightAscii()`：

```tsx
const content = displayMode === 'hex'
  ? formatHex(message.raw)
  : highlightAscii(decodeText(message.raw, encoding))
```

### 1.3 输入框预览

在 `SendPanel.tsx` 中 TextArea 下方添加控制字符计数行。

## 2. 命令历史

### 2.1 状态管理

```typescript
const [history, setHistory] = useState<string[]>([])
const [historyIndex, setHistoryIndex] = useState<number>(-1)
const [draftInput, setDraftInput] = useState<string>('')
```

### 2.2 方向键处理

```typescript
function handleHistoryNav(e: KeyboardEvent, direction: 'up' | 'down'): void {
  if (history.length === 0) return

  if (historyIndex === -1) {
    // 首次按 ↑：保存当前输入为草稿
    setDraftInput(input)
  }

  let newIndex: number
  if (direction === 'up') {
    newIndex = Math.min(historyIndex + 1, history.length - 1)
  } else {
    newIndex = Math.max(historyIndex - 1, -1)
  }

  setHistoryIndex(newIndex)
  if (newIndex === -1) {
    setInput(draftInput)
  } else {
    setInput(history[newIndex])
  }
}
```

### 2.3 发送保存

发送成功后将内容 unshift 到 history，重置 index，清空 draft。

## 3. CSS 样式

```css
.ascii-ctrl { font-weight: bold; border-radius: 2px; padding: 0 1px; margin: 0 1px; }
.ascii-crlf { color: #4ec9b0; background: rgba(78,201,176,0.12); }
.ascii-tab  { color: #6a9955; background: rgba(106,153,85,0.12); }
.ascii-esc  { color: #ce9178; background: rgba(206,145,120,0.12); }
.ascii-del  { color: #f44747; background: rgba(244,71,71,0.12); }
.ascii-other { color: #858585; background: rgba(133,133,133,0.08); }
```

## 4. 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `components/common/AsciiHighlighter.tsx` | 新建 | ASCII 可视化工具函数 |
| `components/messages/MessageItem.tsx` | 修改 | 集成 ASCII 可视化渲染 |
| `components/messages/MessageList.css` | 修改 | ascii-ctrl 样式 |
| `components/send/SendPanel.tsx` | 修改 | 命令历史 + rows=6 + ASCII 预览行 |
| `components/send/SendPanel.css` | 修改 | ASCII 预览行样式 |
