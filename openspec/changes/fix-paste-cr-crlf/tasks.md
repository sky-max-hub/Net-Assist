# Tasks

## 1. 修复 `controlChars.ts` 行分隔符显示（CR 显示成 CRLF）

- [x] 新增 `separatorKind(sep: string): LineEnding` 纯函数（`'\r'` → `'cr'`，`'\r\n'` → `'crlf'`，否则 `'lf'`），复用 `hooks/lineEnding.ts` 的 `LineEnding` 类型
- [x] `LineBreakWidget` 构造函数从 `crlf: boolean` 改为 `kind: LineEnding`，按 kind 渲染 `<CR><LF>` / `<CR>` / `<LF>`
- [x] `controlCharField.update` 用 `separatorKind(...)` 计算 kind，替代 `crlf = sep.includes('\r')`

## 2. 修复 `controlChars.ts` 初始内容不显示控制符标记

- [x] 提取 `buildDecorations(state)`，`controlCharField.create(state)` 基于初始 doc 计算装饰
- [x] `update` 在 doc 变化或 lineSeparator 变化时重建装饰；其余事务沿用映射（selection 不触发重建）

## 3. 添加测试

- [x] 新增 `separatorKind` 单测：`'\r'` → `'cr'`、`'\r\n'` → `'crlf'`、`'\n'` → `'lf'`
- [x] 新增装饰生成测试：带控制符的初始 doc 在 `create` 时即有装饰（可用 StateField 值断言）

## 4. 修复快捷指令编辑框无滚动条

- [x] `.cr-editor` 改为确定高度（`height/min-height/max-height: 180px`，与发送框 `.cmp-input` 一致），使 `.cm-scroller` 有界可滚动
