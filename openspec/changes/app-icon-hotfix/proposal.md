## Why

应用启动时 BrowserWindow 未设置窗口图标，开发模式下标题栏和任务栏显示默认 Electron 图标，而打包配置（electron-builder）已正确引用 `resources/icon.svg`。需要为 BrowserWindow 添加运行时 icon 属性。

## What Changes

- **BREAKING**: 无
- 在 `src/main/index.ts` 的 BrowserWindow 构造选项中添加 `icon` 属性，指向 `resources/icon.svg`

## Capabilities

### New Capabilities
无（修复已有行为）

### Modified Capabilities
无

## Impact

- `src/main/index.ts`: BrowserWindow 构造选项新增 icon 属性
