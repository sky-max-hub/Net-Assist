# Brainstorm Summary

- Change: connection-ux-enhance
- Date: 2026-07-15

## 确认的技术方案

### 持久化存储
- 使用 electron-store，在 Main Process `src/main/store/tab-store.ts` 封装
- 键名 `tabs`，存储 `PersistedTab[]`（id, title, type, config）
- 不持久化 status（恢复为 idle）、messages（恢复为空数组）

### IPC 通道
- `store:load-tabs`：invoke/handle 模式，Renderer 启动时调用获取持久化数据
- `store:save-tabs`：send/on 模式，tab 变更时单向通知保存
- 沿用现有 ipc-channels.ts + preload + ipc-router 架构

### 保存时机
- 实时保存：createTab、closeTab、setTabConfig、updateTabTitle 后触发 saveTabs
- 保底保存：app.on('before-quit') 做最终保存

### 启动恢复
- React useEffect 挂载时调用 loadPersistedTabs()
- 恢复后 tabCounter = tabs.length + 1 避免 ID 冲突

### 默认 IP
- defaultConfig('tcp-client') 中 host 改为 '127.0.0.1'
- TcpClientConfig.tsx 中 useState 初始值使用 `host || '127.0.0.1'`

### 清空消息
- tab-store 新增 clearMessages(tabId) 方法
- MessageList 顶部增加 antd Button type="text" danger + DeleteOutlined

## 关键取舍与风险

- electron-store 成熟稳定，API 简洁，放弃手动 JSON 文件和 SQLite
- 实时保存方式增加了一定 IPC 开销，但每个操作仅一次 send 调用，可忽略
- 文件损坏时返回空数组静默降级，不阻塞 UI

## 测试策略

- 手动验证三项功能（持久化恢复、清空消息、默认 IP）
- 边界场景：空数据首次启动、文件损坏、最大 tab 数
- 单元测试可选（tab-store 逻辑），由于改动简单暂不强制

## Spec Patch

无
