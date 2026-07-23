import { useEffect, useRef } from 'react'
import type { Message, DisplayMode, EncodingMode } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import MessageItem from './MessageItem'
import './MessageList.css'

interface Props {
  tabId: string
  messages: Message[]
  displayMode: DisplayMode
  encoding: EncodingMode
}

export default function MessageList({ tabId, messages, displayMode, encoding }: Props): JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null)
  const clearMessages = useTabStore((s) => s.clearMessages)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleDoubleClick = (): void => {
    if (messages.length > 0) {
      clearMessages(tabId)
    }
  }

  return (
    <div className="message-list" onDoubleClick={handleDoubleClick}>
      <div className="message-list-scroll">
        {messages.length === 0 ? (
          <div className="message-list-empty">暂无消息</div>
        ) : (
          messages.map((msg) => (
            <MessageItem key={msg.id} message={msg} displayMode={displayMode} encoding={encoding} />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
