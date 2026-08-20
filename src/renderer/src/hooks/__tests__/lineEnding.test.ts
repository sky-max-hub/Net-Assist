// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { detectLineEnding, expandLineEnding, normalizeToLf } from '../lineEnding'

describe('lineEnding 工具 — 换行风格处理', () => {
  it('detectLineEnding 识别 crlf / cr / lf', () => {
    expect(detectLineEnding('A\r\nB')).toBe('crlf')
    expect(detectLineEnding('A\rB')).toBe('cr')
    expect(detectLineEnding('A\nB')).toBe('lf')
    expect(detectLineEnding('plain')).toBe('lf')
  })

  it('expandLineEnding 按风格展开 LF', () => {
    expect(expandLineEnding('A\nB', 'crlf')).toBe('A\r\nB')
    expect(expandLineEnding('A\nB', 'cr')).toBe('A\rB')
    expect(expandLineEnding('A\nB', 'lf')).toBe('A\nB')
  })

  it('normalizeToLf 将 CRLF/CR 归一到 LF', () => {
    expect(normalizeToLf('A\r\nB')).toBe('A\nB')
    expect(normalizeToLf('A\rB')).toBe('A\nB')
    expect(normalizeToLf('A\nB')).toBe('A\nB')
  })

  it('textarea 显示层把 CR 规范化为 LF（HTML 规范，无法显示 CR 字符）', () => {
    // 验证：设置含 CR 的 value 到原生 textarea，读回为 LF
    const ta = document.createElement('textarea')
    ta.value = 'A\r\nB'
    expect(ta.value).toBe('A\nB')
  })

  it('lfToCr 发送转换：先归一化再转换，CRLF 不产生双 CR', () => {
    // doSend / handleQuickSend 的 lfToCr 逻辑
    const finalText = normalizeToLf('A\r\nB').replace(/\n/g, '\r')
    expect(finalText).toBe('A\rB')
  })
})
