import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import './Modal.css'

interface ModalProps {
  title: string
  sub?: string
  onClose: () => void
  children: React.ReactNode
  actions?: React.ReactNode
}

/** 通用模态弹窗：createPortal 到 body，Escape / 点击背景关闭（样式见 design/base.css） */
export default function Modal({ title, sub, onClose, children, actions }: ModalProps): JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal">
        {title && <h3>{title}</h3>}
        {sub && <p className="modal-sub">{sub}</p>}
        {children}
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>,
    document.body
  )
}
