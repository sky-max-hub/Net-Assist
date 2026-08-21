// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import { renderMessageBody } from '../fmtBody'

function htmlOf(nodes: React.ReactNode[]): string {
  const { container } = render(React.createElement('span', null, nodes))
  // 取 span 内部 HTML，排除容器包装，便于 toBe 断言
  return (container.firstChild as HTMLElement).innerHTML
}

describe('fmtBody 控制符可视化', () => {
  it('CRLF → <CR><LF> + 换行', () => {
    expect(htmlOf(renderMessageBody('A\r\nB', 'text'))).toContain('<span class="ctrl">&lt;CR&gt;</span>')
    expect(htmlOf(renderMessageBody('A\r\nB', 'text'))).toContain('<span class="ctrl">&lt;LF&gt;</span>')
  })
  it('单 CR / 单 LF 各自成 chip + 换行', () => {
    expect(htmlOf(renderMessageBody('A\rB', 'text'))).toContain('&lt;CR&gt;')
    expect(htmlOf(renderMessageBody('A\nB', 'text'))).toContain('&lt;LF&gt;')
  })
  it('TAB → <TAB> chip', () => {
    expect(htmlOf(renderMessageBody('a\tb', 'text'))).toContain('&lt;TAB&gt;')
  })
  it('hex 模式原样输出', () => {
    expect(htmlOf(renderMessageBody('01 03 00 0A', 'hex'))).toBe('01 03 00 0A')
  })
})
