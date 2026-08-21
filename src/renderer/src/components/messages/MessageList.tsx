import { useEffect, useRef } from 'react'
import type { TabState, Message } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import MessageItem from './MessageItem'
import './MessageList.css'

interface Props { tab: TabState }

function Column({ label, cls, messages, displayMode, onClear }: { label: string; cls: string; messages: Message[]; displayMode: TabState['sendOptions']['displayMode']; onClear: () => void }): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight
  }, [messages.length])
  return (
    <div className={`msg-col ${cls}`} ref={ref} onDoubleClick={onClear}>
      <div className="msg-col-head">
        <span className="mch-label">{label}</span><span className="mch-count">{messages.length} 条</span>
        <span className="spacer" />
        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onClear() }} disabled={messages.length === 0}>清空</button>
      </div>
      <div className="msg-list">
        {messages.length === 0 ? <div className="empty-msg">暂无数据<span className="em-kbd">连接后收发数据将显示在这里</span></div>
          : messages.map((m) => <MessageItem key={m.id} message={m} displayMode={displayMode} />)}
      </div>
    </div>
  )
}

export default function MessageList({ tab }: Props): JSX.Element {
  const clearMessages = useTabStore((s) => s.clearMessages)
  const clearDirectionMessages = useTabStore((s) => s.clearDirectionMessages)
  const areaRef = useRef<HTMLDivElement>(null)
  const split = tab.sendOptions.splitView
  const displayMode = tab.sendOptions.displayMode
  const tx = tab.messages.filter((m) => m.direction === 'tx')
  const rx = tab.messages.filter((m) => m.direction === 'rx')

  useEffect(() => {
    if (areaRef.current) areaRef.current.scrollTop = areaRef.current.scrollHeight
  }, [tab.messages.length, split])

  if (split) {
    return (
      <div className="msg-area split">
        <Column label="TX 发送" cls="tx-col" messages={tx} displayMode={displayMode} onClear={() => clearDirectionMessages(tab.id, 'tx')} />
        <Column label="RX 接收" cls="rx-col" messages={rx} displayMode={displayMode} onClear={() => clearDirectionMessages(tab.id, 'rx')} />
      </div>
    )
  }
  return (
    <div className="msg-area" ref={areaRef} onDoubleClick={() => clearMessages(tab.id)}>
      <div className="msg-list">
        {tab.messages.length === 0 ? <div className="empty-msg">暂无消息<span className="em-kbd">连接后收发数据将显示在这里</span></div>
          : tab.messages.map((m) => <MessageItem key={m.id} message={m} displayMode={displayMode} />)}
      </div>
    </div>
  )
}
