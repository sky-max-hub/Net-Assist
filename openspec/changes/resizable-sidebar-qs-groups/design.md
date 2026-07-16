## 可拖拽侧边栏
MainLayout sidebar 用 CSS `resize: horizontal; overflow: auto` + `min-width/max-width` 限制范围

## 快捷发送分组
- 新增 `QuickSendGroup { id, name, items: QuickSendItem[] }` 类型
- QuickSendPanel 用 antd Tree 渲染分组树
- 分组支持新建/重命名/折叠
- MainLayout 传递 onSend 回调使发送 icon 正常工作
