import { useState, useCallback } from 'react'
import { Tooltip } from 'antd'
import { CopyOutlined, CheckOutlined } from '@ant-design/icons'
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
  const [copied, setCopied] = useState(false)
  const directionSymbol = message.direction === 'tx' ? '→' : '←'
  const content =
    displayMode === 'hex' ? formatHex(message.raw) : highlightAscii(message.text || decodeText(message.raw, encoding))

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(message.text || decodeText(message.raw, encoding))
      setCopied(true)
      setTimeout(() => setCopied(false), 1000)
    } catch {
      // fallback
    }
  }, [message.text, message.raw, encoding])

  return (
    <div className={`message-item message-${message.direction}`}>
      <span className="message-time">[{formatTime(message.timestamp)}]</span>
      <span className="message-direction">{directionSymbol}</span>
      <span className="message-remote">{message.remote}</span>
      <span className="message-length">({message.byteLength} bytes)</span>
      <span className="message-content">{content}</span>
      <Tooltip title={copied ? '已复制' : '复制原文'} open={copied ? true : undefined}>
        <span className={`message-copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
          {copied ? <CheckOutlined /> : <CopyOutlined />}
        </span>
      </Tooltip>
    </div>
  )
}
