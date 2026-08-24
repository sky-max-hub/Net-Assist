# 修复方案：按种类渲染行分隔符 + 初始内容即计算装饰 + 编辑器确定高度滚动

## Context

`CrPreservingEditor`（CodeMirror 6）通过 `EditorState.lineSeparator` facet 支持 CR/CRLF/LF 三种换行风格，`controlCharMarkers()` 扩展在行尾渲染零宽 widget 标记（`<CR>`/`<LF>`）。存在三个显示 bug：布尔 `crlf = sep.includes('\r')` 无法区分 CR-only 与 CRLF；`controlCharField.create()` 返回空装饰导致初始内容不显示标记；基础 `.cr-editor` 无确定高度导致行数多时不滚动。

## Goals / Non-Goals

**Goals:**
- 按实际种类渲染行分隔符：CR → `<CR>`，CRLF → `<CR><LF>`，LF → `<LF>`
- 初始内容（首次挂载）即显示控制符/行分隔符标记
- 快捷指令编辑框行数多时出现滚动条，最大行数与发送框一致
- 不改动内容/数据路径

**Non-Goals:**
- 不改粘贴流程、setValue 流程、发送逻辑

## Decisions

### 1. `separatorKind(sep)` 纯函数

在 `controlChars.ts` 新增（复用 `hooks/lineEnding.ts` 的 `LineEnding` 类型）：

```ts
export function separatorKind(sep: string): LineEnding {
  if (sep === '\r') return 'cr'
  if (sep === '\r\n') return 'crlf'
  return 'lf'
}
```

### 2. `LineBreakWidget` 按 kind 渲染

构造函数从 `crlf: boolean` 改为 `kind: LineEnding`：`'crlf'` → `<CR><LF>`，`'cr'` → `<CR>`，`'lf'` → `<LF>`。

### 3. 装饰在 `create` 时即计算

提取 `buildDecorations(state)` 从状态构建装饰；`controlCharField` 改为：

```ts
create(state) { return buildDecorations(state) },          // 初始内容立即显示标记
update(deco, tr) {
  const sepChanged = tr.startState.facet(EditorState.lineSeparator) !== tr.state.facet(EditorState.lineSeparator)
  if (!tr.docChanged && !sepChanged) return deco.map(tr.changes)  // selection 等沿用
  return buildDecorations(tr.state)                                // doc 或换行风格变化时重建
}
```

`sepChanged` 分支同时修复"仅 reconfigure 换行风格、doc 未变时 widget 种类陈旧"的问题。

### 4. `.cr-editor` 确定高度使 scroller 可滚动

发送框 `.cmp-input` 固定 `height/min-height/max-height: 180px`，因此可滚动。基础 `.cr-editor` 改为相同确定高度（180px，与发送框保持一致），使 CodeMirror `.cm-scroller { height: 100% }` 有界并产生滚动条：

```css
.cr-editor {
  height: 180px;
  min-height: 180px;
  max-height: 180px;
}
```

`.cr-editor` 仅被 SendPanel（`.cmp-input` 覆盖为同样 180px，无视觉变化）与 QuickSendPanel（应用新高度，修复无滚动条）使用。

## Risks / Trade-offs

- `create(state)` 每次建状态都计算装饰：编辑器文档很小（发送框/快捷指令），开销可忽略。
- `.cr-editor` 从「72px 起、150px 上限」改为固定 180px：与发送框一致，空编辑器也会占 180px 高度（与发送框行为相同）。
- 改动集中在 `controlChars.ts` 与 `CrPreservingEditor.css` 两个文件，仅影响控制符/行分隔符标记的显示与编辑器高度，无数据路径影响。
- 真实渲染（装饰 widget 进 DOM、滚动条出现）需真实 Electron 验证；逻辑用 `@codemirror/state` + `@codemirror/view`（CJS）实证通过。
