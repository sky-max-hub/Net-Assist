import { useState, useEffect } from 'react'
import type { TabStats } from '../../../shared/types'
import './StatsBar.css'

interface Props {
  stats: TabStats
  status: string
}

function formatBytes(bytes: number): string {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return bytes + ' B'
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '--:--:--'
  const s = Math.floor(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

export default function StatsBar({ stats, status }: Props): JSX.Element {
  const [rate, setRate] = useState(0)
  const [duration, setDuration] = useState(0)
  const connected = status === 'connected' || status === 'listening'

  useEffect(() => {
    if (!connected) return
    const total = stats.txBytes + stats.rxBytes
    const startBytes = total
    const startTime = Date.now()

    const timer = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000
      const currentTotal = stats.txBytes + stats.rxBytes
      const diff = currentTotal - startBytes
      setRate(elapsed > 0 ? diff / elapsed : 0)
      if (stats.connectedAt > 0) {
        setDuration(Date.now() - stats.connectedAt)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [connected, stats.txBytes, stats.rxBytes, stats.connectedAt])

  return (
    <div className="stats-bar">
      <span className="stats-item">TX: <b>{formatBytes(stats.txBytes)}</b></span>
      <span className="stats-item">RX: <b>{formatBytes(stats.rxBytes)}</b></span>
      <span className="stats-item">速率: <b>{formatBytes(rate)}/s</b></span>
      <span className="stats-item">时长: <b>{formatDuration(duration)}</b></span>
    </div>
  )
}
