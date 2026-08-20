// @vitest-environment jsdom
import { describe, it, expect, vi, afterAll } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React, { createRef } from 'react'
import { EditorState } from '@codemirror/state'
import CrPreservingEditor, { type CrPreservingEditorHandle } from '../CrPreservingEditor'

afterAll(() => cleanup())

describe('CrPreservingEditor 组件挂载', () => {
  it('渲染出 CodeMirror 内容节点', () => {
    const onChange = vi.fn()
    const { container } = render(
      React.createElement(CrPreservingEditor, { initialValue: 'A\r\nB', onChange })
    )
    expect(container.querySelector('.cm-content')).toBeTruthy()
  })

  it('Mod+Enter 触发自定义 keymap handler，而非 defaultKeymap 的 insertBlankLine', () => {
    const onChange = vi.fn()
    const onSend = vi.fn()
    const extraKeymap = [{ key: 'Mod-Enter', run: () => { onSend(); return true } }]
    const { container } = render(
      React.createElement(CrPreservingEditor, { initialValue: 'hello', onChange, extraKeymap })
    )
    const cmContent = container.querySelector('.cm-content')
    expect(cmContent).toBeTruthy()
    const evt = new KeyboardEvent('keydown', {
      key: 'Enter',
      ctrlKey: true,
      bubbles: true,
      cancelable: true
    })
    cmContent?.dispatchEvent(evt)
    // 自定义 handler 被调用，且未插入空行（doc 未变）
    expect(onSend).toHaveBeenCalled()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('ref.setValue 外部设置触发 onChange 且无循环', () => {
    const onChange = vi.fn()
    const ref = createRef<CrPreservingEditorHandle>()
    render(
      React.createElement(CrPreservingEditor, { initialValue: 'A\r\nB', onChange, ref })
    )
    expect(ref.current).toBeTruthy()
    // 相同内容：current===expected，return，不触发（避免编辑同步时反向 dispatch）
    ref.current?.setValue('A\r\nB')
    expect(onChange).not.toHaveBeenCalled()
    // 不同内容：内容实际变化，触发 onChange 一次（输出 CRLF 保留）
    ref.current?.setValue('X\r\nY')
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toBe('X\r\nY')
    // 再次相同内容：不再触发（无循环）
    ref.current?.setValue('X\r\nY')
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})

describe('CodeMirror lineSeparator — CRLF/CR 保留（修复根因）', () => {
  it('CRLF 内容经编辑后 sliceDoc 保留 CRLF（textarea 无法实现）', () => {
    // 初始含 CRLF 的内容
    const state = EditorState.create({
      doc: 'A\r\nB\r\nC',
      extensions: [EditorState.lineSeparator.of('\r\n')]
    })
    // 模拟用户编辑：在位置 2 插入 'X'
    const txn = state.update({ changes: { from: 2, to: 2, insert: 'X' } })
    const next = txn.state
    expect(next.sliceDoc(0, next.doc.length)).toBe('A\r\nXB\r\nC')
  })

  it('CRLF 内容删除末尾字符后仍保留 CRLF', () => {
    const state = EditorState.create({
      doc: 'A\r\nB\r\nC',
      extensions: [EditorState.lineSeparator.of('\r\n')]
    })
    // 删除末尾字符 C（LF 模型中 doc.length=5，删除位置 4→5）
    const txn = state.update({ changes: { from: 4, to: 5 } })
    const next = txn.state
    expect(next.sliceDoc(0, next.doc.length)).toBe('A\r\nB\r\n')
  })

  it('单 CR 换行风格编辑后保留单 CR', () => {
    const state = EditorState.create({
      doc: 'A\rB\rC',
      extensions: [EditorState.lineSeparator.of('\r')]
    })
    const txn = state.update({ changes: { from: 1, to: 1, insert: 'X' } })
    const next = txn.state
    expect(next.sliceDoc(0, next.doc.length)).toBe('AX\rB\rC')
  })

  it('LF 风格内容编辑后保持 LF', () => {
    const state = EditorState.create({
      doc: 'A\nB\nC',
      extensions: [EditorState.lineSeparator.of('\n')]
    })
    const txn = state.update({ changes: { from: 1, to: 1, insert: 'X' } })
    const next = txn.state
    expect(next.sliceDoc(0, next.doc.length)).toBe('AX\nB\nC')
  })

  it('内部 doc 为 LF，序列化 sliceDoc 为 CRLF（显示 LF、发送 CRLF）', () => {
    const state = EditorState.create({
      doc: 'A\r\nB',
      extensions: [EditorState.lineSeparator.of('\r\n')]
    })
    // 内部模型是 LF（textarea 等价），序列化输出 CRLF
    expect(state.doc.toString()).toBe('A\nB')
    expect(state.sliceDoc(0, state.doc.length)).toBe('A\r\nB')
  })
})
