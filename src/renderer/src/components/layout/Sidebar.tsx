import { useEffect, useRef, useState } from 'react'
import { useTabStore } from '../../store/tab-store'
import { useUiStore } from '../../store/ui-store'
import { STATUS_META, TYPE_META } from '../../store/tab-meta'
import Icon from '../common/Icons'
import TabBar from '../tab/TabBar'
import QuickSendPanel from '../quick-send/QuickSendPanel'
import './Sidebar.css'

const SIDEBAR_MIN = 224
const SIDEBAR_MAX = 440

interface Props {
  onQuickSend: (content: string) => void
}

/** rail 悬浮提示内容（原型行 1290–1311） */
interface RailTip {
  left: number
  top: number
  name: string
  status: keyof typeof STATUS_META
}

export default function Sidebar({ onQuickSend }: Props): JSX.Element {
  const tabs = useTabStore((s) => s.tabs)
  const activeTabId = useTabStore((s) => s.activeTabId)
  const setActiveTab = useTabStore((s) => s.setActiveTab)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const setCollapsed = useUiStore((s) => s.setSidebarCollapsed)
  const setFilter = useUiStore((s) => s.setSidebarFilter)
  const [width, setWidth] = useState(292)
  const asideRef = useRef<HTMLElement>(null)
  const moveRef = useRef<((ev: MouseEvent) => void) | null>(null)
  const upRef = useRef<(() => void) | null>(null)
  const [railTip, setRailTip] = useState<RailTip | null>(null)

  // 小屏 920px 自动折叠
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 920px)')
    setCollapsed(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setCollapsed(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [setCollapsed])

  const startResize = (e: React.MouseEvent): void => {
    e.preventDefault()
    // 拖拽期间抑制 width 过渡，并锁定光标/文本选择
    asideRef.current?.classList.add('no-trans')
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    const startX = e.clientX
    const startW = width
    const onMove = (ev: MouseEvent) => setWidth(Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startW + (ev.clientX - startX))))
    const onUp = () => {
      asideRef.current?.classList.remove('no-trans')
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      moveRef.current = null
      upRef.current = null
    }
    moveRef.current = onMove
    upRef.current = onUp
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // 拖拽监听器卸载清理：组件卸载时移除 document 级监听并恢复 body 样式，避免泄漏
  useEffect(() => {
    return () => {
      if (moveRef.current) document.removeEventListener('mousemove', moveRef.current)
      if (upRef.current) document.removeEventListener('mouseup', upRef.current)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [])

  // rail 悬浮提示：鼠标进入连接按钮时按按钮位置显示提示
  const showRailTip = (e: React.MouseEvent<HTMLButtonElement>, id: string): void => {
    const t = tabs.find((x) => x.id === id)
    if (!t) return
    const r = e.currentTarget.getBoundingClientRect()
    setRailTip({
      left: r.right + 12,
      top: r.top + r.height / 2,
      name: t.title,
      status: t.status
    })
  }

  return (
    <aside ref={asideRef} className={`sidebar${collapsed ? ' collapsed' : ''}`} style={{ width }}>
      <div className="sb-resize" onMouseDown={startResize} title="拖拽调整宽度" />
      <div className="sb-search">
        <div className="search-box">
          <Icon name="search" size={14} />
          <input type="text" placeholder="筛选连接或指令" autoComplete="off"
            onChange={(e) => setFilter(e.target.value)} />
        </div>
        <button className="icon-btn sb-toggle-btn" title={collapsed ? '展开侧栏' : '收起侧栏'} aria-label="收起/展开侧栏"
          aria-expanded={!collapsed} onClick={() => setCollapsed(!collapsed)}>
          <Icon name="chevron-left" />
        </button>
      </div>
      <div className="sb-rail">
        {tabs.length === 0 ? <div className="rail-empty">+</div> : tabs.map((t) => {
          const sm = STATUS_META[t.status]
          return (
            <button key={t.id} className={`rail-conn${t.id === activeTabId ? ' active' : ''}`} aria-label={t.title}
              onMouseEnter={(e) => showRailTip(e, t.id)}
              onMouseLeave={() => setRailTip(null)}
              onClick={() => setActiveTab(t.id)}>
              <Icon name={TYPE_META[t.type].icon} size={17} className={`ic ct-${TYPE_META[t.type].tag.toLowerCase()}`} />
              <span className={`rail-dot ${sm.cls}${sm.pulse ? ' pulse' : ''}`} />
            </button>
          )
        })}
      </div>
      <div className="sb-body">
        <TabBar />
        <QuickSendPanel onSend={onQuickSend} />
      </div>
      <div className="sb-foot"><span>NetAssist v2.0</span></div>
      {railTip && (
        <div className="rail-tip" style={{ left: railTip.left, top: railTip.top }}>
          <div className="rt-name">{railTip.name}</div>
          <div className="rt-meta">
            <span className={`dot ${STATUS_META[railTip.status].cls}`} />
            {STATUS_META[railTip.status].label}
          </div>
        </div>
      )}
    </aside>
  )
}
