## 1. 数据层

- [x] 1.1 SendOptions 新增 splitView: boolean（默认 true）
- [x] 1.2 defaultSendOptions + PersistedTab 同步更新

## 2. 分屏视图

- [x] 2.1 创建 SplitMessageList 组件（分屏/合并切换逻辑）
- [x] 2.2 TabContent 集成 SplitMessageList，替代原 MessageList
- [x] 2.3 切换按钮 + CSS

## 3. Tab 标签

- [x] 3.1 defaultTitle 改为完整标签 TCP_CLIENT/TCP_SERVER/UDP
- [x] 3.2 Tab CSS 加宽 min-width

## 4. 验证

- [x] 4.1 TypeScript 编译 + 构建通过
- [x] 4.2 手动验证分屏/合并切换、持久化、Tab 标签
