<p align="center">
  <img src="resources/icon.svg" alt="NetAssist icon" width="120" />
</p>

<h1 align="center">NetAssist</h1>

<p align="center">Cross-platform TCP/UDP network debugging tool for embedded, IoT, and protocol testing.</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-22C55E?style=flat-square" alt="License: MIT" /></a>
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-4B5563?style=flat-square" alt="Platform: Windows | macOS | Linux" />
  <img src="https://img.shields.io/badge/Electron-28-3776AB?style=flat-square" alt="Electron 28" />
  <img src="https://img.shields.io/badge/React-18-3776AB?style=flat-square" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3776AB?style=flat-square" alt="TypeScript 5" />
</p>

NetAssist is a desktop TCP/UDP debugging tool built with Electron. It brings TCP Client, TCP Server, and UDP together in one window, with tabbed connection management, UTF-8/ASCII/GBK encoding, HEX viewing, quick-send commands, and a send history — so you can move between debugging targets without leaving the app.

## Highlights

| Highlight | Why it matters |
|---|---|
| TCP Client, TCP Server, and UDP in one tool | Debug clients, servers, and connectionless protocols without switching applications |
| Independent tabbed connections | Run a server, a client, and a UDP socket side by side; tab order and settings survive restarts |
| UTF-8, ASCII, and GBK encoding plus HEX mode | Talk to devices that do not use UTF-8 and inspect raw binary frames |
| Quick-send command tree | Group and one-click replay frequent commands; chips send instantly from the send panel |
| TCP Server multi-client support | Accept several clients at once and switch between broadcast and unicast targets |
| Split TX/RX view with control-character highlighting | Compare what was sent against what arrived, and see CR, LF, and TAB clearly |

## Architecture

```text
┌───────────────────────────────────────────────────────────────┐
│                    Main process (Node.js)                     │
│  tcp-client · tcp-server · udp  ·  gbk-codec  ·  ipc-router    │
│                       tab-store (electron-store)              │
└───────────────────────────────┬───────────────────────────────┘
                                │  IPC (ipc-channels.ts)
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                    Preload (contextBridge)                    │
│                  exposes window.electronAPI                   │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
┌───────────────────────────────────────────────────────────────┐
│                   Renderer process (React 18)                 │
│  MainLayout · TabBar · QuickSendPanel · TabContent · SendPanel │
│              SettingsModal · Zustand stores                   │
└───────────────────────────────────────────────────────────────┘
```

Connection logic, GBK encoding, IPC routing, and persistence live in the main process. The preload script bridges them to the renderer through a typed `window.electronAPI`, and the React renderer consumes that API. Shared types and IPC channel names are defined in `src/shared`.

## Quick Install

Prerequisites: [Node.js](https://nodejs.org/) 18 or newer and [pnpm](https://pnpm.io/). The release workflow runs on Node 22 with pnpm 10.

```bash
git clone https://github.com/sky-max-hub/Net-Assist.git
cd Net-Assist
pnpm install
```

## Quick Start

Launch the app in development mode:

```bash
pnpm dev
```

To reach a first useful result:

1. Click the **+** button above the connection list and choose **TCP Client**.
2. Keep the default host `127.0.0.1`, set a port, then click **Connect**.
3. Type a message in the send area and press **Ctrl+Enter** to send it.

Run the test suite with `pnpm test`. `pnpm build` compiles the app to `out/`; `pnpm build:win` packages an unpacked Windows build, while `pnpm build:mac` produces a DMG/ZIP and `pnpm build:linux` produces DEB/AppImage in `dist/`. Pushing a `v*` tag triggers the workflow in `.github/workflows/build-release.yml` to build and release Windows installers.

## Features

Detailed UI and interaction behavior — connection configuration, message display, encoding rules, persistence, and IPC channels — is documented in [UI feature description](docs/ui-feature-description.md).

## Tech stack

| Layer | Technology |
|---|---|
| Desktop framework | [Electron](https://www.electronjs.org/) 28 |
| Frontend | [React](https://react.dev/) 18 + [TypeScript](https://www.typescriptlang.org/) |
| State management | [Zustand](https://github.com/pmndrs/zustand) |
| Build tooling | [electron-vite](https://electron-vite.org/) + [Vite](https://vitejs.dev/) |
| GBK encoding | [iconv-lite](https://github.com/ashtuchkin/iconv-lite) |
| Persistence | [electron-store](https://github.com/sindresorhus/electron-store) |
| Testing | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/) |
| Packaging | [electron-builder](https://www.electron.build/) |

## License

[MIT](LICENSE)
