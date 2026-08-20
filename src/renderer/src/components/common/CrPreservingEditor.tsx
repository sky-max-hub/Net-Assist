import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef
} from 'react'
import { EditorView, keymap, placeholder, type KeyBinding } from '@codemirror/view'
import { EditorState, StateEffect, type Extension } from '@codemirror/state'
import { defaultKeymap, history } from '@codemirror/commands'
import { detectLineEnding, normalizeToLf } from '../../hooks/lineEnding'
import './CrPreservingEditor.css'

function sepFor(value: string): string {
  const s = detectLineEnding(value)
  return s === 'crlf' ? '\r\n' : s === 'cr' ? '\r' : '\n'
}

export interface CrPreservingEditorHandle {
  /** 外部程序化设置内容（历史切换/清空/快捷填充），保留 CRLF/CR */
  setValue: (value: string) => void
  focus: () => void
}

interface Props {
  initialValue?: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  extraKeymap?: KeyBinding[]
  className?: string
}

/**
 * 基于 CodeMirror 6 的换行保留编辑器。
 *
 * HTML <textarea> 强制将 \r\n / \r 规范化为 \n，导致粘贴/编辑后 CR 丢失。
 * CodeMirror 保留 insert 文本中的原始换行字符（\r 作为字面字符），sliceDoc 序列化时输出 CRLF/CR。
 *
 * 关键实现（经实验验证）：
 * - 编辑/粘贴时 onChange 单向通知，绝不反向 dispatch → 光标由 CodeMirror 自主管理，稳定
 * - insert 保留原始换行（不 normalize），sliceDoc 输出 CRLF/CR
 * - 外部设置（setValue）跨风格时：先 reconfigure lineSeparator（doc 不变 selection 保留），再 insert
 *   （同一 dispatch 内 changes+reconfigure 会产生双 CR，必须分两步）
 * - 换行风格更新用 StateEffect.reconfigure（实验验证 selection 保留）
 * - 不重建 EditorView，避免光标重置/闪烁
 */
const CrPreservingEditor = forwardRef<CrPreservingEditorHandle, Props>(
  function CrPreservingEditor(
    { initialValue = '', onChange, placeholder: ph, disabled, extraKeymap, className },
    ref
  ): JSX.Element {
    const containerRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)
    const onChangeRef = useRef(onChange)
    onChangeRef.current = onChange
    const phRef = useRef(ph)
    phRef.current = ph
    const disabledRef = useRef(disabled)
    disabledRef.current = disabled
    const keymapRef = useRef(extraKeymap)
    keymapRef.current = extraKeymap

    const currentSep = (view: EditorView): string =>
      view.state.facet(EditorState.lineSeparator) || '\n'

    const buildExtensions = useCallback((sep: string): Extension[] => {
      return [
        history(),
        EditorState.lineSeparator.of(sep),
        // 自定义快捷键（Mod+Enter 发送等）须排在 defaultKeymap 之前，否则被默认绑定覆盖
        keymap.of([...(keymapRef.current ?? []), ...defaultKeymap]),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            // sliceDoc 保留 insert 时的原始换行字符，输出 CRLF/CR
            onChangeRef.current(update.state.sliceDoc(0, update.state.doc.length))
          }
        }),
        ...(phRef.current ? [placeholder(phRef.current)] : []),
        ...(disabledRef.current ? [EditorState.readOnly.of(true)] : [])
      ]
    }, [])

    const createView = useCallback(
      (doc: string, sep: string): EditorView => {
        const view = new EditorView({
          parent: containerRef.current as HTMLDivElement,
          state: EditorState.create({ doc, extensions: buildExtensions(sep) })
        })
        viewRef.current = view
        return view
      },
      [buildExtensions]
    )

    // 创建 EditorView（仅一次，用初始值）
    useEffect(() => {
      const view = createView(initialValue, sepFor(initialValue))
      return () => {
        view.destroy()
        viewRef.current = null
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useImperativeHandle(
      ref,
      () => ({
        setValue: (value: string) => {
          const view = viewRef.current
          if (!view) return
          // doc 内部可能是 LF + 字面 \r（粘贴 CRLF 时 \r 被存为普通字符），
          // 必须把 current 也 normalize 到 LF 空间比较，否则编辑后误判内容变化 → dispatch → 光标跳末尾
          const current = normalizeToLf(view.state.doc.toString())
          const expected = normalizeToLf(value)
          const newSep = sepFor(value)
          const oldSep = currentSep(view)
          const styleChanged = newSep !== oldSep
          const docChanged = current !== expected
          // 完全无变化：return（编辑后 onChange 同步时调用，避免反向 dispatch 干扰光标）
          if (!styleChanged && !docChanged) return

          if (styleChanged) {
            // 先单独 reconfigure lineSeparator（doc 不变 selection 保留）
            // 同一 dispatch 内 changes+reconfigure 会让 insert 用旧 sep 解析 → 双 CR
            view.dispatch({ effects: [StateEffect.reconfigure.of(buildExtensions(newSep))] })
          }
          if (docChanged) {
            // insert 保留原始换行字符（CRLF/CR），sliceDoc 输出对应格式
            // 全量替换 doc 时 selection 会映射到 0（实验验证），显式放到末尾，避免光标乱飞
            const newLen = normalizeToLf(value).length
            view.dispatch({
              changes: { from: 0, to: view.state.doc.length, insert: value },
              selection: { anchor: newLen }
            })
          }
        },
        focus: () => viewRef.current?.focus()
      }),
      [createView, buildExtensions]
    )

    return <div ref={containerRef} className={`cr-editor ${className ?? ''}`} />
  }
)

export default CrPreservingEditor
