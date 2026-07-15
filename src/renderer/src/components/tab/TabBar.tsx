import { useState } from 'react'
import { Button, Dropdown, Input } from 'antd'
import { PlusOutlined, CloseOutlined } from '@ant-design/icons'
import type { MenuProps } from 'antd'
import type { TabType } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
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

export default function TabBar(): JSX.Element {
  const { tabs, activeTabId, createTab, closeTab, setActiveTab } = useTabStore()
  const [editTabId, setEditTabId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

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

  return (
    <div className="tab-bar">
      <div className="tab-bar-header">
        <span className="tab-bar-title">连接列表</span>
        <Dropdown menu={{ items: newTabItems }} trigger={['click']}>
          <Button type="text" size="small" icon={<PlusOutlined />} />
        </Dropdown>
      </div>
      <div className="tab-list">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-item ${tab.id === activeTabId ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span
              className="tab-status-dot"
              style={{ backgroundColor: statusColors[tab.status] || '#999' }}
            />
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
                closeTab(tab.id)
              }}
              className="tab-close-btn"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
