import { useTabStore } from '../../store/tab-store'
import { deriveGlobalStatus } from '../../store/tab-meta'
import { useUiStore } from '../../store/ui-store'
import Icon from '../common/Icons'
import './AppBar.css'

const STATUS_TEXT: Record<'idle' | 'active' | 'error', { cls: string; text: (n: number) => string }> = {
  idle: { cls: 'st-idle', text: () => '空闲' },
  active: { cls: 'st-connected', text: (n) => `${n} 个连接活跃` },
  error: { cls: 'st-error', text: (n) => `${n} 个连接异常` }
}

export default function AppBar(): JSX.Element {
  const tabs = useTabStore((s) => s.tabs)
  const openSettings = useUiStore((s) => s.openSettings)
  const gs = deriveGlobalStatus(tabs)
  const meta = STATUS_TEXT[gs.level]
  return (
    <header className="titlebar">
      <div className="app-title">
        <Icon name="network" size={19} />
        NetAssist <span className="at-sub">网络调试助手</span>
      </div>
      <div className="title-right">
        <div className="global-status"><span className={`dot ${meta.cls}`} />{meta.text(gs.count)}</div>
        <button className="icon-btn" title="设置" aria-label="设置" onClick={openSettings}><Icon name="sliders" /></button>
      </div>
    </header>
  )
}
