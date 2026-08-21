import React from 'react'

function ctrl(label: string, key: number): React.ReactNode {
  return <span className="ctrl" key={key}>{`<${label}>`}</span>
}

export function renderMessageBody(text: string, mode: 'text' | 'hex'): React.ReactNode[] {
  if (mode === 'hex') return [text]
  const nodes: React.ReactNode[] = []
  let key = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code === 0x0d && i + 1 < text.length && text.charCodeAt(i + 1) === 0x0a) {
      nodes.push(ctrl('CR', key++)); nodes.push(ctrl('LF', key++)); nodes.push(<br key={key++} />); i++
    } else if (code === 0x0d) {
      nodes.push(ctrl('CR', key++)); nodes.push(<br key={key++} />)
    } else if (code === 0x0a) {
      nodes.push(ctrl('LF', key++)); nodes.push(<br key={key++} />)
    } else if (code === 0x09) {
      nodes.push(ctrl('TAB', key++))
    } else {
      nodes.push(text[i])
    }
  }
  return nodes
}
