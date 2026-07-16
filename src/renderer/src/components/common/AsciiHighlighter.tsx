import React from 'react'

const ASCII_NAMES: Record<number, string> = {
  0x00: 'NUL', 0x01: 'SOH', 0x02: 'STX', 0x03: 'ETX',
  0x04: 'EOT', 0x05: 'ENQ', 0x06: 'ACK', 0x07: 'BEL',
  0x08: 'BS',  0x09: 'TAB', 0x0A: 'LF',  0x0B: 'VT',
  0x0C: 'FF',  0x0D: 'CR',  0x0E: 'SO',  0x0F: 'SI',
  0x10: 'DLE', 0x11: 'DC1', 0x12: 'DC2', 0x13: 'DC3',
  0x14: 'DC4', 0x15: 'NAK', 0x16: 'SYN', 0x17: 'ETB',
  0x18: 'CAN', 0x19: 'EM',  0x1A: 'SUB', 0x1B: 'ESC',
  0x1C: 'FS',  0x1D: 'GS',  0x1E: 'RS',  0x1F: 'US',
  0x7F: 'DEL'
}

function getAsciiClass(code: number): string {
  if (code === 0x0A || code === 0x0D) return 'crlf'
  if (code === 0x09) return 'tab'
  if (code === 0x1B) return 'esc'
  if (code === 0x7F) return 'del'
  return 'other'
}

function asciiTag(code: number, key: number): React.ReactNode {
  const name = ASCII_NAMES[code] || `0x${code.toString(16).toUpperCase()}`
  return (
    <span key={key} className={`ascii-ctrl ascii-${getAsciiClass(code)}`}>
      {'<'}{name}{'>'}
    </span>
  )
}

export function highlightAscii(text: string): React.ReactNode[] {
  const result: React.ReactNode[] = []
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)

    // CRLF pair: both tags then one line break
    if (code === 0x0D && i + 1 < text.length && text.charCodeAt(i + 1) === 0x0A) {
      result.push(asciiTag(0x0D, i))
      result.push(asciiTag(0x0A, i + 0.5))
      result.push(<br key={`br-${i}`} />)
      i++ // skip LF
      continue
    }

    // CR alone: CR tag then line break
    if (code === 0x0D) {
      result.push(asciiTag(code, i))
      result.push(<br key={`br-${i}`} />)
      continue
    }

    // LF alone: LF tag then line break
    if (code === 0x0A) {
      result.push(asciiTag(code, i))
      result.push(<br key={`br-${i}`} />)
      continue
    }

    // Other control chars: inline tag
    if (code <= 0x1F || code === 0x7F) {
      result.push(asciiTag(code, i))
    } else {
      result.push(text[i])
    }
  }
  return result
}

export function countControlChars(text: string): string[] {
  const names: string[] = []
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code <= 0x1F || code === 0x7F) {
      names.push(ASCII_NAMES[code] || `0x${code.toString(16).toUpperCase()}`)
    }
  }
  return names
}
