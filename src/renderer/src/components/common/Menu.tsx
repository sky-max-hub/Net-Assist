import React, { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import './Menu.css'

interface MenuProps {
  title?: string
  style: React.CSSProperties
  onClose: () => void
  children: React.ReactNode
}

/** 通用下拉菜单：createPortal 到 body，点击外部 / Escape 关闭（样式见 design/base.css） */
export default function Menu({ title, style, onClose, children }: MenuProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDocClick); document.removeEventListener('keydown', onKey) }
  }, [onClose])
  return createPortal(
    <div className="menu" ref={ref} style={style}>
      {title && <div className="menu-title">{title}</div>}
      {children}
    </div>,
    document.body
  )
}

/** 由锚点元素计算菜单浮层位置：锚点下方 6px，右对齐（右缘距视口 ≥8px） */
export function menuPosition(anchor: DOMRect): React.CSSProperties {
  return { top: anchor.bottom + 6, left: Math.max(8, anchor.right - 216) }
}
