# 编辑器控制符/行分隔符显示错误（CR 显示成 CRLF；初始内容不显示 ASCII 标记）

## 问题描述

两个紧密相关的显示 bug（都位于编辑器控制符标记层）：

1. **粘贴 CR 显示为 CR LF**：在发送框（SendPanel）与快捷指令编辑框（QuickSendPanel）中，粘贴只含 CR（`\r`）换行的文本后，编辑器把每个行分隔符错误地显示为 `<CR><LF>`，而实际内容是单个 `\r`。用户要求"粘贴是啥，显示就要是啥"——粘贴 CR 就应显示 `<CR>`。

2. **初始内容不显示 ASCII 标记**：快捷指令编辑框首次点进（新增/编辑指令）时，内容里已有的 ASCII 控制符（CR/LF 等）不显示 `<CR>`/`<LF>` 标记；只有粘贴/编辑触发变化后才出现。保存后再次进入仍不显示。

## 根因分析

两处都位于 `src/renderer/src/components/common/controlChars.ts` 的装饰层：

1. **CRLF 混淆**：`controlCharField.update` 中用 `crlf = sep.includes('\r')` 判定，对 CR-only（`'\r'`）与 CRLF（`'\r\n'`）都为 true，`LineBreakWidget` 统一渲染 `<CR><LF>`。已用 `@codemirror/state` 实证内容层保留 CR（`lineSep='\r'` 粘贴 `"A\rB"` → sliceDoc 仍为 `"A\rB"`），问题纯在显示层。

2. **create 空装饰**：`controlCharField.create()` 返回 `Decoration.none`，装饰只在 `tr.docChanged` 时计算。QuickSendPanel 编辑模态框挂载时 `initialValue={editContent}` 作为初始 doc，初始渲染无任何装饰；随后 `setValue` 因内容相同提前 return，不触发重算。故首次进入不显示标记，只有粘贴/编辑这类 doc 变化后才出现。

## 修复目标

- CR-only（`'\r'`）行分隔符显示为 `<CR>`，CRLF 显示 `<CR><LF>`，LF 显示 `<LF>`（按实际种类渲染）
- 编辑器初始内容（首次挂载即含控制符）就显示标记，无需等粘贴/编辑
- 内容（发送字节/存储）保持原样，不改动数据路径
