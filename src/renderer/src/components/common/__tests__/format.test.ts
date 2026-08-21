import { describe, it, expect } from 'vitest'
import { fmtBytes, formatTime, fmtDur } from '../format'

describe('format 工具', () => {
  it('fmtBytes: B / KB / MB', () => {
    expect(fmtBytes(0)).toBe('0 B')
    expect(fmtBytes(512)).toBe('512 B')
    expect(fmtBytes(2048)).toBe('2.00 KB')
    expect(fmtBytes(1048576 * 2)).toBe('2.00 MB')
  })
  it('formatTime: HH:mm:ss.mmm', () => {
    const d = new Date(2026, 0, 1, 10, 5, 9, 123)
    expect(formatTime(d.getTime())).toBe('10:05:09.123')
  })
  it('fmtDur: m:ss 与 h:mm:ss', () => {
    expect(fmtDur(198)).toBe('3:18')
    expect(fmtDur(3661)).toBe('1:01:01')
  })
})
