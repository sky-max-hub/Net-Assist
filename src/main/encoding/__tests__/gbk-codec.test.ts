import { describe, it, expect } from 'vitest'
import { encodeGBK, decodeGBK } from '../gbk-codec'

describe('GBK codec', () => {
  it('encodes Chinese text to GBK bytes', () => {
    const result = encodeGBK('你好')
    expect(result.length).toBe(4)
  })

  it('encodes ASCII text as single bytes', () => {
    const result = encodeGBK('hello')
    expect(result.length).toBe(5)
    expect(result.toString()).toBe('hello')
  })

  it('round-trips: encode then decode', () => {
    const original = '你好世界'
    const encoded = encodeGBK(original)
    const decoded = decodeGBK(encoded)
    expect(decoded).toBe(original)
  })

  it('decodes GBK bytes to text', () => {
    const encoded = encodeGBK('测试')
    const decoded = decodeGBK(encoded)
    expect(decoded).toBe('测试')
  })
})
