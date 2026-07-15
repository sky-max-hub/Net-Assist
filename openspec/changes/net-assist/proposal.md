## Why

现有 TCP 调试工具 tcpTester 存在界面老旧、操作繁琐、不支持多连接同时管理等问题。开发者需要同时调试多个 TCP 端口或设备时，必须反复开关窗口，效率低下。本项目旨在提供一个跨平台、现代化的 TCP/UDP 调试工具，以多 Tab 管理为杀手特性，提升网络协议调试体验。

## What Changes

- 新增 Electron 跨平台桌面应用 `net-assist`
- TCP Client 模式：连接远程服务器，发送/接收数据
- TCP Server 模式：监听本地端口，接收客户端连接并回复数据
- UDP 模式：发送和接收 UDP 数据包
- 多 Tab 管理：每个 Tab 独立运行一种模式，互不干扰
- 文本模式收发，支持 ASCII / UTF-8 / GBK 编码切换
- HEX 十六进制模式收发
- 换行符可配置（\r\n、\n、\r）
- 快捷发送：预设常用指令列表，一键发送

## Capabilities

### New Capabilities
- `tcp-client`: TCP 客户端连接管理，支持连接/断开、数据收发、编码切换
- `tcp-server`: TCP 服务端监听，支持启动/停止、客户端管理、数据回复
- `udp-socket`: UDP 数据包收发
- `multi-tab`: 多 Tab 管理，每个 Tab 独立运行 TCP Client/Server 或 UDP 模式
- `hex-editor`: HEX 十六进制数据编辑与显示
- `quick-send`: 快捷发送预设指令列表

### Modified Capabilities
<!-- 全新项目，无已有 capability 需要修改 -->

## Impact

- 全新项目，无已有代码受影响的
- 技术依赖：Electron、React/Vue 前端框架、Node.js net/dgram 模块
- 目标平台：Windows、macOS、Linux
