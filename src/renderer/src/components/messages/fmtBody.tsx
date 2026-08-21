import React from 'react'

const CTRL_LABELS: Record<number, string> = {
  0x00: 'NUL', 0x01: 'SOH', 0x02: 'STX', 0x03: 'ETX', 0x04: 'EOT',
  0x05: 'ENQ', 0x06: 'ACK', 0x07: 'BEL', 0x08: 'BS', 0x09: 'TAB',
  0x0a: 'LF', 0x0b: 'VT', 0x0c: 'FF', 0x0d: 'CR', 0x0e: 'SO', 0x0f: 'SI',
  0x10: 'DLE', 0x11: 'DC1', 0x12: 'DC2', 0x13: 'DC3', 0x14: 'DC4',
  0x15: 'NAK', 0x16: 'SYN', 0x17: 'ETB', 0x18: 'CAN', 0x19: 'EM',
  0x1a: 'SUB', 0x1b: 'ESC', 0x1c: 'FS', 0x1d: 'GS', 0x1e: 'RS',
  0x1f: 'US', 0x7f: 'DEL'
}

function ctrl(label: string, key: number): React.ReactNode {
  return <span className="ctrl" key={key}>{`<${label}>`}</span>
}

/** 控制符可视化：CR/LF 带换行；TAB 及其余 C0 控制符 + DEL 渲染为 <X> 标记。仅影响显示。 */
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
    } else if (CTRL_LABELS[code]) {
      nodes.push(ctrl(CTRL_LABELS[code], key++))
    } else {
      nodes.push(text[i])
    }
  }
  return nodes
}

/** 单行预览：控制符渲染为 <X> 标记（不插入换行），用于快捷指令等单行内容展示 */
export function renderInlineControls(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let key = 0
  for (let i = 0; i < text.length; i++) {
    const label = CTRL_LABELS[text.charCodeAt(i)]
    if (label) {
      nodes.push(<span className="ctrl" key={key++}>{`<${label}>`}</span>)
    } else {
      nodes.push(text[i])
    }
  }
  return nodes
}
