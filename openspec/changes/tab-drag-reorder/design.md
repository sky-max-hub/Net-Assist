## Context

TabBar 使用 `tabs.map()` 渲染 `.tab-item` 列表，顺序由 store 中 `tabs` 数组决定。`persistTabs` 在每次变更后保存到磁盘。新建连接的发送选项由 `defaultSendOptions()` 决定，其中 `lfToCr: true` 为默认值。

## Goals / Non-Goals

**Goals:**
- 拖拽标签项调整其在连接列表中的顺序，新顺序持久化
- 新建连接的 LF→CR 默认关闭

**Non-Goals:**
- 不改变标签创建/关闭逻辑
- 不引入第三方拖拽库（保持轻量）
- 不改变已有连接（仅影响新建连接的默认值）

## Decisions

### 1. 原生 HTML5 拖拽

使用浏览器原生 `draggable` 属性 + `dragstart`/`dragover`/`drop` 事件，无需额外依赖。

- `onDragStart`：记录被拖拽项的 `index`
- `onDragOver`：`preventDefault()` 允许放置，并高亮目标位置
- `onDrop`：调用 `reorderTabs(dragIndex, dropIndex)`

### 2. store 新增 `reorderTabs(fromIndex, toIndex)`

```typescript
reorderTabs: (fromIndex: number, toIndex: number) => {
  const tabs = [...get().tabs]
  const [moved] = tabs.splice(fromIndex, 1)
  tabs.splice(toIndex, 0, moved)
  set({ tabs })
  persistTabs(tabs)
}
```

### 3. LF→CR 默认关闭

修改 `defaultSendOptions()`：`lfToCr: true` → `lfToCr: false`。仅影响新建连接，已保存的连接配置不受影响。

## Risks / Trade-offs

- **拖拽与单击冲突** → 拖拽后抑制 click（通过判断是否有实际移动），或依赖 `onDrop` 而非 `onClick` 触发排序
- **兼容性** → 原生 HTML5 DnD 在 Electron/Chromium 完全支持
