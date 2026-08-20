// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import React, { createRef } from 'react'
import CrPreservingEditor, { type CrPreservingEditorHandle } from '../CrPreservingEditor'

afterEach(cleanup)

// 注意：jsdom 无法测量 CodeMirror 文本（measureTextSize 报错），
// 真实的粘贴/打字交互无法在 jsdom 验证，需在真实 Electron 环境测试。
// 这里验证可通过 dispatch 触发的核心数据流。

describe('外部设置（setValue）CRLF 保留', () => {
  it('setValue 设置 CRLF 后 onChange 输出保留 CRLF', () => {
    const onChange = vi.fn()
    const ref = createRef<CrPreservingEditorHandle>()
    render(
      React.createElement(CrPreservingEditor, { initialValue: '', onChange, ref })
    )
    ref.current?.setValue('A\r\nB')
    expect(onChange.mock.calls.length).toBeGreaterThan(0)
    expect(onChange.mock.calls[0][0]).toBe('A\r\nB')
  })

  it('编辑后父组件回传相同内容不重复触发（无循环，光标稳定前提）', () => {
    const onChange = vi.fn()
    const ref = createRef<CrPreservingEditorHandle>()
    render(
      React.createElement(CrPreservingEditor, { initialValue: 'A\r\nB', onChange, ref })
    )
    onChange.mockClear()
    ref.current?.setValue('A\r\nB')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('历史切换（setValue 不同 CRLF 内容）输出正确', () => {
    const onChange = vi.fn()
    const ref = createRef<CrPreservingEditorHandle>()
    render(
      React.createElement(CrPreservingEditor, { initialValue: 'OLD\r\n', onChange, ref })
    )
    onChange.mockClear()
    ref.current?.setValue('NEW\r\nX')
    expect(onChange.mock.calls.length).toBeGreaterThan(0)
    expect(onChange.mock.calls[0][0]).toBe('NEW\r\nX')
  })

  it('清空（setValue 空字符串）正常', () => {
    const onChange = vi.fn()
    const ref = createRef<CrPreservingEditorHandle>()
    render(
      React.createElement(CrPreservingEditor, { initialValue: 'A\r\nB', onChange, ref })
    )
    onChange.mockClear()
    ref.current?.setValue('')
    expect(onChange.mock.calls.length).toBeGreaterThan(0)
    expect(onChange.mock.calls[0][0]).toBe('')
  })
})
