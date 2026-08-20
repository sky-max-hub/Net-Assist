import { useState, useRef } from 'react'
import { Button, Dropdown, Input } from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { TabType } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useIpc } from '../../hooks/useIpc'
import './TabBar.css'

const tabTypeLabels: Record<TabType, string> = {
  'tcp-client': 'TCP Client',
  'tcp-server': 'TCP Server',
  udp: 'UDP'
}

const statusColors: Record<string, string> = {
  idle: '#999',
  connecting: '#faad14',
  connected: '#52c41a',
  listening: '#52c41a',
  error: '#ff4d4f'
}

const tabTypeConfig: Record<TabType, { label: string; color: string }> = {
  'tcp-client': { label: 'TC', color: '#52c41a' },
  'tcp-server': { label: 'TS', color: '#1890ff' },
  udp: { label: 'UD', color: '#fa8c16' }
}

export default function TabBar(): JSX.Element {
  const { tabs, activeTabId, createTab, closeTab, reorderTabs, setActiveTab } = useTabStore()
  const { disconnect } = useIpc()
  const [editTabId, setEditTabId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const draggedRef = useRef(false)

  const handleCloseTab = async (tabId: string): Promise<void> => {
    try { await disconnect(tabId) } catch { /* force close */ }
    closeTab(tabId)
  }

  const newTabItems: MenuProps['items'] = (
    Object.entries(tabTypeLabels) as [TabType, string][]
  ).map(([type, label]) => ({
    key: type,
    label,
    onClick: () => createTab(type)
  }))

  const handleDoubleClick = (tabId: string, currentTitle: string): void => {
    setEditTabId(tabId)
    setEditTitle(currentTitle)
  }

  const handleTitleSave = (): void => {
    if (editTabId && editTitle.trim()) {
      useTabStore.getState().updateTabTitle(editTabId, editTitle.trim())
    }
    setEditTabId(null)
    setEditTitle('')
  }

  const handleDragStart = (e: React.DragEvent, index: number): void => {
    setDragIndex(index)
    draggedRef.current = false
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }

  const handleDragOver = (e: React.DragEvent, index: number): void => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e: React.DragEvent, index: number): void => {
    e.preventDefault()
    e.stopPropagation()
    if (dragIndex !== null && dragIndex !== index) {
      reorderTabs(dragIndex, index)
      draggedRef.current = true
    }
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = (): void => {
    setDragIndex(null)
    setDragOverIndex(null)
  }

  const handleItemClick = (tabId: string): void => {
    // 拖拽结束后抑制 click，避免切换标签
    if (draggedRef.current) {
      draggedRef.current = false
      return
    }
    setActiveTab(tabId)
  }

  return (
    <div className="tab-bar">
      <div className="tab-bar-header">
        <span className="tab-bar-title">连接列表</span>
        <Dropdown menu={{ items: newTabItems }} trigger={['click']}>
          <Button type="text" size="small" icon={<PlusOutlined />} />
        </Dropdown>
      </div>
      <div className="tab-list">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? 'active' : ''} ${dragOverIndex === index && dragIndex !== index ? 'drag-over' : ''}`}
            onClick={() => handleItemClick(tab.id)}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
          >
            <span
              className="tab-status-dot"
              style={{ backgroundColor: statusColors[tab.status] || '#999' }}
            />
            <span className="tab-type-tag" title={tabTypeLabels[tab.type]} style={{
              background: tabTypeConfig[tab.type].color,
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '1px 5px',
              borderRadius: 3,
              flexShrink: 0,
              lineHeight: '16px',
              letterSpacing: 0.5
            }}>
              {tabTypeConfig[tab.type].label}
            </span>
            {editTabId === tab.id ? (
              <Input
                size="small"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleTitleSave}
                onPressEnter={handleTitleSave}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="tab-title-input"
              />
            ) : (
              <span
                className="tab-label"
                onDoubleClick={() => handleDoubleClick(tab.id, tab.title)}
              >
                {tab.title}
              </span>
            )}
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={(e) => {
                e.stopPropagation()
                handleCloseTab(tab.id)
              }}
              className="tab-close-btn"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
