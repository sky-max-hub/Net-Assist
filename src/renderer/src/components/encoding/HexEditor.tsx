import { useMemo } from 'react'
import { Input } from 'antd'
import './HexEditor.css'

interface Props {
  value: string
  onChange: (hex: string) => void
}

const HEX_PATTERN = /^[0-9a-fA-F\s]*$/

export function validateHex(input: string): boolean {
  return HEX_PATTERN.test(input)
}

export function hexToBytes(input: string): Uint8Array {
  const cleaned = input.replace(/\s+/g, '')
  if (cleaned.length % 2 !== 0) {
    throw new Error('HEX 字符串长度必须为偶数')
  }
  const bytes = new Uint8Array(cleaned.length / 2)
  for (let i = 0; i < cleaned.length; i += 2) {
    bytes[i / 2] = parseInt(cleaned.slice(i, i + 2), 16)
  }
  return bytes
}

export default function HexEditor({ value, onChange }: Props): JSX.Element {
  const isValid = useMemo(() => validateHex(value), [value])

  const formattedValue = useMemo(() => {
    const cleaned = value.replace(/\s+/g, '').toUpperCase()
    let result = ''
    for (let i = 0; i < cleaned.length; i += 2) {
      if (i > 0) result += ' '
      result += cleaned.slice(i, i + 2)
    }
    return result
  }, [value])

  return (
    <div className="hex-editor">
      <Input.TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="输入 HEX 数据，如: AA BB CC 0D 0A"
        rows={4}
        style={{ resize: 'none' }}
        className={!isValid && value ? 'hex-invalid' : ''}
      />
      {!isValid && value && <div className="hex-error">包含非法字符，仅允许 0-9、A-F、空格</div>}
      {value && isValid && <div className="hex-preview">{formattedValue}</div>}
    </div>
  )
}
