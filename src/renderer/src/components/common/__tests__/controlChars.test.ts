// @vitest-environment jsdom
import { describe, it, expect, vi, afterAll } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React, { createRef } from 'react'
import { EditorState } from '@codemirror/state'
import CrPreservingEditor, { type CrPreservingEditorHandle } from '../CrPreservingEditor'
import { separatorKind, buildDecorations } from '../controlChars'

afterAll(() => cleanup())

describe('separatorKind：行分隔符种类映射（修复 CR 显示为 CRLF 的根因）', () => {
  it('CR-only 分隔符 → cr', () => {
    expect(separatorKind('\r')).toBe('cr')
  })

  it('CRLF 分隔符 → crlf', () => {
    expect(separatorKind('\r\n')).toBe('crlf')
  })

  it('LF 分隔符 → lf', () => {
    expect(separatorKind('\n')).toBe('lf')
  })

  it('未知/空分隔符 → lf（兜底）', () => {
    expect(separatorKind('')).toBe('lf')
    expect(separatorKind('x')).toBe('lf')
  })
})

describe('buildDecorations：初始内容即生成装饰（修复首次进入不显示 ASCII 标记）', () => {
  it('create 时对带 CR 行分隔符的初始 doc 生成装饰', () => {
    const state = EditorState.create({
      doc: 'A\rB\rC',
      extensions: [EditorState.lineSeparator.of('\r')]
    })
    expect(buildDecorations(state).size).toBeGreaterThan(0)
  })

  it('create 时对带 CRLF 行分隔符的初始 doc 生成装饰', () => {
    const state = EditorState.create({
      doc: 'A\r\nB',
      extensions: [EditorState.lineSeparator.of('\r\n')]
    })
    expect(buildDecorations(state).size).toBeGreaterThan(0)
  })

  it('空 doc 不生成装饰', () => {
    const state = EditorState.create({ doc: '', extensions: [EditorState.lineSeparator.of('\n')] })
    expect(buildDecorations(state).size).toBe(0)
  })

  it('纯文本（无控制符/换行）不生成装饰', () => {
    const state = EditorState.create({ doc: 'hello', extensions: [EditorState.lineSeparator.of('\n')] })
    expect(buildDecorations(state).size).toBe(0)
  })
})

describe('行分隔符标记渲染：粘贴什么显示什么', () => {
  it('CR 内容行尾只显示 <CR>，不显示 <LF>', () => {
    const onChange = vi.fn()
    const ref = createRef<CrPreservingEditorHandle>()
    const { container } = render(
      React.createElement(CrPreservingEditor, { initialValue: 'A\rB', onChange, ref })
    )
    // 触发一次 doc 变化以计算装饰（初始 state 无装饰）
    ref.current?.setValue('A\rB\rC')
    const lineSep = container.querySelectorAll('.cm-linesep')
    expect(lineSep.length).toBeGreaterThan(0)
    for (const node of Array.from(lineSep)) {
      const text = (node as HTMLElement).textContent ?? ''
      expect(text).toContain('<CR>')
      expect(text).not.toContain('<LF>')
    }
  })

  it('CRLF 内容行尾显示 <CR><LF>', () => {
    const onChange = vi.fn()
    const ref = createRef<CrPreservingEditorHandle>()
    const { container } = render(
      React.createElement(CrPreservingEditor, { initialValue: 'A\r\nB', onChange, ref })
    )
    ref.current?.setValue('A\r\nB\r\nC')
    const lineSep = container.querySelectorAll('.cm-linesep')
    expect(lineSep.length).toBeGreaterThan(0)
    for (const node of Array.from(lineSep)) {
      const text = (node as HTMLElement).textContent ?? ''
      expect(text).toContain('<CR>')
      expect(text).toContain('<LF>')
    }
  })

  it('LF 内容行尾只显示 <LF>', () => {
    const onChange = vi.fn()
    const ref = createRef<CrPreservingEditorHandle>()
    const { container } = render(
      React.createElement(CrPreservingEditor, { initialValue: 'A\nB', onChange, ref })
    )
    ref.current?.setValue('A\nB\nC')
    const lineSep = container.querySelectorAll('.cm-linesep')
    expect(lineSep.length).toBeGreaterThan(0)
    for (const node of Array.from(lineSep)) {
      const text = (node as HTMLElement).textContent ?? ''
      expect(text).toContain('<LF>')
      expect(text).not.toContain('<CR>')
    }
  })
})
