## 1. 修复重复消息

- [x] 1.1 移除 TcpClientConnection.send() 中的 callbacks.onData() 调用
- [x] 1.2 移除 TcpServerConnection.send() 中的 callbacks.onData() 调用
- [x] 1.3 分离 useIpc：IPC 监听器移到 useIpcListeners()，仅在 MainLayout 中注册一次
- [x] 1.4 验证 TypeScript 编译和构建通过
