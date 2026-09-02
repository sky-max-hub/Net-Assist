# 粘贴中间片段导致尾部 CR LF 变 LF

## 问题描述

在发送框（SendPanel）与快捷指令编辑框（QuickSendPanel）中：先粘贴一段以 CR LF（`\r\n`）结尾的报文，随后粘贴修改报文中间的某一段（未动到结尾），原本以 CR LF 结尾的报文变成 LF（`\n`）结尾。期望：粘贴未触碰到结尾时，结尾的 CR LF 应保持不变。

## 根因分析

`CrPreservingEditor.tsx` 的粘贴 handler 用 `sepFor(pastedText)` 判断粘贴文本的换行风格，只要与当前 lineSeparator 不同就 `StateEffect.reconfigure` **整个文档**的 lineSeparator：

```ts
paste: (event, view) => {
  const text = event.clipboardData?.getData('text')
  if (text) {
    const newSep = sepFor(text)          // 无换行/LF 的片段 → '\n'
    if (newSep !== currentSep(view)) {   // CRLF 文档 + LF 片段 → 触发 reconfigure
      view.dispatch({ effects: [StateEffect.reconfigure.of(buildExtensions(newSep))] })
    }
  }
  return false
}
```

粘贴"XXX"这类无换行或 LF 片段的修改时，`sepFor` 返回 `'\n'`，与当前 `'\r\n'` 不同 → 全文 reconfigure 为 LF。此时整个文档（含原本 `\r\n` 的尾部）按 LF 重新序列化，`\r` 变成行内字面字符，尾部 CR LF 丢失。

已用 `@codemirror/state` 实证：
- CRLF 文档 + 替换中间片段（不 reconfigure）→ `"XXX\r\nBBB\r\n"`（尾部 CRLF 保留）
- 先 reconfigure 到 LF 再替换 → `"XXX\nBBB\n"`（尾部 CRLF 变 LF，即 bug）

## 修复目标

- 粘贴片段（未替换整个文档）时，保持文档现有 lineSeparator，尾部/原有 CR LF 风格不被翻转
- 仅当粘贴替换整个文档内容时，才按新内容换行风格 reconfigure
- 内容字节（发送数据）保持原样
