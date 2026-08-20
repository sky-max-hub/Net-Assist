import { useCallback } from 'react'

/**
 * 拦截 TextArea 的 onPaste 事件，保留剪贴板原始换行格式（\r\n / \r 不被浏览器规范化为 \n）。
 * 浏览器 <textarea> 默认在 value 边界统一换行，直接 setState 会丢失 CR；
 * 此 hook 从 clipboardData 读取原始文本，preventDefault 后按光标位置原样插入。
 *
 * @param setValue 受控组件的 value setter
 * @returns 绑定到 onPaste 的处理器
 */
export function usePreservePaste(
  setValue: (value: string) => void
): (e: React.ClipboardEvent<HTMLTextAreaElement>) => void {
  return useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>): void => {
      const pastedText = e.clipboardData.getData('text')
      if (!pastedText) return
      e.preventDefault()
      const el = e.currentTarget
      const start = el.selectionStart ?? 0
      const end = el.selectionEnd ?? 0
      setValue(el.value.slice(0, start) + pastedText + el.value.slice(end))
      requestAnimationFrame(() => {
        const pos = start + pastedText.length
        el.setSelectionRange(pos, pos)
      })
    },
    [setValue]
  )
}
