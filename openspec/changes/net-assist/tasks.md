## 1. 项目初始化

- [ ] 1.1 初始化 Electron + React + TypeScript 项目骨架（Vite 构建）
- [ ] 1.2 配置 Main Process / Preload / Renderer 三层目录结构
- [ ] 1.3 安装基础依赖（antd、zustand、electron-builder）

## 2. IPC 通信基础设施

- [ ] 2.1 定义 IPC 通道常量与类型接口（指令/事件/数据）
- [ ] 2.2 实现 Main Process 侧 IPC 处理器注册与分发
- [ ] 2.3 实现 Preload 脚本，暴露安全的 contextBridge API
- [ ] 2.4 实现 Renderer 侧 IPC 调用 hooks（useIpc）

## 3. 多 Tab 管理

- [ ] 3.1 实现 Tab 状态管理（Zustand store）：创建、切换、关闭、标题编辑
- [ ] 3.2 实现 Tab 栏 UI 组件（TabBar）：新建按钮、Tab 标签、关闭按钮
- [ ] 3.3 实现 Tab 内容面板：根据 Tab 类型渲染对应配置/收发组件

## 4. TCP Client

- [ ] 4.1 Main Process：net 模块封装，connect / disconnect / send / onData
- [ ] 4.2 Renderer：TCP Client 配置面板 UI（IP 输入、端口输入、连接/断开按钮）
- [ ] 4.3 Renderer：收发消息面板 UI（发送区、接收区、消息列表、编码选择）

## 5. TCP Server

- [ ] 5.1 Main Process：net.createServer 封装，listen / stop / 客户端管理 / send / onData
- [ ] 5.2 Renderer：TCP Server 配置面板 UI（端口输入、启动/停止按钮、客户端列表）
- [ ] 5.3 Renderer：Server 收发面板 UI（选择目标客户端、发送区、接收区、消息列表）

## 6. UDP

- [ ] 6.1 Main Process：dgram 模块封装，bind / close / send / onMessage
- [ ] 6.2 Renderer：UDP 配置面板 UI（本地端口、目标 IP、目标端口、绑定/关闭按钮）
- [ ] 6.3 Renderer：UDP 收发面板 UI（发送区、接收区、消息列表）

## 7. 文本编码与 HEX 模式

- [ ] 7.1 实现文本编码切换组件（ASCII / UTF-8 / GBK），Main Process 侧编解码逻辑
- [ ] 7.2 实现 HEX 编辑器组件：输入校验、字节转换、显示格式化
- [ ] 7.3 实现消息列表中文本/HEX 模式切换显示

## 8. 快捷发送

- [ ] 8.1 实现快捷指令数据存储（localStorage / electron-store）
- [ ] 8.2 实现快捷发送面板 UI：列表展示、添加/编辑/删除、一键发送

## 9. 换行符配置

- [ ] 9.1 实现换行符选择组件（\r\n、\n、\r）
- [ ] 9.2 发送时自动追加选定换行符

## 10. UI 完善与集成

- [ ] 10.1 应用主布局（Tab 栏 + 配置面板 + 收发面板 + 快捷发送面板）
- [ ] 10.2 消息日志区域：时间戳、方向标识（发送/接收）、来源标识
- [ ] 10.3 连接状态指示与错误提示
- [ ] 10.4 应用图标与窗口标题
