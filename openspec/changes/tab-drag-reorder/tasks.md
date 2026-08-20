## 1. store 新增 reorderTabs

- [x] 1.1 在 `tab-store.ts` 的 `TabStore` 接口新增 `reorderTabs: (fromIndex: number, toIndex: number) => void`
- [x] 1.2 实现 `reorderTabs`：splice 移动元素、`set` 更新状态、调用 `persistTabs` 持久化

## 2. TabBar 添加拖拽

- [x] 2.1 TabBar 组件新增 `dragIndex` 状态记录被拖拽项
- [x] 2.2 每个 `.tab-item` 添加 `draggable` 属性及 `onDragStart`/`onDragOver`/`onDrop`/`onDragEnd` 处理器
- [x] 2.3 `onDrop` 时调用 `reorderTabs(dragIndex, dropIndex)` 完成排序
- [x] 2.4 拖拽中的目标项添加高亮 class

## 3. LF→CR 默认关闭

- [x] 3.1 修改 `defaultSendOptions()`：`lfToCr` 默认值由 `true` 改为 `false`

## 4. 验证

- [x] 4.1 验证拖拽调整顺序后列表立即更新且重启后顺序保留
- [x] 4.2 验证新建连接的 LF→CR 开关默认为关闭
