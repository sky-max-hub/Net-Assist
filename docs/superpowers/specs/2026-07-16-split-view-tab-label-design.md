---
comet_change: split-view-tab-label
role: technical-design
canonical_spec: openspec
---

# 消息分屏与 Tab 标签 — 技术设计

## 1. 数据层

`SendOptions` 新增 `splitView: boolean`，默认 `true`：

```typescript
export interface SendOptions {
  encoding: EncodingMode
  displayMode: DisplayMode
  lfToCr: boolean
  splitView: boolean  // 新增
}
```

`defaultSendOptions()` 返回 `{ encoding: 'utf-8', displayMode: 'text', lfToCr: true, splitView: true }`。

## 2. 分屏组件

创建 `SplitMessageList` 组件替换原 `MessageList`：

```tsx
function SplitMessageList({ tabId, messages, displayMode, encoding, splitView, onToggle }) {
  if (!splitView) {
    // 合并模式：原 MessageList
    return <MessageList tabId={tabId} messages={messages} ... />
  }
  // 分屏模式
  const txMessages = messages.filter(m => m.direction === 'tx')
  const rxMessages = messages.filter(m => m.direction === 'rx')
  return (
    <div className="split-view">
      <div className="split-panel"><MessageList tabId={tabId} messages={txMessages} ... /></div>
      <div className="split-divider" />
      <div className="split-panel"><MessageList tabId={tabId} messages={rxMessages} ... /></div>
    </div>
  )
}
```

切换按钮放在组件右上角，调用 `updateSendOptions(tabId, { splitView: !splitView })`。

## 3. Tab 标签

`defaultTitle()` 改为完整名称，CSS 加宽 tab 项。

## 4. 文件变更

| 文件 | 操作 |
|------|------|
| `types.ts` | SendOptions 加 splitView |
| `tab-store.ts` | defaultSendOptions + updateSendOptions 无变化 |
| `SplitMessageList.tsx` | 新建 |
| `SplitMessageList.css` | 新建 |
| `TabContent.tsx` | 用 SplitMessageList 替代 MessageList |
| `TabBar.css` | 加宽 min-width |
| `tab-store.ts` | defaultTitle 改为完整标签 |
