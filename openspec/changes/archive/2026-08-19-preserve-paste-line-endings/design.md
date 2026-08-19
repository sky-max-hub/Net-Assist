## Context

HTML `<textarea>` 规范要求其 `value` 中的换行统一为 `\n`，因此浏览器在用户粘贴含 `\r` 的内容时会自动规范化。这是浏览器行为，无法通过设置改变，只能拦截 paste 事件手动插入。

## Goals / Non-Goals

**Goals:**
- 粘贴时完全保留剪贴板中的原始换行格式（包括 `\r`）
- 支持在光标位置插入，覆盖选中区域

**Non-Goals:**
- 不改变发送时的 `lfToCr` 转换逻辑（该开关仍在发送时生效）
- 不处理拖拽粘贴等其他粘贴途径（仅标准 Ctrl+V / 右键粘贴）

## Decisions

### 1. 使用 `onPaste` + `clipboardData.getData('text')`

在 TextArea 上添加 `onPaste` 处理器：
- `e.clipboardData.getData('text')` 返回剪贴板原始文本（保留 `\r`）
- 通过 `e.preventDefault()` 阻止浏览器默认的规范化插入
- 手动将原始文本插入到 `selectionStart`/`selectionEnd` 位置

### 2. 光标位置恢复

使用 `useRef` 引用底层 textarea，插入后用 `requestAnimationFrame` 在状态更新后恢复光标到插入文本末尾。

## Risks / Trade-offs

- **兼容性** → `clipboardData.getData('text')` 在所有现代浏览器（含 Electron/Chromium）均支持
- **仅拦截标准粘贴** → 拖拽/程序化粘贴（`insertText`）不在本修复范围，属于非目标
