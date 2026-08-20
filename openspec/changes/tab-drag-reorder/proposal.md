## Why

- 连接列表（左侧 TabBar）中的标签项当前按创建顺序固定排列，无法调整顺序，用户常希望将常用连接置于列表顶部
- 新建连接的 `LF→CR` 选项默认开启，但多数场景下用户并不需要自动转换换行符，默认关闭更合理

## What Changes

- **新增** `useTabStore.reorderTabs(fromIndex, toIndex)` 方法，调整标签顺序并持久化
- **修改** TabBar 组件：为每个 `.tab-item` 添加原生 HTML5 拖拽支持（`draggable` + `onDragStart`/`onDragOver`/`onDrop`），拖拽后调用 `reorderTabs` 更新顺序
- **修改** `defaultSendOptions()`：新建连接的 `lfToCr` 默认值由 `true` 改为 `false`

## Capabilities

### New Capabilities
无

### Modified Capabilities
无

## Impact

- `src/renderer/src/store/tab-store.ts`：新增 `reorderTabs`；修改 `defaultSendOptions()` 的 `lfToCr` 默认值
- `src/renderer/src/components/tab/TabBar.tsx`：添加拖拽事件
- 顺序持久化沿用现有 `persistTabs` 机制
