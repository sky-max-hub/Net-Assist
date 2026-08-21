import type { TabState, TcpServerConfig as TcpServerConfigType, ClientInfo } from '../../../shared/types'
import { isLive } from '../../store/tab-meta'

interface Props {
  tab: TabState
  clients: ClientInfo[]
  target: string
  onTargetChange: (clientId: string | null) => void
  onChange: (config: TcpServerConfigType) => void
}

export default function TcpServerConfigFields({ tab, clients, target, onTargetChange, onChange }: Props): JSX.Element {
  const cfg = tab.config as TcpServerConfigType
  const live = isLive(tab)
  return (
    <>
      <span className="cfg-field">
        <span className="cfg-label">监听端口</span>
        <input className="cfg-input w-70" type="number" min={1} max={65535} value={cfg.port || ''} disabled={live}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (Number.isFinite(v) && v >= 1 && v <= 65535) onChange({ ...cfg, port: v }) }} />
      </span>
      <span className="cfg-field">
        <span className="cfg-label">发送目标</span>
        <select className="cfg-select" value={target} disabled={!live}
          onChange={(e) => onTargetChange(e.target.value === 'broadcast' ? null : e.target.value)}>
          <option value="broadcast">广播所有客户端</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.remoteAddress}:{c.remotePort}</option>)}
        </select>
      </span>
    </>
  )
}
