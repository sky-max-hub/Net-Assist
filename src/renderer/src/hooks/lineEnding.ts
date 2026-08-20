export type LineEnding = 'crlf' | 'cr' | 'lf'

/**
 * 检测文本的换行风格。
 * - 含 `\r\n` → 'crlf'
 * - 含独立 `\r` → 'cr'
 * - 否则 → 'lf'
 */
export function detectLineEnding(text: string): LineEnding {
  if (/\r\n/.test(text)) return 'crlf'
  if (/\r/.test(text)) return 'cr'
  return 'lf'
}

/** 将任意换行规范化为 LF（textarea 的 DOM 显示层即此形式） */
export function normalizeToLf(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
}

/**
 * 将 LF 按指定风格展开：
 * - 'crlf'：`\n` → `\r\n`
 * - 'cr'：`\n` → `\r`
 * - 'lf'：保持不变
 */
export function expandLineEnding(text: string, style: LineEnding): string {
  if (style === 'crlf') return text.replace(/\n/g, '\r\n')
  if (style === 'cr') return text.replace(/\n/g, '\r')
  return text
}
