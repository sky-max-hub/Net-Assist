import { useState, useCallback } from 'react'
import type { Message, DisplayMode } from '../../../shared/types'
import { formatTime } from '../common/format'
import { renderMessageBody } from './fmtBody'
import Icon from '../common/Icons'

interface Props { message: Message; displayMode: DisplayMode }

function formatHex(data: ArrayBuffer): string {
  const arr = new Uint8Array(data)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0').toUpperCase()).join(' ')
}

export default function MessageItem({ message, displayMode }: Props): JSX.Element {
  const [copied, setCopied] = useState(false)
  const dirSymbol = message.direction === 'tx' ? '→' : '←'
  const body = displayMode === 'hex' ? formatHex(message.raw) : message.text || ''
  const copyText = message.text || (message.raw ? new TextDecoder('utf-8').decode(message.raw) : '')

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(copyText)
      setCopied(true)
      setTimeout(() => setCopied(false), 900)
    } catch { /* 剪贴板不可用时静默 */ }
  }, [copyText])

  return (
    <div className={`msg-row ${message.direction}`}>
      <div className="msg-meta">
        <span className="msg-time">[{formatTime(message.timestamp)}]</span>
        <span className="msg-dir">{dirSymbol}</span>
        <span className="msg-peer">{message.remote}</span>
        <span className="msg-bytes">({message.byteLength} bytes)</span>
        <button className={`icon-btn msg-copy${copied ? ' copied' : ''}`} title="复制原文" aria-label="复制" onClick={handleCopy}>
          {copied ? <Icon name="check" /> : <Icon name="copy" />}
        </button>
      </div>
      <div className="msg-body">{renderMessageBody(body, displayMode)}</div>
    </div>
  )
}
