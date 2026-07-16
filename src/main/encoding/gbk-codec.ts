import * as iconv from 'iconv-lite'

export function encodeGBK(text: string): Buffer {
  return iconv.encode(text, 'gbk')
}

export function decodeGBK(buffer: Buffer): string {
  return iconv.decode(buffer, 'gbk')
}

export function encodeText(text: string, encoding: string): Buffer {
  if (encoding === 'ascii') {
    return Buffer.from(text.split('').map((c) => c.charCodeAt(0) & 0x7f))
  }
  if (encoding === 'gbk') {
    return iconv.encode(text, 'gbk')
  }
  return Buffer.from(text, 'utf-8')
}

export function decodeText(buffer: Buffer, encoding: string): string {
  if (encoding === 'ascii') {
    return buffer.toString('ascii')
  }
  if (encoding === 'gbk') {
    return iconv.decode(buffer, 'gbk')
  }
  return buffer.toString('utf-8')
}
