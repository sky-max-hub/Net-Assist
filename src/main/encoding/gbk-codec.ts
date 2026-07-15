import * as iconv from 'iconv-lite'

export function encodeGBK(text: string): Buffer {
  return iconv.encode(text, 'gbk')
}

export function decodeGBK(buffer: Buffer): string {
  return iconv.decode(buffer, 'gbk')
}
