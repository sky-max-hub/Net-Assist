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
