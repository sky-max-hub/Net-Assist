# Comet Design Handoff

- Change: resizable-sidebar-qs-groups
- Phase: design
- Mode: compact
- Context hash: 266448d7ffa0ee030383d44eaa6a1e14702483d0c13baa429b3e04b443f34268

Generated-by: comet-handoff.sh

OpenSpec remains the canonical capability spec. This handoff is a deterministic, source-traceable context pack, not an agent-authored summary.

## openspec/changes/resizable-sidebar-qs-groups/proposal.md

- Source: openspec/changes/resizable-sidebar-qs-groups/proposal.md
- Lines: 1-19
- SHA256: f708a297d495116b1e210d8b4a65993a44bcac6c02b6dd25eae097ae0d7944c3

```md
## Why

侧边栏宽度固定不可调。快捷发送无分组管理，列表扁平不易组织。发送 icon 因缺少 onSend 回调无法工作。

## What Changes

- 侧边栏支持拖拽调整宽度（160px ~ 400px）
- 快捷发送改为树状分组结构，支持新建/重命名分组
- 修复发送功能：MainLayout 传递 send 回调

## Capabilities

### New Capabilities
- `resizable-sidebar`: 可拖拽侧边栏
- `quick-send-groups`: 快捷发送分组管理

## Impact

`MainLayout`、`QuickSendPanel`、`tab-store`、`types.ts`

```

## openspec/changes/resizable-sidebar-qs-groups/design.md

- Source: openspec/changes/resizable-sidebar-qs-groups/design.md
- Lines: 1-8
- SHA256: 421daf8713f7a4a4d5c06fbc0aad34b3b002617c4ec05990a1a14603f687bca1

```md
## 可拖拽侧边栏
MainLayout sidebar 用 CSS `resize: horizontal; overflow: auto` + `min-width/max-width` 限制范围

## 快捷发送分组
- 新增 `QuickSendGroup { id, name, items: QuickSendItem[] }` 类型
- QuickSendPanel 用 antd Tree 渲染分组树
- 分组支持新建/重命名/折叠
- MainLayout 传递 onSend 回调使发送 icon 正常工作

```

## openspec/changes/resizable-sidebar-qs-groups/tasks.md

- Source: openspec/changes/resizable-sidebar-qs-groups/tasks.md
- Lines: 1-11
- SHA256: 7b1ab026bbf83fb6fda9fef79456371dd7b27bd23612494beb589401279f3f60

```md
## 1. 可拖拽侧边栏
- [ ] 1.1 MainLayout sidebar CSS resize + min/max-width

## 2. 快捷发送分组
- [ ] 2.1 types.ts 新增 QuickSendGroup 类型
- [ ] 2.2 tab-store 新增 groups 相关方法
- [ ] 2.3 QuickSendPanel 树状分组 UI
- [ ] 2.4 MainLayout 传递 onSend 修复发送功能

## 3. 验证
- [ ] 3.1 TypeScript 编译 + 构建通过

```
