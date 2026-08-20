import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import type { KeyBinding } from '@codemirror/view'
import { Button, Space, Switch } from 'antd'
import { SendOutlined, ClearOutlined, ColumnWidthOutlined, MergeCellsOutlined } from '@ant-design/icons'
import type { EncodingMode, DisplayMode } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import { normalizeToLf } from '../../hooks/lineEnding'
import { countControlChars } from '../common/AsciiHighlighter'
import CrPreservingEditor, { type CrPreservingEditorHandle } from '../common/CrPreservingEditor'
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
  const quickSendItems = useTabStore((s) => s.quickSendItems)
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
      // lfToCr 时先归一化再转换，避免 CRLF 双重转换；否则按原样发送（保留粘贴/编辑的 CR/CRLF）
      const finalText = lfToCr ? normalizeToLf(textToSend).replace(/\n/g, '\r') : textToSend
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

  const historyUp = useCallback((): void => {
    if (history.length === 0) return
    if (historyIndex === -1) {
      setDraftInput(input)
    }
    const newIndex = Math.min(historyIndex + 1, history.length - 1)
    setHistoryIndex(newIndex)
    setInput(history[newIndex])
  }, [history, historyIndex, input])

  const historyDown = useCallback((): void => {
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
  }, [history, historyIndex, draftInput])

  // CodeMirror keymap 只在首次挂载时创建，闭包固定。
  // 用 ref 转发最新 handler，避免 keymap 捕获过期闭包导致快捷键无响应。
  const handlersRef = useRef({ doSend, historyUp, historyDown })
  handlersRef.current = { doSend, historyUp, historyDown }

  const sendKeymap = useMemo<KeyBinding[]>(() => [
    { key: 'Mod-Enter', run: () => { handlersRef.current.doSend(); return true } },
    { key: 'Mod-ArrowUp', run: () => { handlersRef.current.historyUp(); return true } },
    { key: 'Mod-ArrowDown', run: () => { handlersRef.current.historyDown(); return true } }
  ], [])

  // 编辑器实例：外部设置内容（历史切换/清空/快捷填充）时同步
  const editorRef = useRef<CrPreservingEditorHandle>(null)
  useEffect(() => {
    editorRef.current?.setValue(input)
  }, [input])

  const ctrlChars = countControlChars(input)

  const handleQuickTag = useCallback((content: string) => {
    setInput(content)
  }, [])

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
      {quickSendItems.length > 0 && (
        <div className="send-quick-tags">
          {quickSendItems.map((item) => (
            <span key={item.id} className="send-quick-tag" title={item.content}
              onClick={() => handleQuickTag(item.content)}>
              {item.name}
            </span>
          ))}
        </div>
      )}
      <div className="send-input-area" onClick={() => editorRef.current?.focus()}>
        <CrPreservingEditor
          ref={editorRef}
          initialValue={input}
          onChange={setInput}
          extraKeymap={sendKeymap}
          placeholder={isConnected ? '输入要发送的内容 (Ctrl+Enter 发送, Ctrl+↑↓ 历史)' : '请先建立连接'}
          disabled={!isConnected || sending}
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
