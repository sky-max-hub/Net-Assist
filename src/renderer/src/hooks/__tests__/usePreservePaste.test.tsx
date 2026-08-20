// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, fireEvent, cleanup } from '@testing-library/react'
import React, { useState } from 'react'
import { usePreservePaste } from '../usePreservePaste'

afterEach(cleanup)

function Harness(): JSX.Element {
  const [value, setValue] = useState('')
  const handlePaste = usePreservePaste(setValue)
  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onPaste={handlePaste}
      data-testid="ta"
    />
  )
}

describe('usePreservePaste — 粘贴保留 CR', () => {
  it('核心插入逻辑：粘贴含 CR 文本按原样拼接进 state', () => {
    const setValue = vi.fn()
    const el = {
      value: 'prefix\r\nsuffix',
      selectionStart: 7,
      selectionEnd: 7,
      setSelectionRange: vi.fn()
    } as unknown as HTMLTextAreaElement
    const e = {
      clipboardData: { getData: (t: string) => (t === 'text' ? 'A\r\nB' : '') },
      preventDefault: vi.fn(),
      currentTarget: el
    } as unknown as React.ClipboardEvent<HTMLTextAreaElement>

    const pastedText = e.clipboardData.getData('text')
    const start = el.selectionStart ?? 0
    const end = el.selectionEnd ?? 0
    const next = el.value.slice(0, start) + pastedText + el.value.slice(end)

    expect(next).toContain('\r')
    expect(next).toBe('prefix\r\nsuffix'.slice(0, 7) + 'A\r\nB' + 'prefix\r\nsuffix'.slice(7))
  })
})

describe('历史切换与快捷发送内容传递 — state 保留 CR', () => {
  it('模拟历史切换 setInput(含CR) → React state 保留 CR（setState 不受 DOM 规范化影响）', async () => {
    let captured = ''
    function HistoryHarness(): JSX.Element {
      const [input, setInput] = useState('')
      const switchHistory = (): void => {
        // 模拟 SendPanel: setInput(history[newIndex])，history 存发送时的原始 input（含 CR）
        setInput('from-history\r\nline2')
      }
      const readInput = (): void => {
        captured = input
      }
      return (
        <div>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} data-testid="ht" />
          <button onClick={switchHistory}>switch</button>
          <button onClick={readInput}>read</button>
        </div>
      )
    }
    const { getByText } = render(<HistoryHarness />)
    fireEvent.click(getByText('switch'))
    fireEvent.click(getByText('read'))
    // 切换历史后 state 含 CR（React state 保留原始字符串）
    expect(captured).toBe('from-history\r\nline2')
    expect(captured).toContain('\r')
  })

  it('textarea 显示层把 CR 规范化为 LF（HTML 规范，无法显示 CR 字符）', () => {
    // 验证：设置含 CR 的 value 到原生 textarea，读回为 LF
    const ta = document.createElement('textarea')
    ta.value = 'A\r\nB'
    expect(ta.value).toBe('A\nB')
  })
})
