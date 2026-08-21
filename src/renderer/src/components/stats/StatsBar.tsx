import { useEffect, useState } from 'react'
import type { TabState } from '../../../shared/types'
import { isLive } from '../../store/tab-meta'
import { fmtBytes, fmtDur } from '../common/format'
import './StatsBar.css'

export default function StatsBar({ tab }: { tab: TabState }): JSX.Element {
  const live = isLive(tab)
  const [rates, setRates] = useState({ tx: 0, rx: 0 })
  const [dur, setDur] = useState(0)

  const txBytes = tab.messages.filter((m) => m.direction === 'tx').reduce((a, m) => a + m.byteLength, 0)
  const rxBytes = tab.messages.filter((m) => m.direction === 'rx').reduce((a, m) => a + m.byteLength, 0)

  useEffect(() => {
    if (!live) return
    let prevTx = txBytes, prevRx = rxBytes, seconds = 0
    const timer = setInterval(() => {
      setRates({ tx: txBytes - prevTx, rx: rxBytes - prevRx })
      prevTx = txBytes; prevRx = rxBytes
      seconds += 1
      setDur(seconds)
    }, 1000)
    return () => clearInterval(timer)
  }, [live, txBytes, rxBytes])

  return (
    <div className="stats">
      <span className="st"><span className="st-label">发送</span><span className="st-val tx">{fmtBytes(txBytes)}</span></span>
      <span className="st"><span className="st-label">接收</span><span className="st-val rx">{fmtBytes(rxBytes)}</span></span>
      <span className="st"><span className="st-label">发送速率</span><span className="st-val">{fmtBytes(rates.tx)}/s</span></span>
      <span className="st"><span className="st-label">接收速率</span><span className="st-val">{fmtBytes(rates.rx)}/s</span></span>
      <span className="st"><span className="st-label">消息</span><span className="st-val">{tab.messages.length}</span></span>
      <span className="spacer" />
      <span className="dur">会话时长 <span className="st-val">{fmtDur(dur)}</span></span>
    </div>
  )
}
