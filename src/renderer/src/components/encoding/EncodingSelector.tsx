import { Radio } from 'antd'
import type { EncodingMode } from '../../../shared/types'

interface Props {
  value: EncodingMode
  onChange: (enc: EncodingMode) => void
}

export default function EncodingSelector({ value, onChange }: Props): JSX.Element {
  return (
    <Radio.Group value={value} onChange={(e) => onChange(e.target.value as EncodingMode)} size="small">
      <Radio.Button value="ascii">ASCII</Radio.Button>
      <Radio.Button value="utf-8">UTF-8</Radio.Button>
      <Radio.Button value="gbk">GBK</Radio.Button>
    </Radio.Group>
  )
}
