## Context

`package.json` 的 electron-builder 配置中已设置 `icon: "resources/icon.svg"`（win/mac/linux），打包后的应用图标正确。但 BrowserWindow 构造函数未设置 `icon` 属性，开发模式（`npm run dev`）下窗口图标使用 Electron 默认图标。

## Goals / Non-Goals

**Goals:**
- 开发模式和打包模式下窗口均使用 `resources/icon.svg`

**Non-Goals:**
- 不修改 electron-builder 配置

## Decisions

在 `BrowserWindow` 构造选项中添加 `icon` 属性。`join(__dirname, '../../resources/icon.svg')` 路径在开发模式（`out/main/`）和生产模式（`app.asar` 内）均可正确解析。

Electron 28+ 支持通过 `nativeImage` 加载 SVG 图标，直接传入路径即可。
