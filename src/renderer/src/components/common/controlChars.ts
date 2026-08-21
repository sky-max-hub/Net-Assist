import { RangeSetBuilder, StateField, EditorState } from '@codemirror/state'
import { Decoration, EditorView, WidgetType, type Extension } from '@codemirror/view'

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

/** 行分隔符标记：<CR><LF>（CRLF）或 <LF>（LF）。以零宽 widget 渲染在行尾，自然换行保留 */
class LineBreakWidget extends WidgetType {
  constructor(readonly crlf: boolean) { super() }
  toDOM(): HTMLElement {
    const wrap = document.createElement('span')
    wrap.className = 'cm-linesep'
    if (this.crlf) {
      const cr = document.createElement('span')
      cr.className = 'ctrl'
      cr.textContent = '<CR>'
      wrap.appendChild(cr)
    }
    const lf = document.createElement('span')
    lf.className = 'ctrl'
    lf.textContent = '<LF>'
    wrap.appendChild(lf)
    return wrap
  }
  ignoreEvent(): boolean { return true }
}

const controlCharField = StateField.define({
  create() { return Decoration.none },
  update(deco, tr) {
    if (!tr.docChanged) return deco.map(tr.changes)
    const doc = tr.newDoc
    if (doc.length === 0) return Decoration.none
    const sep = tr.state.facet(EditorState.lineSeparator) || '\n'
    const crlf = sep.includes('\r')
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
      // 行尾分隔符：以零宽 widget（side -1，渲染在行内容末尾）显示 <CR><LF>/<LF> 标记
      if (l < doc.lines) {
        builder.add(line.to, line.to, Decoration.widget({ widget: new LineBreakWidget(crlf), side: -1 }))
      }
    }
    return builder.finish()
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
