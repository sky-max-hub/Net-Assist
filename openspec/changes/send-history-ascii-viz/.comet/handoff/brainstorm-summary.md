# Brainstorm Summary

- Change: send-history-ascii-viz
- Date: 2026-07-16

## 确认的技术方案

### ASCII 控制字符可视化
- 工具函数 `highlightAscii(text)` → `ReactNode[]`，逐字符扫描
- 控制字符（0x00-0x1F + 0x7F）映射为 `<span class="ascii-ctrl">` 缩写标签
- 消息显示区完整可视化（MessageItem 中处理）
- 输入框下方摘要行显示控制字符提示

### 命令历史
- SendPanel 中 `useState<string[]>` + `historyIndex`
- 首次按 ↑ 保存草稿（draftInput）
- ↑ index++ ↓ index-- 边界停止
- 手动编辑或发送退出历史模式

### 高度
- rows={6}

## 关键取舍与风险
- 输入框不做实时可视化（TextArea 限制），改为摘要行
- 使用 JSX split+map 避免 dangerouslySetInnerHTML
- 历史 session-only 不持久化

## 测试策略
- 手动验证：↑↓ 导航、边界、ASCII 标签渲染、高度变化

## Spec Patch
无
