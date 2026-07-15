## 1. 依赖安装与 IPC 通道

- [x] 1.1 安装 electron-store 依赖
- [x] 1.2 在 Main Process 中初始化 electron-store 实例
- [x] 1.3 注册 `store:load-tabs` IPC handler（返回持久化的 tab 列表）
- [x] 1.4 注册 `store:save-tabs` IPC handler（保存 tab 列表到 electron-store）
- [x] 1.5 在 shared/ipc-channels.ts 中新增 IPC 通道常量定义

## 2. 持久化核心逻辑

- [x] 2.1 在 tab-store.ts 中新增持久化相关的 IPC 调用方法（loadPersistedTabs、saveTabs）
- [x] 2.2 修改 createTab：创建 tab 后自动触发 saveTabs
- [x] 2.3 修改 closeTab：关闭 tab 后自动触发 saveTabs
- [x] 2.4 修改 setTabConfig：更新配置后自动触发 saveTabs
- [x] 2.5 修改 updateTabTitle：更新标题后自动触发 saveTabs
- [x] 2.6 应用启动时调用 loadPersistedTabs 恢复 tab 列表，并调整 tabCounter 避免 ID 冲突

## 3. TCP 客户端默认 IP

- [x] 3.1 修改 tab-store.ts 中 defaultConfig 函数：tcp-client 的 host 默认值改为 `127.0.0.1`
- [x] 3.2 修改 TcpClientConfig.tsx 中 host 的 useState 初始值：`host || '127.0.0.1'`

## 4. 消息清空功能

- [x] 4.1 在 tab-store.ts 中新增 clearMessages(tabId) 方法
- [x] 4.2 在消息接收区顶部/底部增加「清空消息」按钮，调用 clearMessages

## 5. 验证与收尾

- [ ] 5.1 手动验证：创建多个 tab → 关闭应用 → 重新打开 → 确认 tab 恢复且状态为 idle
- [ ] 5.2 手动验证：在 TCP Client 中发送/接收消息 → 点击清空 → 确认消息清空且其他 tab 不受影响
- [ ] 5.3 手动验证：新建 TCP Client → 确认 host 默认显示 127.0.0.1
