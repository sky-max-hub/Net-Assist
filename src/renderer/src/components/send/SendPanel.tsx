import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import type { KeyBinding } from '@codemirror/view'
import type { TabState, EncodingMode } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import { countControlChars } from '../common/AsciiHighlighter'
import CrPreservingEditor, { type CrPreservingEditorHandle } from '../common/CrPreservingEditor'
import { useUiStore } from '../../store/ui-store'
import { isLive } from '../../store/tab-meta'
import Icon from '../common/Icons'
import Menu, { menuPosition } from '../common/Menu'
import './SendPanel.css'

// 显示标签大写，存储值用小写 EncodingMode（与 IPC/主进程约定一致）
const ENCODINGS: { label: string; value: EncodingMode }[] = [
  { label: 'ASCII', value: 'ascii' },
  { label: 'UTF-8', value: 'utf-8' },
  { label: 'GBK', value: 'gbk' }
]

export default function SendPanel({ tab }: { tab: TabState }): JSX.Element {
  const tabId = tab.id
  const updateSendOptions = useTabStore((s) => s.updateSendOptions)
  const quickSendItems = useTabStore((s) => s.quickSendItems)
  const quickTagsCount = (useUiStore((s) => s.settings.quickTagsCount) as number) || 5
  const showToast = useUiStore((s) => s.showToast)
  const openQuickSendModal = useUiStore((s) => s.openQuickSendModal)
  const { send } = useIpc()

  const encoding = tab.sendOptions.encoding
  const displayMode = tab.sendOptions.displayMode
  const isConnected = isLive(tab)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [draftInput, setDraftInput] = useState('')
  const [historyMenu, setHistoryMenu] = useState<React.CSSProperties | null>(null)
  const editorRef = useRef<CrPreservingEditorHandle>(null)

  useEffect(() => { editorRef.current?.setValue(input) }, [input])

  const doSend = useCallback(async (textToSend?: string): Promise<void> => {
    const content = textToSend ?? input
    if (!content) return
    setSending(true)
    try {
      const finalText = content
      let bytes: Uint8Array
      if (encoding === 'gbk') {
        const encoded = await window.electronAPI.encoding.encodeText(finalText, 'gbk')
        bytes = new Uint8Array(encoded)
      } else if (encoding === 'ascii') {
        bytes = new Uint8Array(finalText.split('').map((c) => c.charCodeAt(0) & 0x7f))
      } else {
        bytes = new TextEncoder().encode(finalText)
      }
      await send(tabId, bytes, encoding)
      setHistory((prev) => [content, ...prev])
      setHistoryIndex(-1); setDraftInput(''); setInput('')
      showToast('已发送')
    } catch (err) { console.error('send failed:', err) } finally { setSending(false) }
  }, [input, encoding, tabId, send, showToast])

  const historyUp = useCallback((): void => {
    if (history.length === 0) return
    if (historyIndex === -1) setDraftInput(input)
    const idx = Math.min(historyIndex + 1, history.length - 1)
    setHistoryIndex(idx)
    setInput(history[idx])
  }, [history, historyIndex, input])

  const historyDown = useCallback((): void => {
    if (history.length === 0) return
    if (historyIndex <= 0) { setHistoryIndex(-1); setInput(draftInput); setDraftInput('') }
    else { const idx = historyIndex - 1; setHistoryIndex(idx); setInput(history[idx]) }
  }, [history, historyIndex, draftInput])

  const handlersRef = useRef({ doSend, historyUp, historyDown })
  handlersRef.current = { doSend, historyUp, historyDown }

  const sendKeymap = useMemo<KeyBinding[]>(() => [
    { key: 'Mod-Enter', run: () => { handlersRef.current.doSend(); return true } },
    { key: 'Mod-ArrowUp', run: () => { handlersRef.current.historyUp(); return true } },
    { key: 'Mod-ArrowDown', run: () => { handlersRef.current.historyDown(); return true } }
  ], [])

  const chips = quickSendItems.slice(0, quickTagsCount)

  const fill = (content: string): void => { setInput(content); editorRef.current?.focus() }
  const chipSend = (content: string): void => { if (isConnected) { doSend(content) } else showToast('请先建立连接') }

  const ctrlHits = countControlChars(input)
  const asciiHint = ctrlHits.length ? `ASCII: ${ctrlHits.join(', ')}` : ''
  const encLabel = ENCODINGS.find((e) => e.value === encoding)?.label ?? encoding
  const encHint = encLabel + (displayMode === 'hex' ? ' · HEX' : '')

  return (
    <div className="composer">
      <div className="cmp-toolbar">
        <div className="seg" role="group" aria-label="编码">
          {ENCODINGS.map((e) => (
            <button key={e.value} className={encoding === e.value ? 'active' : ''} onClick={() => updateSendOptions(tabId, { encoding: e.value })}>{e.label}</button>
          ))}
        </div>
        <div className="toolbar-sep" />
        <div className="seg" role="group" aria-label="显示格式">
          <button className={displayMode === 'text' ? 'active' : ''} title="文本" onClick={() => updateSendOptions(tabId, { displayMode: 'text' })}>TXT</button>
          <button className={displayMode === 'hex' ? 'active' : ''} title="十六进制" onClick={() => updateSendOptions(tabId, { displayMode: 'hex' })}>HEX</button>
        </div>
        <div className="toolbar-sep" />
        <button className="cmp-history-btn" title="发送历史 (Ctrl+↑↓)" onClick={(e) => setHistoryMenu(menuPosition((e.currentTarget as HTMLElement).getBoundingClientRect()))}>
          <Icon name="history" size={13} />发送历史
        </button>
        <div className="spacer" />
        <button className="btn btn-secondary btn-sm tb-send" title="发送 (Ctrl+Enter)" disabled={!isConnected || !input.trim() || sending} onClick={() => doSend()}>
          <Icon name="send" size={14} />发送
        </button>
      </div>

      {chips.length > 0 ? (
        <div className="cmp-chips">
          {chips.map((c) => (
            <span key={c.id} className="chip" title="点击填入发送框" onClick={() => fill(c.content)}>
              <span className="chip-name">{c.name}</span>
              <Icon name="play" size={12} className="chip-send" title="立即发送"
                onClick={(e) => { e.stopPropagation(); chipSend(c.content) }} />
            </span>
          ))}
        </div>
      ) : (
        <div className="cmp-chips">
          <span className="chip" onClick={openQuickSendModal}>+ 添加快捷指令</span>
        </div>
      )}

      <div className="cmp-row">
        <CrPreservingEditor
          ref={editorRef}
          initialValue={input}
          onChange={setInput}
          extraKeymap={sendKeymap}
          placeholder={isConnected ? '输入要发送的内容 (Ctrl+Enter 发送 · Ctrl+↑↓ 历史)' : '请先建立连接'}
          disabled={sending}
          className="cmp-input"
        />
      </div>

      <div className="cmp-hint">
        <span><kbd>Ctrl</kbd>+<kbd>Enter</kbd> 发送</span>
        <span><kbd>Ctrl</kbd>+<kbd>↑↓</kbd> 历史</span>
        <span>双击消息面板清空</span>
        <span className="spacer" />
        {asciiHint && <span className="ascii-hint">{asciiHint}</span>}
        <span className="enc-hint">{encHint}</span>
      </div>

      {historyMenu && (
        <Menu style={{ ...historyMenu, maxHeight: 190 }} onClose={() => setHistoryMenu(null)}>
          {history.length === 0
            ? <div className="menu-empty">暂无历史 · Ctrl+↑↓ 回溯</div>
            : history.slice(0, 50).map((h) => (
                <div key={h} className="menu-item history-item" onClick={() => { fill(h); setHistoryMenu(null) }}>{h}</div>
              ))}
        </Menu>
      )}
    </div>
  )
}
