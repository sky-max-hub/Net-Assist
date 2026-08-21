import type { TabType } from '../../../shared/types'
import { useTabStore } from '../../store/tab-store'
import { useUiStore } from '../../store/ui-store'
import { TYPE_META } from '../../store/tab-meta'
import Icon, { type IconName } from './Icons'
import './Welcome.css'

const MODES: { type: TabType; icon: IconName; desc: string }[] = [
  { type: 'tcp-client', icon: 'client', desc: '连接远程主机，收发文本与十六进制数据。' },
  { type: 'tcp-server', icon: 'server', desc: '本地监听，管理多个客户端并支持单播与广播。' },
  { type: 'udp', icon: 'udp', desc: '绑定本地端口，向指定目标定向收发。' }
]

export default function Welcome(): JSX.Element {
  const createTab = useTabStore((s) => s.createTab)
  const newTab = (type: TabType) => {
    const id = createTab(type)
    if (id) useUiStore.getState().showToast(`已创建 ${TYPE_META[type].label}`)
  }
  return (
    <section className="welcome">
      <div className="welcome-inner">
        <p className="eyebrow">NETASSIST · TCP/UDP 调试</p>
        <h1>从一个连接开始调试</h1>
        <p className="lead">支持 TCP Client / TCP Server / UDP 三种模式；多标签、多编码、HEX 查看与快捷指令，让协议调试更顺手。</p>
        <div className="mode-grid">
          {MODES.map((m) => (
            <div key={m.type} className="mode-card" tabIndex={0} role="button"
              onClick={() => newTab(m.type)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); newTab(m.type) } }}>
              <div className="mc-icon"><Icon name={m.icon} size={19} /></div>
              <h3>{TYPE_META[m.type].label}</h3>
              <p>{m.desc}</p>
              <span className="mc-action">新建连接 <Icon name="arrow-right" size={13} /></span>
            </div>
          ))}
        </div>
        <div className="kbd-hint">
          <span><kbd>Ctrl</kbd> + <kbd>Enter</kbd> 发送</span>
          <span><kbd>Ctrl</kbd> + <kbd>↑↓</kbd> 发送历史</span>
          <span>双击消息面板清空</span>
        </div>
      </div>
    </section>
  )
}
