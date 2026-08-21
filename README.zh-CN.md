<p align="center">
  <img src="resources/icon.svg" alt="NetAssist 图标" width="120" />
</p>

<h1 align="center">NetAssist</h1>

<p align="center">面向嵌入式开发、物联网调试与协议测试的跨平台 TCP/UDP 网络调试工具。</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-22C55E?style=flat-square" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-4B5563?style=flat-square" alt="平台: Windows | macOS | Linux" />
  <img src="https://img.shields.io/badge/Electron-28-3776AB?style=flat-square" alt="Electron 28" />
  <img src="https://img.shields.io/badge/React-18-3776AB?style=flat-square" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3776AB?style=flat-square" alt="TypeScript 5" />
</p>

NetAssist 是基于 Electron 的桌面网络调试工具，将 TCP Client、TCP Server 与 UDP 三种通信模式集于一个窗口，并提供标签页连接管理、多编码收发、HEX 查看、快捷发送与发送历史，让你无需在多个工具之间切换即可完成各类调试场景。

## 核心特性

| 特性 | 价值 |
|---|---|
| TCP Client / TCP Server / UDP 三合一 | 调试客户端、服务端与无连接协议时无需切换工具 |
| 独立标签页连接 | 服务器、客户端、UDP 可并行运行；标签顺序与配置重启后保留 |
| UTF-8 / ASCII / GBK 编码 + HEX 模式 | 兼容非 UTF-8 设备，直接查看二进制报文 |
| 快捷发送指令树 | 分组管理常用指令并一键重发，发送区 chip 可立即发送 |
| TCP Server 多客户端 | 同时接入多个客户端，支持广播 / 单播切换 |
| TX/RX 分屏 + 控制符高亮 | 对比收发内容，清晰标识 CR、LF、TAB |

## 架构

```text
┌───────────────────────────────────────────────────────────────┐
│                    主进程 (Node.js)                             │
│  tcp-client · tcp-server · udp  ·  gbk-codec  ·  ipc-router    │
│                       tab-store (electron-store)              │
└───────────────────────────────┬───────────────────────────────┘
                                │  IPC（ipc-channels.ts）
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                     预加载 (contextBridge)                      │
│                   暴露 window.electronAPI                     │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    渲染进程 (React 18)                          │
│  MainLayout · TabBar · QuickSendPanel · TabContent · SendPanel │
│              SettingsModal · Zustand stores                   │
└───────────────────────────────────────────────────────────────┘
```

连接管理、GBK 编码、IPC 路由与持久化位于主进程；预加载脚本通过类型化的 `window.electronAPI` 桥接到渲染进程，React 渲染层调用该接口。共享类型与 IPC 通道名定义在 `src/shared`。

## 安装

环境要求：[Node.js](https://nodejs.org/) 18 及以上、[pnpm](https://pnpm.io/)。发布流程使用 Node 22 与 pnpm 10。

```bash
git clone https://github.com/sky-max-hub/Net-Assist.git
cd Net-Assist
pnpm install
```

## 快速开始

以开发模式启动：

```bash
pnpm dev
```

首次使用流程：

1. 点击连接列表上方的 **+** 按钮，选择 **TCP Client**。
2. 保持默认主机 `127.0.0.1`，填写端口后点击 **连接**。
3. 在发送区输入内容，按 **Ctrl+Enter** 发送。

运行测试：`pnpm test`。`pnpm build` 将应用编译到 `out/`；`pnpm build:win` 产出未打包的 Windows 构建，`pnpm build:mac` 产出 DMG/ZIP，`pnpm build:linux` 产出 DEB/AppImage（位于 `dist/`）。推送 `v*` 标签会触发 `.github/workflows/build-release.yml` 构建并发布 Windows 安装包。

## 功能说明

连接配置、消息展示、编码规则、持久化与 IPC 通道等 UI 交互细节见 [UI 界面与功能描述](docs/ui-feature-description.md)。

## 技术栈

| 层级 | 技术 |
|---|---|
| 桌面框架 | [Electron](https://www.electronjs.org/) 28 |
| 前端 | [React](https://react.dev/) 18 + [TypeScript](https://www.typescriptlang.org/) |
| 状态管理 | [Zustand](https://github.com/pmndrs/zustand) |
| 构建 | [electron-vite](https://electron-vite.org/) + [Vite](https://vitejs.dev/) |
| GBK 编码 | [iconv-lite](https://github.com/ashtuchkin/iconv-lite) |
| 持久化 | [electron-store](https://github.com/sindresorhus/electron-store) |
| 测试 | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |
| 打包 | [electron-builder](https://www.electron.build/) |

## 许可证

[MIT](LICENSE)
