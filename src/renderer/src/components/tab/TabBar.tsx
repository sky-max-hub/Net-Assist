import React, { useState } from 'react'
import type { TabType } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import { useUiStore } from '../../store/ui-store'
import { TYPE_META, STATUS_META, filterConnections } from '../../store/tab-meta'
import Icon, { type IconName } from '../common/Icons'
import Menu, { menuPosition } from '../common/Menu'
import './TabBar.css'

const NEW_TAB_ITEMS: { type: TabType; icon: IconName; title: string; desc: string }[] = [
  { type: 'tcp-client', icon: 'client', title: 'TCP Client', desc: '连接远程主机' },
  { type: 'tcp-server', icon: 'server', title: 'TCP Server', desc: '本地监听服务' },
  { type: 'udp', icon: 'udp', title: 'UDP', desc: '无连接定向收发' }
]

export default function TabBar(): JSX.Element {
  const { tabs, activeTabId, createTab, closeTab, reorderTabs, setActiveTab } = useTabStore()
  const { disconnect } = useIpc()
  const filter = useUiStore((s) => s.sidebarFilter)
  const [newMenu, setNewMenu] = useState<React.CSSProperties | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const visible = filterConnections(tabs, filter)

  const handleClose = async (id: string): Promise<void> => { try { await disconnect(id) } catch { /* 强制关闭 */ } closeTab(id) }

  const commitRename = (): void => {
    if (renameId && renameValue.trim()) useTabStore.getState().updateTabTitle(renameId, renameValue.trim())
    setRenameId(null)
  }

  return (
    <section className="sb-section">
      <div className="sb-head">
        <h2>连接列表</h2>
        <div className="sb-actions">
          <button className="icon-btn" title="新建连接" aria-label="新建连接"
            onClick={(e) => setNewMenu(menuPosition((e.currentTarget as HTMLElement).getBoundingClientRect()))}>
            <Icon name="plus" />
          </button>
        </div>
      </div>
      <div className="conn-list">
        {visible.length === 0 ? (
          <div className="sb-none">没有匹配的连接</div>
        ) : visible.map((tab) => {
          const sm = STATUS_META[tab.status]
          const tm = TYPE_META[tab.type]
          return (
            <div key={tab.id}
              className={`conn-row${tab.id === activeTabId ? ' active' : ''}${dragOverId === tab.id && dragId !== tab.id ? ' drag-over' : ''}`}
              draggable tabIndex={0} title={`${tm.label} · ${sm.label}`}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveTab(tab.id) } }}
              onDragStart={(e) => { setDragId(tab.id); e.dataTransfer.effectAllowed = 'move' }}
              onDragOver={(e) => { e.preventDefault(); setDragOverId(tab.id) }}
              onDrop={(e) => {
                e.preventDefault()
                if (dragId && dragId !== tab.id) {
                  const from = tabs.findIndex((t) => t.id === dragId)
                  const to = tabs.findIndex((t) => t.id === tab.id)
                  if (from > -1 && to > -1) reorderTabs(from, to)
                }
                setDragId(null); setDragOverId(null)
              }}
              onDragEnd={() => { setDragId(null); setDragOverId(null) }}>
              <span className={`status-dot ${sm.cls}${sm.pulse ? ' pulse' : ''}`} />
              <Icon name={tm.icon} size={15} className={`conn-type-icon ct-${tm.tag.toLowerCase()}`} />
              {renameId === tab.id ? (
                <input className="conn-name renaming" autoFocus value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); if (e.key === 'Escape') { setRenameValue(tab.title); (e.target as HTMLInputElement).blur() } }}
                  onClick={(e) => e.stopPropagation()} />
              ) : (
                <span className="conn-name" onDoubleClick={(e) => { e.stopPropagation(); setRenameId(tab.id); setRenameValue(tab.title) }}>{tab.title}</span>
              )}
              <button className="icon-btn conn-close" title="关闭并断开" aria-label="关闭"
                onClick={(e) => { e.stopPropagation(); handleClose(tab.id) }}>
                <Icon name="x" />
              </button>
            </div>
          )
        })}
      </div>
      {newMenu && (
        <Menu title="新建连接" style={newMenu} onClose={() => setNewMenu(null)}>
          {NEW_TAB_ITEMS.map((it) => (
            <div key={it.type} className="menu-item" onClick={() => {
              const id = createTab(it.type)
              if (id) useUiStore.getState().showToast(`已创建 ${TYPE_META[it.type].label}`)
              setNewMenu(null)
            }}>
              <span className="mi-icon"><Icon name={it.icon} /></span>
              <span className="mi-text"><span className="mi-title">{it.title}</span><br /><span className="mi-desc">{it.desc}</span></span>
            </div>
          ))}
        </Menu>
      )}
    </section>
  )
}
