## Why

发送面板的编码选项（utf-8/ascii/gbk）、LF→CR 开关和 HEX/TXT 显示模式在应用重启后丢失，需持久化保存。

## What Changes

- 新增 `SendOptions` 类型（encoding、displayMode、lfToCr）
- 纳入 `PersistedTab` 持久化范围
- SendPanel 从 tab store 读写而非本地 state

## Impact

- `shared/types.ts`、`renderer/store/tab-store.ts`、`SendPanel.tsx`
