import { useEffect, useRef, useState } from 'react'
import { Button, Input, Modal, Tree, Popconfirm, Empty, Space } from 'antd'
import type { DataNode } from 'antd/es/tree'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  FolderAddOutlined
} from '@ant-design/icons'
import { useTabStore } from '../../store/tab-store'
import CrPreservingEditor, { type CrPreservingEditorHandle } from '../common/CrPreservingEditor'
import './QuickSendPanel.css'

interface Props {
  onSend?: (content: string) => void
}

export default function QuickSendPanel({ onSend }: Props): JSX.Element {
  const {
    quickSendItems,
    quickSendGroups,
    addQuickSendItem,
    updateQuickSendItem,
    removeQuickSendItem,
    addQuickSendGroup,
    updateQuickSendGroup,
    removeQuickSendGroup
  } = useTabStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editGroupId, setEditGroupId] = useState<string | undefined>(undefined)
  const [groupModalOpen, setGroupModalOpen] = useState(false)
  const [editGroupId2, setEditGroupId2] = useState<string | null>(null)
  const [editGroupName, setEditGroupName] = useState('')
  const contentEditorRef = useRef<CrPreservingEditorHandle>(null)

  // 外部设置内容（打开编辑/新增清空）时同步到编辑器
  useEffect(() => {
    contentEditorRef.current?.setValue(editContent)
  }, [editContent])

  const openAdd = (groupId?: string): void => {
    setEditId(null)
    setEditName('')
    setEditContent('')
    setEditGroupId(groupId)
    setModalOpen(true)
  }

  const openEdit = (item: { id: string; name: string; content: string; groupId?: string }): void => {
    setEditId(item.id)
    setEditName(item.name)
    setEditContent(item.content)
    setEditGroupId(item.groupId)
    setModalOpen(true)
  }

  const handleOk = (): void => {
    if (!editName.trim() || !editContent.trim()) return
    if (editId) {
      updateQuickSendItem(editId, { name: editName.trim(), content: editContent, groupId: editGroupId })
    } else {
      addQuickSendItem({ name: editName.trim(), content: editContent, groupId: editGroupId })
    }
    setModalOpen(false)
  }

  const openGroupAdd = (): void => {
    setEditGroupId2(null)
    setEditGroupName('')
    setGroupModalOpen(true)
  }

  const openGroupEdit = (id: string, name: string): void => {
    setEditGroupId2(id)
    setEditGroupName(name)
    setGroupModalOpen(true)
  }

  const handleGroupOk = (): void => {
    if (!editGroupName.trim()) return
    if (editGroupId2) {
      updateQuickSendGroup(editGroupId2, editGroupName.trim())
    } else {
      addQuickSendGroup(editGroupName.trim())
    }
    setGroupModalOpen(false)
  }

  // Build tree data
  const treeData: DataNode[] = quickSendGroups.map((group) => {
    const items = quickSendItems.filter((item) => item.groupId === group.id)
    return {
      key: group.id,
      title: (
        <span className="qs-group-title">
          <span>{group.name}</span>
          <span className="qs-group-actions">
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); openAdd(group.id) }} />
            <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openGroupEdit(group.id, group.name) }} />
            <Popconfirm title="删除分组及其内容?" onConfirm={(e) => { e?.stopPropagation(); removeQuickSendGroup(group.id) }}>
              <Button type="text" size="small" icon={<DeleteOutlined />} danger onClick={(e) => e.stopPropagation()} />
            </Popconfirm>
          </span>
        </span>
      ),
      selectable: false,
      children: items.map((item) => ({
        key: item.id,
        title: (
          <span className="qs-item-title">
            <span className="qs-item-name" title={item.content}>{item.name}</span>
            <span className="qs-item-actions">
              <Button type="text" size="small" icon={<SendOutlined />} onClick={(e) => { e.stopPropagation(); onSend?.(item.content) }} />
              <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEdit(item) }} />
              <Popconfirm title="确定删除?" onConfirm={(e) => { e?.stopPropagation(); removeQuickSendItem(item.id) }}>
                <Button type="text" size="small" icon={<DeleteOutlined />} danger onClick={(e) => e.stopPropagation()} />
              </Popconfirm>
            </span>
          </span>
        ),
        isLeaf: true,
        selectable: false
      }))
    }
  })

  // Ungrouped items
  const ungroupedItems = quickSendItems.filter((item) => !item.groupId)
  if (ungroupedItems.length > 0) {
    treeData.push({
      key: '__ungrouped__',
      title: (
        <span className="qs-group-title">
          <span>未分组</span>
          <span className="qs-group-actions">
            <Button type="text" size="small" icon={<PlusOutlined />} onClick={(e) => { e.stopPropagation(); openAdd(undefined) }} />
          </span>
        </span>
      ),
      selectable: false,
      children: ungroupedItems.map((item) => ({
        key: item.id,
        title: (
          <span className="qs-item-title">
            <span className="qs-item-name" title={item.content}>{item.name}</span>
            <span className="qs-item-actions">
              <Button type="text" size="small" icon={<SendOutlined />} onClick={(e) => { e.stopPropagation(); onSend?.(item.content) }} />
              <Button type="text" size="small" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); openEdit(item) }} />
              <Popconfirm title="确定删除?" onConfirm={(e) => { e?.stopPropagation(); removeQuickSendItem(item.id) }}>
                <Button type="text" size="small" icon={<DeleteOutlined />} danger onClick={(e) => e.stopPropagation()} />
              </Popconfirm>
            </span>
          </span>
        ),
        isLeaf: true,
        selectable: false
      }))
    })
  }

  const handleDrop = (info: { node: { key: string }; dragNode: { key: string } }): void => {
    const dragKey = info.dragNode.key as string
    const dropKey = info.node.key as string
    // Only allow dropping items onto groups
    const isGroup = quickSendGroups.some((g) => g.id === dropKey) || dropKey === '__ungrouped__'
    if (!isGroup) return
    const newGroupId = dropKey === '__ungrouped__' ? undefined : dropKey
    updateQuickSendItem(dragKey, { groupId: newGroupId })
  }

  const isEmpty = quickSendGroups.length === 0 && quickSendItems.length === 0

  return (
    <div className="quick-send-panel">
      <div className="quick-send-header">
        <span className="quick-send-title">快捷发送</span>
        <Space size="small">
          <Button type="text" size="small" icon={<FolderAddOutlined />} onClick={openGroupAdd} />
          <Button type="text" size="small" icon={<PlusOutlined />} onClick={() => openAdd()} />
        </Space>
      </div>
      <div className="quick-send-list">
        {isEmpty ? (
          <Empty description="暂无快捷指令" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Tree
            treeData={treeData}
            defaultExpandAll
            blockNode
            showIcon={false}
            draggable={{ icon: false }}
            onDrop={handleDrop as never}
          />
        )}
      </div>

      <Modal title={editId ? '编辑快捷指令' : '添加快捷指令'} open={modalOpen} onOk={handleOk} onCancel={() => setModalOpen(false)}
        okButtonProps={{ disabled: !editName.trim() || !editContent.trim() }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <Input placeholder="指令名称" value={editName} onChange={(e) => setEditName(e.target.value)} />
          <CrPreservingEditor ref={contentEditorRef} initialValue={editContent} onChange={setEditContent} placeholder="指令内容" />
        </div>
      </Modal>

      <Modal title={editGroupId2 ? '重命名分组' : '新建分组'} open={groupModalOpen} onOk={handleGroupOk} onCancel={() => setGroupModalOpen(false)}
        okButtonProps={{ disabled: !editGroupName.trim() }}>
        <div style={{ marginTop: 12 }}>
          <Input placeholder="分组名称" value={editGroupName} onChange={(e) => setEditGroupName(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
