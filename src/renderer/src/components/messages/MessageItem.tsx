import type { Message, DisplayMode, EncodingMode } from '../../../shared/types'
import { highlightAscii } from '../common/AsciiHighlighter'

interface Props {
  message: Message
  displayMode: DisplayMode
  encoding: EncodingMode
}

function decodeText(data: ArrayBuffer, encoding: EncodingMode): string {
  const arr = new Uint8Array(data)
  if (encoding === 'ascii') {
    return Array.from(arr).map((b) => String.fromCharCode(b & 0x7f)).join('')
  }
  if (encoding === 'gbk') {
    return '[GBK 解码不可用]'
  }
  const decoder = new TextDecoder('utf-8')
  try {
    return decoder.decode(arr)
  } catch {
    return '[解码失败]'
  }
}

function formatHex(data: ArrayBuffer): string {
  const arr = new Uint8Array(data)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return (
    d.getHours().toString().padStart(2, '0') +
    ':' +
    d.getMinutes().toString().padStart(2, '0') +
    ':' +
    d.getSeconds().toString().padStart(2, '0') +
    '.' +
    d.getMilliseconds().toString().padStart(3, '0')
  )
}

export default function MessageItem({ message, displayMode, encoding }: Props): JSX.Element {
  const directionSymbol = message.direction === 'tx' ? '→' : '←'
  const content =
    displayMode === 'hex' ? formatHex(message.raw) : highlightAscii(message.text || decodeText(message.raw, encoding))

  return (
    <div className={`message-item message-${message.direction}`}>
      <span className="message-time">[{formatTime(message.timestamp)}]</span>
      <span className="message-direction">{directionSymbol}</span>
      <span className="message-remote">{message.remote}</span>
      <span className="message-length">({message.byteLength} bytes)</span>
      <span className="message-content">{content}</span>
    </div>
  )
}
