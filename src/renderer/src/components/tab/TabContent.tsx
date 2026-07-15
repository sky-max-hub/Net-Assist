import type { TabState } from '../../../shared/types'

interface Props {
  tab: TabState
}

export default function TabContent({ tab }: Props): JSX.Element {
  return (
    <div className="tab-content" style={{ flex: 1, padding: 16, overflow: 'auto' }}>
      <div style={{ padding: 8, background: '#f5f5f5', borderRadius: 4, marginBottom: 16 }}>
        <strong>{tab.title}</strong> -- 类型: {tab.type} -- 状态: {tab.status}
      </div>
    </div>
  )
}
