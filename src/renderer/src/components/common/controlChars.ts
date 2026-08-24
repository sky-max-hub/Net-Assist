import { RangeSetBuilder, StateField, EditorState } from '@codemirror/state'
import { Decoration, EditorView, WidgetType, type DecorationSet, type Extension } from '@codemirror/view'
import type { LineEnding } from '../../hooks/lineEnding'

/** 从 lineSeparator facet 值推断行分隔符种类：`'\r'` → 'cr'，`'\r\n'` → 'crlf'，否则 'lf' */
export function separatorKind(sep: string): LineEnding {
  if (sep === '\r') return 'cr'
  if (sep === '\r\n') return 'crlf'
  return 'lf'
}

/** C0 控制符 + DEL 的名称映射（0x0a LF 与 0x0d CR 也包含——非行分隔符场景下以标记展示） */
const CTRL_LABELS: Record<number, string> = {
  0x00: 'NUL', 0x01: 'SOH', 0x02: 'STX', 0x03: 'ETX', 0x04: 'EOT',
  0x05: 'ENQ', 0x06: 'ACK', 0x07: 'BEL', 0x08: 'BS', 0x09: 'TAB',
  0x0a: 'LF', 0x0b: 'VT', 0x0c: 'FF', 0x0d: 'CR', 0x0e: 'SO', 0x0f: 'SI',
  0x10: 'DLE', 0x11: 'DC1', 0x12: 'DC2', 0x13: 'DC3', 0x14: 'DC4',
  0x15: 'NAK', 0x16: 'SYN', 0x17: 'ETB', 0x18: 'CAN', 0x19: 'EM',
  0x1a: 'SUB', 0x1b: 'ESC', 0x1c: 'FS', 0x1d: 'GS', 0x1e: 'RS',
  0x1f: 'US', 0x7f: 'DEL'
}

class CtrlWidget extends WidgetType {
  constructor(readonly label: string) { super() }
  toDOM(): HTMLElement {
    const span = document.createElement('span')
    span.className = 'ctrl'
    span.textContent = `<${this.label}>`
    return span
  }
  ignoreEvent(): boolean { return true }
}

/** 行分隔符标记：CRLF 显示 `<CR><LF>`，CR 显示 `<CR>`，LF 显示 `<LF>`。以零宽 widget 渲染在行尾，自然换行保留 */
class LineBreakWidget extends WidgetType {
  constructor(readonly kind: LineEnding) { super() }
  toDOM(): HTMLElement {
    const mk = (label: string): HTMLElement => {
      const span = document.createElement('span')
      span.className = 'ctrl'
      span.textContent = `<${label}>`
      return span
    }
    const wrap = document.createElement('span')
    wrap.className = 'cm-linesep'
    if (this.kind === 'crlf') {
      wrap.appendChild(mk('CR'))
      wrap.appendChild(mk('LF'))
    } else if (this.kind === 'cr') {
      wrap.appendChild(mk('CR'))
    } else {
      wrap.appendChild(mk('LF'))
    }
    return wrap
  }
  ignoreEvent(): boolean { return true }
}

/** 根据状态中的文档与 lineSeparator 构建控制符/行分隔符装饰（初始内容也生效） */
export function buildDecorations(state: EditorState): DecorationSet {
  const doc = state.doc
  if (doc.length === 0) return Decoration.none
  const sep = state.facet(EditorState.lineSeparator) || '\n'
  const kind = separatorKind(sep)
  const builder = new RangeSetBuilder<Decoration>()
  for (let l = 1; l <= doc.lines; l++) {
    const line = doc.line(l)
    const text = line.text
    for (let i = 0; i < text.length; i++) {
      const label = CTRL_LABELS[text.charCodeAt(i)]
      if (label) {
        builder.add(line.from + i, line.from + i + 1, Decoration.replace({ widget: new CtrlWidget(label) }))
      }
    }
    // 行尾分隔符：以零宽 widget（side -1，渲染在行内容末尾）显示 CRLF/CR/LF 标记
    if (l < doc.lines) {
      builder.add(line.to, line.to, Decoration.widget({ widget: new LineBreakWidget(kind), side: -1 }))
    }
  }
  return builder.finish()
}

const controlCharField = StateField.define<DecorationSet>({
  // create 时即基于初始 doc 计算装饰，否则首次加载（如快捷指令编辑框带初始内容）不显示控制符标记
  create(state) { return buildDecorations(state) },
  update(deco, tr) {
    const sepChanged = tr.startState.facet(EditorState.lineSeparator) !== tr.state.facet(EditorState.lineSeparator)
    // 仅 doc 或行分隔符变化时重建；其余（selection 等）沿用映射后的装饰
    if (!tr.docChanged && !sepChanged) return deco.map(tr.changes)
    return buildDecorations(tr.state)
  },
  provide: (f) => EditorView.decorations.from(f)
})

/**
 * CodeMirror 扩展：把文档中的 ASCII 控制字符渲染为 `<CR>`/`<LF>`/`<TAB>` 等样式标记，
 * 行分隔符（CRLF/LF）也渲染为标记 + 换行。
 * 仅影响显示，文档内容（发送字节）保持原样。
 */
export function controlCharMarkers(): Extension {
  return controlCharField
}
