import { useState } from 'react'
import { Button, Input, Modal, List, Popconfirm, Empty } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined
} from '@ant-design/icons'
import { useTabStore } from '../../store/tab-store'
import './QuickSendPanel.css'

interface Props {
  onSend?: (content: string) => void
}

export default function QuickSendPanel({ onSend }: Props): JSX.Element {
  const { quickSendItems, addQuickSendItem, updateQuickSendItem, removeQuickSendItem } =
    useTabStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')

  const openAdd = (): void => {
    setEditId(null)
    setEditName('')
    setEditContent('')
    setModalOpen(true)
  }

  const openEdit = (item: { id: string; name: string; content: string }): void => {
    setEditId(item.id)
    setEditName(item.name)
    setEditContent(item.content)
    setModalOpen(true)
  }

  const handleOk = (): void => {
    if (!editName.trim() || !editContent.trim()) return
    if (editId) {
      updateQuickSendItem(editId, { name: editName.trim(), content: editContent })
    } else {
      addQuickSendItem({ name: editName.trim(), content: editContent })
    }
    setModalOpen(false)
  }

  return (
    <div className="quick-send-panel">
      <div className="quick-send-header">
        <span className="quick-send-title">快捷发送</span>
        <Button type="text" size="small" icon={<PlusOutlined />} onClick={openAdd} />
      </div>
      <div className="quick-send-list">
        {quickSendItems.length === 0 ? (
          <Empty description="暂无快捷指令" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <List
            size="small"
            dataSource={quickSendItems}
            renderItem={(item) => (
              <List.Item
                className="quick-send-item"
                actions={[
                  <Button
                    key="send"
                    type="text"
                    size="small"
                    icon={<SendOutlined />}
                    onClick={() => onSend?.(item.content)}
                  />,
                  <Button
                    key="edit"
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(item)}
                  />,
                  <Popconfirm
                    key="del"
                    title="确定删除此指令?"
                    onConfirm={() => removeQuickSendItem(item.id)}
                  >
                    <Button type="text" size="small" icon={<DeleteOutlined />} danger />
                  </Popconfirm>
                ]}
              >
                <List.Item.Meta title={item.name} description={item.content.slice(0, 30)} />
              </List.Item>
            )}
          />
        )}
      </div>

      <Modal
        title={editId ? '编辑快捷指令' : '添加快捷指令'}
        open={modalOpen}
        onOk={handleOk}
        onCancel={() => setModalOpen(false)}
        okButtonProps={{ disabled: !editName.trim() || !editContent.trim() }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <Input
            placeholder="指令名称"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <Input.TextArea
            placeholder="指令内容"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  )
}
