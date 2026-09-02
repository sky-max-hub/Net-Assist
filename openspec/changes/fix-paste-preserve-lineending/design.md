# 修复方案：粘贴仅在替换整个文档时重配换行风格

## Context

`CrPreservingEditor`（CodeMirror 6）的粘贴 handler 在每次粘贴时按粘贴文本的换行风格 reconfigure 全局 `lineSeparator`。当粘贴片段（非全选替换）的换行风格与文档不同（如 CRLF 文档中粘贴无换行/LF 片段），全文被翻转，尾部 CR LF 变 LF。

## Goals / Non-Goals

**Goals:**
- 片段粘贴不改动文档全局换行风格，原有 CR LF / CR / LF 结尾保留
- 全选替换时按新内容风格设置（保持既有粘贴体验）
- 内容字节保持原样

**Non-Goals:**
- 不改 setValue / 历史切换 / 发送逻辑
- 不改变粘贴内容本身的字节（CodeMirror 内置粘贴已按当前 lineSeparator 保留 `\r` 字面字符）

## Decisions

### 1. 粘贴 handler 仅在替换整个文档时 reconfigure

用选区是否覆盖整个文档判断"是否全量替换"：

```ts
paste: (event, view) => {
  const text = event.clipboardData?.getData('text')
  if (text) {
    const main = view.state.selection.main
    // 仅当粘贴替换整个文档（或文档为空）时按新内容换行风格重配，
    // 避免片段粘贴翻转全文 lineSeparator（导致尾部 CR LF 变 LF）
    const replacesAll = main.from === 0 && main.to === view.state.doc.length
    if (replacesAll) {
      const newSep = sepFor(text)
      if (newSep !== currentSep(view)) {
        view.dispatch({ effects: [StateEffect.reconfigure.of(buildExtensions(newSep))] })
      }
    }
  }
  return false
}
```

空文档时 `from=0, to=0, doc.length=0`，`replacesAll` 为 true，首次粘贴 CR/CRLF 仍会正确设置风格。

### 2. 内容保留机制说明

CodeMirror 内置粘贴按当前 lineSeparator 切分：CRLF 文档粘贴 CR-only 片段时，`\r` 保留为行内字面字符（显示为 `<CR>` 标记），尾部 CR LF 不受影响。已实证。

## Risks / Trade-offs

- 片段粘贴时若新片段含与文档不同的换行风格（如 CRLF 文档粘贴 LF 片段），LF 会以行内 `<LF>` 标记显示而非换行——字节保留、显示为"所见即粘贴"，与既有"粘贴是啥显示啥"原则一致。
- 改动集中在 `CrPreservingEditor.tsx` 一个文件，无数据路径影响。
- 逻辑用 `@codemirror/state`（CJS）实证：CRLF 文档替换中间片段保留尾部 CRLF；reconfigure 到 LF 才导致翻转。
