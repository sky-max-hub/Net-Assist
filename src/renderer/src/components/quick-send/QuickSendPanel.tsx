import { useEffect, useRef, useState } from 'react'
import { useTabStore } from '../../store/tab-store'
import { useUiStore } from '../../store/ui-store'
import { filterCommands } from '../../store/tab-meta'
import Icon from '../common/Icons'
import Modal from '../common/Modal'
import CrPreservingEditor, { type CrPreservingEditorHandle } from '../common/CrPreservingEditor'
import './QuickSendPanel.css'

interface Props { onSend: (content: string) => void }

export default function QuickSendPanel({ onSend }: Props): JSX.Element {
  const { quickSendItems, quickSendGroups, addQuickSendItem, updateQuickSendItem, removeQuickSendItem, addQuickSendGroup } = useTabStore()
  const filter = useUiStore((s) => s.sidebarFilter)
  const quickSendModalOpen = useUiStore((s) => s.quickSendModalOpen)
  const closeQuickSendModal = useUiStore((s) => s.closeQuickSendModal)

  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(quickSendGroups.map((g) => g.id)))
  const [editTarget, setEditTarget] = useState<{ id?: string; groupId?: string } | null>(null)
  const [editName, setEditName] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editGroupId, setEditGroupId] = useState('')
  const [groupModal, setGroupModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const contentRef = useRef<CrPreservingEditorHandle>(null)

  useEffect(() => { contentRef.current?.setValue(editContent) }, [editContent])

  const groups = filterCommands(quickSendGroups, quickSendItems, filter)
  const q = filter.trim().toLowerCase()
  const ungrouped = quickSendItems
    .filter((it) => !it.groupId)
    .filter((it) => !q || it.name.toLowerCase().includes(q) || it.content.toLowerCase().includes(q))

  const openAdd = (groupId?: string): void => { setEditTarget(groupId ? { groupId } : {}); setEditName(''); setEditContent(''); setEditGroupId(groupId ?? quickSendGroups[0]?.id ?? ''); useUiStore.getState().openQuickSendModal() }
  const openEdit = (item: { id: string; name: string; content: string; groupId?: string }): void => { setEditTarget({ id: item.id }); setEditName(item.name); setEditContent(item.content); setEditGroupId(item.groupId ?? ''); useUiStore.getState().openQuickSendModal() }

  const saveItem = (): void => {
    if (!editName.trim() || !editContent.trim()) { useUiStore.getState().showToast('名称与内容不能为空'); return }
    if (editTarget?.id) updateQuickSendItem(editTarget.id, { name: editName.trim(), content: editContent, groupId: editGroupId || undefined })
    else addQuickSendItem({ name: editName.trim(), content: editContent, groupId: editGroupId || undefined })
    closeQuickSendModal(); useUiStore.getState().showToast('已保存')
  }

  const saveGroup = (): void => {
    if (!groupName.trim()) return
    addQuickSendGroup(groupName.trim())
    setGroupModal(false); useUiStore.getState().showToast('已创建分组')
  }

  const toggle = (gid: string): void => setOpenGroups((prev) => { const n = new Set(prev); n.has(gid) ? n.delete(gid) : n.add(gid); return n })

  const renderGroup = (gid: string, name: string, items: typeof quickSendItems, collapsible: boolean): JSX.Element => {
    const open = !collapsible || openGroups.has(gid)
    return (
      <div className="cmd-group" key={gid}>
        <div className="cmd-group-head" tabIndex={0} onClick={() => { if (collapsible) toggle(gid) }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (collapsible) toggle(gid) } }}>
          {collapsible && <Icon name="chevron" size={12} className={`ic chev${open ? '' : ' rot'}`} />}
          <Icon name="folder" size={13} style={{ color: 'var(--meta)' }} />
          <span>{name}</span><span className="count">{items.length}</span>
        </div>
        {open && (
          <div className="cmd-list">
            {items.length === 0 ? <div className="sb-none" style={{ padding: '6px 0 6px 24px' }}>暂无指令</div> : items.map((c) => (
              <div key={c.id} className="cmd-row" tabIndex={0} title="点击发送"
                onClick={() => onSend(c.content)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSend(c.content) } }}>
                <span className="cmd-name">{c.name}</span>
                <span className="cmd-preview">{c.content.replace(/[\r\n]/g, ' ')}</span>
                <span className="cmd-actions">
                  <button className="icon-btn play-btn" title="发送" aria-label="发送" onClick={(e) => { e.stopPropagation(); onSend(c.content) }}><Icon name="play" size={13} /></button>
                  <button className="icon-btn" title="编辑" aria-label="编辑" onClick={(e) => { e.stopPropagation(); openEdit(c) }}><Icon name="pencil" size={13} /></button>
                  <button className="icon-btn" title="删除" aria-label="删除" onClick={(e) => { e.stopPropagation(); removeQuickSendItem(c.id); useUiStore.getState().showToast('已删除') }}><Icon name="trash" size={13} /></button>
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className="sb-section">
      <div className="sb-head">
        <h2>快捷指令</h2>
        <div className="sb-actions">
          <button className="icon-btn" title="新建分组" aria-label="新建分组" onClick={() => { setGroupModal(true); setGroupName('') }}><Icon name="folder" /></button>
          <button className="icon-btn" title="新增指令" aria-label="新增指令" onClick={() => openAdd()}><Icon name="plus" /></button>
        </div>
      </div>
      <div className="cmd-groups">
        {groups.map(({ group, items }) => renderGroup(group.id, group.name, items, true))}
        {ungrouped.length > 0 && renderGroup('__ungrouped__', '未分组', ungrouped, false)}
        {groups.length === 0 && ungrouped.length === 0 && <div className="sb-none">没有匹配的指令</div>}
      </div>

      {quickSendModalOpen && (
        <Modal title={editTarget?.id ? '编辑指令' : '新增指令'} sub="将常用指令保存到快捷发送，点击即可发送。"
          onClose={closeQuickSendModal}
          actions={<>
            <button className="btn btn-ghost" onClick={closeQuickSendModal}>取消</button>
            <button className="btn btn-dark" onClick={saveItem}>保存</button>
          </>}>
          <div className="field"><label>指令名称</label><input className="input" value={editName} placeholder="例如:读取保持寄存器" onChange={(e) => setEditName(e.target.value)} /></div>
          <div className="field"><label>指令内容</label><CrPreservingEditor ref={contentRef} initialValue={editContent} onChange={setEditContent} placeholder="支持文本与 HEX，如:01 03 00 00 00 0A C5 CD" /></div>
          <div className="field"><label>所属分组</label>
            <select className="modal-select" value={editGroupId} onChange={(e) => setEditGroupId(e.target.value)}>
              {quickSendGroups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {groupModal && (
        <Modal title="新建分组" sub="创建指令分组。" onClose={() => setGroupModal(false)}
          actions={<>
            <button className="btn btn-ghost" onClick={() => setGroupModal(false)}>取消</button>
            <button className="btn btn-dark" onClick={saveGroup}>保存</button>
          </>}>
          <div className="field"><label>分组名称</label><input className="input" value={groupName} placeholder="例如:Modbus 指令" onChange={(e) => setGroupName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveGroup() }} /></div>
        </Modal>
      )}
    </section>
  )
}
