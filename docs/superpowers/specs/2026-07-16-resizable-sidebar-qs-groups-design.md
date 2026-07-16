---
comet_change: resizable-sidebar-qs-groups
role: technical-design
canonical_spec: openspec
---

# 可拖拽侧边栏 + 快捷发送分组 — 技术设计

## 1. 可拖拽侧边栏
- MainLayout sidebar 使用 CSS `resize: horizontal; overflow: auto; min-width: 160px; max-width: 400px`
- 用户拖拽右边框调整宽度

## 2. 快捷发送分组
- 新增 `QuickSendGroup { id, name, items }` 类型
- tab-store 新增 `quickSendGroups[]` + 分组 CRUD + 项 CRUD
- QuickSendPanel 用 antd Tree 渲染：分组=父节点，发送项=叶子节点
- MainLayout 传 `onSend` 给 QuickSendPanel 修复发送
