import { useState, useCallback, KeyboardEvent } from 'react'
import { Input, Button, Space, Switch } from 'antd'
import { SendOutlined, ClearOutlined, ColumnWidthOutlined, MergeCellsOutlined } from '@ant-design/icons'
import type { EncodingMode, DisplayMode } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import { countControlChars } from '../common/AsciiHighlighter'
import EncodingSelector from '../encoding/EncodingSelector'
import './SendPanel.css'

interface Props {
  tabId: string
  splitView?: boolean
  onToggleSplit?: () => void
}

export default function SendPanel({ tabId, splitView, onToggleSplit }: Props): JSX.Element {
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)
  const [draftInput, setDraftInput] = useState<string>('')
  const { send } = useIpc()
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === tabId))
  const updateSendOptions = useTabStore((s) => s.updateSendOptions)
  const encoding = tab?.sendOptions.encoding ?? 'utf-8'
  const displayMode = tab?.sendOptions.displayMode ?? 'text'
  const lfToCr = tab?.sendOptions.lfToCr ?? true
  const isConnected = tab?.status === 'connected' || tab?.status === 'listening'

  const doSend = useCallback(async (): Promise<void> => {
    if (!input) return
    const textToSend = input
    setSending(true)
    try {
      const encoder = new TextEncoder()
      let bytes: Uint8Array
      const finalText = lfToCr ? textToSend.replace(/\n/g, '\r') : textToSend
      if (encoding === 'gbk') {
        const encoded = await window.electronAPI.encoding.encodeText(finalText, 'gbk')
        bytes = new Uint8Array(encoded)
      } else if (encoding === 'utf-8') {
        bytes = encoder.encode(finalText)
      } else if (encoding === 'ascii') {
        bytes = new Uint8Array(finalText.split('').map((c) => c.charCodeAt(0) & 0x7f))
      } else {
        bytes = encoder.encode(finalText)
      }
      await send(tabId, bytes, encoding)
      setHistory((prev) => [textToSend, ...prev])
      setHistoryIndex(-1)
      setDraftInput('')
      setInput('')
    } catch (err) {
      console.error('send failed:', err)
    } finally {
      setSending(false)
    }
  }, [input, encoding, tabId, send, lfToCr])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (history.length === 0) return
        if (historyIndex === -1) {
          setDraftInput(input)
        }
        const newIndex = Math.min(historyIndex + 1, history.length - 1)
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (history.length === 0) return
        if (historyIndex <= 0) {
          setHistoryIndex(-1)
          setInput(draftInput)
          setDraftInput('')
          return
        }
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(history[newIndex])
        return
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        doSend()
        return
      }
      // Any other key: exit history mode
      if (historyIndex !== -1) {
        setHistoryIndex(-1)
        setDraftInput('')
      }
    },
    [history, historyIndex, input, draftInput, doSend]
  )

  const ctrlChars = countControlChars(input)

  return (
    <div className="send-panel">
      <div className="send-toolbar">
        <Space wrap size="small">
          <EncodingSelector value={encoding} onChange={(v) => updateSendOptions(tabId, { encoding: v })} />
          <Button size="small" onClick={() => updateSendOptions(tabId, { displayMode: displayMode === 'text' ? 'hex' : 'text' })}>
            {displayMode === 'text' ? 'TXT' : 'HEX'}
          </Button>
          <span className="send-option">
            <Switch
              checked={lfToCr}
              onChange={(v) => updateSendOptions(tabId, { lfToCr: v })}
              size="small"
            />
            <span className="send-option-label">LF转CR</span>
          </span>
        </Space>
        {onToggleSplit && (
          <Button type="text" size="small"
            icon={splitView ? <MergeCellsOutlined /> : <ColumnWidthOutlined />}
            onClick={onToggleSplit}>
            {splitView ? '合并' : '分开'}
          </Button>
        )}
      </div>
      <div className="send-input-area">
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? '输入要发送的内容 (Ctrl+Enter 发送, ↑↓ 历史)' : '请先建立连接'}
          disabled={!isConnected || sending}
          rows={6}
          style={{ resize: 'none' }}
        />
      </div>
      <div className="send-actions">
        <Space>
          <Button type="primary" icon={<SendOutlined />} onClick={doSend} loading={sending} disabled={!isConnected || !input.trim()}>
            发送
          </Button>
          <Button icon={<ClearOutlined />} onClick={() => setInput('')} disabled={!input}>
            清空
          </Button>
        </Space>
        <span className="send-hint">
          {ctrlChars.length > 0
            ? `ASCII: ${ctrlChars.join(', ')}`
            : 'Ctrl+Enter 发送'}
        </span>
      </div>
    </div>
  )
}
