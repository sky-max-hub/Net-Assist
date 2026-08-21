import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useUiStore } from '../../store/ui-store'
import { SETTINGS_SCHEMA, type SettingsItem } from '../../store/settings-schema'
import Icon from '../common/Icons'
import './SettingsModal.css'

function renderControl(item: SettingsItem, value: string | number | boolean, disabled: boolean, onChange: (v: string | number | boolean) => void): JSX.Element {
  if (item.type === 'switch') {
    return (
      <label className="switch">
        <input type="checkbox" checked={Boolean(value)} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
        <span className="track" />
      </label>
    )
  }
  if (item.type === 'seg') {
    return (
      <div className="seg">
        {(item.options as string[]).map((o) => (
          <button key={o} type="button" className={value === o ? 'active' : ''} disabled={disabled} onClick={() => onChange(o)}>{o}</button>
        ))}
      </div>
    )
  }
  if (item.type === 'select') {
    return (
      <select className="cfg-select" disabled={disabled} value={String(value)}
        onChange={(e) => {
          const found = (item.options as [string | number, string][]).find(([v]) => String(v) === e.target.value)
          onChange(typeof found?.[0] === 'number' ? Number(e.target.value) : e.target.value)
        }}>
        {(item.options as [string | number, string][]).map(([v, l]) => <option key={String(v)} value={v}>{l}</option>)}
      </select>
    )
  }
  return (
    <input className="cfg-input w-number" type="number" min={item.min} max={item.max} value={String(value)} disabled={disabled}
      onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(Math.max(item.min ?? 0, Math.min(item.max ?? 9999, n))) }} />
  )
}

export default function SettingsModal(): JSX.Element | null {
  const open = useUiStore((s) => s.settingsModalOpen)
  const settings = useUiStore((s) => s.settings)
  const updateSetting = useUiStore((s) => s.updateSetting)
  const close = useUiStore((s) => s.closeSettings)
  const save = useUiStore((s) => s.saveSettings)
  const cancel = useUiStore((s) => s.cancelSettings)
  const reset = useUiStore((s) => s.resetSettings)
  const showToast = useUiStore((s) => s.showToast)
  const [catKey, setCatKey] = useState('general')

  if (!open) return null
  const cat = SETTINGS_SCHEMA.find((c) => c.key === catKey) ?? SETTINGS_SCHEMA[0]

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close() }}>
      <div className="settings-modal" onKeyDown={(e) => { if (e.key === 'Escape') close() }}>
        <div className="settings-head">
          <h3>设置</h3><span className="sub">NetAssist · 偏好与行为</span>
          <button className="icon-btn close" title="关闭" aria-label="关闭" onClick={close}><Icon name="x" /></button>
        </div>
        <div className="settings-body">
          <div className="settings-rail">
            {SETTINGS_SCHEMA.map((c) => (
              <button key={c.key} className={`settings-cat${c.key === catKey ? ' active' : ''}`} onClick={() => setCatKey(c.key)}>
                <Icon name={c.icon as 'sliders' | 'copy' | 'send' | 'network' | 'history'} size={15} />{c.label}
              </button>
            ))}
          </div>
          <div className="settings-panel">
            <div className="set-group-title">注：设置仅作外观演示，暂不影响实际行为</div>
            {cat.groups.map((g) => (
              <div key={g.title}>
                <div className="set-group-title">{g.title}</div>
                {g.items.map((item) => {
                  const disabled = item.depends ? !settings[item.depends] : false
                  return (
                    <div key={item.key} className={`set-row${disabled ? ' disabled' : ''}`}>
                      <div className="set-info">
                        <div className="set-label">{item.label}</div>
                        {item.desc && <div className="set-desc">{item.desc}</div>}
                      </div>
                      <div className="set-control">{renderControl(item, settings[item.key], disabled, (v) => updateSetting(item.key, v))}</div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="settings-foot">
          <button className="btn btn-ghost btn-sm" onClick={reset}>恢复默认</button>
          <span className="spacer" />
          <button className="btn btn-secondary" onClick={cancel}>取消</button>
          <button className="btn btn-primary" onClick={() => { save(); showToast('设置已保存') }}>保存</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
