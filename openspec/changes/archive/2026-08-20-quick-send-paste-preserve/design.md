## Context

浏览器 `<textarea>` 在粘贴含 `\r` 的内容时，会将其规范化为 `\n`。解决方式是拦截 `onPaste` 事件，从 `clipboardData.getData('text')` 读取原始文本（保留 `\r`），`preventDefault()` 后手动插入。SendPanel 已有此实现，QuickSendPanel 缺失。

## Goals / Non-Goals

**Goals:**
- 快捷指令内容粘贴保留原始换行格式（CR 不被规范化）
- 消除 SendPanel / QuickSendPanel 的重复实现

**Non-Goals:**
- 不改变发送时的 LF→CR 转换逻辑
- 不处理 HexEditor（HEX 输入不含 CR 换行语义）

## Decisions

### 1. 抽取共享 hook `usePreservePaste`

从 SendPanel 现有 `handlePaste` 抽取为可复用 hook，返回绑定到 `onPaste` 的处理函数。读取 `e.currentTarget.value`（而非闭包状态）作为插入基础，避免 stale closure。

```typescript
export function usePreservePaste(setValue: (v: string) => void) {
  return useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData('text')
    if (!pastedText) return
    e.preventDefault()
    const el = e.currentTarget
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    setValue(el.value.slice(0, start) + pastedText + el.value.slice(end))
    requestAnimationFrame(() => {
      el.setSelectionRange(start + pastedText.length, start + pastedText.length)
    })
  }, [setValue])
}
```

### 2. SendPanel 改用 hook

行为等价重构：原 `handlePaste` 基于 `input` 状态插入，新 hook 基于 `el.value`（DOM 值 = 当前显示值）插入，效果一致。

## Risks / Trade-offs

- **行为等价性** → SendPanel 重构后发送行为不变，仅实现方式统一
- 无新增依赖，兼容 Electron/Chromium
