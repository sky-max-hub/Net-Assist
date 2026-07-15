import { useState, useCallback, KeyboardEvent } from 'react'
import { Input, Button, Space } from 'antd'
import { SendOutlined, ClearOutlined } from '@ant-design/icons'
import type { EncodingMode, DisplayMode } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import EncodingSelector from '../encoding/EncodingSelector'
import './SendPanel.css'

interface Props {
  tabId: string
}

export default function SendPanel({ tabId }: Props): JSX.Element {
  const [input, setInput] = useState('')
  const [encoding, setEncoding] = useState<EncodingMode>('utf-8')
  const [displayMode, setDisplayMode] = useState<DisplayMode>('text')
  const [sending, setSending] = useState(false)
  const { send } = useIpc()
  const tab = useTabStore((s) => s.tabs.find((t) => t.id === tabId))
  const isConnected = tab?.status === 'connected' || tab?.status === 'listening'

  const doSend = useCallback(async (): Promise<void> => {
    if (!input) return
    const textToSend = input
    setSending(true)
    try {
      const encoder = new TextEncoder()
      let bytes: Uint8Array
      if (encoding === 'utf-8') {
        bytes = encoder.encode(textToSend)
      } else if (encoding === 'ascii') {
        bytes = new Uint8Array(textToSend.split('').map((c) => c.charCodeAt(0) & 0x7f))
      } else {
        bytes = encoder.encode(textToSend)
      }
      await send(tabId, bytes)
      setInput('')
    } catch (err) {
      console.error('send failed:', err)
    } finally {
      setSending(false)
    }
  }, [input, encoding, tabId, send])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>): void => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        doSend()
      }
    },
    [doSend]
  )

  return (
    <div className="send-panel">
      <div className="send-toolbar">
        <Space wrap size="small">
          <EncodingSelector value={encoding} onChange={setEncoding} />
          <Button size="small" onClick={() => setDisplayMode(displayMode === 'text' ? 'hex' : 'text')}>
            {displayMode === 'text' ? 'TXT' : 'HEX'}
          </Button>
        </Space>
      </div>
      <div className="send-input-area">
        <Input.TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? '输入要发送的内容 (Ctrl+Enter 发送)' : '请先建立连接'}
          disabled={!isConnected || sending}
          rows={4}
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
        <span className="send-hint">Ctrl+Enter 发送</span>
      </div>
    </div>
  )
}
