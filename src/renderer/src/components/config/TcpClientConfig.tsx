import type { TabState, TcpClientConfig as TcpClientConfigType } from '../../../shared/types'
import { isLive } from '../../store/tab-meta'

interface Props { tab: TabState; onChange: (config: TcpClientConfigType) => void }

export default function TcpClientConfigFields({ tab, onChange }: Props): JSX.Element {
  const cfg = tab.config as TcpClientConfigType
  const disabled = isLive(tab)
  return (
    <>
      <span className="cfg-field">
        <span className="cfg-label">主机</span>
        <input className="cfg-input w-ip" value={cfg.host} spellCheck={false} disabled={disabled}
          onChange={(e) => onChange({ ...cfg, host: e.target.value })} />
      </span>
      <span className="cfg-field">
        <span className="cfg-label">端口</span>
        <input className="cfg-input w-70" type="number" min={1} max={65535} value={cfg.port || ''} disabled={disabled}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (Number.isFinite(v) && v >= 1 && v <= 65535) onChange({ ...cfg, port: v }) }} />
      </span>
    </>
  )
}
