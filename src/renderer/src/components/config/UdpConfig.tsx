import type { TabState, UdpConfig as UdpConfigType } from '../../../shared/types'
import { isLive } from '../../store/tab-meta'

interface Props { tab: TabState; onChange: (config: UdpConfigType) => void }

export default function UdpConfigFields({ tab, onChange }: Props): JSX.Element {
  const cfg = tab.config as UdpConfigType
  const disabled = isLive(tab)
  return (
    <>
      <span className="cfg-field">
        <span className="cfg-label">本地</span>
        <input className="cfg-input w-60" type="number" min={1} max={65535} value={cfg.localPort || ''} disabled={disabled}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (Number.isFinite(v) && v >= 1 && v <= 65535) onChange({ ...cfg, localPort: v }) }} />
      </span>
      <span className="cfg-field">
        <span className="cfg-label">目标</span>
        <input className="cfg-input w-ip" value={cfg.targetHost} spellCheck={false} disabled={disabled}
          onChange={(e) => onChange({ ...cfg, targetHost: e.target.value })} />
        <span className="cfg-sep" />
        <input className="cfg-input w-70" type="number" min={1} max={65535} value={cfg.targetPort || ''} disabled={disabled}
          onChange={(e) => { const v = parseInt(e.target.value, 10); if (Number.isFinite(v) && v >= 1 && v <= 65535) onChange({ ...cfg, targetPort: v }) }} />
      </span>
    </>
  )
}
