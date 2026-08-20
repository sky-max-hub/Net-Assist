## Why

用户反馈：从发送框/快捷指令粘贴含 `\r`（CR）换行内容后，**切换发送历史**和**快捷发送**时 CR 仍被吞掉。经调查，`usePreservePaste` 在"粘贴那一刻"正确把 CR 存入 state（React state 保持 CR），但：
1. textarea 的 DOM value 永远显示 LF（HTML 规范强制规范化）
2. **任何后续编辑（onChange）会用 DOM 的 LF 覆盖 state → CR 永久丢失**
3. 历史（history）与快捷指令（quickSend store）中的内容若来源已为 LF，切换/发送即为 LF

## What Changes

- **验证并固化**：history 切换、快捷发送路径在 state 层面保留 CR
- **修复**：确保历史切换 `setInput(history[i])` 与快捷发送 `handleQuickTag(item.content)` / `handleQuickSend(content)` 传递的内容不做任何换行规范化
- **测试**：新增单元测试，验证"粘贴 CR → 发送 → 历史切换 → 发送"全程 state 保留 CR
- **明确边界**：textarea 显示层无法呈现 CR（HTML 规范），编辑后 onChange 规范化属于固有行为，通过文档说明

## Capabilities

### New Capabilities
无

### Modified Capabilities
无

## Impact

- `src/renderer/src/components/send/SendPanel.tsx`：审查历史切换路径
- `src/renderer/src/components/layout/MainLayout.tsx`：审查快捷发送路径
- `src/renderer/src/components/quick-send/QuickSendPanel.tsx`：审查内容传递
- 新增测试文件
