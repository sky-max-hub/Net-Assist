import { useEffect, useRef } from 'react'
import type { Message, DisplayMode, EncodingMode } from '../../../shared/types'
import MessageItem from './MessageItem'
import './MessageList.css'

interface Props {
  messages: Message[]
  displayMode: DisplayMode
  encoding: EncodingMode
}

export default function MessageList({ messages, displayMode, encoding }: Props): JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="message-list-empty">暂无消息</div>
      ) : (
        messages.map((msg) => (
          <MessageItem key={msg.id} message={msg} displayMode={displayMode} encoding={encoding} />
        ))
      )}
      <div ref={bottomRef} />
    </div>
  )
}
